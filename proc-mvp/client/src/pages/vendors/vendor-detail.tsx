import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Globe,
  MapPin,
  Mail,
  Phone,
  Award,
  Package,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { vendorApi, outreachApi } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Vendor } from "@/types";

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: outreachStatus } = useQuery({
    queryKey: ["outreach", "status"],
    queryFn: () => outreachApi.status().then((r) => r.data),
  });

  const { data: vendor, isLoading } = useQuery<Vendor>({
    queryKey: ["vendor", id],
    queryFn: () => vendorApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  const sendOutreach = useMutation({
    mutationFn: (params: {
      vendorId: string;
      channel: "email" | "whatsapp";
      recipient?: string;
    }) => outreachApi.send(params).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor", id] });
    },
  });

  const emailContact = vendor?.contacts.find((c) => c.type === "email");
  const phoneContact = vendor?.contacts.find((c) => c.type === "phone");

  if (!vendor) {
    return <p className="text-gray-500">Vendor not found.</p>;
  }

  return (
    <div className="space-y-6">
      <Link
        to="/vendors"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to vendors
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {vendor.companyName}
          </h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {vendor.country}
            </span>
            {vendor.website && (
              <a
                href={vendor.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
              >
                <Globe className="h-4 w-4" />
                Website
              </a>
            )}
          </div>
        </div>
        <StatusBadge status={vendor.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Scores */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Performance Scores
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <ScoreDisplay label="Quality" value={vendor.qualityScore} />
              <ScoreDisplay
                label="Reliability"
                value={vendor.reliabilityScore}
              />
              <ScoreDisplay label="Overall" value={vendor.performanceScore} />
            </div>
          </div>

          {/* Products */}
          {vendor.products.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Package className="h-5 w-5" />
                Products
              </h2>
              <div className="space-y-3">
                {vendor.products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
                  >
                    <span className="font-medium text-gray-900">
                      {p.productCategory}
                    </span>
                    {p.moq && (
                      <span className="text-sm text-gray-500">
                        MOQ: {p.moq}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {vendor.certifications.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Award className="h-5 w-5" />
                Certifications
              </h2>
              <div className="flex flex-wrap gap-2">
                {vendor.certifications.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20"
                  >
                    {c.name}
                    {c.issuedBy && (
                      <span className="ml-1 text-green-500">
                        ({c.issuedBy})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contacts */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Contact Info
            </h2>
            <div className="space-y-3">
              {vendor.contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    {c.type === "email" ? (
                      <Mail className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Phone className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-gray-700">{c.value}</span>
                  </div>
                  {c.type === "email" && outreachStatus?.email && (
                    <button
                      onClick={() =>
                        sendOutreach.mutate({
                          vendorId: vendor.id,
                          channel: "email",
                          recipient: c.value,
                        })
                      }
                      disabled={sendOutreach.isPending}
                      className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                    >
                      {sendOutreach.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Send"
                      )}
                    </button>
                  )}
                  {c.type === "phone" && outreachStatus?.whatsapp && (
                    <button
                      onClick={() =>
                        sendOutreach.mutate({
                          vendorId: vendor.id,
                          channel: "whatsapp",
                          recipient: c.value,
                        })
                      }
                      disabled={sendOutreach.isPending}
                      className="rounded border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                    >
                      {sendOutreach.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <MessageCircle className="h-3 w-3" />
                          Send
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
              {vendor.contacts.length === 0 && (
                <p className="text-sm text-gray-400">No contacts listed</p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Details
            </h2>
            <dl className="space-y-3 text-sm">
              {vendor.companySize && (
                <DetailRow label="Company Size" value={vendor.companySize} />
              )}
              {vendor.yearsInBusiness && (
                <DetailRow
                  label="Years in Business"
                  value={`${vendor.yearsInBusiness}`}
                />
              )}
              {vendor.manufacturingCapacity && (
                <DetailRow
                  label="Capacity"
                  value={vendor.manufacturingCapacity}
                />
              )}
              {vendor.minimumOrderQuantity && (
                <DetailRow label="MOQ" value={vendor.minimumOrderQuantity} />
              )}
              {vendor.leadTime && (
                <DetailRow label="Lead Time" value={vendor.leadTime} />
              )}
              <DetailRow
                label="Response Rate"
                value={`${(vendor.responseRate * 100).toFixed(0)}%`}
              />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreDisplay({ label, value }: { label: string; value: number }) {
  const pct = (value / 10) * 100;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-gray-900">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-primary-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}
