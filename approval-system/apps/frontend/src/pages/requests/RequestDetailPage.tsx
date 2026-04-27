import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Paperclip,
  Send,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Trash2,
  Upload,
  Loader2,
  Sparkles,
  MessageSquare,
  ChevronDown,
  Bot,
} from 'lucide-react';
import api from '../../lib/api-client';
import { downloadAttachment } from '../../lib/download';
import { useAuth } from '../../context/AuthContext';
import { fa } from '../../i18n/fa';
import { formatJalaliDateTime, formatAmount } from '../../lib/utils';
import { StatusBadge } from '../../components/ui/StatusBadge';

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isManager = user?.role === 'manager';

  const { data: request, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: () => api.get(`/requests/${id}`).then((r) => r.data),
  });

  const actionMutation = useMutation({
    mutationFn: ({ action, comment }: { action: string; comment?: string }) =>
      api.post(`/requests/${id}/${action}`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      navigate('/requests');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="ms-2 text-sm">{fa.common.loading}</span>
      </div>
    );
  }
  if (!request) {
    return <p className="text-sm text-muted-foreground py-8 text-center">{fa.common.noData}</p>;
  }

  const isOwner = request.createdById === user?.id;
  const canSubmit = isOwner && (request.status === 'draft' || request.status === 'needs_revision');
  const canEdit = isOwner && request.status === 'draft';
  const canManagerAct = isManager && request.status === 'pending';

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="w-3.5 h-3.5" />
        {fa.request.back}
      </button>

      {/* Header card */}
      <div className="bg-card rounded-xl border border-border shadow-soft p-4 md:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-base md:text-lg font-bold text-foreground leading-snug">{request.title}</h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{request.createdBy?.name}</span>
              <span>·</span>
              <span>{formatJalaliDateTime(request.createdAt)}</span>
            </div>
          </div>
          <StatusBadge status={request.status} />
        </div>
        {request.amount != null && (
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{fa.request.amount}</span>
            <span className="text-base font-bold text-foreground tabular-nums">
              {formatAmount(request.amount)}
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      <Section title={fa.request.description}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
          {request.description}
        </p>
      </Section>

      {/* Attachments */}
      {request.attachments?.length > 0 && (
        <Section title={fa.request.attachments}>
          <ul className="space-y-1.5">
            {request.attachments.map((a: any) => (
              <li key={a.id}>
                <AttachmentDownloadButton
                  requestId={id!}
                  attachmentId={a.id}
                  filename={a.filename}
                />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* File upload for draft/revision */}
      {isOwner && (request.status === 'draft' || request.status === 'needs_revision') && (
        <FileUploadSection requestId={id!} />
      )}

      {/* Actions */}
      {(canSubmit || canEdit || canManagerAct) && (
        <div className="bg-card rounded-xl border border-border shadow-soft p-4 md:p-5">
          {canManagerAct ? (
            <ManagerActions requestId={id!} />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {canSubmit && (
                <ActionButton
                  label={fa.request.submit}
                  Icon={Send}
                  onClick={() => actionMutation.mutate({ action: 'submit' })}
                  variant="primary"
                  loading={actionMutation.isPending}
                />
              )}
              {canEdit && (
                <ActionButton
                  label={fa.request.delete}
                  Icon={Trash2}
                  onClick={() => {
                    if (confirm(fa.request.deleteConfirm)) deleteMutation.mutate();
                  }}
                  variant="destructive"
                  loading={deleteMutation.isPending}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Status timeline */}
      {request.statusEvents?.length > 0 && (
        <Section title={fa.request.history}>
          <ol className="relative space-y-4 ps-5">
            <span className="absolute top-1 bottom-1 start-[5px] w-px bg-border" aria-hidden />
            {request.statusEvents.map((e: any) => (
              <li key={e.id} className="relative">
                <span className="absolute -start-[18px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-card" />
                <div className="text-sm">
                  <div className="flex flex-wrap items-center gap-1.5 text-foreground">
                    <span className="font-semibold">{e.actor?.name}</span>
                    <span className="text-muted-foreground">—</span>
                    {e.fromStatus && (
                      <>
                        <StatusBadge status={e.fromStatus} size="sm" />
                        <span className="text-muted-foreground">←</span>
                      </>
                    )}
                    <StatusBadge status={e.toStatus} size="sm" />
                  </div>
                  {e.comment && (
                    <p className="text-xs text-muted-foreground mt-1.5 bg-muted/40 rounded-lg px-3 py-2 leading-relaxed">
                      {e.comment}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {formatJalaliDateTime(e.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Comments */}
      <CommentsSection
        requestId={id!}
        comments={request.comments}
        status={request.status}
        isOwner={isOwner}
      />

      {/* AI section */}
      <AISection requestId={id!} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-xl border border-border shadow-soft p-4 md:p-5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {title}
      </h3>
      {children}
    </section>
  );
}

function AttachmentDownloadButton({
  requestId,
  attachmentId,
  filename,
}: {
  requestId: string;
  attachmentId: string;
  filename: string;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleClick = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadAttachment(requestId, attachmentId, filename);
    } catch {
      alert(fa.common.error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={downloading}
      className="w-full flex items-center gap-2.5 px-3 py-2 bg-muted/40 hover:bg-muted rounded-lg text-sm transition-colors group text-start disabled:opacity-60 disabled:cursor-wait"
    >
      {downloading ? (
        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
      ) : (
        <Paperclip className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
      )}
      <span className="text-foreground group-hover:text-primary truncate">{filename}</span>
    </button>
  );
}

function FileUploadSection({ requestId }: { requestId: string }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/requests/${requestId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
    } catch {
      alert(fa.common.error);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-soft p-4 md:p-5">
      <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-muted hover:bg-muted/70 rounded-lg text-sm font-medium cursor-pointer transition-colors">
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        <span>{uploading ? fa.common.loading : fa.request.attachFile}</span>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"
          onChange={handleUpload}
          className="hidden"
        />
      </label>
      <p className="text-[11px] text-muted-foreground mt-2">{fa.request.fileHint}</p>
    </div>
  );
}

function ManagerActions({ requestId }: { requestId: string }) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (action: string) =>
      api.post(`/requests/${requestId}/${action}`, { comment: comment || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      setActiveAction(null);
      setComment('');
    },
  });

  if (activeAction) {
    const labels: Record<string, string> = {
      approve: fa.request.approve,
      reject: fa.request.reject,
      revise: fa.request.revise,
    };
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-foreground">{labels[activeAction]}</h4>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={fa.request.commentPlaceholder}
          rows={3}
          className="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => mutation.mutate(activeAction)}
            disabled={mutation.isPending}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
              activeAction === 'reject'
                ? 'bg-destructive hover:bg-destructive/90'
                : activeAction === 'revise'
                  ? 'bg-warning hover:bg-warning/90'
                  : 'bg-success hover:bg-success/90'
            }`}
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {mutation.isPending ? fa.common.loading : fa.request.confirm}
          </button>
          <button
            onClick={() => setActiveAction(null)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-muted text-foreground hover:bg-muted/70 transition-colors"
          >
            {fa.request.cancel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ActionButton
        label={fa.request.approve}
        Icon={CheckCircle2}
        onClick={() => setActiveAction('approve')}
        variant="success"
      />
      <ActionButton
        label={fa.request.reject}
        Icon={XCircle}
        onClick={() => setActiveAction('reject')}
        variant="destructive"
      />
      <ActionButton
        label={fa.request.revise}
        Icon={RefreshCcw}
        onClick={() => setActiveAction('revise')}
        variant="warning"
      />
    </div>
  );
}

function CommentsSection({
  requestId,
  comments,
  status,
  isOwner: _isOwner,
}: {
  requestId: string;
  comments: any[];
  status: string;
  isOwner: boolean;
}) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post(`/requests/${requestId}/comments`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      setBody('');
    },
  });

  const canComment = status !== 'approved' && status !== 'rejected';

  return (
    <section className="bg-card rounded-xl border border-border shadow-soft p-4 md:p-5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
        <MessageSquare className="w-3.5 h-3.5" />
        {fa.request.comment}
      </h3>

      {comments?.length === 0 ? (
        <p className="text-xs text-muted-foreground mb-3">{fa.common.noData}</p>
      ) : (
        <ul className="space-y-2.5 mb-4">
          {comments?.map((c: any) => (
            <li key={c.id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                {c.author?.name?.charAt(0) || '؟'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-muted/50 rounded-2xl rounded-ts-sm px-3 py-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground">{c.author?.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatJalaliDateTime(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{c.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canComment && (
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={fa.request.commentPlaceholder}
            rows={2}
            className="flex-1 px-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
            maxLength={2000}
          />
          <button
            onClick={() => mutation.mutate()}
            disabled={!body.trim() || mutation.isPending}
            aria-label={fa.request.addComment}
            className="inline-flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </section>
  );
}

function AISection({ requestId }: { requestId: string }) {
  const [insights, setInsights] = useState<any>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const insightsMutation = useMutation({
    mutationFn: () => api.post(`/requests/${requestId}/ai/insights`).then((r) => r.data),
    onSuccess: (data) => setInsights(data),
    onError: (err: any) => {
      if (err.response?.status === 503) {
        setInsights({ disabled: true });
      }
    },
  });

  const askMutation = useMutation({
    mutationFn: () =>
      api.post(`/requests/${requestId}/ai/ask`, { question }).then((r) => r.data),
    onSuccess: (data) => setAnswer(data.answer),
    onError: (err: any) => {
      if (err.response?.status === 503) {
        setAnswer(fa.ai.disabled);
      }
    },
  });

  return (
    <div className="space-y-3">
      <details className="bg-card rounded-xl border border-border shadow-soft group">
        <summary className="cursor-pointer p-4 md:p-5 flex items-center justify-between gap-3 list-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">{fa.ai.insights}</h3>
              <p className="text-[11px] text-muted-foreground truncate">{fa.ai.insightsDesc}</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180 shrink-0" />
        </summary>
        <div className="px-4 md:px-5 pb-4 md:pb-5">
          {insights?.disabled ? (
            <p className="text-sm text-muted-foreground">{fa.ai.disabled}</p>
          ) : insights ? (
            <div className="space-y-3 text-sm">
              <AIBlock title={fa.ai.summary}>
                <p>{insights.summary}</p>
              </AIBlock>
              {insights.keyPoints?.length > 0 && (
                <AIBlock title={fa.ai.keyPoints}>
                  <ul className="list-disc list-inside space-y-1">
                    {insights.keyPoints.map((p: string, i: number) => <li key={i}>{p}</li>)}
                  </ul>
                </AIBlock>
              )}
              {insights.considerations?.length > 0 && (
                <AIBlock title={fa.ai.considerations}>
                  <ul className="list-disc list-inside space-y-1">
                    {insights.considerations.map((c: string, i: number) => <li key={i}>{c}</li>)}
                  </ul>
                </AIBlock>
              )}
            </div>
          ) : null}
          <button
            onClick={() => insightsMutation.mutate()}
            disabled={insightsMutation.isPending}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-muted text-foreground text-xs font-medium rounded-lg hover:bg-muted/70 disabled:opacity-50 transition-colors"
          >
            {insightsMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {insightsMutation.isPending ? fa.ai.loading : insights ? fa.ai.refresh : fa.ai.generate}
          </button>
        </div>
      </details>

      <details className="bg-card rounded-xl border border-border shadow-soft group">
        <summary className="cursor-pointer p-4 md:p-5 flex items-center justify-between gap-3 list-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{fa.ai.ask}</h3>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180 shrink-0" />
        </summary>
        <div className="px-4 md:px-5 pb-4 md:pb-5 space-y-3">
          <div className="flex items-end gap-2">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={fa.ai.askPlaceholder}
              rows={2}
              className="flex-1 px-3 py-2.5 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
              maxLength={1000}
            />
            <button
              onClick={() => askMutation.mutate()}
              disabled={!question.trim() || askMutation.isPending}
              aria-label={fa.ai.send}
              className="inline-flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {askMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          {answer && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">{answer}</div>
          )}
        </div>
      </details>
    </div>
  );
}

function AIBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-foreground mb-1">{title}</h4>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}

function ActionButton({
  label,
  Icon,
  onClick,
  variant,
  loading,
}: {
  label: string;
  Icon: typeof CheckCircle2;
  onClick: () => void;
  variant: 'primary' | 'destructive' | 'success' | 'warning';
  loading?: boolean;
}) {
  const styles: Record<string, string> = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    success: 'bg-success text-success-foreground hover:bg-success/90',
    warning: 'bg-warning text-warning-foreground hover:bg-warning/90',
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-soft ${styles[variant] || ''}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      {loading ? fa.common.loading : label}
    </button>
  );
}
