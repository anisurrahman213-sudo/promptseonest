import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Sparkles, Moon, Sun, Loader2, ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  // Check lock status periodically when locked
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isAccountLocked && lockRemainingMinutes > 0) {
      intervalId = setInterval(() => {
        setLockRemainingMinutes(prev => {
          if (prev <= 1) {
            setIsAccountLocked(false);
            setAttemptsRemaining(5);
            return 0;
          }
          return prev - 1;
        });
      }, 60000); // Update every minute
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAccountLocked, lockRemainingMinutes]);

  // Check login attempt status
  const checkLoginAttempt = async (emailToCheck: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-login-attempt', {
        body: { action: 'check', email: emailToCheck }
      });
      
      if (error) {
        console.error('Error checking login attempt:', error);
        return true; // Allow login on error
      }
      
      if (data?.locked) {
        setIsAccountLocked(true);
        setLockRemainingMinutes(data.remainingMinutes || 15);
        toast.error(data.message || t('auth.accountLocked', { minutes: data.remainingMinutes || 15 }));
        return false;
      }
      
      setAttemptsRemaining(data?.attemptsRemaining || 5);
      return true;
    } catch (err) {
      console.error('Error in checkLoginAttempt:', err);
      return true; // Allow login on error
    }
  };

  // Record failed login attempt
  const recordFailedAttempt = async (emailToRecord: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-login-attempt', {
        body: { action: 'record_failure', email: emailToRecord }
      });
      
      if (error) {
        console.error('Error recording failed attempt:', error);
        return;
      }
      
      if (data?.locked) {
        setIsAccountLocked(true);
        setLockRemainingMinutes(data.remainingMinutes || 15);
        toast.error(data.message);
      } else if (data?.attemptsRemaining !== undefined) {
        setAttemptsRemaining(data.attemptsRemaining);
        if (data.attemptsRemaining <= 2) {
          toast.warning(t('auth.attemptsWarning', { count: data.attemptsRemaining }));
        }
      }
    } catch (err) {
      console.error('Error in recordFailedAttempt:', err);
    }
  };

  // Reset login attempts on successful login
  const resetLoginAttempts = async (emailToReset: string) => {
    try {
      await supabase.functions.invoke('check-login-attempt', {
        body: { action: 'reset', email: emailToReset }
      });
      setAttemptsRemaining(5);
      setIsAccountLocked(false);
    } catch (err) {
      console.error('Error resetting login attempts:', err);
    }
  };

  // Handle Google OAuth callback and redirect if logged in
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check if this is a Google OAuth callback
      const provider = searchParams.get('provider');
      if (provider === 'google' && user) {
        toast.success(t('toast.welcomeBack'));
        navigate('/dashboard');
        return;
      }
      
      // Regular redirect for logged in users (but not on reset tab)
      if (user && activeTab !== 'reset') {
        navigate('/dashboard');
      }
    };
    
    handleAuthCallback();
  }, [user, activeTab, navigate, searchParams, t]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('errors.fillAllFields'));
      return;
    }

    // Check if account is locked before attempting login
    const canProceed = await checkLoginAttempt(email);
    if (!canProceed) {
      return;
    }
    
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    
    if (error) {
      // Record failed attempt
      await recordFailedAttempt(email);
      
      if (error.message.includes('Invalid login credentials')) {
        toast.error(t('errors.invalidCredentials'));
      } else {
        toast.error(error.message);
      }
    } else {
      // Reset attempts on successful login
      await resetLoginAttempts(email);
      toast.success(t('toast.welcomeBack'));
      navigate('/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    const { error } = await signInWithApple();
    if (error) {
      toast.error(error.message);
      setAppleLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName || !phoneNumber) {
      toast.error(t('errors.fillAllFields'));
      return;
    }
    
    if (password.length < 6) {
      toast.error(t('errors.passwordTooShort'));
      return;
    }
    
    setLoading(true);
    const { error, userId } = await signUp(email, password);
    
    if (error) {
      setLoading(false);
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        toast.error(t('errors.emailAlreadyRegistered'));
      } else {
        toast.error(error.message);
      }
      return;
    }

    // Update user profile with name and phone - with retry for race condition
    if (userId) {
      let retries = 3;
      let profileUpdated = false;
      
      while (retries > 0 && !profileUpdated) {
        // Small delay to allow the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ 
            full_name: fullName.trim(), 
            phone_number: phoneNumber.trim() 
          })
          .eq('user_id', userId);
        
        if (!profileError) {
          profileUpdated = true;
        } else {
          retries--;
          if (retries === 0) {
            console.error('Error updating profile after retries:', profileError);
          }
        }
      }
    }
    
    setLoading(false);
    toast.success(t('toast.accountCreated'));
    navigate('/dashboard');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error(t('errors.fillAllFields'));
      return;
    }
    
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('toast.passwordResetSent'));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error(t('errors.fillAllFields'));
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error(t('errors.passwordTooShort'));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error(t('errors.passwordMismatch'));
      return;
    }
    
    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('toast.passwordUpdated'));
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
            <p className="text-muted-foreground mt-1.5 sm:mt-2 text-sm sm:text-base">
              {t('auth.appDesc')}
            </p>
          </div>

          <Card className="shadow-glow">
            <CardHeader className="space-y-1 pb-3 sm:pb-4 px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl text-center font-display">
                {activeTab === 'reset' ? t('auth.resetPasswordTitle') : activeTab === 'forgot' ? t('auth.forgotPasswordTitle') : t('auth.welcome')}
              </CardTitle>
              <CardDescription className="text-center text-xs sm:text-sm">
                {activeTab === 'reset' 
                  ? t('auth.resetPasswordDesc')
                  : activeTab === 'forgot' 
                    ? t('auth.forgotPasswordDesc')
                    : t('auth.welcomeDesc')
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-5 sm:pb-6">
              {activeTab === 'forgot' ? (
                <form onSubmit={handleForgotPassword} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="forgot-email" className="text-sm">{t('auth.email')}</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="h-10 sm:h-11"
                      autoComplete="email"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-10 sm:h-11 bg-gradient-primary hover:opacity-90 text-sm sm:text-base"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.sending')}
                      </>
                    ) : (
                      t('auth.sendResetLink')
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full h-10 sm:h-11 text-sm sm:text-base"
                    onClick={() => setActiveTab('login')}
                  >
                    {t('auth.backToLogin')}
                  </Button>
                </form>
              ) : activeTab === 'reset' ? (
                <form onSubmit={handleResetPassword} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="new-password" className="text-sm">{t('auth.newPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={loading}
                        className="h-10 sm:h-11 pr-10"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm">{t('auth.confirmPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        className="h-10 sm:h-11 pr-10"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-10 sm:h-11 bg-gradient-primary hover:opacity-90 text-sm sm:text-base"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.updating')}
                      </>
                    ) : (
                      t('auth.updatePassword')
                    )}
                  </Button>
                </form>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-10 sm:h-11">
                    <TabsTrigger value="login" className="text-sm">{t('auth.login')}</TabsTrigger>
                    <TabsTrigger value="signup" className="text-sm">{t('auth.signUp')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                      {/* Account Locked Warning */}
                      {isAccountLocked && (
                        <Alert variant="destructive" className="mb-4">
                          <Lock className="h-4 w-4" />
                          <AlertDescription>
                            {t('auth.accountLocked', { minutes: lockRemainingMinutes })}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {/* Low attempts warning */}
                      {!isAccountLocked && attemptsRemaining <= 2 && attemptsRemaining > 0 && (
                        <Alert variant="destructive" className="mb-4 bg-warning/10 border-warning text-warning-foreground">
                          <AlertDescription className="text-sm">
                            ⚠️ {t('auth.attemptsWarning', { count: attemptsRemaining })}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="login-email" className="text-sm">{t('auth.email')}</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading || isAccountLocked}
                          className="h-10 sm:h-11"
                          autoComplete="email"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password" className="text-sm">{t('auth.password')}</Label>
                          <button
                            type="button"
                            onClick={() => setActiveTab('forgot')}
                            className="text-xs text-primary hover:underline py-0.5"
                          >
                            {t('auth.forgotPassword')}
                          </button>
                        </div>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading || isAccountLocked}
                            className="h-10 sm:h-11 pr-10"
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-10 sm:h-11 bg-gradient-primary hover:opacity-90 text-sm sm:text-base"
                        disabled={loading || googleLoading || isAccountLocked}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('auth.signingIn')}
                          </>
                        ) : (
                          t('auth.signIn')
                        )}
                      </Button>

                      <div className="relative my-3 sm:my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-10 sm:h-11 text-sm"
                          onClick={handleGoogleSignIn}
                          disabled={loading || googleLoading || appleLoading}
                        >
                          {googleLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                              <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                              />
                              <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                              />
                              <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                              />
                              <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                              />
                            </svg>
                          )}
                          {t('auth.continueWithGoogle')}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-10 sm:h-11 text-sm"
                          onClick={handleAppleSignIn}
                          disabled={loading || googleLoading || appleLoading}
                        >
                          {appleLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                            </svg>
                          )}
                          {t('auth.continueWithApple')}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="signup-name" className="text-sm">{t('auth.fullName')}</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder={t('auth.yourName')}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          disabled={loading}
                          className="h-10 sm:h-11"
                          autoComplete="name"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="signup-phone" className="text-sm">{t('auth.phoneNumber')}</Label>
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="+880 1XXX-XXXXXX"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          disabled={loading}
                          className="h-10 sm:h-11"
                          autoComplete="tel"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="signup-email" className="text-sm">{t('auth.email')}</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                          className="h-10 sm:h-11"
                          autoComplete="email"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="signup-password" className="text-sm">{t('auth.password')}</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            className="h-10 sm:h-11 pr-10"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-10 sm:h-11 bg-gradient-primary hover:opacity-90 text-sm sm:text-base"
                        disabled={loading || googleLoading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('auth.creatingAccount')}
                          </>
                        ) : (
                          t('auth.createAccount')
                        )}
                      </Button>

                      <div className="relative my-3 sm:my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-10 sm:h-11 text-sm"
                          onClick={handleGoogleSignIn}
                          disabled={loading || googleLoading || appleLoading}
                        >
                          {googleLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                              <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                              />
                              <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                              />
                              <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                              />
                              <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                              />
                            </svg>
                          )}
                          {t('auth.continueWithGoogle')}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-10 sm:h-11 text-sm"
                          onClick={handleAppleSignIn}
                          disabled={loading || googleLoading || appleLoading}
                        >
                          {appleLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                            </svg>
                          )}
                          {t('auth.continueWithApple')}
                        </Button>
                      </div>
                    </form>
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
