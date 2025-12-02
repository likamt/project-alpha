import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Star, MapPin, User, Home } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const HouseWorkers = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
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
        .select(
          `
          *,
          profile:profiles(full_name, avatar_url)
        `
        )
        .order("rating", { ascending: false });

      if (error) throw error;
      setWorkers(data || []);
    } catch (error) {
      console.error("Error loading house workers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkers = workers.filter((worker) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      worker.profile?.full_name?.toLowerCase().includes(searchLower) ||
      worker.services?.some((service: string) =>
        service.toLowerCase().includes(searchLower)
      ) ||
      worker.location?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            العاملات المنزلية المحترفات
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            احصل على خدمات منزلية موثوقة من عاملات محترفات ومعتمدات
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12 animate-scale-in">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="ابحث عن عاملة حسب الخدمة أو المدينة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-12 py-6 text-lg rounded-2xl shadow-lg"
            />
          </div>
        </div>

        {/* Workers Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              {searchTerm ? "لم يتم العثور على عاملات" : "لا توجد عاملات متاحة حالياً"}
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/join-house-worker")}
              className="bg-gradient-secondary hover:opacity-90"
            >
              انضمي كعاملة منزلية
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
                    <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center shrink-0">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">
                          {worker.profile?.full_name || "عاملة منزلية"}
                        </h3>
                        {worker.is_verified && (
                          <Badge className="bg-success text-success-foreground text-xs">
                            موثقة
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {worker.location || "المغرب"}
                      </div>
                    </div>
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
                          {service}
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
                        ({worker.completed_orders || 0} طلب)
                      </span>
                    </div>
                    <div className="text-xl font-bold text-secondary">
                      {worker.hourly_rate} درهم/ساعة
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-secondary hover:opacity-90"
                    size="lg"
                  >
                    عرض الملف
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center bg-gradient-hero rounded-3xl p-12 text-white animate-fade-in">
          <h2 className="text-3xl font-bold mb-4">
            هل ترغبين في الانضمام لفريقنا؟
          </h2>
          <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
            انضمي إلى منصتنا واحصلي على فرص عمل متنوعة ودخل مضمون
          </p>
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 rounded-full px-8"
            onClick={() => navigate("/join-house-worker")}
          >
            سجلي الآن
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HouseWorkers;