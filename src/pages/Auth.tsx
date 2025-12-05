import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Mail, User, Phone, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/profile");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/profile");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (password.length < 6) {
        throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      }

      if (password !== confirmPassword) {
        throw new Error("كلمات المرور غير متطابقة");
      }

      if (!fullName.trim()) {
        throw new Error("يرجى إدخال الاسم الكامل");
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // إنشاء الملف الشخصي
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: authData.user.id,
            full_name: fullName,
            phone: phone,
          },
        ]);

        if (profileError) throw profileError;

        // إضافة دور العميل
        const { error: roleError } = await supabase.from("user_roles").insert([
          {
            user_id: authData.user.id,
            role: "client",
          },
        ]);

        if (roleError) throw roleError;

        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "تم إرسال رابط التأكيد إلى بريدك الإلكتروني. يرجى التحقق من بريدك لتفعيل حسابك.",
          duration: 10000,
        });
      }
    } catch (error: any) {
      console.error("Error signing up:", error);
      let errorMessage = error.message;
      if (error.message.includes("already registered")) {
        errorMessage = "هذا البريد الإلكتروني مسجل مسبقاً";
      }
      toast({
        title: "خطأ في التسجيل",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بعودتك!",
        });

        navigate("/profile");
      }
    } catch (error: any) {
      console.error("Error signing in:", error);
      let errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "يرجى تأكيد بريدك الإلكتروني أولاً";
      }
      toast({
        title: "خطأ في تسجيل الدخول",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!resetEmail.trim()) {
        throw new Error("يرجى إدخال البريد الإلكتروني");
      }

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      toast({
        title: "تم الإرسال",
        description: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني",
      });

      setShowResetPassword(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إرسال رابط إعادة التعيين",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />

        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8 animate-fade-in">
              <h1 className="text-4xl font-bold mb-2">استرجاع كلمة المرور</h1>
              <p className="text-muted-foreground text-lg">أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين</p>
            </div>

            <Card className="animate-scale-in shadow-2xl">
              <CardHeader>
                <Button
                  variant="ghost"
                  className="w-fit mb-2"
                  onClick={() => setShowResetPassword(false)}
                >
                  <ArrowLeft className="h-4 w-4 ml-2" />
                  العودة
                </Button>
                <CardTitle className="text-center text-2xl">إعادة تعيين كلمة المرور</CardTitle>
                <CardDescription className="text-center">
                  سنرسل لك رابطاً لإعادة تعيين كلمة المرور
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="example@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary hover:opacity-90"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "جاري الإرسال..." : "إرسال رابط الاسترجاع"}
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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-2">مرحباً بك</h1>
            <p className="text-muted-foreground text-lg">سجل دخولك أو أنشئ حساباً جديداً</p>
          </div>

          <Card className="animate-scale-in shadow-2xl">
            <CardHeader>
              <CardTitle className="text-center text-2xl">تسجيل الدخول / حساب جديد</CardTitle>
              <CardDescription className="text-center">
                املأ البيانات للمتابعة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">تسجيل دخول</TabsTrigger>
                  <TabsTrigger value="signup">حساب جديد</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">البريد الإلكتروني</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="example@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pr-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signin-password">كلمة المرور</Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pr-10"
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-sm text-primary"
                      onClick={() => setShowResetPassword(true)}
                    >
                      نسيت كلمة المرور؟
                    </Button>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-primary hover:opacity-90"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">الاسم الكامل</Label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="أحمد محمد"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pr-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">البريد الإلكتروني</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="example@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pr-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">رقم الهاتف</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="0600000000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pr-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">كلمة المرور</Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pr-10"
                          minLength={6}
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        يجب أن تكون كلمة المرور 6 أحرف على الأقل
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">تأكيد كلمة المرور</Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="signup-confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pr-10"
                          minLength={6}
                          required
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-primary hover:opacity-90"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Auth;