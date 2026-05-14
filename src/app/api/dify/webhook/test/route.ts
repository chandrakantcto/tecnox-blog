/**
 * POST /api/dify/webhook/test
 *
 * Convenience endpoint for local / dev testing.
 * Finds the most recent pending/processing task and fires the dummy webhook
 * against the main /api/dify/webhook route with the example payload.
 *
 * Body (all optional — uses defaults when omitted):
 * {
 *   "task_id":     "<mongo-object-id>",   // default: latest pending task
 *   "status":      "completed",           // default: "completed"
 *   "response":    "Dummy AI response",   // default: "Dummy AI response"
 *   "executed_at": "2026-05-13T10:30:00Z" // default: now
 * }
 *
 * Returns a summary of what was sent and the webhook response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AITask } from '@/models/AITask';
import { env } from '@/config/env';

export async function POST(request: NextRequest) {
  // Only allow in non-production
  if (env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Test endpoint is disabled in production' },
      { status: 403 },
    );
  }

  // ── Parse optional body overrides ──────────────────────────────────────────
  let overrides: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text.trim()) overrides = JSON.parse(text);
  } catch {
    // no body is fine
  }

  await connectToDatabase();

  // Resolve target task
  let taskId = overrides.task_id ? String(overrides.task_id) : null;

  if (!taskId) {
    const latest = await AITask.findOne({ status: { $in: ['pending', 'processing', 'failed'] } })
      .sort({ createdAt: -1 });
    if (!latest) {
      return NextResponse.json(
        { success: false, error: 'No pending/processing task found to test with' },
        { status: 404 },
      );
    }
    taskId = String(latest._id);
  }

  // Build the dummy payload
  const dummyPayload = {
    task_id:     taskId,
    status:      (overrides.status      as string)  || 'completed',
    response:    (overrides.response    as string)  || 'Dummy AI response — webhook test successful',
    executed_at: (overrides.executed_at as string)  || new Date().toISOString(),
  };

  // Construct the webhook URL (same server, no network hop needed in tests)
  const webhookUrl = `${env.NEXTAUTH_URL}/api/dify/webhook`;

  console.info('[WebhookTest] Firing dummy webhook', { webhookUrl, payload: dummyPayload });

  // ── Call the main webhook endpoint ─────────────────────────────────────────
  let webhookResponse: Response;
  try {
    webhookResponse = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(dummyPayload),
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error:   `Could not reach webhook endpoint: ${err instanceof Error ? err.message : err}`,
      },
      { status: 502 },
    );
  }

  const webhookResult = await webhookResponse.json();

  console.info('[WebhookTest] Webhook response', {
    status:   webhookResponse.status,
    result:   webhookResult,
  });

  return NextResponse.json({
    success: webhookResponse.ok,
    test: {
      description:       'Dummy webhook fired against POST /api/dify/webhook',
      target_task_id:    taskId,
      webhook_url:       webhookUrl,
      payload_sent:      dummyPayload,
      webhook_status:    webhookResponse.status,
      webhook_response:  webhookResult,
    },
  }, { status: webhookResponse.ok ? 200 : 502 });
}

/**
 * GET /api/dify/webhook/test
 * Returns documentation about the test endpoint and the current task queue.
 */
export async function GET() {
  if (env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Disabled in production' }, { status: 403 });
  }

  await connectToDatabase();
  const tasks = await AITask.find({ status: { $in: ['pending', 'processing', 'failed'] } })
    .select('_id contentType status scheduledAt createdAt')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return NextResponse.json({
    success: true,
    description: 'POST to this endpoint with optional body to fire a dummy webhook',
    example_payload: {
      task_id:     tasks[0] ? String(tasks[0]._id) : '<task-object-id>',
      status:      'completed',
      response:    'Dummy AI response',
      executed_at: new Date().toISOString(),
    },
    available_tasks: tasks.map((t) => ({
      id:          String(t._id),
      contentType: t.contentType,
      status:      t.status,
      scheduledAt: t.scheduledAt,
      createdAt:   t.createdAt,
    })),
  });
}
