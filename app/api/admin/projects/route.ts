// Admin projects listing / creation placeholder to satisfy build (empty file caused module error)
import { NextResponse } from 'next/server';

export async function GET() {
	return NextResponse.json({ adminProjects: [], message: 'stub' });
}

export async function POST(req: Request) {
	const body = await req.json().catch(()=>({}));
	return NextResponse.json({ created: true, input: body }, { status: 201 });
}
