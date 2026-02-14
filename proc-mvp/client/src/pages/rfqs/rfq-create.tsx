import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { rfqApi } from "@/lib/api";

interface LineItem {
  productName: string;
  quantity: string;
  unit: string;
  specifications: string;
}

export default function RfqCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    deliveryLocation: "",
    requiredDeliveryDate: "",
    budgetMin: "",
    budgetMax: "",
    budgetCurrency: "USD",
    priority: "MEDIUM",
    qualityRequirements: "",
    paymentTermsPreference: "",
    notes: "",
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { productName: "", quantity: "", unit: "pieces", specifications: "" },
  ]);

  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => rfqApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      navigate("/rfqs");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to create RFQ";
      setError(msg);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const qualityReqs = form.qualityRequirements
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    mutation.mutate({
      deliveryLocation: form.deliveryLocation,
      requiredDeliveryDate: form.requiredDeliveryDate
        ? new Date(form.requiredDeliveryDate).toISOString()
        : undefined,
      budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
      budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
      budgetCurrency: form.budgetCurrency,
      priority: form.priority,
      qualityRequirements: qualityReqs,
      paymentTermsPreference: form.paymentTermsPreference || undefined,
      notes: form.notes || undefined,
      lineItems: lineItems.map((li) => ({
        productName: li.productName,
        quantity: Number(li.quantity),
        unit: li.unit,
        specifications: li.specifications
          ? JSON.parse(`{${li.specifications}}`)
          : undefined,
      })),
    });
  };

  const addLineItem = () =>
    setLineItems((prev) => [
      ...prev,
      { productName: "", quantity: "", unit: "pieces", specifications: "" },
    ]);

  const removeLineItem = (idx: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== idx));

  const updateLineItem = (idx: number, field: string, value: string) =>
    setLineItems((prev) =>
      prev.map((li, i) => (i === idx ? { ...li, [field]: value } : li)),
    );

  const updateForm = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/rfqs"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to RFQs
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New RFQ</h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill in the details for your Request for Quotation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Line Items */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Products / Line Items
            </h2>
            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {lineItems.map((li, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-3 rounded-lg border border-gray-100 p-4"
              >
                <div className="col-span-5">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Product Name *
                  </label>
                  <input
                    required
                    value={li.productName}
                    onChange={(e) =>
                      updateLineItem(idx, "productName", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                    placeholder="e.g. Steel Pipes"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Quantity *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={li.quantity}
                    onChange={(e) =>
                      updateLineItem(idx, "quantity", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Unit
                  </label>
                  <input
                    value={li.unit}
                    onChange={(e) =>
                      updateLineItem(idx, "unit", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Specs
                  </label>
                  <input
                    value={li.specifications}
                    onChange={(e) =>
                      updateLineItem(idx, "specifications", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                    placeholder='"key":"val"'
                  />
                </div>
                <div className="col-span-1 flex items-end justify-center">
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery & Budget */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Delivery & Budget
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Delivery Location *
              </label>
              <input
                required
                value={form.deliveryLocation}
                onChange={(e) =>
                  updateForm("deliveryLocation", e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                placeholder="City, Country"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Required Delivery Date
              </label>
              <input
                type="date"
                value={form.requiredDeliveryDate}
                onChange={(e) =>
                  updateForm("requiredDeliveryDate", e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Budget Min
              </label>
              <input
                type="number"
                min="0"
                value={form.budgetMin}
                onChange={(e) => updateForm("budgetMin", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Budget Max
              </label>
              <input
                type="number"
                min="0"
                value={form.budgetMax}
                onChange={(e) => updateForm("budgetMax", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => updateForm("priority", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Payment Terms
              </label>
              <input
                value={form.paymentTermsPreference}
                onChange={(e) =>
                  updateForm("paymentTermsPreference", e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                placeholder="e.g. 30 days after delivery"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Quality Requirements
            </label>
            <input
              value={form.qualityRequirements}
              onChange={(e) =>
                updateForm("qualityRequirements", e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              placeholder="Comma-separated, e.g. ISO 9001, Mill Test Certificate"
            />
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            to="/rfqs"
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
          >
            {mutation.isPending ? "Creating..." : "Create RFQ"}
          </button>
        </div>
      </form>
    </div>
  );
}
