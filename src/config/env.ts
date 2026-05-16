import { z } from 'zod';

// .default() must precede .transform() in Zod v4 so the default is the INPUT type
const boolFlag = z
  .string()
  .default('false')
  .transform((v) => v.toLowerCase() === 'true');

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  /** Empty during Docker/CapRover image build; must be set at runtime (validated in dbConnect). */
  MONGODB_URI: z.string().default(''),

  NEXTAUTH_SECRET: z.string().min(1).default('dev-secret-at-least-32-chars-long!!'),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),

  DIFY_API_KEY: z.string().min(1).default('placeholder-key'),
  DIFY_BASE_URL: z.string().url().default('https://api.dify.ai'),
  DIFY_WORKFLOW_ID: z.string().min(1).default('placeholder-workflow'),
  DIFY_WEBHOOK_SECRET: z.string().min(1).default('placeholder-webhook-secret-32chars'),

  // ── Queue feature flags ───────────────────────────────────────────────────
  ENABLE_QUEUE:    boolFlag,
  ENABLE_REDIS:    boolFlag,
  ENABLE_RABBITMQ: boolFlag,

  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

  QUEUE_CONCURRENCY:  z.coerce.number().default(5),
  QUEUE_MAX_ATTEMPTS: z.coerce.number().default(3),

  // ── Cron ─────────────────────────────────────────────────────────────────
  CRON_SECRET: z.string().default('cron-secret-change-in-production'),

  // ── Blog Publish Webhook ──────────────────────────────────────────────────
  BLOG_WEBHOOK_SECRET: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().min(1).default('placeholder'),
  CLOUDINARY_API_KEY:    z.string().min(1).default('placeholder'),
  CLOUDINARY_API_SECRET: z.string().min(1).default('placeholder'),

  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL:  z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (result.success) {
    return result.data;
  }

  // Do not throw during `next build`: CapRover/Docker often omit secrets until runtime.
  console.warn(
    'Environment validation warning (falling back to schema defaults):',
    result.error.flatten(),
  );

  const fallback = envSchema.safeParse({});
  if (fallback.success) {
    return fallback.data;
  }

  console.error('Fatal: env defaults failed:', fallback.error.flatten());
  throw new Error('Invalid environment configuration');
}

export const env = parseEnv();
