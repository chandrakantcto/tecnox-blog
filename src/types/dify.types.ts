export interface DifyTriggerInput {
  taskId:        string;
  contentType:   string;
  keywords:      string[];
  targetUrl?:    string;
  productName?:  string;
  /** 'blocking' runs synchronously; 'async' uses Dify's callback. Default: 'blocking' */
  responseMode?: 'blocking' | 'async';
  /** Dify user identifier for rate-limiting / audit. Default: 'admin-user' */
  user?:         string;
}

export interface DifyRunResponse {
  workflow_run_id: string;
  task_id:         string;
  data?:           Record<string, unknown>;
}

export interface DifyRunStatus {
  id:             string;
  workflow_id:    string;
  status:         'running' | 'succeeded' | 'failed' | 'stopped';
  outputs?:       Record<string, unknown>;
  error?:         string;
  elapsed_time?:  number;
  total_tokens?:  number;
  created_at?:    number;
  finished_at?:   number;
}

export interface DifyWebhookPayload {
  event:            string;
  workflow_run_id:  string;
  task_id:          string;
  data: {
    title:                   string;
    slug?:                   string;
    excerpt?:                string;
    content:                 string;
    meta_title?:             string;
    meta_description?:       string;
    keywords?:               string[];
    category_slug?:          string;
    tags?:                   string[];
    featured_image_prompt?:  string;
  };
  signature?: string;
}

/** Simplified dummy/test webhook payload (used for local testing) */
export interface DummyWebhookPayload {
  task_id:      string | number;
  status:       'completed' | 'failed' | 'processing';
  response?:    string;
  executed_at?: string;
}
