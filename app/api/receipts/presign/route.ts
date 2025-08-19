import { NextRequest, NextResponse } from 'next/server';
import { planLocalReceipt, publicUrlForKey } from '@/lib/s3';

// Returns a planned key and upload endpoint for local storage
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as any;
  const ext = (body?.ext || '').toString().replace(/[^a-zA-Z0-9]/g,'').slice(0,10) || 'bin';
  const plan = planLocalReceipt(ext);
  console.log('RECEIPT_PRESIGN', { ext, key: plan.key });
  return NextResponse.json({ key: plan.key, uploadUrl: plan.uploadUrl, formField: plan.formField, publicUrl: publicUrlForKey(plan.key) });
}
