import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  // Vendor statuses
  DISCOVERED: "bg-blue-50 text-blue-700 ring-blue-600/20",
  CONTACTED: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  ACTIVE: "bg-green-50 text-green-700 ring-green-600/20",
  INACTIVE: "bg-gray-50 text-gray-700 ring-gray-600/20",
  // RFQ statuses
  DRAFT: "bg-gray-50 text-gray-700 ring-gray-600/20",
  SENT: "bg-blue-50 text-blue-700 ring-blue-600/20",
  QUOTING: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  NEGOTIATING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  COMPARING: "bg-purple-50 text-purple-700 ring-purple-600/20",
  COMPLETED: "bg-green-50 text-green-700 ring-green-600/20",
  CANCELLED: "bg-red-50 text-red-700 ring-red-600/20",
  // Quote statuses
  RECEIVED: "bg-blue-50 text-blue-700 ring-blue-600/20",
  UNDER_REVIEW: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  ACCEPTED: "bg-green-50 text-green-700 ring-green-600/20",
  REJECTED: "bg-red-50 text-red-700 ring-red-600/20",
  // Priority
  LOW: "bg-gray-50 text-gray-700 ring-gray-600/20",
  MEDIUM: "bg-blue-50 text-blue-700 ring-blue-600/20",
  HIGH: "bg-orange-50 text-orange-700 ring-orange-600/20",
  URGENT: "bg-red-50 text-red-700 ring-red-600/20",
  // Discovery job statuses (PENDING, RUNNING, FAILED; COMPLETED/CANCELLED shared above)
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  RUNNING: "bg-blue-50 text-blue-700 ring-blue-600/20",
  FAILED: "bg-red-50 text-red-700 ring-red-600/20",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        statusStyles[status] ?? "bg-gray-50 text-gray-700 ring-gray-600/20",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
