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
    <div className="group relative rounded-3xl border border-white/[0.08] bg-[#1a1c1e]/40 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/30 hover:bg-[#1a1c1e]/60 hover:shadow-2xl hover:shadow-emerald-500/5">
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/10 to-emerald-600/10 border border-emerald-500/20 text-emerald-400">
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
                  className="w-full bg-white/5 border border-emerald-500/30 rounded-xl px-4 py-2 text-white text-base font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                  >
                    <FiCheck className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="p-2 rounded-xl bg-white/10 text-white/60 hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-xl tracking-tight truncate">{displayName}</h3>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-white/30 hover:text-white transition-all"
                    title="تعديل"
                  >
                    <FiEdit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-white/30 font-mono mt-0.5 uppercase tracking-widest">
                  ID: {project.id.slice(0, 8)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <FiActivity className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-white/50">الميزانية</span>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              {project.totalBudget?.toLocaleString('ar-DZ') || 0}
              <span className="text-xs font-medium text-white/40 mr-1.5 uppercase">د.ج</span>
            </span>
          </div>
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="flex items-center justify-center w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white transition-all hover:bg-emerald-500 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/25"
        >
          عرض التفاصيل
        </Link>
      </div>
    </div>
  );
}
