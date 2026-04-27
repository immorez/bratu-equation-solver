import { useState, useRef, type FormEvent, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Upload, Paperclip, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../lib/api-client';
import { fa } from '../../i18n/fa';

export function NewRequestPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/requests', {
        title,
        description,
        amount: amount ? parseFloat(amount) : null,
      });
      const requestId = res.data.id;
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        await api.post(`/requests/${requestId}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return requestId;
    },
    onSuccess: (requestId) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      navigate(`/requests/${requestId}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || fa.common.error);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) setFiles((prev) => [...prev, ...dropped]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
      >
        <ArrowRight className="w-3.5 h-3.5" />
        {fa.request.back}
      </button>
      <h2 className="text-lg md:text-xl font-bold text-foreground mb-5">{fa.request.newRequest}</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-card rounded-xl border border-border shadow-soft p-4 md:p-5 space-y-4">
          <Field label={fa.request.title} required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              required
              maxLength={500}
              placeholder={fa.request.titlePlaceholder}
            />
          </Field>

          <Field label={fa.request.description} required>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
              required
              maxLength={5000}
              placeholder={fa.request.descriptionPlaceholder}
            />
            <p className="text-[11px] text-muted-foreground mt-1 text-end">
              {description.length.toLocaleString('fa-IR')} / ۵٬۰۰۰
            </p>
          </Field>

          <Field label={fa.request.amount}>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition tabular-nums"
              dir="ltr"
              min={0}
              placeholder={fa.request.amountPlaceholder}
            />
          </Field>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-soft p-4 md:p-5 space-y-3">
          <div>
            <p className="text-xs font-semibold text-foreground mb-1">{fa.request.attachments}</p>
            <p className="text-[11px] text-muted-foreground">{fa.request.fileHint}</p>
          </div>

          <label
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border bg-background hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-foreground">{fa.request.dropFiles}</p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"
              multiple
              onChange={(e) => {
                const list = Array.from(e.target.files || []);
                if (list.length) setFiles((prev) => [...prev, ...list]);
                e.target.value = '';
              }}
              className="hidden"
            />
          </label>

          {files.length > 0 && (
            <ul className="space-y-1.5">
              {files.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg text-xs"
                >
                  <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate text-foreground">{f.name}</span>
                  <span className="text-muted-foreground tabular-nums shrink-0">
                    {(f.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    aria-label="حذف"
                    className="w-6 h-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex items-center gap-2 sticky bottom-20 md:bottom-0 md:relative bg-background/0">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 active:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-soft"
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {createMutation.isPending ? fa.common.loading : fa.request.save}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-card text-foreground border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            {fa.request.cancel}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive ms-1">*</span>}
      </label>
      {children}
    </div>
  );
}
