import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, CheckCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationSelector from "@/components/LocationSelector";
import { houseWorkerRegistrationSchema, type HouseWorkerRegistrationData } from "@/lib/validationSchemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const JoinAsHouseWorker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingUser, setCheckingUser] = useState(true);

  const form = useForm<HouseWorkerRegistrationData>({
    resolver: zodResolver(houseWorkerRegistrationSchema),
    defaultValues: {
      services: [],
      description: "",
      hourlyRate: "",
      location: "",
      workType: "flexible",
      serviceCategory: "general",
      experienceYears: "",
      nationality: "",
      languages: [],
      availableDays: [],
      countryId: "",
      cityId: "",
    },
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    } finally {
      setCheckingUser(false);
    }
  };

  const onSubmit = async (data: HouseWorkerRegistrationData) => {
    if (!user) {
      toast({
        title: t('houseWorker.noAccountPrompt'),
        description: t('auth.signIn'),
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      const { data: existingWorker } = await supabase
        .from("house_workers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingWorker) {
        toast({
          title: t('common.error'),
          description: "أنت مسجلة بالفعل كعاملة منزلية",
          variant: "destructive",
        });
        navigate("/house-worker-dashboard");
        return;
      }

      const { error } = await supabase.from("house_workers").insert({
        user_id: user.id,
        services: data.services,
        description: data.description.trim(),
        hourly_rate: parseFloat(data.hourlyRate),
        location: data.location?.trim() || null,
        work_type: data.workType,
        service_category: data.serviceCategory || "general",
        experience_years: data.experienceYears ? parseInt(data.experienceYears) : 0,
        nationality: data.nationality?.trim() || null,
        languages: data.languages || [],
        available_days: data.availableDays || [],
        is_verified: false,
        rating: 0,
        completed_orders: 0,
        country_id: data.countryId,
        city_id: data.cityId,
      });

      if (error) throw error;

      // لا نضيف الدور هنا لأنه محمي بـ RLS ولا يسمح للمستخدمين بإضافة أدوارهم

      toast({
        title: t('common.success'),
        description: "تم تسجيلك بنجاح كعاملة منزلية",
      });

      navigate("/house-worker-dashboard");
    } catch (error: any) {
      console.error("Error joining as house worker:", error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const availableServices = [
    { key: "houseCleaning", label: t('houseWorker.services.houseCleaning') },
    { key: "laundry", label: t('houseWorker.services.laundry') },
    { key: "ironing", label: t('houseWorker.services.ironing') },
    { key: "organizing", label: t('houseWorker.services.organizing') },
    { key: "childcare", label: t('houseWorker.services.childcare') },
    { key: "eldercare", label: t('houseWorker.services.eldercare') },
    { key: "homeCooking", label: t('houseWorker.services.homeCooking') },
    { key: "comprehensive", label: t('houseWorker.services.comprehensive') },
  ];

  const workTypes = [
    { value: "permanent", label: t('houseWorker.workTypes.permanent') },
    { value: "partTime", label: t('houseWorker.workTypes.partTime') },
    { value: "flexible", label: t('houseWorker.workTypes.flexible') },
    { value: "daily", label: t('houseWorker.workTypes.daily') },
  ];

  const serviceCategories = [
    { value: "general", label: t('houseWorker.serviceCategories.general') },
    { value: "cleaning", label: t('houseWorker.serviceCategories.cleaning') },
    { value: "childcare", label: t('houseWorker.serviceCategories.childcare') },
    { value: "eldercare", label: t('houseWorker.serviceCategories.eldercare') },
    { value: "cooking", label: t('houseWorker.serviceCategories.cooking') },
    { value: "laundry", label: t('houseWorker.serviceCategories.laundry') },
    { value: "comprehensive", label: t('houseWorker.serviceCategories.comprehensive') },
  ];

  const availableLanguages = [
    { value: "arabic", label: t('houseWorker.languagesList.arabic') },
    { value: "french", label: t('houseWorker.languagesList.french') },
    { value: "english", label: t('houseWorker.languagesList.english') },
    { value: "spanish", label: t('houseWorker.languagesList.spanish') },
  ];

  const days = [
    { value: "monday", label: t('houseWorker.days.monday') },
    { value: "tuesday", label: t('houseWorker.days.tuesday') },
    { value: "wednesday", label: t('houseWorker.days.wednesday') },
    { value: "thursday", label: t('houseWorker.days.thursday') },
    { value: "friday", label: t('houseWorker.days.friday') },
    { value: "saturday", label: t('houseWorker.days.saturday') },
    { value: "sunday", label: t('houseWorker.days.sunday') },
  ];

  const toggleArrayField = (fieldName: keyof HouseWorkerRegistrationData, value: string) => {
    const current = form.getValues(fieldName) as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    form.setValue(fieldName, updated as any, { shouldValidate: true });
  };

  if (checkingUser) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-20 h-20 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2">{t('houseWorker.joinCta')}</h1>
            <p className="text-muted-foreground text-lg">
              {t('houseWorker.joinDescription')}
            </p>
          </div>

          <Card className="animate-scale-in shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">{t('houseWorker.workerInfo')}</CardTitle>
              <CardDescription>{t('houseWorker.fillForm')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* نوع العمل والتصنيف */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="workType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('houseWorker.workType')} *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('houseWorker.workType')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {workTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="serviceCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('houseWorker.serviceCategory')} *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('houseWorker.serviceCategory')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {serviceCategories.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* الخدمات المقدمة */}
                  <FormField
                    control={form.control}
                    name="services"
                    render={() => (
                      <FormItem>
                        <FormLabel>{t('houseWorker.servicesOffered')} *</FormLabel>
                        <div className="grid grid-cols-2 gap-3">
                          {availableServices.map((service) => (
                            <button
                              key={service.key}
                              type="button"
                              onClick={() => toggleArrayField("services", service.key)}
                              className={`p-3 border rounded-lg text-sm transition-all ${
                                form.watch("services").includes(service.key)
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-input hover:border-primary"
                              }`}
                            >
                              {service.label}
                            </button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* نبذة عن الخبرة */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('houseWorker.experienceDescription')} *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('houseWorker.experiencePlaceholder')}
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* سنوات الخبرة والجنسية */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="experienceYears"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('houseWorker.experienceYears')}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" min="0" max="50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('houseWorker.nationality')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('houseWorker.nationality')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* اللغات */}
                  <FormField
                    control={form.control}
                    name="languages"
                    render={() => (
                      <FormItem>
                        <FormLabel>{t('houseWorker.languages')}</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {availableLanguages.map((lang) => (
                            <button
                              key={lang.value}
                              type="button"
                              onClick={() => toggleArrayField("languages", lang.value)}
                              className={`px-4 py-2 border rounded-full text-sm transition-all ${
                                (form.watch("languages") || []).includes(lang.value)
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-input hover:border-primary"
                              }`}
                            >
                              {lang.label}
                            </button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* أيام العمل المتاحة */}
                  <FormField
                    control={form.control}
                    name="availableDays"
                    render={() => (
                      <FormItem>
                        <FormLabel>{t('houseWorker.availableDays')}</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {days.map((day) => (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => toggleArrayField("availableDays", day.value)}
                              className={`px-3 py-2 border rounded-lg text-sm transition-all ${
                                (form.watch("availableDays") || []).includes(day.value)
                                  ? "bg-secondary text-secondary-foreground border-secondary"
                                  : "bg-background border-input hover:border-secondary"
                              }`}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* اختيار الموقع الجغرافي */}
                  <div className="space-y-2">
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

                  {/* السعر والعنوان التفصيلي */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="hourlyRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('houseWorker.hourlyRate')} *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="80"
                              min="0"
                              step="0.01"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('houseWorker.cityRegion')}</FormLabel>
                          <FormControl>
                            <Input placeholder="العنوان التفصيلي..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* المميزات */}
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                      <div className="space-y-2 text-sm">
                        <p className="font-medium">{t('houseWorker.benefits')}</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• {t('houseWorker.benefitsList.work')}</li>
                          <li>• {t('houseWorker.benefitsList.orders')}</li>
                          <li>• {t('houseWorker.benefitsList.income')}</li>
                          <li>• {t('houseWorker.benefitsList.protection')}</li>
                          <li>• {t('houseWorker.benefitsList.support')}</li>
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
                    {loading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        {t('houseWorker.registering')}
                      </>
                    ) : (
                      t('houseWorker.submitRequest')
                    )}
                  </Button>

                  {!user && (
                    <p className="text-center text-sm text-muted-foreground">
                      {t('houseWorker.noAccountPrompt')}{" "}
                      <a href="/auth" className="text-primary hover:underline">
                        {t('auth.signUp')}
                      </a>
                    </p>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default JoinAsHouseWorker;
