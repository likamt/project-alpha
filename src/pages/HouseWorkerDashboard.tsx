import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PortfolioUploader from "@/components/PortfolioUploader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Home, Star, Package, MessageSquare, Loader2, ImageIcon, Edit, Eye,
  Clock, DollarSign, CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import StatsCard from "@/components/dashboard/StatsCard";
import ImageGallery from "@/components/dashboard/ImageGallery";
import RatingStars from "@/components/RatingStars";

const HouseWorkerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [workerProfile, setWorkerProfile] = useState<any>(null);
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

      const { data: worker, error } = await supabase
        .from("house_workers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!worker) {
        toast({
          title: "غير مسجلة كعاملة منزلية",
          description: "يرجى التسجيل كعاملة منزلية أولاً",
          variant: "destructive",
        });
        navigate("/join-house-worker");
        return;
      }

      setWorkerProfile(worker);
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
        <main className="flex-grow pt-24 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto" />
            <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const stats = {
    completedOrders: workerProfile?.completed_orders || 0,
    rating: workerProfile?.rating || 0,
    portfolioImages: workerProfile?.portfolio_images?.length || 0,
    hourlyRate: workerProfile?.hourly_rate || 0,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center">
                <Home className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">لوحة تحكم العاملة</h1>
                <p className="text-muted-foreground">إدارة ملفك الشخصي ومعرض أعمالك</p>
              </div>
            </div>
            
            <Button asChild variant="outline" className="border-purple-500 text-purple-500 hover:bg-purple-50">
              <Link to={`/house-worker/${workerProfile?.id}`}>
                <Eye className="h-4 w-4 ml-2" />
                عرض ملفي العام
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="طلبات مكتملة"
              value={stats.completedOrders}
              icon={Package}
              iconColor="text-blue-500"
              iconBgColor="bg-blue-500/10"
            />
            <StatsCard
              title="التقييم"
              value={stats.rating.toFixed(1)}
              icon={Star}
              iconColor="text-yellow-500"
              iconBgColor="bg-yellow-500/10"
              animationDelay="0.1s"
            />
            <StatsCard
              title="صور المعرض"
              value={stats.portfolioImages}
              icon={ImageIcon}
              iconColor="text-purple-500"
              iconBgColor="bg-purple-500/10"
              animationDelay="0.2s"
            />
            <StatsCard
              title="السعر/ساعة"
              value={`${stats.hourlyRate} د.م`}
              icon={DollarSign}
              iconColor="text-green-500"
              iconBgColor="bg-green-500/10"
              animationDelay="0.3s"
            />
          </div>

          {/* Main Content */}
          <Tabs defaultValue="portfolio" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="portfolio" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                معرض الأعمال
              </TabsTrigger>
              <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
            </TabsList>

            <TabsContent value="portfolio">
              <Card>
                <CardHeader>
                  <CardTitle>معرض أعمالي</CardTitle>
                  <CardDescription>أضيفي صور أعمالك لجذب المزيد من العملاء</CardDescription>
                </CardHeader>
                <CardContent>
                  {user && (
                    <PortfolioUploader
                      userId={user.id}
                      currentImages={workerProfile?.portfolio_images || []}
                      onImagesUpdate={async (images) => {
                        try {
                          const { error } = await supabase
                            .from("house_workers")
                            .update({ portfolio_images: images })
                            .eq("id", workerProfile.id);
                          
                          if (error) throw error;
                          setWorkerProfile({ ...workerProfile, portfolio_images: images });
                          toast({ title: "تم تحديث المعرض بنجاح" });
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
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <p className="text-sm text-muted-foreground mb-2">الخدمات</p>
                      <div className="flex flex-wrap gap-2">
                        {workerProfile?.services?.map((service: string, i: number) => (
                          <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-700">
                            {service}
                          </Badge>
                        ))}
                        {(!workerProfile?.services || workerProfile.services.length === 0) && (
                          <span className="text-muted-foreground text-sm">لم يتم تحديد خدمات</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <p className="text-sm text-muted-foreground mb-2">السعر</p>
                      <p className="text-2xl font-bold text-purple-500">{workerProfile?.hourly_rate} د.م/ساعة</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-2">الوصف</p>
                    <p>{workerProfile?.description || "لا يوجد وصف"}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <p className="text-sm text-muted-foreground mb-2">الموقع</p>
                      <p className="font-medium">{workerProfile?.location || "غير محدد"}</p>
                    </div>
                    
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <p className="text-sm text-muted-foreground mb-2">التقييم</p>
                      <div className="flex items-center gap-2">
                        <RatingStars rating={stats.rating} showValue />
                      </div>
                    </div>
                  </div>
                  
                  {workerProfile?.is_verified && (
                    <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-200 dark:border-green-500/20">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-700 dark:text-green-400">حساب موثق</span>
                    </div>
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

export default HouseWorkerDashboard;
