import React from 'react';
import { Button } from './button';
import { X, AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2 text-lg font-semibold">
            {variant === 'danger' && <AlertCircle className="w-5 h-5 text-red-500" />}
            <h3>{title}</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-300">{message}</p>
        </div>
        
        <div className="p-4 border-t bg-muted/20 flex justify-end gap-3 mt-auto">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button 
            type="button" 
            onClick={onConfirm} 
            disabled={loading}
            className={
              variant === 'danger' 
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
