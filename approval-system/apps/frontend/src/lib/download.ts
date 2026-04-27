import api from "./api-client";

/**
 * Authenticated cross-origin file download.
 *
 * A plain `<a href>` cannot attach the JWT bearer header, so when the API is
 * on a different domain the browser sends the request unauthenticated and
 * gets 401. Instead we fetch the file with the configured axios client (which
 * injects `Authorization: Bearer …`), pull the bytes as a Blob, and trigger
 * the Save dialog via a temporary object URL.
 */
export async function downloadFile(
  url: string,
  fallbackFilename: string,
): Promise<void> {
  const res = await api.get(url, { responseType: "blob" });

  const filename =
    parseFilenameFromContentDisposition(res.headers["content-disposition"]) ??
    fallbackFilename;

  const blobUrl = URL.createObjectURL(res.data as Blob);
  try {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // Release the blob on the next tick so the click has time to start the save.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
  }
}

export function downloadAttachment(
  requestId: string,
  attachmentId: string,
  fallbackFilename: string,
): Promise<void> {
  return downloadFile(
    `/requests/${requestId}/attachments/${attachmentId}/download`,
    fallbackFilename,
  );
}

// Parses both RFC 5987 `filename*=UTF-8''…` and the legacy `filename="…"`,
// preferring the UTF-8 variant when both are present.
function parseFilenameFromContentDisposition(
  header: string | undefined,
): string | null {
  if (!header) return null;

  const star = /filename\*\s*=\s*([^']*)'[^']*'([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[2].trim());
    } catch {
      // fall through to plain filename
    }
  }

  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : null;
}
