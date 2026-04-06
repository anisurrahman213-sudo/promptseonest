import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoginFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  loading: boolean;
  googleLoading: boolean;
  appleLoading: boolean;
  isAccountLocked: boolean;
  lockRemainingMinutes: number;
  attemptsRemaining: number;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
  onGoogleSignIn: () => void;
  onAppleSignIn: () => void;
}

export function LoginForm({
  email, setEmail, password, setPassword,
  showPassword, setShowPassword,
  loading, googleLoading, appleLoading,
  isAccountLocked, lockRemainingMinutes, attemptsRemaining,
  onSubmit, onForgotPassword, onGoogleSignIn, onAppleSignIn,
}: LoginFormProps) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
      {isAccountLocked && (
        <Alert variant="destructive" className="mb-4">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            {t('auth.accountLocked', { minutes: lockRemainingMinutes })}
          </AlertDescription>
        </Alert>
      )}
      
      {!isAccountLocked && attemptsRemaining <= 2 && attemptsRemaining > 0 && (
        <Alert variant="destructive" className="mb-4 bg-warning/10 border-warning text-warning-foreground">
          <AlertDescription className="text-sm">
            ⚠️ {t('auth.attemptsWarning', { count: attemptsRemaining })}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="login-email" className="text-sm">{t('auth.email')}</Label>
        <Input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading || isAccountLocked} className="h-10 sm:h-11" autoComplete="email" />
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password" className="text-sm">{t('auth.password')}</Label>
          <button type="button" onClick={onForgotPassword} className="text-xs text-primary hover:underline py-0.5">
            {t('auth.forgotPassword')}
          </button>
        </div>
        <div className="relative">
          <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading || isAccountLocked} className="h-10 sm:h-11 pr-10" autoComplete="current-password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full h-10 sm:h-11 bg-gradient-primary hover:opacity-90 text-sm sm:text-base" disabled={loading || googleLoading || isAccountLocked}>
        {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.signingIn')}</>) : t('auth.signIn')}
      </Button>

      <SocialButtons googleLoading={googleLoading} appleLoading={appleLoading} loading={loading} onGoogleSignIn={onGoogleSignIn} onAppleSignIn={onAppleSignIn} />
    </form>
  );
}

interface SignupFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  fullName: string;
  setFullName: (v: string) => void;
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  loading: boolean;
  googleLoading: boolean;
  appleLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSignIn: () => void;
  onAppleSignIn: () => void;
}

export function SignupForm({
  email, setEmail, password, setPassword,
  fullName, setFullName, phoneNumber, setPhoneNumber,
  showPassword, setShowPassword,
  loading, googleLoading, appleLoading,
  onSubmit, onGoogleSignIn, onAppleSignIn,
}: SignupFormProps) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="signup-name" className="text-sm">{t('auth.fullName')}</Label>
        <Input id="signup-name" type="text" placeholder={t('auth.yourName')} value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={loading} className="h-10 sm:h-11" autoComplete="name" />
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="signup-phone" className="text-sm">{t('auth.phoneNumber')}</Label>
        <Input id="signup-phone" type="tel" placeholder="+880 1XXX-XXXXXX" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={loading} className="h-10 sm:h-11" autoComplete="tel" />
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="signup-email" className="text-sm">{t('auth.email')}</Label>
        <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="h-10 sm:h-11" autoComplete="email" />
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="signup-password" className="text-sm">{t('auth.password')}</Label>
        <div className="relative">
          <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="h-10 sm:h-11 pr-10" autoComplete="new-password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full h-10 sm:h-11 bg-gradient-primary hover:opacity-90 text-sm sm:text-base" disabled={loading || googleLoading}>
        {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.creatingAccount')}</>) : t('auth.createAccount')}
      </Button>

      <SocialButtons googleLoading={googleLoading} appleLoading={appleLoading} loading={loading} onGoogleSignIn={onGoogleSignIn} onAppleSignIn={onAppleSignIn} />
    </form>
  );
}

interface SocialButtonsProps {
  googleLoading: boolean;
  appleLoading: boolean;
  loading: boolean;
  onGoogleSignIn: () => void;
  onAppleSignIn: () => void;
}

function SocialButtons({ googleLoading, appleLoading, loading, onGoogleSignIn, onAppleSignIn }: SocialButtonsProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="relative my-3 sm:my-4">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button type="button" variant="outline" className="w-full h-10 sm:h-11 text-sm" onClick={onGoogleSignIn} disabled={loading || googleLoading || appleLoading}>
          {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          {t('auth.continueWithGoogle')}
        </Button>
        <Button type="button" variant="outline" className="w-full h-10 sm:h-11 text-sm" onClick={onAppleSignIn} disabled={loading || googleLoading || appleLoading}>
          {appleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
          )}
          {t('auth.continueWithApple')}
        </Button>
      </div>
    </>
  );
}
