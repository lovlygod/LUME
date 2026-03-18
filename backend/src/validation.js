/**
 * Zod СЃС…РµРјС‹ РІР°Р»РёРґР°С†РёРё РґР»СЏ LUME API
 * Р’СЃРµ СЃС…РµРјС‹ РґР»СЏ РІР°Р»РёРґР°С†РёРё РІС…РѕРґСЏС‰РёС… РґР°РЅРЅС‹С…
 */

const { z } = require('zod');

// ==================== Common Schemas ====================

// Email РІР°Р»РёРґР°С†РёСЏ
const emailSchema = z.string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email too long');

// Password РІР°Р»РёРґР°С†РёСЏ (РјРёРЅРёРјСѓРј 6 СЃРёРјРІРѕР»РѕРІ)
const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password too long');

// Username РІР°Р»РёРґР°С†РёСЏ (РјРёРЅРёРјСѓРј 5 СЃРёРјРІРѕР»РѕРІ, С‚РѕР»СЊРєРѕ Р»Р°С‚РёРЅРёС†Р° Рё С†РёС„СЂС‹)
const usernameSchema = z.string()
  .min(5, 'Username must be at least 5 characters')
  .max(50, 'Username too long')
  .regex(/^[a-zA-Z0-9-]+$/, 'Username can only contain English letters, numbers, and hyphens');

// Name РІР°Р»РёРґР°С†РёСЏ
const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name too long');

// ID РІР°Р»РёРґР°С†РёСЏ
const idSchema = z.string()
  .or(z.number())
  .transform(val => String(val));

// Pagination РїР°СЂР°РјРµС‚СЂС‹
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ==================== Auth Schemas ====================

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  username: usernameSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ==================== Profile Schemas ====================

const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  username: usernameSchema.optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
  city: z.string().max(100).optional(),
  website: z.string().url('Invalid website URL').max(255).optional(),
});

const deleteAccountSchema = z.object({
  password: passwordSchema,
});

// ==================== Post Schemas ====================

const createPostSchema = z.object({
  text: z.string()
    .min(1, 'Text is required')
    .max(420, 'Text exceeds 420 characters')
    .optional(),
  image: z.any().optional(), // Р”Р»СЏ multipart/form-data
});

const reportPostSchema = z.object({
  reason: z.string()
    .min(1, 'Reason is required')
    .max(500, 'Reason too long'),
});

const addCommentSchema = z.object({
  text: z.string()
    .min(1, 'Text is required')
    .max(1000, 'Comment too long'),
});

// ==================== Message Schemas ====================

const sendMessageSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  text: z.string().max(2000, 'Message too long').optional(),
  attachmentIds: z.array(z.string()).optional(),
  replyToMessageId: z.string().optional(),
});

const markAsReadSchema = z.object({
  lastReadMessageId: z.string().min(1, 'Message ID is required'),
});

const deleteMessageSchema = z.object({
  scope: z.enum(['me', 'all']).default('me'),
});

// ==================== Server (Community) Schemas ====================

const createServerSchema = z.object({
  name: z.string()
    .min(1, 'Server name is required')
    .max(100, 'Server name too long'),
  username: usernameSchema
    .optional()
    .refine(
      (val) => !val || val.length >= 5,
      'Public server username must be at least 5 characters'
    ),
  type: z.enum(['public', 'private'], {
    error: 'Type must be "public" or "private"',
  }),
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
});

const updateServerSchema = z.object({
  name: z.string()
    .min(1, 'Server name is required')
    .max(100, 'Server name too long')
    .optional(),
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
  username: usernameSchema.optional(),
});

const createChannelSchema = z.object({
  name: z.string()
    .min(2, 'Channel name must be at least 2 characters')
    .max(50, 'Channel name too long')
    .transform(val => val.toLowerCase().replace(/\s+/g, '-')),
});

const joinServerSchema = z.object({
  serverId: z.coerce.number().int().positive(),
});

const requestJoinSchema = z.object({
  serverId: z.coerce.number().int().positive(),
});

const approveRequestSchema = z.object({
  serverId: z.coerce.number().int().positive(),
  requestId: z.coerce.number().int().positive(),
});

const changeMemberRoleSchema = z.object({
  roleId: z.coerce.number().int().positive('Role ID must be positive'),
});

const kickMemberSchema = z.object({
  memberId: z.coerce.number().int().positive('Member ID must be positive'),
});

