import React, { useState } from 'react';
import api from '../../core/api';
import { Button } from './button';
import { Textarea } from './textarea';
import { Label } from './label';
import { useToast } from './Toast';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface RaiseDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadId: string;
  onSuccess?: () => void;
}

export function RaiseDisputeModal({ isOpen, onClose, loadId, onSuccess }: RaiseDisputeModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast('Please enter a reason for the dispute', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/disputes', {
        load_id: loadId,
        reason: reason.trim()
      });
      toast('Dispute filed successfully. Notifications sent to involved parties & platform admins.', 'success');
      setReason('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Failed to raise dispute', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-md overflow-hidden border flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b bg-amber-500/10">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3>Raise Shipment Dispute</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading} className="rounded-xl">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            If a POD was rejected or there is a disagreement regarding cargo delivery, submit details below to initiate formal dispute resolution.
          </p>

          <div className="space-y-2">
            <Label htmlFor="dispute-reason" className="text-xs font-bold">
              Dispute Reason / Details <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="dispute-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why the POD is valid or describe the delivery issue in detail..."
              rows={4}
              className="rounded-xl text-xs"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                </>
              ) : (
                'Submit Dispute'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
