import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactDialog from "@/components/ContactDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, MapPin, User, CheckCircle, Phone, 
  MessageSquare, ArrowRight, ImageIcon, Clock
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
  profile: {
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
  } | null;
}

const HouseWorkerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [worker, setWorker] = useState<HouseWorker | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
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
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <Navbar />
        <main className="flex-grow pt-16 flex items-center justify-center">
          <div className="text-center">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">العاملة غير موجودة</h2>
            <p className="text-muted-foreground mb-4">لم نتمكن من العثور على هذه العاملة</p>
            <Button asChild>
              <Link to="/house-workers">
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة للعاملات
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
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Navbar />
      
      <main className="flex-grow pt-16">
        {/* Profile Header */}
        <section className="bg-gradient-to-br from-pink-500 to-purple-600 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center">
                {worker.profile?.avatar_url ? (
                  <img 
                    src={worker.profile.avatar_url} 
                    alt={worker.profile.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-16 w-16 text-white" />
                )}
              </div>
              
              <div className="text-center md:text-right flex-grow">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{worker.profile?.full_name || "عاملة"}</h1>
                  {worker.is_verified && (
                    <CheckCircle className="h-6 w-6 text-green-300" />
                  )}
                </div>
                
                {worker.location && (
                  <p className="flex items-center justify-center md:justify-start gap-1 opacity-90 mb-2">
                    <MapPin className="h-4 w-4" />
                    {worker.location}
                  </p>
                )}
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                    <span className="font-semibold">{worker.rating || 0}</span>
                  </div>
                  <span className="opacity-70">|</span>
                  <span>{worker.completed_orders || 0} طلب مكتمل</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button variant="secondary" size="lg" onClick={() => setContactOpen(true)}>
                  <MessageSquare className="ml-2 h-5 w-5" />
                  راسلها
                </Button>
                {worker.profile?.phone && (
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-white text-white hover:bg-white/10"
                    onClick={() => window.location.href = `tel:${worker.profile?.phone}`}
                  >
                    <Phone className="ml-2 h-5 w-5" />
                    اتصل
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="portfolio" className="space-y-6">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
                <TabsTrigger value="portfolio">
                  <ImageIcon className="h-4 w-4 ml-1" />
                  معرض الأعمال ({portfolioImages.length})
                </TabsTrigger>
                <TabsTrigger value="services">الخدمات</TabsTrigger>
                <TabsTrigger value="about">نبذة</TabsTrigger>
              </TabsList>
              
              <TabsContent value="portfolio">
                {portfolioImages.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">لا توجد صور في المعرض بعد</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {portfolioImages.map((image, index) => (
                      <div 
                        key={index} 
                        className="aspect-square cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedImage(image)}
                      >
                        <img
                          src={image}
                          alt={`عمل ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="services">
                <Card className="max-w-2xl mx-auto">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">الخدمات المتاحة</h3>
                    <div className="flex flex-wrap gap-3">
                      {worker.services?.map((service, i) => (
                        <Badge key={i} variant="secondary" className="text-base py-2 px-4">
                          {service}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold text-secondary">{worker.hourly_rate}</p>
                      <p className="text-sm text-muted-foreground">درهم / ساعة</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="about">
                <Card className="max-w-2xl mx-auto">
                  <CardContent className="pt-6 space-y-6">
                    {worker.description && (
                      <div>
                        <h3 className="font-semibold mb-2">عن العاملة</h3>
                        <p className="text-muted-foreground">{worker.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-secondary" />
                        <p className="text-2xl font-bold">{worker.completed_orders || 0}</p>
                        <p className="text-sm text-muted-foreground">طلب مكتمل</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                        <p className="text-2xl font-bold">{worker.rating || 0}</p>
                        <p className="text-sm text-muted-foreground">تقييم</p>
                      </div>
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
          recipientName={worker.profile?.full_name || "العاملة"}
        />
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="صورة مكبرة"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default HouseWorkerProfile;
