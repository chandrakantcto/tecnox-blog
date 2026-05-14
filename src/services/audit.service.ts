import { connectToDatabase } from '@/lib/mongodb';
import { AuditLog } from '@/models/AuditLog';

interface AuditLogInput {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  ipAddress: string;
  userAgent: string;
}

export class AuditService {
  async log(input: AuditLogInput): Promise<void> {
    try {
      await connectToDatabase();
      await AuditLog.create(input);
    } catch (error) {
      console.error('[Audit] Failed to write audit log:', error);
    }
  }
}

export const auditService = new AuditService();
