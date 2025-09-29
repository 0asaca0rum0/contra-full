import { NextRequest, NextResponse } from 'next/server';
import { planWarehouseImage, publicUrlForKey } from '@/lib/s3';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { ext?: string | null } | null;
  const rawExt = typeof body?.ext === 'string' ? body.ext : '';
  const ext = rawExt.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'bin';
  const plan = planWarehouseImage(ext);
  return NextResponse.json({
    key: plan.key,
    uploadUrl: plan.uploadUrl,
    formField: plan.formField,
    publicUrl: publicUrlForKey(plan.key),
  });
}
