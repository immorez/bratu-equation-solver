import { Router } from 'express';
import multer from 'multer';
import { authenticateJWT } from '../../middleware/auth';
import { asyncHandler } from '../../utils/async-handler';
import { env } from '../../config/env';
import * as ctrl from './attachment.controller';

const ALLOWED_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.docx'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
    if (!ALLOWED_MIMES.includes(file.mimetype) || !ALLOWED_EXTS.includes(ext)) {
      cb(new Error('نوع فایل مجاز نیست. فرمت‌های مجاز: PDF، JPG، PNG، XLSX، DOCX'));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.use(authenticateJWT);

router.post('/:id/attachments', upload.single('file'), asyncHandler(ctrl.uploadAttachment));
router.get('/:id/attachments/:fid/download', asyncHandler(ctrl.downloadAttachment));
router.delete('/:id/attachments/:fid', asyncHandler(ctrl.deleteAttachment));

export default router;
