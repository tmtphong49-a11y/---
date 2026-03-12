import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
}

export default function AlertDialog({
  isOpen,
  title,
  message,
  onClose,
  type = 'info'
}: AlertDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              type === 'success' ? "bg-emerald-50 text-emerald-600" : 
              type === 'error' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
            )}>
              {type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">{message}</p>
          
          <button
            onClick={onClose}
            className={cn(
              "w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg",
              type === 'success' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" : 
              type === 'error' ? "bg-red-600 hover:bg-red-700 shadow-red-100" : "bg-slate-900 hover:bg-slate-800"
            )}
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
}
