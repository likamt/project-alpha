import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, MapPin } from "lucide-react";
import PortfolioUploader from "@/components/PortfolioUploader";

interface ProfileEditFormProps {
  type: "home_cook" | "house_worker";
  profile: any;
  userId: string;
  onProfileUpdate: (updatedProfile: any) => void;
}

const workTypes = [
  { value: "permanent", labelKey: "houseWorker.workTypes.permanent" },
  { value: "partTime", labelKey: "houseWorker.workTypes.partTime" },
  { value: "flexible", labelKey: "houseWorker.workTypes.flexible" },
  { value: "daily", labelKey: "houseWorker.workTypes.daily" },
];

const serviceCategories = [
  { value: "general", labelKey: "houseWorker.serviceCategories.general" },
  { value: "cleaning", labelKey: "houseWorker.serviceCategories.cleaning" },
  { value: "childcare", labelKey: "houseWorker.serviceCategories.childcare" },
  { value: "eldercare", labelKey: "houseWorker.serviceCategories.eldercare" },
  { value: "cooking", labelKey: "houseWorker.serviceCategories.cooking" },
  { value: "laundry", labelKey: "houseWorker.serviceCategories.laundry" },
  { value: "comprehensive", labelKey: "houseWorker.serviceCategories.comprehensive" },
];

const workerServices = [
  { value: "houseCleaning", labelKey: "houseWorker.services.houseCleaning" },
  { value: "laundry", labelKey: "houseWorker.services.laundry" },
  { value: "ironing", labelKey: "houseWorker.services.ironing" },
  { value: "organizing", labelKey: "houseWorker.services.organizing" },
  { value: "childcare", labelKey: "houseWorker.services.childcare" },
  { value: "eldercare", labelKey: "houseWorker.services.eldercare" },
  { value: "homeCooking", labelKey: "houseWorker.services.homeCooking" },
  { value: "comprehensive", labelKey: "houseWorker.services.comprehensive" },
];

const cookSpecialties = [
  { value: "moroccan", labelKey: "profileEdit.specialties.moroccan" },
  { value: "traditional", labelKey: "profileEdit.specialties.traditional" },
  { value: "modern", labelKey: "profileEdit.specialties.modern" },
  { value: "desserts", labelKey: "profileEdit.specialties.desserts" },
  { value: "pastries", labelKey: "profileEdit.specialties.pastries" },
  { value: "healthy", labelKey: "profileEdit.specialties.healthy" },
];

