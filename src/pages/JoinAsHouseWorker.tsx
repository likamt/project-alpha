import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Home, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const JoinAsHouseWorker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    services: [] as string[],
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
        description: "قم بتسجيل الدخول أولاً للانضمام كعاملة منزلية",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (formData.services.length === 0) {
      toast({
        title: "اختر خدمة واحدة على الأقل",
        description: "يجب اختيار خدمة واحدة على الأقل",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // التحقق من عدم وجود ملف عاملة منزلية مسبق
      const { data: existingWorker } = await supabase
        .from("house_workers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (existingWorker) {
        toast({
          title: "لديك حساب عاملة منزلية بالفعل",
          description: "يمكنك تحديث بياناتك من الملف الشخصي",
        });
        navigate("/profile");
        return;
      }

      // إنشاء ملف العاملة المنزلية
      const { error } = await supabase.from("house_workers").insert([
        {
          user_id: user.id,
          services: formData.services,
          description: formData.description,
          hourly_rate: parseFloat(formData.hourly_rate),
          location: formData.location,
          is_verified: false,
          rating: 0,
          completed_orders: 0,
        },
      ]);

      if (error) throw error;

      // إضافة دور العاملة المنزلية في جدول الأدوار
      const { error: roleError } = await supabase.from("user_roles").insert([
        {
          user_id: user.id,
          role: "house_worker",
        },
      ]);

      if (roleError) {
        console.error("Error adding house_worker role:", roleError);
      }

      toast({
        title: "تم التسجيل بنجاح!",
        description: "سيتم مراجعة طلبك والرد عليك قريباً",
      });

      navigate("/profile");
    } catch (error: any) {
      console.error("Error joining as house worker:", error);
      toast({
        title: "خطأ في التسجيل",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const availableServices = [
    "تنظيف المنازل",
    "غسيل الملابس",
    "كي الملابس",
    "ترتيب المنزل",
    "رعاية الأطفال",
    "رعاية كبار السن",
    "طبخ منزلي",
    "مساعدة منزلية شاملة",
  ];

  const toggleService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-20 h-20 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2">انضمي كعاملة منزلية</h1>
            <p className="text-muted-foreground text-lg">
              سجلي معنا وابدئي في تلقي طلبات العملاء وتحقيق دخل مناسب من المنزل
            </p>
          </div>

          <Card className="animate-scale-in shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">معلومات العاملة</CardTitle>
              <CardDescription>املئي البيانات التالية للانضمام إلى منصتنا</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>الخدمات المقدمة *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {availableServices.map((service) => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={`p-3 border rounded-lg text-sm text-right transition-all ${
                          formData.services.includes(service)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-input hover:border-primary"
                        }`}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">نبذة عن خبرتك *</Label>
                  <Textarea
                    id="description"
                    placeholder="اكتبي نبذة عن خبرتك ومهاراتك..."
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
                    placeholder="80"
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
                      <p className="font-medium">ما ستحصلين عليه:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• فرصة عمل من المنزل أو بالانتقال</li>
                        <li>• طلبات متنوعة من عائلات وشركات</li>
                        <li>• دخل مضمون ومرونة في العمل</li>
                        <li>• حماية وضمان حقوقك</li>
                        <li>• دعم فني متواصل</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-secondary hover:opacity-90"
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
                      سجلي الآن
                    </Button>
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 p-6 bg-card rounded-lg border border-border">
            <h3 className="font-bold text-lg mb-3">شروط الانضمام:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• خبرة في مجال الخدمات المنزلية</li>
              <li>• الالتزام بمواعيد العمل المتفق عليها</li>
              <li>• التعامل الاحترافي والأمانة</li>
              <li>• جودة عمل عالية ونظافة تامة</li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default JoinAsHouseWorker;