import { z } from 'zod';

export const SendInvitationSchema = z.object({
  emails: z.array(z.string().email()).min(1, 'At least one email required'),
});

export const RsvpSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED']),
});

export type SendInvitationInput = z.infer<typeof SendInvitationSchema>;
export type RsvpInput = z.infer<typeof RsvpSchema>;
