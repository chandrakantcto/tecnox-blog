/**
 * GET /api/cron/process-tasks
 *
 * Called every minute by Vercel Cron (or any external scheduler).
 * Finds all pending tasks whose scheduledAt <= now and executes them
 * via the task-runner (queue or direct Dify call, depending on env flags).
 *
 * Security: requires the `Authorization: Bearer <CRON_SECRET>` header.
 * Vercel automatically injects this when the cron triggers the route.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processDueTasks } from '@/lib/task-runner';
import { env } from '@/config/env';

export const maxDuration = 60; // seconds — allow time for Dify calls

export async function GET(request: NextRequest) {
  // ── Auth: verify cron secret ───────────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const expected   = `Bearer ${env.CRON_SECRET}`;

  if (authHeader !== expected) {
    // In development, also allow calls without auth for easy manual testing
    if (env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }
    console.warn('[Cron] No/invalid auth header — allowed in development mode.');
  }

  const startedAt = Date.now();
  console.info('[Cron] process-tasks fired at', new Date().toISOString());

  try {
    const { processed, errors } = await processDueTasks();
    const elapsed = Date.now() - startedAt;

    console.info(`[Cron] Done — processed: ${processed}, errors: ${errors}, elapsed: ${elapsed}ms`);

    return NextResponse.json({
      success: true,
      data: {
        processed,
        errors,
        elapsed_ms: elapsed,
        triggered_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Cron] process-tasks fatal error:', message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
