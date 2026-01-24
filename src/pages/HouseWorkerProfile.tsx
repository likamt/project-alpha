import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactDialog from "@/components/ContactDialog";
import ImageLightbox from "@/components/ImageLightbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, MapPin, User, CheckCircle, Phone, 
  MessageSquare, ArrowRight, ImageIcon, Clock, Briefcase, Globe
} from "lucide-react";

interface HouseWorker {
  id: string;
  user_id: string;
  services: string[];
  description: string | null;
  hourly_rate: number;
  location: string | null;
  is_verified: boolean | null;
  rating: number | null;
  completed_orders: number | null;
  portfolio_images: string[] | null;
  work_type: string | null;
  service_category: string | null;
  experience_years: number | null;
  nationality: string | null;
  languages: string[] | null;
  available_days: string[] | null;
  profile: {
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
  } | null;
}

const HouseWorkerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [worker, setWorker] = useState<HouseWorker | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchWorkerData();
    }
  }, [id]);

  const fetchWorkerData = async () => {
    try {
      const { data, error } = await supabase
        .from("house_workers")
        .select(`
          *,
          profile:profiles(full_name, avatar_url, phone)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      setWorker(data);
    } catch (error) {
      console.error("Error fetching worker:", error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceLabel = (serviceKey: string) => {
    const labels: Record<string, string> = {
      houseCleaning: t('houseWorker.services.houseCleaning'),
      laundry: t('houseWorker.services.laundry'),
      ironing: t('houseWorker.services.ironing'),
      organizing: t('houseWorker.services.organizing'),
      childcare: t('houseWorker.services.childcare'),
      eldercare: t('houseWorker.services.eldercare'),
      homeCooking: t('houseWorker.services.homeCooking'),
      comprehensive: t('houseWorker.services.comprehensive'),
    };
    return labels[serviceKey] || serviceKey;
  };

  const getWorkTypeLabel = (workType: string) => {
    const labels: Record<string, string> = {
      permanent: t('houseWorker.workTypes.permanent'),
      partTime: t('houseWorker.workTypes.partTime'),
      flexible: t('houseWorker.workTypes.flexible'),
      daily: t('houseWorker.workTypes.daily'),
    };
    return labels[workType] || workType;
  };

  const getDayLabel = (day: string) => {
    const labels: Record<string, string> = {
      monday: t('houseWorker.days.monday'),
      tuesday: t('houseWorker.days.tuesday'),
      wednesday: t('houseWorker.days.wednesday'),
      thursday: t('houseWorker.days.thursday'),
      friday: t('houseWorker.days.friday'),
      saturday: t('houseWorker.days.saturday'),
      sunday: t('houseWorker.days.sunday'),
    };
    return labels[day] || day;
  };

  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      arabic: t('houseWorker.languagesList.arabic'),
      french: t('houseWorker.languagesList.french'),
      english: t('houseWorker.languagesList.english'),
      spanish: t('houseWorker.languagesList.spanish'),
    };
    return labels[lang] || lang;
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
        <Navbar />
        <main className="flex-grow pt-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
        <Navbar />
        <main className="flex-grow pt-16 flex items-center justify-center">
          <div className="text-center">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t('houseWorker.workerNotFound')}</h2>
            <p className="text-muted-foreground mb-4">{t('houseWorker.workerNotFoundDesc')}</p>
            <Button asChild>
              <Link to="/house-workers">
                <ArrowRight className={`${isRTL ? 'mr-2' : 'ml-2'} h-4 w-4`} />
                {t('houseWorker.backToWorkers')}
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const portfolioImages = worker.portfolio_images || [];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="flex-grow pt-16">
        {/* Profile Header */}
        <section className="bg-gradient-to-br from-pink-500 to-purple-600 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                {worker.profile?.avatar_url ? (
                  <img 
                    src={worker.profile.avatar_url} 
                    alt={worker.profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-16 w-16 text-white" />
                )}
              </div>
              
              <div className="text-center md:text-right flex-grow">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{worker.profile?.full_name || t('houseWorker.title')}</h1>
                  {worker.is_verified && (
                    <CheckCircle className="h-6 w-6 text-green-300" />
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-2">
                  {worker.location && (
                    <p className="flex items-center gap-1 opacity-90">
                      <MapPin className="h-4 w-4" />
                      {worker.location}
                    </p>
                  )}
                  {worker.work_type && (
                    <Badge variant="secondary" className="bg-white/20">
                      <Briefcase className="h-3 w-3 mr-1" />
                      {getWorkTypeLabel(worker.work_type)}
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                    <span className="font-semibold">{worker.rating || 0}</span>
                  </div>
                  <span className="opacity-70">|</span>
                  <span>{worker.completed_orders || 0} {t('common.completedOrders')}</span>
                  {worker.experience_years && worker.experience_years > 0 && (
                    <>
                      <span className="opacity-70">|</span>
                      <span>{worker.experience_years} {t('houseWorker.experienceYears')}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button variant="secondary" size="lg" onClick={() => setContactOpen(true)}>
                  <MessageSquare className={`${isRTL ? 'mr-2' : 'ml-2'} h-5 w-5`} />
                  {t('common.sendMessage')}
                </Button>
                {worker.profile?.phone && (
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-white text-white hover:bg-white/10"
                    onClick={() => window.location.href = `tel:${worker.profile?.phone}`}
                  >
                    <Phone className={`${isRTL ? 'mr-2' : 'ml-2'} h-5 w-5`} />
                    {t('common.call')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="services" className="space-y-6">
              <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3">
                <TabsTrigger value="services">{t('houseWorker.availableServices')}</TabsTrigger>
                <TabsTrigger value="portfolio">
                  <ImageIcon className="h-4 w-4 ml-1" />
                  {t('houseWorker.portfolio')} ({portfolioImages.length})
                </TabsTrigger>
                <TabsTrigger value="about">{t('houseWorker.about')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="services">
                <Card className="max-w-2xl mx-auto">
                  <CardContent className="pt-6 space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">{t('houseWorker.availableServices')}</h3>
                      <div className="flex flex-wrap gap-3">
                        {worker.services?.map((service, i) => (
                          <Badge key={i} variant="secondary" className="text-base py-2 px-4">
                            {getServiceLabel(service)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Available Days */}
                    {worker.available_days && worker.available_days.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">{t('houseWorker.availableDays')}</h3>
                        <div className="flex flex-wrap gap-2">
                          {worker.available_days.map((day, i) => (
                            <Badge key={i} variant="outline" className="py-2 px-3">
                              {getDayLabel(day)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {worker.languages && worker.languages.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {t('houseWorker.languages')}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {worker.languages.map((lang, i) => (
                            <Badge key={i} variant="outline" className="py-2 px-3">
                              {getLanguageLabel(lang)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold text-secondary">{worker.hourly_rate}</p>
                      <p className="text-sm text-muted-foreground">{t('common.perHour')}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="portfolio">
                {portfolioImages.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">{t('houseWorker.noPortfolioImages')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {portfolioImages.map((image, index) => (
                      <div 
                        key={index} 
                        className="aspect-square cursor-pointer hover:opacity-90 transition-opacity group relative overflow-hidden rounded-lg"
                        onClick={() => openLightbox(index)}
                      >
                        <img
                          src={image}
                          alt={`${t('houseWorker.portfolio')} ${index + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="about">
                <Card className="max-w-2xl mx-auto">
                  <CardContent className="pt-6 space-y-6">
                    {worker.description && (
                      <div>
                        <h3 className="font-semibold mb-2">{t('houseWorker.aboutWorker')}</h3>
                        <p className="text-muted-foreground">{worker.description}</p>
                      </div>
                    )}

                    {worker.nationality && (
                      <div>
                        <h3 className="font-semibold mb-2">{t('houseWorker.nationality')}</h3>
                        <p className="text-muted-foreground">{worker.nationality}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-secondary" />
                        <p className="text-2xl font-bold">{worker.completed_orders || 0}</p>
                        <p className="text-sm text-muted-foreground">{t('common.completedOrders')}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                        <p className="text-2xl font-bold">{worker.rating || 0}</p>
                        <p className="text-sm text-muted-foreground">{t('common.rating')}</p>
                      </div>
                      {worker.experience_years && worker.experience_years > 0 && (
                        <div className="p-4 bg-muted rounded-lg text-center">
                          <Briefcase className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <p className="text-2xl font-bold">{worker.experience_years}</p>
                          <p className="text-sm text-muted-foreground">{t('houseWorker.experienceYears')}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
      
      {worker && (
        <ContactDialog
          open={contactOpen}
          onOpenChange={setContactOpen}
          recipientId={worker.user_id}
          recipientName={worker.profile?.full_name || t('houseWorker.title')}
        />
      )}

      <ImageLightbox
        images={portfolioImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
};

export default HouseWorkerProfile;