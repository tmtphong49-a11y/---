import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  type = 'danger'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center",
              type === 'danger' ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
            )}>
              <AlertTriangle size={24} />
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-all">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
        </div>
        
        <div className="p-4 bg-slate-50 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onCancel(); }}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all shadow-lg",
              type === 'danger' ? "bg-red-600 hover:bg-red-700 shadow-red-100" : "bg-orange-600 hover:bg-orange-700 shadow-orange-100"
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
