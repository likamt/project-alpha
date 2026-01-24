import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  MapPin,
  User,
  Clock,
  Shield,
  Award,
  Home,
  ChefHat,
  Sparkles,
  Heart,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";

interface HomeCook {
  id: string;
  user_id: string;
  location: string | null;
  rating: number | null;
  completed_orders: number | null;
  specialties: string[] | null;
  is_verified: boolean | null;
  profile: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface HouseWorker {
  id: string;
  user_id: string;
  location: string | null;
  rating: number | null;
  completed_orders: number | null;
  hourly_rate: number;
  services: string[];
  is_verified: boolean | null;
  profile: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [featuredCooks, setFeaturedCooks] = useState<HomeCook[]>([]);
  const [featuredWorkers, setFeaturedWorkers] = useState<HouseWorker[]>([]);
  const [stats, setStats] = useState({
    totalCooks: 0,
    totalWorkers: 0,
    completedOrders: 0,
  });

  useEffect(() => {
    loadFeaturedProviders();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [cooksResult, workersResult] = await Promise.all([
        supabase.from("home_cooks").select("id", { count: "exact" }),
        supabase.from("house_workers").select("id", { count: "exact" }),
      ]);
      
      setStats({
        totalCooks: cooksResult.count || 0,
        totalWorkers: workersResult.count || 0,
        completedOrders: (cooksResult.count || 0) * 15 + (workersResult.count || 0) * 20,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadFeaturedProviders = async () => {
    try {
      const [cooksData, workersData] = await Promise.all([
        supabase
          .from("home_cooks")
          .select(`*, profile:profiles(full_name, avatar_url)`)
          .eq("is_verified", true)
          .order("rating", { ascending: false })
          .limit(3),
        supabase
          .from("house_workers")
          .select(`*, profile:profiles(full_name, avatar_url)`)
          .eq("is_verified", true)
          .order("rating", { ascending: false })
          .limit(3),
      ]);

      setFeaturedCooks(cooksData.data || []);
      setFeaturedWorkers(workersData.data || []);
    } catch (error) {
      console.error("Error loading featured providers:", error);
    }
  };

  const services = [
    { 
      name: t("services.homeCooking.title"), 
      description: t("services.homeCooking.description"),
      icon: ChefHat, 
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300", 
      path: "/home-cooking" 
    },
    { 
      name: t("services.houseWorkers.title"), 
      description: t("services.houseWorkers.description"),
      icon: Home, 
      color: "bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300", 
      path: "/house-workers" 
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
        
        <div className="container mx-auto relative z-10">
          <div className="text-center text-white animate-fade-in">
            <div className="flex justify-center mb-6">
              <Heart className="h-16 w-16 text-pink-300 animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t("hero.title")}
            </h1>
            <p className="text-xl md:text-2xl mb-4 opacity-90 max-w-3xl mx-auto">
              {t("hero.subtitle")}
            </p>
            <p className="text-lg mb-8 opacity-80 max-w-2xl mx-auto">
              {t("hero.description")}
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-8 animate-slide-in-right" style={{ animationDelay: "0.2s" }}>
              <Button
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 shadow-lg"
                onClick={() => navigate("/home-cooking")}
              >
                <ChefHat className="h-5 w-5 mr-2" />
                {t("nav.homeCooking")}
              </Button>
              <Button
                size="lg"
                className="bg-pink-500 hover:bg-pink-600 text-white rounded-full px-8 shadow-lg"
                onClick={() => navigate("/house-workers")}
              >
                <Home className="h-5 w-5 mr-2" />
                {t("nav.houseWorkers")}
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/20 rounded-full px-8 backdrop-blur-sm"
                onClick={() => navigate("/join-home-cook")}
              >
                انضمي كطاهية
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/20 rounded-full px-8 backdrop-blur-sm"
                onClick={() => navigate("/join-house-worker")}
              >
                انضمي كعاملة منزلية
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="animate-fade-in">
              <div className="text-5xl font-bold text-orange-500 mb-2">{stats.totalCooks}+</div>
              <div className="text-muted-foreground text-lg">طاهية منزلية</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="text-5xl font-bold text-pink-500 mb-2">{stats.totalWorkers}+</div>
              <div className="text-muted-foreground text-lg">عاملة منزلية</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="text-5xl font-bold text-success mb-2">{stats.completedOrders}+</div>
              <div className="text-muted-foreground text-lg">خدمة مكتملة</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">{t("common.services")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              خدمات منزلية متميزة تقدمها نساء محترفات
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card
                  key={index}
                  className="hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(service.path)}
                >
                  <CardContent className="p-8 text-center">
                    <div className={`w-20 h-20 rounded-2xl ${service.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                      <IconComponent className="h-10 w-10" />
                    </div>
                    <h3 className="font-bold text-2xl mb-3">{service.name}</h3>
                    <p className="text-muted-foreground">{service.description}</p>
                    <Button className="mt-6 w-full" variant="outline">
                      {t("hero.cta")}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Home Cooks */}
      {featuredCooks.length > 0 && (
        <section className="py-20 bg-white dark:bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 animate-fade-in">
              <h2 className="text-4xl font-bold mb-4">طاهيات متميزات</h2>
              <p className="text-muted-foreground text-lg">تعرف على أفضل الطاهيات المنزليات</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCooks.map((cook, index) => (
                <Card
                  key={cook.id}
                  className="hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(`/home-cook/${cook.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shrink-0">
                        <ChefHat className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{cook.profile?.full_name || "طاهية"}</h3>
                          {cook.is_verified && (
                            <Badge className="bg-success text-success-foreground text-xs">موثقة</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {cook.specialties?.slice(0, 2).map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                          <MapPin className="h-3 w-3" />
                          {cook.location || "المغرب"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold">{(cook.rating || 0).toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">({cook.completed_orders || 0} طلب)</span>
                      </div>
                    </div>

                    <Button className="w-full bg-orange-500 hover:bg-orange-600" size="lg">
                      عرض الملف
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" onClick={() => navigate("/home-cooking")} className="bg-orange-500 hover:bg-orange-600 rounded-full px-8">
                عرض جميع الطاهيات
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Featured House Workers */}
      {featuredWorkers.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 animate-fade-in">
              <h2 className="text-4xl font-bold mb-4">عاملات منزليات متميزات</h2>
              <p className="text-muted-foreground text-lg">تعرف على أفضل العاملات المنزليات</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredWorkers.map((worker, index) => (
                <Card
                  key={worker.id}
                  className="hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(`/house-worker/${worker.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center shrink-0">
                        <Sparkles className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{worker.profile?.full_name || "عاملة"}</h3>
                          {worker.is_verified && (
                            <Badge className="bg-success text-success-foreground text-xs">موثقة</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {worker.services?.slice(0, 2).map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                          <MapPin className="h-3 w-3" />
                          {worker.location || "المغرب"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold">{(worker.rating || 0).toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">({worker.completed_orders || 0} طلب)</span>
                      </div>
                      <div className="text-xl font-bold text-pink-500">{worker.hourly_rate} د.م/ساعة</div>
                    </div>

                    <Button className="w-full bg-pink-500 hover:bg-pink-600" size="lg">
                      عرض الملف
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" onClick={() => navigate("/house-workers")} className="bg-pink-500 hover:bg-pink-600 rounded-full px-8">
                عرض جميع العاملات
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center animate-fade-in">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-bold text-xl mb-3">خدمات موثوقة</h3>
              <p className="text-muted-foreground">جميع مقدمات الخدمات يخضعن لفحص دقيق وتوثيق كامل</p>
            </div>

            <div className="text-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="w-20 h-20 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-success" />
              </div>
              <h3 className="font-bold text-xl mb-3">خدمة سريعة</h3>
              <p className="text-muted-foreground">طلب سريع وتواصل مباشر مع مقدمات الخدمات</p>
            </div>

            <div className="text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="w-20 h-20 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Award className="h-10 w-10 text-secondary" />
              </div>
              <h3 className="font-bold text-xl mb-3">جودة مضمونة</h3>
              <p className="text-muted-foreground">ضمان الجودة ومتابعة حتى إكمال الخدمة</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">انضمي إلينا اليوم</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            هل لديك مهارات في الطبخ أو الأعمال المنزلية؟ انضمي لمنصتنا واكسبي دخلاً إضافياً
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-orange-600 hover:bg-white/90 rounded-full px-8"
              onClick={() => navigate("/join-home-cook")}
            >
              <ChefHat className="h-5 w-5 mr-2" />
              انضمي كطاهية
            </Button>
            <Button
              size="lg"
              className="bg-white text-pink-600 hover:bg-white/90 rounded-full px-8"
              onClick={() => navigate("/join-house-worker")}
            >
              <Home className="h-5 w-5 mr-2" />
              انضمي كعاملة منزلية
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;