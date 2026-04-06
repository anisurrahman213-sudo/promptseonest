import { useState, useEffect } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Sparkles, Moon, Sun, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoginForm, SignupForm } from '@/components/auth/AuthForms';
import { ForgotPasswordForm, ResetPasswordForm } from '@/components/auth/PasswordForms';

export default function Auth() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const defaultTab = tabParam === 'signup' ? 'signup' : tabParam === 'reset' ? 'reset' : tabParam === 'forgot' ? 'forgot' : 'login';
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [lockRemainingMinutes, setLockRemainingMinutes] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const { signIn, signUp, signInWithGoogle, signInWithApple, resetPassword, updatePassword, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isAccountLocked && lockRemainingMinutes > 0) {
      intervalId = setInterval(() => {
        setLockRemainingMinutes(prev => {
          if (prev <= 1) { setIsAccountLocked(false); setAttemptsRemaining(5); return 0; }
          return prev - 1;
        });
      }, 60000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isAccountLocked, lockRemainingMinutes]);

  const checkLoginAttempt = async (emailToCheck: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-login-attempt', { body: { action: 'check', email: emailToCheck } });
      if (error) { console.error('Error checking login attempt:', error); return true; }
      if (data?.locked) { setIsAccountLocked(true); setLockRemainingMinutes(data.remainingMinutes || 15); toast.error(data.message || t('auth.accountLocked', { minutes: data.remainingMinutes || 15 })); return false; }
      setAttemptsRemaining(data?.attemptsRemaining || 5);
      return true;
    } catch (err) { console.error('Error in checkLoginAttempt:', err); return true; }
  };

  const recordFailedAttempt = async (emailToRecord: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-login-attempt', { body: { action: 'record_failure', email: emailToRecord } });
      if (error) { console.error('Error recording failed attempt:', error); return; }
      if (data?.locked) { setIsAccountLocked(true); setLockRemainingMinutes(data.remainingMinutes || 15); toast.error(data.message); }
      else if (data?.attemptsRemaining !== undefined) { setAttemptsRemaining(data.attemptsRemaining); if (data.attemptsRemaining <= 2) toast.warning(t('auth.attemptsWarning', { count: data.attemptsRemaining })); }
    } catch (err) { console.error('Error in recordFailedAttempt:', err); }
  };

  const resetLoginAttempts = async (emailToReset: string) => {
    try { await supabase.functions.invoke('check-login-attempt', { body: { action: 'reset', email: emailToReset } }); setAttemptsRemaining(5); setIsAccountLocked(false); }
    catch (err) { console.error('Error resetting login attempts:', err); }
  };

  useEffect(() => {
    const provider = searchParams.get('provider');
    if (provider === 'google' && user) { toast.success(t('toast.welcomeBack')); navigate('/dashboard'); return; }
    if (user && activeTab !== 'reset') navigate('/dashboard');
  }, [user, activeTab, navigate, searchParams, t]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error(t('errors.fillAllFields')); return; }
    const canProceed = await checkLoginAttempt(email);
    if (!canProceed) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { await recordFailedAttempt(email); toast.error(error.message.includes('Invalid login credentials') ? t('errors.invalidCredentials') : error.message); }
    else { await resetLoginAttempts(email); toast.success(t('toast.welcomeBack')); navigate('/dashboard'); }
  };

  const handleGoogleSignIn = async () => { setGoogleLoading(true); const { error } = await signInWithGoogle(); if (error) { toast.error(error.message); setGoogleLoading(false); } };
  const handleAppleSignIn = async () => { setAppleLoading(true); const { error } = await signInWithApple(); if (error) { toast.error(error.message); setAppleLoading(false); } };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName || !phoneNumber) { toast.error(t('errors.fillAllFields')); return; }
    if (password.length < 6) { toast.error(t('errors.passwordTooShort')); return; }
    setLoading(true);
    const { error, userId } = await signUp(email, password);
    if (error) { setLoading(false); toast.error(error.message.includes('already registered') || error.message.includes('User already registered') ? t('errors.emailAlreadyRegistered') : error.message); return; }
    if (userId) {
      let retries = 3; let profileUpdated = false;
      while (retries > 0 && !profileUpdated) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const { error: profileError } = await supabase.from('user_profiles').update({ full_name: fullName.trim(), phone_number: phoneNumber.trim() }).eq('user_id', userId);
        if (!profileError) profileUpdated = true;
        else { retries--; if (retries === 0) console.error('Error updating profile after retries:', profileError); }
      }
    }
    setLoading(false); toast.success(t('toast.accountCreated')); navigate('/dashboard');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error(t('errors.fillAllFields')); return; }
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success(t('toast.passwordResetSent'));
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) { toast.error(t('errors.fillAllFields')); return; }
    if (newPassword.length < 6) { toast.error(t('errors.passwordTooShort')); return; }
    if (newPassword !== confirmPassword) { toast.error(t('errors.passwordMismatch')); return; }
    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success(t('toast.passwordUpdated')); navigate('/dashboard'); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title="Sign In" description="Sign in or create an account to start generating AI-powered SEO metadata for your images." path="/auth" noindex />
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10">
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-foreground transition-colors p-1">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs sm:text-sm">{t('common.back')}</span>
        </Link>
      </div>
      
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-9 w-9 sm:h-10 sm:w-10">
          {theme === 'light' ? <Moon className="h-4 w-4 sm:h-5 sm:w-5" /> : <Sun className="h-4 w-4 sm:h-5 sm:w-5" />}
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-primary mb-3 sm:mb-4">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">{t('auth.appTitle')}</h1>
            <p className="text-muted-foreground mt-1.5 sm:mt-2 text-sm sm:text-base">{t('auth.appDesc')}</p>
          </div>

          <Card className="shadow-glow">
            <CardHeader className="space-y-1 pb-3 sm:pb-4 px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl text-center font-display">
                {activeTab === 'reset' ? t('auth.resetPasswordTitle') : activeTab === 'forgot' ? t('auth.forgotPasswordTitle') : t('auth.welcome')}
              </CardTitle>
              <CardDescription className="text-center text-xs sm:text-sm">
                {activeTab === 'reset' ? t('auth.resetPasswordDesc') : activeTab === 'forgot' ? t('auth.forgotPasswordDesc') : t('auth.welcomeDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-5 sm:pb-6">
              {activeTab === 'forgot' ? (
                <ForgotPasswordForm email={email} setEmail={setEmail} loading={loading} onSubmit={handleForgotPassword} onBackToLogin={() => setActiveTab('login')} />
              ) : activeTab === 'reset' ? (
                <ResetPasswordForm
                  newPassword={newPassword} setNewPassword={setNewPassword}
                  confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                  showNewPassword={showNewPassword} setShowNewPassword={setShowNewPassword}
                  showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}
                  loading={loading} onSubmit={handleResetPassword}
                />
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-10 sm:h-11">
                    <TabsTrigger value="login" className="text-sm">{t('auth.login')}</TabsTrigger>
                    <TabsTrigger value="signup" className="text-sm">{t('auth.signUp')}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login">
                    <LoginForm
                      email={email} setEmail={setEmail} password={password} setPassword={setPassword}
                      showPassword={showPassword} setShowPassword={setShowPassword}
                      loading={loading} googleLoading={googleLoading} appleLoading={appleLoading}
                      isAccountLocked={isAccountLocked} lockRemainingMinutes={lockRemainingMinutes} attemptsRemaining={attemptsRemaining}
                      onSubmit={handleLogin} onForgotPassword={() => setActiveTab('forgot')}
                      onGoogleSignIn={handleGoogleSignIn} onAppleSignIn={handleAppleSignIn}
                    />
                  </TabsContent>
                  <TabsContent value="signup">
                    <SignupForm
                      email={email} setEmail={setEmail} password={password} setPassword={setPassword}
                      fullName={fullName} setFullName={setFullName} phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber}
                      showPassword={showPassword} setShowPassword={setShowPassword}
                      loading={loading} googleLoading={googleLoading} appleLoading={appleLoading}
                      onSubmit={handleSignUp} onGoogleSignIn={handleGoogleSignIn} onAppleSignIn={handleAppleSignIn}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
