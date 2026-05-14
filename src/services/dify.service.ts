import type { DifyTriggerInput, DifyRunResponse, DifyRunStatus } from '@/types/dify.types';
import { validateDifyWebhook } from '@/lib/webhook-validator';

export class DifyService {
  private readonly baseUrl:     string;
  private readonly apiKey:      string;
  private readonly workflowId:  string;
  private readonly webhookSecret: string;

  // Webhook URL is constructed at call-time so it picks up the runtime env.
  get webhookUrl(): string {
    // NEXTAUTH_URL reflects the actual port the server is running on.
    const base = process.env.NEXTAUTH_URL
      || process.env.NEXT_PUBLIC_APP_URL
      || 'http://localhost:3003';
    return `${base}/api/dify/webhook`;
  }

  constructor() {
    this.baseUrl       = process.env.DIFY_BASE_URL      || 'https://api.dify.ai';
    this.apiKey        = process.env.DIFY_API_KEY        || '';
    this.workflowId    = process.env.DIFY_WORKFLOW_ID    || '';
    this.webhookSecret = process.env.DIFY_WEBHOOK_SECRET || '';
  }

  async triggerWorkflow(input: DifyTriggerInput): Promise<DifyRunResponse> {
    const responseMode = input.responseMode || 'blocking';
    const user         = input.user         || 'admin-user';

    const payload = {
      inputs: {
        Content_type:               input.contentType,
        keywords:                   input.keywords.join(', '),
        url:                        input.targetUrl   || '',
        Product_or_category_name:   input.productName || '',
        task_id:                    input.taskId,
        webhook_url:                this.webhookUrl,
      },
      response_mode: responseMode,
      user,
    };

    console.info('[Dify] Triggering workflow', {
      taskId:       input.taskId,
      contentType:  input.contentType,
      keywords:     input.keywords,
      responseMode,
      user,
      webhookUrl:   this.webhookUrl,
      workflowId:   this.workflowId,
    });

    const response = await fetch(`${this.baseUrl}/v1/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('[Dify] Workflow trigger failed', {
        status:   response.status,
        response: responseText,
      });
      throw new Error(`Dify API error ${response.status}: ${responseText}`);
    }

    let data: DifyRunResponse;
    try {
      data = JSON.parse(responseText) as DifyRunResponse;
    } catch {
      throw new Error(`Dify API returned non-JSON: ${responseText.slice(0, 200)}`);
    }

    console.info('[Dify] Workflow triggered successfully', {
      taskId:          input.taskId,
      workflowRunId:   data.workflow_run_id,
      difyTaskId:      data.task_id,
    });

    return data;
  }

  async getWorkflowStatus(runId: string): Promise<DifyRunStatus> {
    const response = await fetch(`${this.baseUrl}/v1/workflows/run/${runId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to get workflow status: ${response.status}`);
    }

    return response.json() as Promise<DifyRunStatus>;
  }

  validateWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.webhookSecret || this.webhookSecret.startsWith('placeholder')) {
      return true; // Skip validation when secret is not configured
    }
    return validateDifyWebhook(rawBody, signature, this.webhookSecret);
  }
}
