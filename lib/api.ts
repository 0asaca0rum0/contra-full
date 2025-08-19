import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
// @ts-ignore - module will be installed (zod)
import { ZodError } from 'zod';

export type ApiSuccess<T> = { success: true; requestId: string; data: T };
export type ApiError = { success: false; requestId: string; error: { code: string; message: string; details?: any } };

export function apiSuccess<T>(req: NextRequest | null, data: T, init?: ResponseInit) {
  const requestId = getRequestId(req);
  return NextResponse.json({ success: true, requestId, data } as ApiSuccess<T>, init);
}

export function apiError(req: NextRequest | null, code: string, message: string, status = 400, details?: any) {
  const requestId = getRequestId(req);
  return NextResponse.json({ success: false, requestId, error: { code, message, details } } as ApiError, { status });
}

export function getRequestId(req: NextRequest | null | undefined) {
  // Reuse existing header if provided by a proxy / client
  const existing = req?.headers.get('x-request-id');
  return existing || randomUUID();
}

export function parseQueryInt(req: NextRequest, key: string, def: number, max: number) {
  const v = Number(new URL(req.url).searchParams.get(key));
  if (!Number.isFinite(v) || v <= 0) return def;
  return Math.min(v, max);
}

export function handleZod(req: NextRequest, e: unknown) {
  if (e && typeof e === 'object' && (e as any).issues && e instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of (e as any).issues) {
      const path = issue.path.join('.') || '_';
      (fieldErrors[path] ||= []).push(issue.message);
    }
    return apiError(req, 'validation_error', 'فشل التحقق من صحة البيانات', 422, { fieldErrors });
  }
  return apiError(req, 'invalid_payload', 'بيانات غير صالحة', 400);
}

// Simple logger abstraction
export const logger = {
  info(meta: any, msg?: string) { try { console.log('[INFO]', msg || '', meta); } catch {} },
  error(meta: any, msg?: string) { try { console.error('[ERROR]', msg || '', meta); } catch {} },
};
