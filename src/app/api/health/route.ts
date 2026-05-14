import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  const start = Date.now();

  let dbStatus = 'disconnected';
  try {
    await connectToDatabase();
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }

  return NextResponse.json({
    status: 'ok',
    services: {
      database: dbStatus,
    },
    uptime: process.uptime(),
    version: '2.0.0',
    responseTime: `${Date.now() - start}ms`,
  });
}
