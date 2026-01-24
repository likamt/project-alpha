import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const JoinAsHouseWorker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    services: [] as string[],
    description: "",
    hourly_rate: "",
    location: "",
    work_type: "flexible",
    service_category: "general",
    experience_years: "",
    nationality: "",
    languages: [] as string[],
    available_days: [] as string[],
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
        title: t('houseWorker.noAccountPrompt'),
        description: t('auth.signIn'),
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (formData.services.length === 0) {
      toast({
        title: t('houseWorker.servicesOffered'),
        description: t('common.error'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: existingWorker } = await supabase
        .from("house_workers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingWorker) {
        toast({
          title: t('common.error'),
          description: t('common.tryAgain'),
        });
        navigate("/profile");
        return;
      }

      const { error } = await supabase.from("house_workers").insert([
        {
          user_id: user.id,
          services: formData.services,
          description: formData.description,
          hourly_rate: parseFloat(formData.hourly_rate),
          location: formData.location,
          work_type: formData.work_type,
          service_category: formData.service_category,
          experience_years: parseInt(formData.experience_years) || 0,
          nationality: formData.nationality,
          languages: formData.languages,
          available_days: formData.available_days,
          is_verified: false,
          rating: 0,
          completed_orders: 0,
        },
      ]);

      if (error) throw error;

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
        title: t('common.success'),
        description: t('houseWorker.registerNow'),
      });

      navigate("/profile");
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

  const toggleService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const toggleLanguage = (language: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
  };

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter((d) => d !== day)
        : [...prev.available_days, day],
    }));
  };

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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* نوع العمل */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('houseWorker.workType')} *</Label>
                    <Select
                      value={formData.work_type}
                      onValueChange={(value) => setFormData({ ...formData, work_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('houseWorker.workType')} />
                      </SelectTrigger>
                      <SelectContent>
                        {workTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('houseWorker.serviceCategory')} *</Label>
                    <Select
                      value={formData.service_category}
                      onValueChange={(value) => setFormData({ ...formData, service_category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('houseWorker.serviceCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* الخدمات المقدمة */}
                <div className="space-y-2">
                  <Label>{t('houseWorker.servicesOffered')} *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {availableServices.map((service) => (
                      <button
                        key={service.key}
                        type="button"
                        onClick={() => toggleService(service.key)}
                        className={`p-3 border rounded-lg text-sm transition-all ${
                          formData.services.includes(service.key)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-input hover:border-primary"
                        }`}
                      >
                        {service.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* نبذة عن الخبرة */}
                <div className="space-y-2">
                  <Label htmlFor="description">{t('houseWorker.experienceDescription')} *</Label>
                  <Textarea
                    id="description"
                    placeholder={t('houseWorker.experiencePlaceholder')}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                {/* سنوات الخبرة والجنسية */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience_years">{t('houseWorker.experienceYears')}</Label>
                    <Input
                      id="experience_years"
                      type="number"
                      placeholder="0"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationality">{t('houseWorker.nationality')}</Label>
                    <Input
                      id="nationality"
                      placeholder={t('houseWorker.nationality')}
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    />
                  </div>
                </div>

                {/* اللغات */}
                <div className="space-y-2">
                  <Label>{t('houseWorker.languages')}</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableLanguages.map((lang) => (
                      <button
                        key={lang.value}
                        type="button"
                        onClick={() => toggleLanguage(lang.value)}
                        className={`px-4 py-2 border rounded-full text-sm transition-all ${
                          formData.languages.includes(lang.value)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-input hover:border-primary"
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* أيام العمل المتاحة */}
                <div className="space-y-2">
                  <Label>{t('houseWorker.availableDays')}</Label>
                  <div className="flex flex-wrap gap-2">
                    {days.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`px-3 py-2 border rounded-lg text-sm transition-all ${
                          formData.available_days.includes(day.value)
                            ? "bg-secondary text-secondary-foreground border-secondary"
                            : "bg-background border-input hover:border-secondary"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* السعر والموقع */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">{t('houseWorker.hourlyRate')} *</Label>
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
                    <Label htmlFor="location">{t('houseWorker.cityRegion')} *</Label>
                    <Input
                      id="location"
                      placeholder={t('houseWorker.cityRegion')}
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>
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
                  {loading ? t('houseWorker.registering') : t('houseWorker.submitRequest')}
                </Button>

                {!user && (
                  <p className="text-center text-sm text-muted-foreground">
                    {t('houseWorker.noAccountPrompt')}{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-primary"
                      onClick={() => navigate("/auth")}
                    >
                      {t('houseWorker.registerLink')}
                    </Button>
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 p-6 bg-card rounded-lg border border-border">
            <h3 className="font-bold text-lg mb-3">{t('houseWorker.joinConditions')}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• {t('houseWorker.conditionsList.experience')}</li>
              <li>• {t('houseWorker.conditionsList.punctuality')}</li>
              <li>• {t('houseWorker.conditionsList.professionalism')}</li>
              <li>• {t('houseWorker.conditionsList.quality')}</li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default JoinAsHouseWorker;