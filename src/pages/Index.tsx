import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Star,
  MapPin,
  User,
  Clock,
  Shield,
  Award,
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Wind,
  Truck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [featuredCraftsmen, setFeaturedCraftsmen] = useState<any[]>([]);
  const [stats] = useState({
    totalCraftsmen: 156,
    completedOrders: 2894,
    happyClients: 2147,
  });

  useEffect(() => {
    loadFeaturedCraftsmen();
  }, []);

  const loadFeaturedCraftsmen = async () => {
    try {
      const { data, error } = await supabase
        .from("craftsmen")
        .select(
          `
          *,
          profile:profiles(full_name, avatar_url)
        `
        )
        .eq("is_verified", true)
        .order("rating", { ascending: false })
        .limit(6);

      if (error) throw error;
      setFeaturedCraftsmen(data || []);
    } catch (error) {
      console.error("Error loading featured craftsmen:", error);
    }
  };

  const services = [
    { name: "سباكة", icon: Wrench, color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300" },
    { name: "كهرباء", icon: Zap, color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300" },
    { name: "نجارة", icon: Hammer, color: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300" },
    { name: "دهان", icon: Paintbrush, color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300" },
    { name: "تكييف", icon: Wind, color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300" },
    { name: "نقل", icon: Truck, color: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300" },
  ];

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate("/craftsmen", { state: { search: searchTerm } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
        
        <div className="container mx-auto relative z-10">
          <div className="text-center text-white animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              احصل على <span className="text-gradient-secondary">الحرفي المثالي</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              منصة متكاملة توفر لك أفضل الحرفيين والمعلمين في جميع التخصصات بجودة عالية وأسعار مناسبة
            </p>

            <div className="max-w-2xl mx-auto relative animate-scale-in">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن حرفي، خدمة، أو مهنة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-12 py-7 text-lg border-0 rounded-2xl shadow-2xl bg-white text-foreground"
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-8 animate-slide-in-right" style={{ animationDelay: "0.2s" }}>
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 rounded-full px-8 shadow-lg"
                onClick={() => navigate("/craftsmen")}
              >
                ابحث عن حرفي
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/20 rounded-full px-8 backdrop-blur-sm"
                onClick={() => navigate("/join")}
              >
                انضم كحرفي
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
              <div className="text-5xl font-bold text-primary mb-2">{stats.totalCraftsmen}+</div>
              <div className="text-muted-foreground text-lg">حرفي معتمد</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="text-5xl font-bold text-success mb-2">{stats.completedOrders}+</div>
              <div className="text-muted-foreground text-lg">خدمة مكتملة</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="text-5xl font-bold text-secondary mb-2">{stats.happyClients}+</div>
              <div className="text-muted-foreground text-lg">عميل سعيد</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">خدماتنا المتوفرة</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              نوفر لك جميع الخدمات المنزلية والحرفية التي تحتاجها مع أفضل الحرفيين المعتمدين
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card
                  key={index}
                  className="text-center hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate("/craftsmen")}
                >
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 rounded-2xl ${service.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <h3 className="font-semibold text-lg">{service.name}</h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Craftsmen */}
      {featuredCraftsmen.length > 0 && (
        <section className="py-20 bg-white dark:bg-card">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 animate-fade-in">
              <h2 className="text-4xl font-bold mb-4">حرفيون متميزون</h2>
              <p className="text-muted-foreground text-lg">تعرف على أفضل الحرفيين ذوي التقييمات العالية</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCraftsmen.map((craftsman, index) => (
                <Card
                  key={craftsman.id}
                  className="hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => navigate(`/craftsman/${craftsman.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shrink-0">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{craftsman.profile?.full_name || "حرفي"}</h3>
                          {craftsman.is_verified && (
                            <Badge className="bg-success text-success-foreground text-xs">موثق</Badge>
                          )}
                        </div>
                        <p className="text-primary font-medium">{craftsman.profession}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          {craftsman.location || "المغرب"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold">{craftsman.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">({craftsman.completed_orders} طلب)</span>
                      </div>
                      <div className="text-xl font-bold text-primary">{craftsman.hourly_rate} درهم/ساعة</div>
                    </div>

                    <Button className="w-full bg-gradient-primary hover:opacity-90" size="lg">
                      عرض الملف
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" onClick={() => navigate("/craftsmen")} className="bg-primary hover:bg-primary-hover rounded-full px-8">
                عرض جميع الحرفيين
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center animate-fade-in">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-bold text-xl mb-3">حرفيون موثوقون</h3>
              <p className="text-muted-foreground">جميع الحرفيين يخضعون لفحص دقيق وتوثيق كامل</p>
            </div>

            <div className="text-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="w-20 h-20 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-success" />
              </div>
              <h3 className="font-bold text-xl mb-3">خدمة سريعة</h3>
              <p className="text-muted-foreground">وصول سريع للحرفيين في وقت قياسي</p>
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

      <Footer />
    </div>
  );
};

export default Index;
