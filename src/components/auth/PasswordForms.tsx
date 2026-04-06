import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface ForgotPasswordFormProps {
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ email, setEmail, loading, onSubmit, onBackToLogin }: ForgotPasswordFormProps) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="forgot-email" className="text-sm">{t('auth.email')}</Label>
        <Input id="forgot-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="h-10 sm:h-11" autoComplete="email" />
      </div>
      <Button type="submit" className="w-full h-10 sm:h-11 bg-gradient-primary hover:opacity-90 text-sm sm:text-base" disabled={loading}>
        {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.sending')}</>) : t('auth.sendResetLink')}
      </Button>
      <Button type="button" variant="ghost" className="w-full h-10 sm:h-11 text-sm sm:text-base" onClick={onBackToLogin}>
        {t('auth.backToLogin')}
      </Button>
    </form>
  );
}

interface ResetPasswordFormProps {
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showNewPassword: boolean;
  setShowNewPassword: (v: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function ResetPasswordForm({
  newPassword, setNewPassword, confirmPassword, setConfirmPassword,
  showNewPassword, setShowNewPassword, showConfirmPassword, setShowConfirmPassword,
  loading, onSubmit,
}: ResetPasswordFormProps) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="new-password" className="text-sm">{t('auth.newPassword')}</Label>
        <div className="relative">
          <Input id="new-password" type={showNewPassword ? "text" : "password"} placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={loading} className="h-10 sm:h-11 pr-10" autoComplete="new-password" />
          <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="confirm-password" className="text-sm">{t('auth.confirmPassword')}</Label>
        <div className="relative">
          <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} className="h-10 sm:h-11 pr-10" autoComplete="new-password" />
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full h-10 sm:h-11 bg-gradient-primary hover:opacity-90 text-sm sm:text-base" disabled={loading}>
        {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.updating')}</>) : t('auth.updatePassword')}
      </Button>
    </form>
  );
}
