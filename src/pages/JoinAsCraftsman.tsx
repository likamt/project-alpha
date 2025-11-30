import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const JoinAsCraftsman = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    profession: "",
    description: "",
    hourly_rate: "",
    location: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "قم بتسجيل الدخول أولاً للانضمام كحرفي",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      // التحقق من عدم وجود ملف حرفي مسبق
      const { data: existingCraftsman } = await supabase
        .from("craftsmen")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (existingCraftsman) {
        toast({
          title: "لديك حساب حرفي بالفعل",
          description: "يمكنك تحديث بياناتك من الملف الشخصي",
        });
        navigate("/profile");
        return;
      }

      // إنشاء ملف الحرفي
      const { error } = await supabase.from("craftsmen").insert([
        {
          user_id: user.id,
          profession: formData.profession,
          description: formData.description,
          hourly_rate: parseFloat(formData.hourly_rate),
          location: formData.location,
          is_verified: false,
          rating: 0,
          completed_orders: 0,
        },
      ]);

      if (error) throw error;

      // تحديث role في profiles
      await supabase.from("profiles").update({ role: "craftsman" }).eq("id", user.id);

      toast({
        title: "تم التسجيل بنجاح!",
        description: "سيتم مراجعة طلبك والرد عليك قريباً",
      });

      navigate("/profile");
    } catch (error: any) {
      console.error("Error joining as craftsman:", error);
      toast({
        title: "خطأ في التسجيل",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const professions = [
    "سباك",
    "كهربائي",
    "نجار",
    "دهان",
    "فني تكييف",
    "فني تبريد",
    "بلاط",
    "حداد",
    "نقاش",
    "سائق",
    "أخرى",
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2">انضم كحرفي</h1>
            <p className="text-muted-foreground text-lg">
              سجل معنا وابدأ في تلقي طلبات العملاء وزيادة دخلك
            </p>
          </div>

          <Card className="animate-scale-in shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">معلومات الحرفي</CardTitle>
              <CardDescription>املأ البيانات التالية للانضمام إلى منصتنا</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="profession">المهنة / التخصص *</Label>
                  <select
                    id="profession"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    className="w-full p-3 border border-input rounded-lg bg-background"
                    required
                  >
                    <option value="">اختر المهنة</option>
                    {professions.map((prof) => (
                      <option key={prof} value={prof}>
                        {prof}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">نبذة عن خبرتك *</Label>
                  <Textarea
                    id="description"
                    placeholder="اكتب نبذة عن خبرتك ومهاراتك..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">السعر بالساعة (درهم) *</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    placeholder="100"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">المدينة / المنطقة *</Label>
                  <Input
                    id="location"
                    placeholder="الدار البيضاء"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">ما ستحصل عليه:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• وصول لآلاف العملاء المحتملين</li>
                        <li>• إدارة سهلة للطلبات والمواعيد</li>
                        <li>• نظام تقييم احترافي</li>
                        <li>• دعم فني متواصل</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:opacity-90"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "جاري التسجيل..." : "تقديم الطلب"}
                </Button>

                {!user && (
                  <p className="text-center text-sm text-muted-foreground">
                    ليس لديك حساب؟{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-primary"
                      onClick={() => navigate("/auth")}
                    >
                      سجل الآن
                    </Button>
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 p-6 bg-card rounded-lg border border-border">
            <h3 className="font-bold text-lg mb-3">شروط الانضمام:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• خبرة لا تقل عن سنة في المجال</li>
              <li>• الالتزام بمواعيد العمل المتفق عليها</li>
              <li>• التعامل الاحترافي مع العملاء</li>
              <li>• جودة عمل عالية وضمان الخدمة</li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default JoinAsCraftsman;
