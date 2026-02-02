"use client";
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { FaCheckCircle, FaTimesCircle, FaCalendarAlt, FaTimes } from 'react-icons/fa';

interface AttendanceRecord {
    id: string;
    date: string;
    present: boolean;
    employeeId: string;
    markedById: string;
}

interface AttendanceStats {
    totalDays: number;
    totalRecords: number;
    presentCount: number;
    absentCount: number;
    notMarkedCount: number;
    attendancePercentage: number;
}

interface EmployeeAttendanceHistoryProps {
    employeeId: string;
    employeeName: string;
    onClose: () => void;
}

export default function EmployeeAttendanceHistory({
    employeeId,
    employeeName,
    onClose
}: EmployeeAttendanceHistoryProps) {
    const [loading, setLoading] = useState(true);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [stats, setStats] = useState<AttendanceStats | null>(null);
    const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30');

    const fetchAttendance = async (days: string) => {
        setLoading(true);
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(days));

            const params = new URLSearchParams({
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
            });

            const res = await fetch(`/api/employees/${employeeId}/attendance?${params}`);
            const data = await res.json();

            if (res.ok) {
                setAttendance(data.attendance || []);
                setStats(data.stats || null);
            }
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance(dateRange);
    }, [employeeId, dateRange]);

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-[70vw] h-[70vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">سجل الحضور</h2>
                        <p className="text-emerald-100 text-sm">{employeeName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                    >
                        <FaTimes className="w-6 h-6" />
                    </button>
                </div>

                {/* Date Range Selector */}
                <div className="px-8 py-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-slate-500" />
                        <span className="text-sm font-semibold text-slate-700 ml-4">الفترة الزمنية:</span>
                        <div className="flex gap-2">
                            {(['7', '30', '90'] as const).map((days) => (
                                <button
                                    key={days}
                                    onClick={() => setDateRange(days)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === days
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                                        }`}
                                >
                                    آخر {days} يوم
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                {stats && (
                    <div className="px-8 py-6 bg-white border-b border-slate-200">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <div className="text-xs text-slate-500 font-semibold mb-1">إجمالي الأيام</div>
                                <div className="text-2xl font-bold text-slate-900">{stats.totalDays}</div>
                            </div>
                            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                                <div className="text-xs text-emerald-700 font-semibold mb-1">الحضور</div>
                                <div className="text-2xl font-bold text-emerald-900">{stats.presentCount}</div>
                            </div>
                            <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
                                <div className="text-xs text-rose-700 font-semibold mb-1">الغياب</div>
                                <div className="text-2xl font-bold text-rose-900">{stats.absentCount}</div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <div className="text-xs text-slate-500 font-semibold mb-1">غير مسجل</div>
                                <div className="text-2xl font-bold text-slate-700">{stats.notMarkedCount}</div>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4">
                                <div className="text-xs text-emerald-100 font-semibold mb-1">نسبة الحضور</div>
                                <div className="text-2xl font-bold text-white">{stats.attendancePercentage}%</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Attendance List */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-slate-400">جاري التحميل...</div>
                        </div>
                    ) : attendance.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="text-slate-400 text-lg mb-2">لا توجد سجلات حضور</div>
                                <div className="text-slate-500 text-sm">لم يتم تسجيل أي حضور في هذه الفترة</div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {attendance.map((record) => (
                                <div
                                    key={record.id}
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${record.present
                                            ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                                            : 'bg-rose-50 border-rose-200 hover:border-rose-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {record.present ? (
                                            <FaCheckCircle className="text-emerald-600 text-2xl" />
                                        ) : (
                                            <FaTimesCircle className="text-rose-600 text-2xl" />
                                        )}
                                        <div>
                                            <div className="font-semibold text-slate-900">
                                                {format(new Date(record.date), 'EEEE، d MMMM yyyy', { locale: ar })}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                {format(new Date(record.date), 'HH:mm', { locale: ar })}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <span
                                            className={`px-4 py-2 rounded-lg font-bold text-sm ${record.present
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-rose-600 text-white'
                                                }`}
                                        >
                                            {record.present ? 'حاضر' : 'غائب'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
