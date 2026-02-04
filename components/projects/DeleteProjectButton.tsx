'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaTrash } from 'react-icons/fa6';

interface DeleteProjectButtonProps {
     projectId: string;
     projectName: string;
}

export default function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
     const [isDeleting, setIsDeleting] = useState(false);
     const [showConfirm, setShowConfirm] = useState(false);
     const router = useRouter();

     const handleDelete = async () => {
          setIsDeleting(true);
          try {
               const res = await fetch(`/api/projects/${projectId}?force=1`, {
                    method: 'DELETE',
               });

               if (!res.ok) {
                    const error = await res.json();
                    alert(`فشل حذف المشروع: ${error.error || 'خطأ غير معروف'}`);
                    setIsDeleting(false);
                    return;
               }

               // Success - redirect to projects list
               router.push('/projects');
               router.refresh();
          } catch (err) {
               console.error('Delete error:', err);
               alert('حدث خطأ أثناء حذف المشروع');
               setIsDeleting(false);
          }
     };

     if (!showConfirm) {
          return (
               <button
                    onClick={() => setShowConfirm(true)}
                    className="px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-medium text-sm transition-colors flex items-center gap-2"
                    title="حذف المشروع"
               >
                    <FaTrash className="text-xs" />
                    حذف المشروع
               </button>
          );
     }

     return (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-300 rounded-xl px-4 py-2">
               <span className="text-sm font-medium text-rose-900">
                    هل أنت متأكد من حذف "{projectName}"؟
               </span>
               <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-medium text-sm transition-colors"
               >
                    {isDeleting ? 'جاري الحذف...' : 'نعم، احذف'}
               </button>
               <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isDeleting}
                    className="px-3 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-700 font-medium text-sm transition-colors"
               >
                    إلغاء
               </button>
          </div>
     );
}