const ProfileEditForm = ({ type, profile, userId, onProfileUpdate }: ProfileEditFormProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const isCook = type === "home_cook";
  const tableName = isCook ? "home_cooks" : "house_workers";
  
  const [formData, setFormData] = useState({
    description: profile?.description || "",
    hourly_rate: profile?.hourly_rate?.toString() || "",
    location: profile?.location || "",
    services: profile?.services || [],
    specialties: profile?.specialties || [],
    portfolio_images: profile?.portfolio_images || [],
    delivery_available: profile?.delivery_available || false,
    min_order_amount: profile?.min_order_amount?.toString() || "",
    service_category: profile?.service_category || "general",
    work_type: profile?.work_type || "flexible",
    experience_years: profile?.experience_years?.toString() || "",
    nationality: profile?.nationality || "",
    languages: profile?.languages || [],
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {
        description: formData.description || null,
        hourly_rate: parseFloat(formData.hourly_rate) || 0,
        location: formData.location || null,
        portfolio_images: formData.portfolio_images,
      };

      if (isCook) {
        updateData.specialties = formData.specialties;
        updateData.delivery_available = formData.delivery_available;
        updateData.min_order_amount = parseFloat(formData.min_order_amount) || 0;
      } else {
        updateData.services = formData.services;
        updateData.service_category = formData.service_category;
        updateData.work_type = formData.work_type;
        updateData.experience_years = parseInt(formData.experience_years) || null;
        updateData.nationality = formData.nationality || null;
        updateData.languages = formData.languages;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("profileEdit.saveSuccess"),
      });

      onProfileUpdate({ ...profile, ...updateData });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (service: string) => {
    const currentServices = isCook ? formData.specialties : formData.services;
    const fieldName = isCook ? "specialties" : "services";
    
    if (currentServices.includes(service)) {
      setFormData({
        ...formData,
        [fieldName]: currentServices.filter((s: string) => s !== service),
      });
    } else {
      setFormData({
        ...formData,
        [fieldName]: [...currentServices, service],
      });
    }
  };

  const toggleLanguage = (lang: string) => {
    if (formData.languages.includes(lang)) {
      setFormData({
        ...formData,
        languages: formData.languages.filter((l: string) => l !== lang),
      });
    } else {
      setFormData({
        ...formData,
        languages: [...formData.languages, lang],
      });
    }
  };

  const servicesList = isCook ? cookSpecialties : workerServices;
  const currentSelection = isCook ? formData.specialties : formData.services;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profileEdit.title")}</CardTitle>
        <CardDescription>{t("profileEdit.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Description */}
        <div className="space-y-2">
          <Label>{t("profileEdit.aboutYou")}</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t("profileEdit.aboutPlaceholder")}
            rows={3}
          />
        </div>

        {/* Location & Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t("profileEdit.location")}
            </Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder={t("profileEdit.locationPlaceholder")}
            />
          </div>
          
          <div className="space-y-2">
            <Label>{t("profileEdit.hourlyRate")}</Label>
            <Input
              type="number"
              value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
              placeholder="50"
              min="0"
            />
          </div>
        </div>

        {/* Cook specific fields */}
        {isCook && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("profileEdit.minOrderAmount")}</Label>
                <Input
                  type="number"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                  placeholder="30"
                  min="0"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <Label>{t("profileEdit.deliveryAvailable")}</Label>
                <Switch
                  checked={formData.delivery_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, delivery_available: checked })}
                />
              </div>
            </div>
          </>
        )}

        {/* Worker specific fields */}
        {!isCook && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("houseWorker.workType")}</Label>
                <Select
                  value={formData.work_type}
                  onValueChange={(v) => setFormData({ ...formData, work_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workTypes.map((wt) => (
                      <SelectItem key={wt.value} value={wt.value}>
                        {t(wt.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>{t("houseWorker.serviceCategory")}</Label>
                <Select
                  value={formData.service_category}
                  onValueChange={(v) => setFormData({ ...formData, service_category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceCategories.map((sc) => (
                      <SelectItem key={sc.value} value={sc.value}>
                        {t(sc.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("houseWorker.experienceYears")}</Label>
                <Input
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                  placeholder="5"
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t("houseWorker.nationality")}</Label>
                <Input
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  placeholder={t("profileEdit.nationalityPlaceholder")}
                />
              </div>
            </div>

            {/* Languages */}
            <div className="space-y-2">
              <Label>{t("houseWorker.languages")}</Label>
              <div className="flex flex-wrap gap-2">
                {["arabic", "french", "english", "spanish"].map((lang) => (
                  <Button
                    key={lang}
                    type="button"
                    variant={formData.languages.includes(lang) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleLanguage(lang)}
                  >
                    {t(`houseWorker.languagesList.${lang}`)}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Services / Specialties */}
        <div className="space-y-2">
          <Label>{isCook ? t("profileEdit.specialties") : t("profileEdit.servicesOffered")}</Label>
          <div className="flex flex-wrap gap-2">
            {servicesList.map((service) => (
              <Button
                key={service.value}
                type="button"
                variant={currentSelection.includes(service.value) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleService(service.value)}
              >
                {t(service.labelKey)}
              </Button>
            ))}
          </div>
        </div>

        {/* Portfolio Images */}
        <div className="space-y-2">
          <Label>{t("profileEdit.portfolioImages")}</Label>
          <PortfolioUploader
            userId={userId}
            currentImages={formData.portfolio_images}
            onImagesUpdate={(images) => setFormData({ ...formData, portfolio_images: images })}
            maxImages={10}
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
          ) : (
            <Save className="h-4 w-4 ml-2" />
          )}
          {t("profileEdit.saveChanges")}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileEditForm;
