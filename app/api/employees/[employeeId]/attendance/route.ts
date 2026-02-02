import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { attendance, employees } from '@/drizzle/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/employees/[employeeId]/attendance?startDate=...&endDate=...
export async function GET(req: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
    try {
        const { employeeId } = await params;
        const { searchParams } = new URL(req.url);

        // Get date range from query params or default to last 30 days
        const endDate = searchParams.get('endDate')
            ? new Date(searchParams.get('endDate')!)
            : new Date();
        const startDate = searchParams.get('startDate')
            ? new Date(searchParams.get('startDate')!)
            : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

        // Normalize to start/end of day
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59);

        // Fetch employee info
        const [employee] = await db
            .select()
            .from(employees)
            .where(eq(employees.id, employeeId))
            .limit(1);

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // Fetch attendance records
        const records = await db
            .select()
            .from(attendance)
            .where(
                and(
                    eq(attendance.employeeId, employeeId),
                    gte(attendance.date, start),
                    lte(attendance.date, end)
                )
            )
            .orderBy(desc(attendance.date));

        // Calculate statistics
        const totalRecords = records.length;
        const presentCount = records.filter(r => r.present).length;
        const absentCount = records.filter(r => !r.present).length;
        const attendancePercentage = totalRecords > 0
            ? Math.round((presentCount / totalRecords) * 100)
            : 0;

        // Calculate total days in range
        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        return NextResponse.json({
            employee: {
                id: employee.id,
                name: employee.name,
                projectId: employee.projectId,
            },
            attendance: records,
            stats: {
                totalDays,
                totalRecords,
                presentCount,
                absentCount,
                notMarkedCount: totalDays - totalRecords,
                attendancePercentage,
            },
            dateRange: {
                start: start.toISOString(),
                end: end.toISOString(),
            },
        });
    } catch (error: any) {
        console.error('Error fetching employee attendance:', error);
        return NextResponse.json(
            { error: 'Failed to fetch attendance history' },
            { status: 500 }
        );
    }
}
