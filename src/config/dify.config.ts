export const difyConfig = {
  baseUrl: process.env.DIFY_BASE_URL || 'https://api.dify.ai',
  apiKey: process.env.DIFY_API_KEY || '',
  workflowId: process.env.DIFY_WORKFLOW_ID || '',
  webhookSecret: process.env.DIFY_WEBHOOK_SECRET || '',
  webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dify/webhook`,
} as const;
