"use client";
import { useState } from 'react';
import Link from 'next/link';
import { FiEdit2, FiCheck, FiX, FiFolder, FiActivity } from 'react-icons/fi';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    totalBudget?: number;
  };
  onNameUpdate?: (id: string, newName: string) => Promise<boolean>;
}

export default function ProjectCard({ project, onNameUpdate }: ProjectCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(project.name);

  const handleSave = async () => {
    if (!editName.trim() || editName === displayName) {
      setIsEditing(false);
      setEditName(displayName);
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      
      if (res.ok) {
        setDisplayName(editName.trim());
        if (onNameUpdate) {
          await onNameUpdate(project.id, editName.trim());
        }
      }
    } catch (e) {
      setEditName(displayName);
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(displayName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <div className="group relative rounded-3xl border border-white/10 bg-[#1a1c1e] transition-all duration-300 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10">
      <div className="p-6">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <FiFolder className="h-6 w-6" />
            </div>
            
            {isEditing ? (
              <div className="flex-1 flex gap-2 items-center">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  disabled={saving}
                  className="w-full bg-slate-800 border border-emerald-500/50 rounded-xl px-4 py-2 text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg"
                  >
                    <FiCheck className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-2 rounded-xl bg-slate-700 text-white/80 hover:bg-slate-600"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-2xl tracking-tight truncate">{displayName}</h3>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-emerald-500 hover:text-emerald-400 transition-all"
                    title="تعديل"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-emerald-500/70 font-bold mt-1 uppercase tracking-wider">
                  #{project.id.slice(0, 8)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-800/50 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <FiActivity className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-slate-300 uppercase tracking-wide">الميزانية</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-black text-white leading-none">
                {project.totalBudget?.toLocaleString('ar-DZ') || 0}
              </span>
              <span className="text-[10px] font-bold text-emerald-500 mt-1 uppercase">دينار جزائري</span>
            </div>
          </div>
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="flex items-center justify-center w-full py-4 rounded-2xl bg-emerald-500 text-white text-sm font-black uppercase tracking-widest transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95"
        >
          فتح بيانات المشروع
        </Link>
      </div>
    </div>
  );
}
