import { vi } from 'vitest';

// Mock Next.js server modules
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
      body: JSON.stringify(data),
    })),
  },
}));

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Silence console in tests
global.console.error = vi.fn();
