/**
 * Contact Extractor — extract email and phone from vendor websites.
 *
 * When discovery results have missing email/phone, fetches the vendor website
 * and extracts contact info using regex patterns (mailto:, tel:, common patterns).
 * Optionally uses AI for complex pages.
 */

export interface ExtractedContacts {
  emails: string[];
  phones: string[];
}

const EMAIL_REGEX =
  /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/g;

// Match mailto: and tel: links
const MAILTO_REGEX = /mailto:([^\s"'>]+)/gi;
const TEL_REGEX = /tel:([^\s"'>]+)/gi;

// Common generic emails to filter out
const GENERIC_BLACKLIST = new Set([
  "example.com",
  "email.com",
  "test.com",
  "domain.com",
  "yoursite.com",
  "sentry.io",
  "wixpress.com",
  "schema.org",
]);

function isValidEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  if (GENERIC_BLACKLIST.has(domain)) return false;
  if (domain.endsWith(".png") || domain.endsWith(".jpg") || domain.endsWith(".gif"))
    return false;
  return true;
}

/**
 * Extract emails and phones from HTML content.
 */
export function extractContactsFromHtml(html: string): ExtractedContacts {
  const emails = new Set<string>();
  const phones = new Set<string>();

  // mailto: links
  let m: RegExpExecArray | null;
  const mailtoRe = new RegExp(MAILTO_REGEX.source, "gi");
  while ((m = mailtoRe.exec(html)) !== null) {
    const addr = m[1].split("?")[0].trim().toLowerCase();
    if (isValidEmail(addr)) emails.add(addr);
  }

  // tel: links
  const telRe = new RegExp(TEL_REGEX.source, "gi");
  while ((m = telRe.exec(html)) !== null) {
    const num = m[1].replace(/\D/g, "").trim();
    if (num.length >= 8) phones.add(m[1].trim());
  }

  // Loose email pattern (avoid too many false positives)
  const emailRe = new RegExp(EMAIL_REGEX.source, "g");
  while ((m = emailRe.exec(html)) !== null) {
    const addr = m[0].toLowerCase();
    if (isValidEmail(addr)) emails.add(addr);
  }

  return {
    emails: [...emails],
    phones: [...phones],
  };
}

/**
 * Fetch a URL and extract contacts from the response HTML.
 * Tries homepage and common contact paths.
 */
export async function extractContactsFromWebsite(
  website: string,
  options?: { timeoutMs?: number },
): Promise<ExtractedContacts> {
  const timeout = options?.timeoutMs ?? 8000;
  const baseUrl = website.startsWith("http") ? website : `https://${website}`;

  const urlsToTry = [
    baseUrl,
    `${baseUrl.replace(/\/$/, "")}/contact`,
    `${baseUrl.replace(/\/$/, "")}/contact-us`,
    `${baseUrl.replace(/\/$/, "")}/about`,
  ];

  const allEmails = new Set<string>();
  const allPhones = new Set<string>();

  for (const url of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ProcMVP/1.0; +https://procmvp.com)",
        },
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const html = await res.text();
      const extracted = extractContactsFromHtml(html);
      extracted.emails.forEach((e) => allEmails.add(e));
      extracted.phones.forEach((p) => allPhones.add(p));

      // If we found contacts on the first page, we can stop
      if (allEmails.size >= 2 || allPhones.size >= 1) break;
    } catch {
      // Skip failed URLs
    }
  }

  return {
    emails: [...allEmails],
    phones: [...allPhones],
  };
}