const sendServerMessageSchema = z.object({
  text: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() : val),
    z.string().max(2000, 'Message too long').optional()
  ),
  attachmentIds: z.array(z.string()).optional(),
  replyToMessageId: z.string().optional(),
}).refine(
  (data) => (data.text && data.text.length > 0) || (data.attachmentIds && data.attachmentIds.length > 0),
  { message: 'Message text or attachments are required' }
);

// ==================== Verification Schemas ====================

const submitVerificationRequestSchema = z.object({
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason too long'),
  tiktokVideoUrl: z.string()
    .url('Invalid TikTok URL')
    .refine(
      (url) => url.includes('tiktok.com'),
      'Must be a valid TikTok video URL'
    ),
});

const reviewVerificationRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNotes: z.string().max(500).optional(),
});

// ==================== Upload Schemas ====================

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
];

const uploadAvatarSchema = z.object({
  file: z.any()
    .refine((file) => file?.size <= MAX_FILE_SIZE, 'File size must be less than 25MB')
    .refine(
      (file) => ALLOWED_IMAGE_TYPES.includes(file?.mimetype),
      'Only image files are allowed (jpeg, jpg, png, gif, webp)'
    ),
});

const uploadBannerSchema = uploadAvatarSchema;

const uploadFileSchema = z.object({
  file: z.any()
    .refine((file) => file?.size <= MAX_FILE_SIZE, 'File size must be less than 25MB')
    .refine(
      (file) => {
        // РџСЂРѕРІРµСЂРєР° РїРѕ СЂР°СЃС€РёСЂРµРЅРёСЋ
        const ext = file?.originalname?.toLowerCase().split('.').pop();
        const forbiddenExts = ['exe', 'bat', 'cmd', 'sh', 'ps1', 'vbs', 'js', 'jar'];
        return !forbiddenExts.includes(ext);
      },
      'This file type is not allowed'
    ),
});

// ==================== Helper Functions ====================

/**
 * Р’Р°Р»РёРґРёСЂРѕРІР°С‚СЊ РґР°РЅРЅС‹Рµ Рё РІРµСЂРЅСѓС‚СЊ СЂРµР·СѓР»СЊС‚Р°С‚
 * @param {z.ZodSchema} schema - Zod СЃС…РµРјР°
 * @param {object} data - Р”Р°РЅРЅС‹Рµ РґР»СЏ РІР°Р»РёРґР°С†РёРё
 * @returns {{ success: boolean, data?: any, errors?: object }}
 */
const validate = (schema, data) => {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten(),
    };
  }
  
  return {
    success: true,
    data: result.data,
  };
};

/**
 * РЎРѕР·РґР°С‚СЊ middleware РґР»СЏ РІР°Р»РёРґР°С†РёРё
 * @param {z.ZodSchema} schema - Zod СЃС…РµРјР°
 * @returns {function} Express middleware
 */
const createValidator = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      const { ValidationError } = require('./errors');
      const fieldErrors = result.error.flatten().fieldErrors;
      throw new ValidationError('Validation failed', { fields: fieldErrors });
    }
    
    // Р—Р°РјРµРЅСЏРµРј req.body РЅР° РІР°Р»РёРґРёСЂРѕРІР°РЅРЅС‹Рµ РґР°РЅРЅС‹Рµ (СЃ С‚СЂР°РЅСЃС„РѕСЂРјР°С†РёСЏРјРё)
    req.body = result.data;
    next();
  };
};

// ==================== Exports ====================

module.exports = {
  // Schemas
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  deleteAccountSchema,
  createPostSchema,
  reportPostSchema,
  addCommentSchema,
  sendMessageSchema,
  markAsReadSchema,
  deleteMessageSchema,
  createServerSchema,
  updateServerSchema,
  createChannelSchema,
  joinServerSchema,
  requestJoinSchema,
  approveRequestSchema,
  changeMemberRoleSchema,
  kickMemberSchema,
  sendServerMessageSchema,
  submitVerificationRequestSchema,
  reviewVerificationRequestSchema,
  uploadAvatarSchema,
  uploadBannerSchema,
  uploadFileSchema,
  
  // Helpers
  validate,
  createValidator,
  
  // Common schemas
  emailSchema,
  passwordSchema,
  usernameSchema,
  nameSchema,
  idSchema,
  paginationSchema,
};

