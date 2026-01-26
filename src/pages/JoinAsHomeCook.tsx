import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationSelector from "@/components/LocationSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ChefHat, Loader2 } from "lucide-react";
import { homeCookRegistrationSchema, type HomeCookRegistrationData } from "@/lib/validationSchemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingUser, setCheckingUser] = useState(true);

  const form = useForm<HomeCookRegistrationData>({
    resolver: zodResolver(homeCookRegistrationSchema),
    defaultValues: {
      description: "",
      hourlyRate: "",
      minOrderAmount: "",
      location: "",
      countryId: "",
      cityId: "",
      specialties: [],
      deliveryAvailable: true,
    },
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
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
    } finally {
      setCheckingUser(false);
    }
  };

  const handleSpecialtyToggle = (specialty: string) => {
    const current = form.getValues("specialties");
    const updated = current.includes(specialty)
      ? current.filter((s) => s !== specialty)
      : [...current, specialty];
    form.setValue("specialties", updated, { shouldValidate: true });
  };

  const onSubmit = async (data: HomeCookRegistrationData) => {
    if (!user) return;

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
        description: data.description.trim(),
        hourly_rate: data.hourlyRate ? parseFloat(data.hourlyRate) : 0,
        location: data.location?.trim() || null,
        min_order_amount: data.minOrderAmount ? parseFloat(data.minOrderAmount) : 0,
        delivery_available: data.deliveryAvailable,
        specialties: data.specialties,
        country_id: data.countryId,
        city_id: data.cityId,
      });

      if (cookError) throw cookError;

      toast({
        title: "تم التسجيل بنجاح!",
        description: "مرحباً بك في منصة خدمة سريعة كطاهية منزلية",
      });

      navigate("/home-cook-dashboard");
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

  if (checkingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

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
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نبذة عنك وعن طبخك *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="اكتبي وصفاً مختصراً عن خبرتك في الطبخ وأنواع الأطباق التي تتقنيها..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Specialties */}
                  <FormField
                    control={form.control}
                    name="specialties"
                    render={() => (
                      <FormItem>
                        <FormLabel>التخصصات *</FormLabel>
                        <div className="grid grid-cols-2 gap-3">
                          {specialtiesList.map((specialty) => (
                            <div key={specialty} className="flex items-center space-x-2 space-x-reverse">
                              <Checkbox
                                id={specialty}
                                checked={form.watch("specialties").includes(specialty)}
                                onCheckedChange={() => handleSpecialtyToggle(specialty)}
                              />
                              <label htmlFor={specialty} className="cursor-pointer text-sm">
                                {specialty}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="hourlyRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>سعر الساعة (د.م)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="50"
                              min="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="minOrderAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الحد الأدنى للطلب (د.م)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="100"
                              min="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Location Selection */}
                  <div className="space-y-4">
                    <LocationSelector
                      selectedCountryId={form.watch("countryId")}
                      selectedCityId={form.watch("cityId")}
                      onCountryChange={(id) => form.setValue("countryId", id, { shouldValidate: true })}
                      onCityChange={(id) => form.setValue("cityId", id, { shouldValidate: true })}
                      required
                    />
                    {form.formState.errors.countryId && (
                      <p className="text-sm text-destructive">{form.formState.errors.countryId.message}</p>
                    )}
                    {form.formState.errors.cityId && (
                      <p className="text-sm text-destructive">{form.formState.errors.cityId.message}</p>
                    )}
                  </div>

                  {/* Detailed Address */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>العنوان التفصيلي</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="الحي، الشارع..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Delivery Available */}
                  <FormField
                    control={form.control}
                    name="deliveryAvailable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-x-reverse">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer">خدمة التوصيل متاحة</FormLabel>
                      </FormItem>
                    )}
                  />

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
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default JoinAsHomeCook;
