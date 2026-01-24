import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  ChefHat,
  Home,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  ArrowRight,
  Loader2,
  Eye,
  BarChart3,
  Bell,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StatsCard from "@/components/dashboard/StatsCard";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import RatingStars from "@/components/RatingStars";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHomeCooks: 0,
    totalHouseWorkers: 0,
    totalFoodOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [recentFoodOrders, setRecentFoodOrders] = useState<any[]>([]);
  const [recentHomeCooks, setRecentHomeCooks] = useState<any[]>([]);
  const [recentHouseWorkers, setRecentHouseWorkers] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "غير مصرح",
          description: "يجب تسجيل الدخول أولاً",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });

      if (roleError || !isAdmin) {
        toast({
          title: "غير مصرح",
          description: "ليس لديك صلاحية الوصول إلى هذه الصفحة",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setUserProfile(profile);
      loadDashboardData();
    } catch (error: any) {
      console.error("Error checking admin access:", error);
      navigate("/");
    }
  };

  const loadDashboardData = async () => {
    try {
      const [usersData, homeCooksData, houseWorkersData, foodOrdersData] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("home_cooks").select("*", { count: "exact", head: true }),
        supabase.from("house_workers").select("*", { count: "exact", head: true }),
        supabase.from("food_orders").select("*"),
      ]);

      const foodOrders = foodOrdersData.data || [];
      const pendingOrders = foodOrders.filter((o) => o.status === "pending").length;
      const completedOrders = foodOrders.filter((o) => o.status === "completed").length;
      const totalRevenue = foodOrders
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

      setStats({
        totalUsers: usersData.count || 0,
        totalHomeCooks: homeCooksData.count || 0,
        totalHouseWorkers: houseWorkersData.count || 0,
        totalFoodOrders: foodOrders.length,
        totalRevenue,
        pendingOrders,
        completedOrders,
      });

      // تحميل طلبات الطعام الأخيرة
      const { data: recentFood } = await supabase
        .from("food_orders")
        .select(`
          *,
          dish:food_dishes(name),
          cook:home_cooks(
            id,
            user_id,
            profile:profiles(full_name)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      setRecentFoodOrders(recentFood || []);

      // تحميل الطاهيات الجديدات
      const { data: newCooks } = await supabase
        .from("home_cooks")
        .select(`
          *,
          profile:profiles(full_name, phone)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentHomeCooks(newCooks || []);

      // تحميل العاملات الجديدات
      const { data: newWorkers } = await supabase
        .from("house_workers")
        .select(`
          *,
          profile:profiles(full_name, phone)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentHouseWorkers(newWorkers || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyHomeCook = async (cookId: string, isVerified: boolean) => {
    try {
      const { error } = await supabase
        .from("home_cooks")
        .update({ is_verified: !isVerified })
        .eq("id", cookId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: isVerified ? "تم إلغاء التوثيق" : "تم التوثيق بنجاح",
      });

      loadDashboardData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleVerifyHouseWorker = async (workerId: string, isVerified: boolean) => {
    try {
      const { error } = await supabase
        .from("house_workers")
        .update({ is_verified: !isVerified })
        .eq("id", workerId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: isVerified ? "تم إلغاء التوثيق" : "تم التوثيق بنجاح",
      });

      loadDashboardData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex flex-col" dir="rtl">
        <Navbar />
        <main className="flex-grow pt-24 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col" dir="rtl">
      <Navbar />

      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">لوحة تحكم المدير</h1>
                  <p className="text-sm md:text-base text-muted-foreground">
                    مرحباً {userProfile?.full_name}، إليك نظرة عامة على نشاط المنصة
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
            <StatsCard
              title="إجمالي المستخدمين"
              value={stats.totalUsers}
              icon={Users}
              iconColor="text-primary"
              iconBgColor="bg-primary/10"
            />
            <StatsCard
              title="الطاهيات"
              value={stats.totalHomeCooks}
              icon={ChefHat}
              iconColor="text-orange-500"
              iconBgColor="bg-orange-500/10"
              animationDelay="0.1s"
            />
            <StatsCard
              title="العاملات"
              value={stats.totalHouseWorkers}
              icon={Home}
              iconColor="text-purple-500"
              iconBgColor="bg-purple-500/10"
              animationDelay="0.2s"
            />
            <StatsCard
              title="الإيرادات"
              value={`${stats.totalRevenue.toLocaleString()} د.م`}
              icon={DollarSign}
              iconColor="text-green-500"
              iconBgColor="bg-green-500/10"
              animationDelay="0.3s"
            />
          </div>

          {/* Orders Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
            <Card className="animate-fade-in">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">طلبات معلقة</p>
                    <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">طلبات مكتملة</p>
                    <p className="text-2xl font-bold">{stats.completedOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">معدل النجاح</p>
                    <p className="text-2xl font-bold">
                      {stats.totalFoodOrders > 0
                        ? Math.round((stats.completedOrders / stats.totalFoodOrders) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="food-orders" className="animate-fade-in">
            <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6 h-auto">
              <TabsTrigger value="food-orders" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2">
                <ShoppingCart className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">طلبات الطعام</span>
                <span className="sm:hidden">طلبات</span>
              </TabsTrigger>
              <TabsTrigger value="home-cooks" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2">
                <ChefHat className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">الطاهيات</span>
                <span className="sm:hidden">طاهيات</span>
              </TabsTrigger>
              <TabsTrigger value="house-workers" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2">
                <Home className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">العاملات</span>
                <span className="sm:hidden">عاملات</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="food-orders">
              <Card>
                <CardHeader>
                  <CardTitle>آخر طلبات الطعام</CardTitle>
                  <CardDescription>متابعة وإدارة طلبات الطعام</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentFoodOrders.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد طلبات حالياً</p>
                      </div>
                    ) : (
                      recentFoodOrders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 border border-border rounded-xl hover:shadow-md transition-all bg-card"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">{order.dish?.name || "طبق"}</h4>
                              <OrderStatusBadge status={order.status} />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              الطاهية: {order.cook?.profile?.full_name || "غير محدد"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              الكمية: {order.quantity}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-lg text-primary">
                              {Number(order.total_amount).toLocaleString()} د.م
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString("ar-MA")}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="home-cooks">
              <Card>
                <CardHeader>
                  <CardTitle>الطاهيات المسجلات</CardTitle>
                  <CardDescription>إدارة وتوثيق حسابات الطاهيات</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentHomeCooks.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد طاهيات مسجلات</p>
                      </div>
                    ) : (
                      recentHomeCooks.map((cook) => (
                        <div
                          key={cook.id}
                          className="flex items-center justify-between p-4 border border-border rounded-xl hover:shadow-md transition-all bg-card"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                                <ChefHat className="h-5 w-5 text-orange-500" />
                              </div>
                              <div>
                                <h4 className="font-semibold">
                                  {cook.profile?.full_name || "طاهية"}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {cook.location || "غير محدد"}
                                </p>
                              </div>
                              {cook.is_verified && (
                                <Badge className="bg-green-500 text-white">موثقة</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span>{cook.rating?.toFixed(1) || "0.0"}</span>
                              </div>
                              <span>{cook.completed_orders || 0} طلب مكتمل</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={cook.is_verified ? "outline" : "default"}
                              onClick={() => handleVerifyHomeCook(cook.id, cook.is_verified)}
                            >
                              {cook.is_verified ? (
                                <>
                                  <XCircle className="h-4 w-4 ml-1" />
                                  إلغاء
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 ml-1" />
                                  توثيق
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/home-cook/${cook.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="house-workers">
              <Card>
                <CardHeader>
                  <CardTitle>العاملات المسجلات</CardTitle>
                  <CardDescription>إدارة وتوثيق حسابات العاملات</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentHouseWorkers.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>لا توجد عاملات مسجلات</p>
                      </div>
                    ) : (
                      recentHouseWorkers.map((worker) => (
                        <div
                          key={worker.id}
                          className="flex items-center justify-between p-4 border border-border rounded-xl hover:shadow-md transition-all bg-card"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                                <Home className="h-5 w-5 text-purple-500" />
                              </div>
                              <div>
                                <h4 className="font-semibold">
                                  {worker.profile?.full_name || "عاملة"}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {worker.location || "غير محدد"}
                                </p>
                              </div>
                              {worker.is_verified && (
                                <Badge className="bg-green-500 text-white">موثقة</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span>{worker.rating?.toFixed(1) || "0.0"}</span>
                              </div>
                              <span>{worker.completed_orders || 0} طلب مكتمل</span>
                              <span>{worker.hourly_rate} د.م/ساعة</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={worker.is_verified ? "outline" : "default"}
                              onClick={() => handleVerifyHouseWorker(worker.id, worker.is_verified)}
                            >
                              {worker.is_verified ? (
                                <>
                                  <XCircle className="h-4 w-4 ml-1" />
                                  إلغاء
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 ml-1" />
                                  توثيق
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/house-worker/${worker.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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

export default AdminDashboard;
