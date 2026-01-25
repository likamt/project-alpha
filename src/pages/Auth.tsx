import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Mail, Lock, User, Phone, Eye, EyeOff, KeyRound, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type AuthStep = "login" | "signup" | "verify-otp" | "reset-password";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [step, setStep] = useState<AuthStep>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    checkExistingSession();
    
    // Check if coming from password reset link
    if (searchParams.get('reset') === 'true') {
      setStep("reset-password");
    }
  }, [searchParams]);

  const checkExistingSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && !searchParams.get('reset')) {
      navigate("/profile");
    }
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast({
        title: t('common.error'),
        description: t('auth.invalidEmail'),
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('auth.passwordMismatch'),
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t('common.error'),
        description: t('auth.passwordTooShort'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // إنشاء الحساب مع تأكيد تلقائي
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // إنشاء الملف الشخصي
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: fullName,
          phone: phone,
        });

        // إضافة دور العميل
        await supabase.from("user_roles").insert({
          user_id: data.user.id,
          role: "client",
        });

        // إرسال OTP عبر Edge Function
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
          body: {
            email: email,
            token: otpCode,
            email_action_type: 'signup',
            user_name: fullName,
          },
        });

        if (emailError) {
          console.error('Error sending OTP email:', emailError);
        }

        // حفظ OTP مؤقتاً في localStorage للتحقق
        localStorage.setItem('pending_otp', JSON.stringify({
          email,
          otp: otpCode,
          expires: Date.now() + 10 * 60 * 1000, // 10 دقائق
          userId: data.user.id,
        }));
      }

      toast({
        title: t('common.success'),
        description: t('auth.verificationSent'),
      });

      // انتقال لصفحة التحقق من OTP
      setStep("verify-otp");
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = error.message;
      if (error.message.includes("already registered")) {
        errorMessage = t('auth.emailExists');
      }
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast({
        title: t('common.error'),
        description: t('auth.invalidEmail'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        toast({
          title: t('common.success'),
          description: t('auth.loginSuccess'),
        });
        navigate("/profile");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      let errorMessage = t('auth.invalidCredentials');
      if (error.message.includes("Email not confirmed")) {
        errorMessage = t('auth.emailNotConfirmed');
      }
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: t('common.error'),
        description: t('auth.invalidOtp'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // التحقق من OTP المخزن محلياً
      const pendingOtp = localStorage.getItem('pending_otp');
      
      if (!pendingOtp) {
        throw new Error(t('auth.otpExpired'));
      }

      const { email: storedEmail, otp: storedOtp, expires, userId } = JSON.parse(pendingOtp);

      if (Date.now() > expires) {
        localStorage.removeItem('pending_otp');
        throw new Error(t('auth.otpExpired'));
      }

      if (otp !== storedOtp || email !== storedEmail) {
        throw new Error(t('auth.invalidOtp'));
      }

      // OTP صحيح - تسجيل الدخول تلقائياً
      localStorage.removeItem('pending_otp');

      // تسجيل الدخول بالبريد وكلمة المرور
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('auth.verificationSuccess'),
      });

      navigate("/profile");
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!validateEmail(resetEmail)) {
      toast({
        title: t('common.error'),
        description: t('auth.invalidEmail'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('auth.resetEmailSent'),
      });

      setResetDialogOpen(false);
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      toast({
        title: t('common.error'),
        description: t('auth.passwordMismatch'),
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t('common.error'),
        description: t('auth.passwordTooShort'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('auth.passwordUpdated'),
      });

      navigate("/profile");
    } catch (error: any) {
      console.error("Update password error:", error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);

    try {
      // إعادة إرسال OTP عبر Edge Function
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
        body: {
          email: email,
          token: otpCode,
          email_action_type: 'signup',
          user_name: fullName,
        },
      });

      if (emailError) throw emailError;

      // تحديث OTP المخزن
      localStorage.setItem('pending_otp', JSON.stringify({
        email,
        otp: otpCode,
        expires: Date.now() + 10 * 60 * 1000,
      }));

      toast({
        title: t('common.success'),
        description: t('auth.otpResent'),
      });
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset Password Step
  if (step === "reset-password") {
    return (
      <div className="min-h-screen bg-gradient-subtle" dir={isRTL ? 'rtl' : 'ltr'}>
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-md mx-auto">
            <Card className="animate-scale-in shadow-2xl">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">{t('auth.resetPassword')}</CardTitle>
                <CardDescription>{t('auth.enterNewPassword')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t('auth.newPassword')}</Label>
                    <div className="relative">
                      <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground`} />
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`absolute ${isRTL ? 'left-1' : 'right-1'} top-1 h-8 w-8`}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">{t('auth.confirmPassword')}</Label>
                    <div className="relative">
                      <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground`} />
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className={isRTL ? 'pr-10' : 'pl-10'}
                        required
                        minLength={6}
                      />
                    </div>
                    {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
                      <p className="text-sm text-destructive">{t('auth.passwordMismatch')}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? t('common.loading') : t('auth.updatePassword')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Verify OTP Step
  if (step === "verify-otp") {
    return (
      <div className="min-h-screen bg-gradient-subtle" dir={isRTL ? 'rtl' : 'ltr'}>
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-md mx-auto">
            <Card className="animate-scale-in shadow-2xl">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">{t('auth.verifyEmail')}</CardTitle>
                <CardDescription>
                  {t('auth.otpDescription')} <strong>{email}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center" dir="ltr">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    className="gap-2"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  className="w-full"
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? t('common.loading') : t('auth.verify')}
                </Button>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t('auth.didntReceive')}
                  </p>
                  <Button variant="link" onClick={handleResendOtp} disabled={loading}>
                    {t('auth.resendOtp')}
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep("login")}
                >
                  <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('common.back')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Main Login/Signup Form
  return (
    <div className="min-h-screen bg-gradient-subtle" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-2">{t('auth.welcome')}</h1>
            <p className="text-muted-foreground text-lg">{t('auth.welcomeSubtitle')}</p>
          </div>

          <Card className="animate-scale-in shadow-2xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">
                {step === "login" ? t('auth.signIn') : t('auth.signUp')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={step} onValueChange={(v) => setStep(v as AuthStep)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">{t('auth.signIn')}</TabsTrigger>
                  <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('auth.email')}</Label>
                      <div className="relative">
                        <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground`} />
                        <Input
                          id="email"
                          type="email"
                          placeholder="example@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">{t('auth.password')}</Label>
                      <div className="relative">
                        <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground`} />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`absolute ${isRTL ? 'left-1' : 'right-1'} top-1 h-8 w-8`}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-sm"
                      onClick={() => setResetDialogOpen(true)}
                    >
                      {t('auth.forgotPassword')}
                    </Button>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t('common.loading') : t('auth.signIn')}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                      <div className="relative">
                        <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground`} />
                        <Input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signupEmail">{t('auth.email')}</Label>
                      <div className="relative">
                        <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground`} />
                        <Input
                          id="signupEmail"
                          type="email"
                          placeholder="example@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('auth.phone')}</Label>
                      <div className="relative">
                        <Phone className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground`} />
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signupPassword">{t('auth.password')}</Label>
                      <div className="relative">
                        <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground`} />
                        <Input
                          id="signupPassword"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'}
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`absolute ${isRTL ? 'left-1' : 'right-1'} top-1 h-8 w-8`}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{t('auth.passwordMinLength')}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                      <div className="relative">
                        <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground`} />
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                          required
                          minLength={6}
                        />
                      </div>
                      {password && confirmPassword && password !== confirmPassword && (
                        <p className="text-sm text-destructive">{t('auth.passwordMismatch')}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t('common.loading') : t('auth.signUp')}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* حوار استعادة كلمة المرور */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('auth.forgotPassword')}</DialogTitle>
            <DialogDescription>
              {t('auth.resetDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail">{t('auth.email')}</Label>
              <Input
                id="resetEmail"
                type="email"
                placeholder="example@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleForgotPassword} disabled={loading}>
              {loading ? t('common.loading') : t('auth.sendResetLink')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Auth;