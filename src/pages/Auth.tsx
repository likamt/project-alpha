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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Mail, Lock, User, Phone, Eye, EyeOff, KeyRound, ArrowLeft, MessageSquare } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type AuthStep = "login" | "signup" | "verify-otp" | "reset-password" | "login-verify-otp" | "reset-verify-otp" | "set-new-password";
type VerificationMethod = "email" | "sms";
type OtpContext = "signup" | "login" | "reset";

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
  const [resetPhone, setResetPhone] = useState("");
  const [resetMethod, setResetMethod] = useState<VerificationMethod>("email");
  const [loginVerificationMethod, setLoginVerificationMethod] = useState<VerificationMethod>("email");
  const [showLoginOtpSelection, setShowLoginOtpSelection] = useState(false);
  const [otpContext, setOtpContext] = useState<OtpContext>("signup");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>("email");

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

  const validatePhone = (phone: string) => {
    // Basic phone validation - at least 9 digits
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 9;
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

    if (verificationMethod === "sms" && !validatePhone(phone)) {
      toast({
        title: t('common.error'),
        description: t('auth.invalidPhone'),
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

        // إرسال OTP حسب الطريقة المختارة
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        if (verificationMethod === "sms") {
          // إرسال OTP عبر SMS
          const { data: smsData, error: smsError } = await supabase.functions.invoke('send-sms-otp', {
            body: {
              phone: phone,
              user_name: fullName,
            },
          });

          if (smsError) {
            console.error('Error sending SMS OTP:', smsError);
            throw smsError;
          }

          // حفظ OTP مؤقتاً
          localStorage.setItem('pending_otp', JSON.stringify({
            email,
            phone,
            otp: smsData.otpCode || otpCode,
            expires: Date.now() + 10 * 60 * 1000,
            userId: data.user.id,
            method: 'sms',
          }));

          toast({
            title: t('common.success'),
            description: t('auth.smsOtpSent'),
          });
        } else {
          // إرسال OTP عبر Email
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

          // حفظ OTP مؤقتاً
          localStorage.setItem('pending_otp', JSON.stringify({
            email,
            phone,
            otp: otpCode,
            expires: Date.now() + 10 * 60 * 1000,
            userId: data.user.id,
            method: 'email',
          }));

          toast({
            title: t('common.success'),
            description: t('auth.verificationSent'),
          });
        }
      }

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
      // التحقق من صحة البيانات أولاً
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session && data.user) {
        // تسجيل الخروج مؤقتاً لإرسال OTP
        await supabase.auth.signOut();

        // الحصول على رقم الهاتف من الملف الشخصي
        const { data: profileData } = await supabase
          .from('profiles')
          .select('phone, full_name')
          .eq('id', data.user.id)
          .single();

        // حفظ بيانات المستخدم مؤقتاً
        localStorage.setItem('pending_login', JSON.stringify({
          email,
          password,
          userId: data.user.id,
          phone: profileData?.phone || phone,
          fullName: profileData?.full_name || '',
        }));

        // عرض خيار اختيار طريقة التحقق
        setPhone(profileData?.phone || '');
        setShowLoginOtpSelection(true);
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

  const handleSendLoginOtp = async () => {
    setLoading(true);

    try {
      const pendingLogin = localStorage.getItem('pending_login');
      if (!pendingLogin) {
        throw new Error('Session expired');
      }

      const loginData = JSON.parse(pendingLogin);
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      if (loginVerificationMethod === 'sms') {
        if (!loginData.phone && !phone) {
          toast({
            title: t('common.error'),
            description: t('auth.noPhoneNumber'),
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { data: smsData, error: smsError } = await supabase.functions.invoke('send-sms-otp', {
          body: {
            phone: loginData.phone || phone,
            user_name: loginData.fullName,
          },
        });

        if (smsError) throw smsError;

        localStorage.setItem('pending_otp', JSON.stringify({
          email: loginData.email,
          phone: loginData.phone || phone,
          password: loginData.password,
          otp: smsData.otpCode || otpCode,
          expires: Date.now() + 10 * 60 * 1000,
          method: 'sms',
          context: 'login',
        }));

        toast({
          title: t('common.success'),
          description: t('auth.smsOtpSent'),
        });
      } else {
        const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
          body: {
            email: loginData.email,
            token: otpCode,
            email_action_type: 'login',
            user_name: loginData.fullName,
          },
        });

        if (emailError) {
          console.error('Error sending login OTP email:', emailError);
        }

        localStorage.setItem('pending_otp', JSON.stringify({
          email: loginData.email,
          password: loginData.password,
          otp: otpCode,
          expires: Date.now() + 10 * 60 * 1000,
          method: 'email',
          context: 'login',
        }));

        toast({
          title: t('common.success'),
          description: t('auth.loginOtpSent'),
        });
      }

      setOtpContext('login');
      setShowLoginOtpSelection(false);
      setStep('login-verify-otp');
    } catch (error: any) {
      console.error("Send login OTP error:", error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginOtp = async () => {
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
      const pendingOtp = localStorage.getItem('pending_otp');
      
      if (!pendingOtp) {
        throw new Error(t('auth.otpExpired'));
      }

      const stored = JSON.parse(pendingOtp);

      if (Date.now() > stored.expires) {
        localStorage.removeItem('pending_otp');
        localStorage.removeItem('pending_login');
        throw new Error(t('auth.otpExpired'));
      }

      if (otp !== stored.otp) {
        throw new Error(t('auth.invalidOtp'));
      }

      // OTP صحيح - تسجيل الدخول
      localStorage.removeItem('pending_otp');
      localStorage.removeItem('pending_login');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: stored.email,
        password: stored.password,
      });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('auth.loginSuccess'),
      });

      navigate("/profile");
    } catch (error: any) {
      console.error("Login OTP verification error:", error);
      toast({
        title: t('common.error'),
        description: error.message,
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

      const stored = JSON.parse(pendingOtp);

      if (Date.now() > stored.expires) {
        localStorage.removeItem('pending_otp');
        throw new Error(t('auth.otpExpired'));
      }

      if (otp !== stored.otp) {
        throw new Error(t('auth.invalidOtp'));
      }

      // OTP صحيح - تسجيل الدخول تلقائياً
      localStorage.removeItem('pending_otp');

      // تسجيل الدخول بالبريد وكلمة المرور
      const { data, error } = await supabase.auth.signInWithPassword({
        email: stored.email || email,
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
    if (resetMethod === "email" && !validateEmail(resetEmail)) {
      toast({
        title: t('common.error'),
        description: t('auth.invalidEmail'),
        variant: "destructive",
      });
      return;
    }

    if (resetMethod === "sms" && !validatePhone(resetPhone)) {
      toast({
        title: t('common.error'),
        description: t('auth.invalidPhone'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      if (resetMethod === "sms") {
        // البحث عن المستخدم بواسطة رقم الهاتف
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('phone', resetPhone)
          .single();

        if (profileError || !profileData) {
          throw new Error(t('auth.phoneNotFound'));
        }

        // إرسال OTP عبر SMS
        const { data: smsData, error: smsError } = await supabase.functions.invoke('send-sms-otp', {
          body: {
            phone: resetPhone,
            user_name: profileData.full_name,
          },
        });

        if (smsError) throw smsError;

        // حفظ بيانات الاستعادة مؤقتاً
        localStorage.setItem('pending_reset', JSON.stringify({
          phone: resetPhone,
          userId: profileData.id,
          otp: smsData.otpCode || otpCode,
          expires: Date.now() + 10 * 60 * 1000,
          method: 'sms',
        }));

        toast({
          title: t('common.success'),
          description: t('auth.resetSmsSent'),
        });

        setResetDialogOpen(false);
        setOtpContext('reset');
        setStep('reset-verify-otp');
      } else {
        // إرسال رابط استعادة كلمة المرور عبر البريد
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
          redirectTo: `${window.location.origin}/auth?reset=true`,
        });

        if (error) throw error;

        toast({
          title: t('common.success'),
          description: t('auth.resetEmailSent'),
        });

        setResetDialogOpen(false);
      }
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

  const handleVerifyResetOtp = async () => {
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
      const pendingReset = localStorage.getItem('pending_reset');
      
      if (!pendingReset) {
        throw new Error(t('auth.otpExpired'));
      }

      const stored = JSON.parse(pendingReset);

      if (Date.now() > stored.expires) {
        localStorage.removeItem('pending_reset');
        throw new Error(t('auth.otpExpired'));
      }

      if (otp !== stored.otp) {
        throw new Error(t('auth.invalidOtp'));
      }

      // OTP صحيح - انتقل لصفحة تعيين كلمة المرور الجديدة
      toast({
        title: t('common.success'),
        description: t('auth.otpVerified'),
      });

      setOtp('');
      setStep('set-new-password');
    } catch (error: any) {
      console.error("Reset OTP verification error:", error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
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
      const pendingReset = localStorage.getItem('pending_reset');
      
      if (!pendingReset) {
        throw new Error(t('auth.sessionExpired'));
      }

      const stored = JSON.parse(pendingReset);

      // تحديث كلمة المرور عبر الـ admin API (edge function)
      const { error } = await supabase.functions.invoke('reset-password-sms', {
        body: {
          userId: stored.userId,
          newPassword: newPassword,
        },
      });

      if (error) throw error;

      localStorage.removeItem('pending_reset');

      toast({
        title: t('common.success'),
        description: t('auth.passwordUpdated'),
      });

      // إعادة التوجيه لصفحة تسجيل الدخول
      setStep('login');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      console.error("Set new password error:", error);
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
      const pendingOtp = localStorage.getItem('pending_otp');
      const stored = pendingOtp ? JSON.parse(pendingOtp) : { method: verificationMethod };
      
      // إعادة إرسال OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      if (stored.method === 'sms' || verificationMethod === 'sms') {
        // إرسال SMS
        const { data: smsData, error: smsError } = await supabase.functions.invoke('send-sms-otp', {
          body: {
            phone: phone || stored.phone,
            user_name: fullName,
          },
        });

        if (smsError) throw smsError;

        localStorage.setItem('pending_otp', JSON.stringify({
          ...stored,
          otp: smsData.otpCode || otpCode,
          expires: Date.now() + 10 * 60 * 1000,
        }));
      } else {
        // إرسال Email
        const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
          body: {
            email: email || stored.email,
            token: otpCode,
            email_action_type: 'signup',
            user_name: fullName,
          },
        });

        if (emailError) throw emailError;

        localStorage.setItem('pending_otp', JSON.stringify({
          ...stored,
          otp: otpCode,
          expires: Date.now() + 10 * 60 * 1000,
        }));
      }

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

  // Reset Verify OTP Step
  if (step === "reset-verify-otp") {
    const pendingReset = localStorage.getItem('pending_reset');
    const stored = pendingReset ? JSON.parse(pendingReset) : null;
    const displayContact = stored?.phone || resetPhone;

    return (
      <div className="min-h-screen bg-gradient-subtle" dir={isRTL ? 'rtl' : 'ltr'}>
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-md mx-auto">
            <Card className="animate-scale-in shadow-2xl">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">{t('auth.resetPasswordTitle')}</CardTitle>
                <CardDescription>
                  {t('auth.enterResetOtp')} <strong dir="ltr">{displayContact}</strong>
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
                  onClick={handleVerifyResetOtp}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? t('common.loading') : t('auth.verify')}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep("login");
                    setOtp("");
                    localStorage.removeItem('pending_reset');
                  }}
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

  // Set New Password Step (after SMS OTP verification)
  if (step === "set-new-password") {
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
                <CardTitle className="text-2xl">{t('auth.setNewPasswordTitle')}</CardTitle>
                <CardDescription>{t('auth.enterNewPassword')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSetNewPassword} className="space-y-4">
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

  // Login Verify OTP Step
  if (step === "login-verify-otp") {
    const pendingOtp = localStorage.getItem('pending_otp');
    const stored = pendingOtp ? JSON.parse(pendingOtp) : null;
    const displayContact = stored?.method === 'sms' ? (stored.phone || phone) : (stored?.email || email);
    const isPhoneVerification = stored?.method === 'sms';

    return (
      <div className="min-h-screen bg-gradient-subtle" dir={isRTL ? 'rtl' : 'ltr'}>
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-md mx-auto">
            <Card className="animate-scale-in shadow-2xl">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  {isPhoneVerification ? (
                    <MessageSquare className="h-8 w-8 text-white" />
                  ) : (
                    <KeyRound className="h-8 w-8 text-white" />
                  )}
                </div>
                <CardTitle className="text-2xl">{t('auth.loginVerification')}</CardTitle>
                <CardDescription>
                  {t('auth.otpDescription')} <strong dir="ltr">{displayContact}</strong>
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
                  onClick={handleVerifyLoginOtp}
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
                  onClick={() => {
                    setStep("login");
                    setOtp("");
                    localStorage.removeItem('pending_otp');
                    localStorage.removeItem('pending_login');
                  }}
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

  // Verify OTP Step (Signup)
  if (step === "verify-otp") {
    const pendingOtp = localStorage.getItem('pending_otp');
    const stored = pendingOtp ? JSON.parse(pendingOtp) : null;
    const displayContact = stored?.method === 'sms' ? (stored.phone || phone) : (stored?.email || email);
    const isPhoneVerification = stored?.method === 'sms';

    return (
      <div className="min-h-screen bg-gradient-subtle" dir={isRTL ? 'rtl' : 'ltr'}>
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-md mx-auto">
            <Card className="animate-scale-in shadow-2xl">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  {isPhoneVerification ? (
                    <MessageSquare className="h-8 w-8 text-white" />
                  ) : (
                    <KeyRound className="h-8 w-8 text-white" />
                  )}
                </div>
                <CardTitle className="text-2xl">
                  {isPhoneVerification ? t('auth.verifyPhone') : t('auth.verifyEmail')}
                </CardTitle>
                <CardDescription>
                  {t('auth.otpDescription')} <strong dir="ltr">{displayContact}</strong>
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
                          placeholder={t('auth.phonePlaceholder')}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* طريقة التحقق */}
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <Label className="text-base font-medium">{t('auth.verificationMethod')}</Label>
                      <RadioGroup
                        value={verificationMethod}
                        onValueChange={(v) => setVerificationMethod(v as VerificationMethod)}
                        className="flex flex-col gap-3"
                      >
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <RadioGroupItem value="email" id="verify-email" />
                          <Label htmlFor="verify-email" className="flex items-center gap-2 cursor-pointer">
                            <Mail className="h-4 w-4 text-primary" />
                            {t('auth.viaEmail')}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <RadioGroupItem value="sms" id="verify-sms" />
                          <Label htmlFor="verify-sms" className="flex items-center gap-2 cursor-pointer">
                            <MessageSquare className="h-4 w-4 text-success" />
                            {t('auth.viaSms')}
                          </Label>
                        </div>
                      </RadioGroup>
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
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('auth.resetPasswordTitle')}</DialogTitle>
            <DialogDescription>
              {t('auth.resetPasswordDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* اختيار طريقة الاستعادة */}
            <RadioGroup
              value={resetMethod}
              onValueChange={(v) => setResetMethod(v as VerificationMethod)}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="email" id="reset-email" />
                <Label htmlFor="reset-email" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{t('auth.viaEmail')}</p>
                    <p className="text-sm text-muted-foreground">{t('auth.resetDescription')}</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="sms" id="reset-sms" />
                <Label htmlFor="reset-sms" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">{t('auth.viaSms')}</p>
                    <p className="text-sm text-muted-foreground">{t('auth.enterPhoneNumber')}</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {/* حقل الإدخال حسب الاختيار */}
            {resetMethod === "email" ? (
              <div className="space-y-2">
                <Label htmlFor="resetEmail">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="example@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className={isRTL ? 'pr-10' : 'pl-10'}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="resetPhone">{t('auth.phone')}</Label>
                <div className="relative">
                  <Phone className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="resetPhone"
                    type="tel"
                    placeholder={t('auth.phonePlaceholder')}
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    className={isRTL ? 'pr-10' : 'pl-10'}
                    dir="ltr"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleForgotPassword} disabled={loading}>
              {loading ? t('common.loading') : t('auth.sendCode')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار اختيار طريقة التحقق لتسجيل الدخول */}
      <Dialog open={showLoginOtpSelection} onOpenChange={(open) => {
        if (!open) {
          setShowLoginOtpSelection(false);
          localStorage.removeItem('pending_login');
        }
      }}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('auth.selectLoginMethod')}</DialogTitle>
            <DialogDescription>
              {t('auth.loginVerificationDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RadioGroup
              value={loginVerificationMethod}
              onValueChange={(v) => setLoginVerificationMethod(v as VerificationMethod)}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="email" id="login-verify-email" />
                <Label htmlFor="login-verify-email" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{t('auth.viaEmail')}</p>
                    <p className="text-sm text-muted-foreground">{email}</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rtl:space-x-reverse p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="sms" id="login-verify-sms" disabled={!phone} />
                <Label htmlFor="login-verify-sms" className={`flex items-center gap-3 cursor-pointer flex-1 ${!phone ? 'opacity-50' : ''}`}>
                  <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">{t('auth.viaSms')}</p>
                    <p className="text-sm text-muted-foreground" dir="ltr">{phone || t('auth.noPhoneNumber')}</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowLoginOtpSelection(false);
              localStorage.removeItem('pending_login');
            }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSendLoginOtp} disabled={loading}>
              {loading ? t('common.loading') : t('auth.sendCode')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Auth;
