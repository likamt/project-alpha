import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Star, MapPin, User, Home, Briefcase } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const HouseWorkers = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedWorkType, setSelectedWorkType] = useState("all");
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("house_workers")
        .select(`
          *,
          profile:profiles(full_name, avatar_url)
        `)
        .order("rating", { ascending: false });

      if (error) throw error;
      setWorkers(data || []);
    } catch (error) {
      console.error("Error loading house workers:", error);
    } finally {
      setLoading(false);
    }
  };

  const serviceCategories = [
    { value: "all", label: t('common.filter') },
    { value: "general", label: t('houseWorker.serviceCategories.general') },
    { value: "cleaning", label: t('houseWorker.serviceCategories.cleaning') },
    { value: "childcare", label: t('houseWorker.serviceCategories.childcare') },
    { value: "eldercare", label: t('houseWorker.serviceCategories.eldercare') },
    { value: "cooking", label: t('houseWorker.serviceCategories.cooking') },
    { value: "laundry", label: t('houseWorker.serviceCategories.laundry') },
    { value: "comprehensive", label: t('houseWorker.serviceCategories.comprehensive') },
  ];

  const workTypes = [
    { value: "all", label: t('houseWorker.workType') },
    { value: "permanent", label: t('houseWorker.workTypes.permanent') },
    { value: "partTime", label: t('houseWorker.workTypes.partTime') },
    { value: "flexible", label: t('houseWorker.workTypes.flexible') },
    { value: "daily", label: t('houseWorker.workTypes.daily') },
  ];

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

  const filteredWorkers = workers.filter((worker) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      worker.profile?.full_name?.toLowerCase().includes(searchLower) ||
      worker.services?.some((service: string) =>
        service.toLowerCase().includes(searchLower) ||
        getServiceLabel(service).toLowerCase().includes(searchLower)
      ) ||
      worker.location?.toLowerCase().includes(searchLower);
    
    const matchesCategory = selectedCategory === "all" || worker.service_category === selectedCategory;
    const matchesWorkType = selectedWorkType === "all" || worker.work_type === selectedWorkType;

    return matchesSearch && matchesCategory && matchesWorkType;
  });

  return (
    <div className="min-h-screen bg-gradient-subtle" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('houseWorker.title')}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('houseWorker.subtitle')}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto mb-12 animate-scale-in space-y-4">
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
            <Input
              placeholder={t('houseWorker.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${isRTL ? 'pr-12' : 'pl-12'} py-6 text-lg rounded-2xl shadow-lg`}
            />
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
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

            <Select value={selectedWorkType} onValueChange={setSelectedWorkType}>
              <SelectTrigger className="w-[180px]">
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
        </div>

        {/* Workers Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              {searchTerm ? t('houseWorker.noWorkersFound') : t('houseWorker.noWorkersAvailable')}
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/join-house-worker")}
              className="bg-gradient-secondary hover:opacity-90"
            >
              {t('houseWorker.joinCta')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredWorkers.map((worker, index) => (
              <Card
                key={worker.id}
                className="hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate(`/house-worker/${worker.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                      {worker.profile?.avatar_url ? (
                        <img 
                          src={worker.profile.avatar_url} 
                          alt={worker.profile.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">
                          {worker.profile?.full_name || t('houseWorker.title')}
                        </h3>
                        {worker.is_verified && (
                          <Badge className="bg-success text-success-foreground text-xs">
                            {t('common.verified')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {worker.location || t('houseWorker.cityRegion')}
                      </div>
                    </div>
                  </div>

                  {/* Work Type & Category */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {worker.work_type && (
                      <Badge variant="secondary" className="text-xs">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {getWorkTypeLabel(worker.work_type)}
                      </Badge>
                    )}
                    {worker.experience_years > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {worker.experience_years} {t('houseWorker.experienceYears')}
                      </Badge>
                    )}
                  </div>

                  {/* Services */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {worker.services?.slice(0, 3).map((service: string) => (
                        <Badge
                          key={service}
                          variant="outline"
                          className="text-xs"
                        >
                          {getServiceLabel(service)}
                        </Badge>
                      ))}
                      {worker.services?.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{worker.services.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {worker.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {worker.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold">
                          {worker.rating?.toFixed(1) || "0.0"}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({worker.completed_orders || 0} {t('common.completedOrders')})
                      </span>
                    </div>
                    <div className="text-xl font-bold text-secondary">
                      {worker.hourly_rate} {t('common.perHour')}
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-secondary hover:opacity-90"
                    size="lg"
                  >
                    {t('common.viewProfile')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center bg-gradient-hero rounded-3xl p-12 text-white animate-fade-in">
          <h2 className="text-3xl font-bold mb-4">
            {t('houseWorker.joinTitle')}
          </h2>
          <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
            {t('houseWorker.joinDescription')}
          </p>
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 rounded-full px-8"
            onClick={() => navigate("/join-house-worker")}
          >
            {t('houseWorker.registerNow')}
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HouseWorkers;