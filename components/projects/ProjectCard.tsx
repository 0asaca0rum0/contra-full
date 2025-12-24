"use client";
import { useState } from 'react';
import Link from 'next/link';
import { FiEdit2, FiCheck, FiX, FiFolder, FiTrendingUp } from 'react-icons/fi';

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
    <div className="group relative rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-500/10">
      {/* Decorative gradient bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
      
      <div className="p-5">
        {/* Header with icon and edit */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <FiFolder className="h-5 w-5" />
            </div>
            
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                disabled={saving}
                className="flex-1 bg-slate-700/50 border border-emerald-500/40 rounded-lg px-3 py-1.5 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            ) : (
              <h3 className="font-bold text-white text-lg truncate">{displayName}</h3>
            )}
          </div>
          
          {/* Edit controls */}
          {isEditing ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
              >
                <FiCheck className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors disabled:opacity-50"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsEditing(true);
              }}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-white transition-all"
              title="تعديل الاسم"
            >
              <FiEdit2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Project info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">الميزانية</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <FiTrendingUp className="h-3.5 w-3.5" />
              {project.totalBudget?.toLocaleString('ar-DZ') || 0} د.ج
            </span>
          </div>
          
          <div className="text-xs text-slate-500">
            ID: {project.id.slice(0, 8)}...
          </div>
        </div>

        {/* Link to project details */}
        <Link
          href={`/projects/${project.id}`}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 hover:border-emerald-400/40"
        >
          عرض التفاصيل
        </Link>
      </div>
    </div>
  );
}
