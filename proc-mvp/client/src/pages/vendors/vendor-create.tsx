import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { vendorApi } from "@/lib/api";

export default function VendorCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    companyName: "",
    country: "",
    website: "",
    address: "",
    companySize: "",
    yearsInBusiness: "",
    manufacturingCapacity: "",
    minimumOrderQuantity: "",
    leadTime: "",
    contactEmail: "",
    contactPhone: "",
  });

  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => vendorApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      navigate("/vendors");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to create vendor";
      setError(msg);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const contacts = [];
    if (form.contactEmail) contacts.push({ type: "email" as const, value: form.contactEmail });
    if (form.contactPhone) contacts.push({ type: "phone" as const, value: form.contactPhone });

    mutation.mutate({
      companyName: form.companyName,
      country: form.country,
      website: form.website || undefined,
      address: form.address || undefined,
      companySize: form.companySize || undefined,
      yearsInBusiness: form.yearsInBusiness
        ? Number(form.yearsInBusiness)
        : undefined,
      manufacturingCapacity: form.manufacturingCapacity || undefined,
      minimumOrderQuantity: form.minimumOrderQuantity || undefined,
      leadTime: form.leadTime || undefined,
      contacts: contacts.length > 0 ? contacts : undefined,
    });
  };

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/vendors"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to vendors
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Vendor</h1>
        <p className="mt-1 text-sm text-gray-500">
          Register a new vendor in your database
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Required fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Company Name *
            </label>
            <input
              required
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Country *
            </label>
            <input
              required
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Website
            </label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              placeholder="https://"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Contact Email
            </label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => update("contactEmail", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Contact Phone
            </label>
            <input
              value={form.contactPhone}
              onChange={(e) => update("contactPhone", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>
        </div>

        {/* Additional details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Company Size
            </label>
            <select
              value={form.companySize}
              onChange={(e) => update("companySize", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            >
              <option value="">Select...</option>
              <option>Small (1-50)</option>
              <option>Medium (51-500)</option>
              <option>Large (500+)</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Years in Business
            </label>
            <input
              type="number"
              min="0"
              value={form.yearsInBusiness}
              onChange={(e) => update("yearsInBusiness", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Manufacturing Capacity
            </label>
            <input
              value={form.manufacturingCapacity}
              onChange={(e) => update("manufacturingCapacity", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              placeholder="e.g. 10,000 tons/year"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Lead Time
            </label>
            <input
              value={form.leadTime}
              onChange={(e) => update("leadTime", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              placeholder="e.g. 25 days"
            />
          </div>
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            to="/vendors"
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
          >
            {mutation.isPending ? "Creating..." : "Create Vendor"}
          </button>
        </div>
      </form>
    </div>
  );
}
