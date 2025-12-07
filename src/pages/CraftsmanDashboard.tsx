import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PortfolioUploader from "@/components/PortfolioUploader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wrench, Star, Package, Loader2, ImageIcon, Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const professions: Record<string, string> = {
  plumber: "سباك",
  electrician: "كهربائي",
  carpenter: "نجار",
  painter: "دهان",
  mechanic: "ميكانيكي",
  ac_technician: "فني تكييف",
  builder: "بناء",
};

const CraftsmanDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [craftsmanProfile, setCraftsmanProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  const checkUserAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);

      const { data: craftsman, error } = await supabase
        .from("craftsmen")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!craftsman) {
        toast({
          title: "غير مسجل كحرفي",
          description: "يرجى التسجيل كحرفي أولاً",
          variant: "destructive",
        });
        navigate("/join");
        return;
      }

      setCraftsmanProfile(craftsman);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <Navbar />
        <main className="flex-grow pt-16 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </main>
        <Footer />
      </div>
    );
  }

  const stats = {
    completedOrders: craftsmanProfile?.completed_orders || 0,
    rating: craftsmanProfile?.rating || 0,
    portfolioImages: craftsmanProfile?.portfolio_images?.length || 0,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Navbar />
      
      <main className="flex-grow pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Wrench className="h-8 w-8 text-blue-500" />
                لوحة تحكم الحرفي
              </h1>
              <p className="text-muted-foreground">إدارة ملفك الشخصي ومعرض أعمالك</p>
            </div>
            
            <Button asChild variant="outline">
              <Link to={`/craftsman/${craftsmanProfile?.id}`}>
                <Edit className="h-4 w-4 ml-2" />
                عرض ملفي الشخصي
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <Package className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">{stats.completedOrders}</p>
                <p className="text-sm text-muted-foreground">طلب مكتمل</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Star className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-2xl font-bold">{stats.rating}</p>
                <p className="text-sm text-muted-foreground">التقييم</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <ImageIcon className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold">{stats.portfolioImages}</p>
                <p className="text-sm text-muted-foreground">صور في المعرض</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="portfolio" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="portfolio">
                <ImageIcon className="h-4 w-4 ml-1" />
                معرض الأعمال
              </TabsTrigger>
              <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
            </TabsList>

            <TabsContent value="portfolio">
              <Card>
                <CardContent className="pt-6">
                  {user && (
                    <PortfolioUploader
                      userId={user.id}
                      currentImages={craftsmanProfile?.portfolio_images || []}
                      onImagesUpdate={async (images) => {
                        try {
                          const { error } = await supabase
                            .from("craftsmen")
                            .update({ portfolio_images: images })
                            .eq("id", craftsmanProfile.id);
                          
                          if (error) throw error;
                          setCraftsmanProfile({ ...craftsmanProfile, portfolio_images: images });
                        } catch (error: any) {
                          toast({
                            title: "خطأ",
                            description: error.message,
                            variant: "destructive",
                          });
                        }
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>معلومات الملف الشخصي</CardTitle>
                  <CardDescription>بيانات ملفك الشخصي الحالية</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">المهنة</p>
                    <Badge variant="secondary" className="text-base">
                      {professions[craftsmanProfile?.profession] || craftsmanProfile?.profession}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">الوصف</p>
                    <p>{craftsmanProfile?.description || "لا يوجد وصف"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">السعر</p>
                    <p className="text-xl font-bold text-blue-600">{craftsmanProfile?.hourly_rate} د.م/ساعة</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">الموقع</p>
                    <p>{craftsmanProfile?.location || "غير محدد"}</p>
                  </div>
                  
                  {craftsmanProfile?.is_verified && (
                    <Badge className="bg-green-500">حساب موثق</Badge>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CraftsmanDashboard;
