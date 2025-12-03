import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ChefHat, Loader2 } from "lucide-react";

const specialtiesList = [
  "طبخ مغربي",
  "طبخ شرقي",
  "حلويات",
  "معجنات",
  "مقبلات",
  "شوربات",
  "سلطات",
  "طبخ صحي",
  "طبخ نباتي",
  "وجبات سريعة",
];

const JoinAsHomeCook = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    description: "",
    hourlyRate: "",
    location: "",
    minOrderAmount: "",
    deliveryAvailable: true,
    specialties: [] as string[],
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "يرجى تسجيل الدخول أولاً للانضمام كطاهية منزلية",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setUser(user);
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (formData.specialties.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار تخصص واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if already registered
      const { data: existing } = await supabase
        .from("home_cooks")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        toast({
          title: "تم التسجيل مسبقاً",
          description: "أنت مسجلة بالفعل كطاهية منزلية",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Insert home cook
      const { error: cookError } = await supabase.from("home_cooks").insert({
        user_id: user.id,
        description: formData.description,
        hourly_rate: parseFloat(formData.hourlyRate) || 0,
        location: formData.location,
        min_order_amount: parseFloat(formData.minOrderAmount) || 0,
        delivery_available: formData.deliveryAvailable,
        specialties: formData.specialties,
      });

      if (cookError) throw cookError;

      // Add role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: "home_cook",
      });

      if (roleError && !roleError.message.includes("duplicate")) {
        throw roleError;
      }

      toast({
        title: "تم التسجيل بنجاح!",
        description: "مرحباً بك في منصة خدمة سريعة كطاهية منزلية",
      });

      navigate("/home-cooking");
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء التسجيل",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Navbar />

      <main className="flex-grow py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-orange-100 rounded-full">
                  <ChefHat className="h-12 w-12 text-orange-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">انضمي كطاهية منزلية</CardTitle>
              <CardDescription>
                شاركي مهاراتك في الطبخ واكسبي دخلاً إضافياً من منزلك
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="description">نبذة عنك وعن طبخك</Label>
                  <Textarea
                    id="description"
                    placeholder="اكتبي وصفاً مختصراً عن خبرتك في الطبخ وأنواع الأطباق التي تتقنيها..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>التخصصات</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {specialtiesList.map((specialty) => (
                      <div key={specialty} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={specialty}
                          checked={formData.specialties.includes(specialty)}
                          onCheckedChange={() => handleSpecialtyToggle(specialty)}
                        />
                        <Label htmlFor={specialty} className="cursor-pointer">
                          {specialty}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">سعر الساعة (د.م)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      placeholder="50"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minOrderAmount">الحد الأدنى للطلب (د.م)</Label>
                    <Input
                      id="minOrderAmount"
                      type="number"
                      placeholder="100"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">الموقع / المدينة</Label>
                  <Input
                    id="location"
                    placeholder="الدار البيضاء، المغرب"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="deliveryAvailable"
                    checked={formData.deliveryAvailable}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, deliveryAvailable: checked as boolean })
                    }
                  />
                  <Label htmlFor="deliveryAvailable">خدمة التوصيل متاحة</Label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري التسجيل...
                    </>
                  ) : (
                    "انضمي الآن"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default JoinAsHomeCook;