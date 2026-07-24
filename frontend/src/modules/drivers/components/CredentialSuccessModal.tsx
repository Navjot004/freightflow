import React, { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { useToast } from '../../../components/ui/Toast';
import {
  Key, Copy, Check, Eye, EyeOff, Mail, ShieldCheck, X, Lock, Sparkles
} from 'lucide-react';

export interface CredentialInfo {
  name: string;
  email: string;
  password: string;
  role: string;
  type: 'creation' | 'reset';
}

interface CredentialSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: CredentialInfo | null;
}

export const CredentialSuccessModal: React.FC<CredentialSuccessModalProps> = ({
  isOpen,
  onClose,
  credentials
}) => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | 'all' | null>(null);

  if (!isOpen || !credentials) return null;

  const handleCopy = (text: string, field: 'email' | 'password' | 'all') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast(
      field === 'email'
        ? 'Email copied to clipboard'
        : field === 'password'
        ? 'Password copied to clipboard'
        : 'All credentials copied to clipboard',
      'success'
    );
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = () => {
    const allText = `FreightFlow ${credentials.role} Account Credentials\nName: ${credentials.name}\nEmail: ${credentials.email}\nTemporary Password: ${credentials.password}\nLogin Portal: ${window.location.origin}/login`;
    handleCopy(allText, 'all');
  };

  const handleSendMail = () => {
    const subject = encodeURIComponent(`Your FreightFlow ${credentials.role} Account Credentials`);
    const body = encodeURIComponent(
      `Hello ${credentials.name},\n\nYour ${credentials.role} account credentials for FreightFlow are:\n\nEmail: ${credentials.email}\nTemporary Password: ${credentials.password}\n\nPlease log in at: ${window.location.origin}/login\n\nNote: You will be prompted to update your password upon your first login.\n\nBest regards,\nFreightFlow Logistics`
    );
    window.open(`mailto:${credentials.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const isReset = credentials.type === 'reset';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in-80">
      <Card className="max-w-md w-full shadow-2xl rounded-3xl border border-border overflow-hidden bg-background">
        {/* Gradient Header Banner */}
        <div className={`p-6 text-white relative ${isReset ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700'}`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shrink-0">
              {isReset ? <Key className="w-6 h-6 text-amber-200" /> : <Sparkles className="w-6 h-6 text-blue-200" />}
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 uppercase tracking-wider">
                {isReset ? 'Password Reset' : 'New Account'}
              </span>
              <h2 className="text-lg font-bold mt-1 text-white">
                {isReset ? 'Password Reset Complete' : `${credentials.role} Account Created`}
              </h2>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-5">
          {/* Target Member Info Badge */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/60 border border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                {credentials.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-xs text-foreground">{credentials.name}</div>
                <div className="text-[11px] text-muted-foreground">{credentials.role} Account</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Ready
            </span>
          </div>

          {/* Credentials Display Card */}
          <div className="space-y-3 rounded-2xl border border-border p-4 bg-card shadow-inner">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Email Address
              </label>
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/70 border border-border">
                <span className="text-xs font-mono font-medium text-foreground truncate">{credentials.email}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(credentials.email, 'email')}
                  className="h-7 px-2 text-[11px] rounded-lg gap-1 shrink-0 hover:bg-background"
                >
                  {copiedField === 'email' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span>{copiedField === 'email' ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>

            {/* Temporary Password Field */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Temporary Password
              </label>
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-sm font-mono font-bold text-foreground">
                    {showPassword ? credentials.password : '••••••••••••'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(credentials.password, 'password')}
                    className="h-7 px-2 text-[11px] rounded-lg gap-1 shrink-0 hover:bg-background text-amber-700 dark:text-amber-300 font-bold"
                  >
                    {copiedField === 'password' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedField === 'password' ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Dismiss */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyAll}
                className="w-full rounded-xl text-xs font-semibold gap-1.5 h-10 border-border"
              >
                {copiedField === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'all' ? 'Copied All!' : 'Copy All Info'}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleSendMail}
                className="w-full rounded-xl text-xs font-semibold gap-1.5 h-10 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              >
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span>Send via Mail</span>
              </Button>
            </div>

            <Button
              type="button"
              onClick={onClose}
              className="w-full h-11 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md mt-1"
            >
              Done & Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
