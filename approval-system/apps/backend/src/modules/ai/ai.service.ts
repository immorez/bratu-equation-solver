import OpenAI from 'openai';
import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../middleware/error-handler';

const STATUS_LABELS: Record<string, string> = {
  draft: 'پیش‌نویس',
  pending: 'در انتظار بررسی',
  approved: 'تأیید شده',
  rejected: 'رد شده',
  needs_revision: 'نیاز به اصلاح',
};

function getClient() {
  if (!env.AI_ENABLED) {
    throw new AppError(503, 'AI_DISABLED', 'بخش هوش مصنوعی غیرفعال است');
  }
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': env.OPENROUTER_HTTP_REFERER,
      'X-Title': env.OPENROUTER_APP_NAME,
    },
  });
}

async function buildContext(requestId: string, userId: string, role: string): Promise<string> {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      createdBy: { select: { name: true } },
      attachments: { select: { filename: true, mimetype: true } },
      comments: {
        include: { author: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!request) throw new AppError(404, 'NOT_FOUND', 'درخواست یافت نشد');
  if (role === 'employee' && request.createdById !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'شما دسترسی به این درخواست را ندارید');
  }

  const lines = [
    `عنوان: ${request.title}`,
    `توضیحات: ${request.description}`,
    `مبلغ: ${request.amount ? `${request.amount} ریال` : 'بدون مبلغ'}`,
    `وضعیت: ${STATUS_LABELS[request.status] || request.status}`,
    `ایجاد‌کننده: ${request.createdBy.name}`,
    `تاریخ ایجاد: ${request.createdAt.toLocaleDateString('fa-IR')}`,
  ];

  if (request.attachments.length > 0) {
    lines.push('', 'فایل‌های پیوست:');
    request.attachments.forEach((a) => lines.push(`  - ${a.filename} (${a.mimetype})`));
  }

  if (request.comments.length > 0) {
    lines.push('', 'نظرات:');
    request.comments.forEach((c) => {
      const roleLabel = c.author.role === 'manager' ? 'مدیر' : 'کارمند';
      lines.push(`  - ${c.author.name} (${roleLabel}): ${c.body}`);
    });
  }

  return lines.join('\n');
}

const INSIGHTS_SYSTEM = `تو یک دستیار هوشمند سیستم تأیید درخواست‌ها هستی. بر اساس اطلاعات درخواست ارائه‌شده، یک تحلیل کوتاه و مفید به زبان فارسی ارائه بده.

پاسخ را دقیقاً به فرمت JSON زیر برگردان:
{
  "summary": "خلاصه یک‌جمله‌ای درخواست",
  "keyPoints": ["نکته کلیدی ۱", "نکته کلیدی ۲"],
  "considerations": ["نکته قابل توجه ۱", "سؤال باز ۱"]
}

فقط JSON برگردان، بدون هیچ متن اضافه‌ای.`;

const ASK_SYSTEM = `تو یک دستیار هوشمند سیستم تأیید درخواست‌ها هستی. به سؤالات کاربر درباره درخواست ارائه‌شده، به زبان فارسی و با لحن خنثی و حرفه‌ای پاسخ بده. اگر سؤال نامربوط بود، بگو که فقط درباره درخواست می‌توانی کمک کنی.`;

export async function generateInsights(requestId: string, userId: string, role: string) {
  const context = await buildContext(requestId, userId, role);
  const client = getClient();

  const response = await client.chat.completions.create({
    model: env.OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: INSIGHTS_SYSTEM },
      { role: 'user', content: context },
    ],
    max_tokens: 1000,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content || '';

  try {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { summary: content, keyPoints: [], considerations: [] };
  }
}

export async function askQuestion(requestId: string, userId: string, role: string, question: string) {
  const context = await buildContext(requestId, userId, role);
  const client = getClient();

  const response = await client.chat.completions.create({
    model: env.OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: ASK_SYSTEM },
      { role: 'user', content: `اطلاعات درخواست:\n${context}\n\nسؤال کاربر: ${question}` },
    ],
    max_tokens: 800,
    temperature: 0.5,
  });

  return { answer: response.choices[0]?.message?.content || 'پاسخی دریافت نشد' };
}
