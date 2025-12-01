import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Wrench,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  ArrowRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCraftsmen: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentCraftsmen, setRecentCraftsmen] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "غير مصرح",
          description: "يجب تسجيل الدخول أولاً",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // التحقق من صلاحية المدير باستخدام النظام الآمن
      const { data: isAdmin, error: roleError } = await supabase.rpc(
        "has_role",
        {
          _user_id: session.user.id,
          _role: "admin",
        }
      );

      if (roleError || !isAdmin) {
        toast({
          title: "غير مصرح",
          description: "ليس لديك صلاحية الوصول إلى هذه الصفحة",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // تحميل الملف الشخصي
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
      // تحميل الإحصائيات
      const [usersData, craftsmenData, ordersData] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("craftsmen").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*"),
      ]);

      const orders = ordersData.data || [];
      const pendingOrders = orders.filter((o) => o.status === "pending").length;
      const completedOrders = orders.filter((o) => o.status === "completed").length;
      const totalRevenue = orders
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

      setStats({
        totalUsers: usersData.count || 0,
        totalCraftsmen: craftsmenData.count || 0,
        totalOrders: orders.length,
        totalRevenue,
        pendingOrders,
        completedOrders,
      });

      // تحميل الطلبات الأخيرة
      const { data: ordersWithDetails } = await supabase
        .from("orders")
        .select(
          `
          *,
          client:profiles!orders_client_id_fkey(full_name),
          craftsman:craftsmen!orders_craftsman_id_fkey(
            profession,
            profile:profiles(full_name)
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentOrders(ordersWithDetails || []);

      // تحميل الحرفيين الجدد
      const { data: newCraftsmen } = await supabase
        .from("craftsmen")
        .select(
          `
          *,
          profile:profiles(full_name, phone)
        `
        )
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentCraftsmen(newCraftsmen || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCraftsman = async (craftsmanId: string, isVerified: boolean) => {
    try {
      const { error } = await supabase
        .from("craftsmen")
        .update({ is_verified: !isVerified })
        .eq("id", craftsmanId);

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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "قيد الانتظار", className: "bg-warning text-warning-foreground" },
      accepted: { label: "مقبول", className: "bg-primary text-primary-foreground" },
      in_progress: { label: "قيد التنفيذ", className: "bg-blue-500 text-white" },
      completed: { label: "مكتمل", className: "bg-success text-success-foreground" },
      cancelled: { label: "ملغي", className: "bg-destructive text-destructive-foreground" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">لوحة تحكم المدير</h1>
          <p className="text-muted-foreground text-lg">
            مرحباً {userProfile?.full_name}، إليك نظرة عامة على نشاط المنصة
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="animate-scale-in hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-1">إجمالي المستخدمين</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-7 w-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-scale-in hover:shadow-xl transition-shadow" style={{ animationDelay: "0.1s" }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-1">إجمالي الحرفيين</p>
                  <p className="text-3xl font-bold">{stats.totalCraftsmen}</p>
                </div>
                <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Wrench className="h-7 w-7 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-scale-in hover:shadow-xl transition-shadow" style={{ animationDelay: "0.2s" }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-1">إجمالي الطلبات</p>
                  <p className="text-3xl font-bold">{stats.totalOrders}</p>
                </div>
                <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-7 w-7 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-scale-in hover:shadow-xl transition-shadow" style={{ animationDelay: "0.3s" }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-1">إجمالي الإيرادات</p>
                  <p className="text-3xl font-bold">{stats.totalRevenue.toLocaleString()} درهم</p>
                </div>
                <div className="w-14 h-14 bg-warning/10 rounded-full flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-muted-foreground">طلبات قيد الانتظار</p>
                  <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-success" />
                <div>
                  <p className="text-muted-foreground">طلبات مكتملة</p>
                  <p className="text-2xl font-bold">{stats.completedOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-muted-foreground">معدل النجاح</p>
                  <p className="text-2xl font-bold">
                    {stats.totalOrders > 0
                      ? Math.round((stats.completedOrders / stats.totalOrders) * 100)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="animate-fade-in">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="orders">الطلبات الأخيرة</TabsTrigger>
            <TabsTrigger value="craftsmen">الحرفيون الجدد</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>آخر الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">لا توجد طلبات حالياً</p>
                  ) : (
                    recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/order/${order.id}`)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">{order.service_type}</h4>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            العميل: {order.client?.full_name || "غير محدد"}
                          </p>
                          {order.craftsman && (
                            <p className="text-sm text-muted-foreground">
                              الحرفي: {order.craftsman.profile?.full_name || "غير محدد"}
                            </p>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-lg">{Number(order.total_amount).toLocaleString()} درهم</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("ar-MA")}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground mr-4" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="craftsmen" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>الحرفيون المسجلون حديثاً</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCraftsmen.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">لا يوجد حرفيون جدد</p>
                  ) : (
                    recentCraftsmen.map((craftsman) => (
                      <div
                        key={craftsman.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">{craftsman.profile?.full_name || "حرفي"}</h4>
                            {craftsman.is_verified ? (
                              <Badge className="bg-success text-success-foreground">موثق</Badge>
                            ) : (
                              <Badge variant="outline">غير موثق</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{craftsman.profession}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{craftsman.rating.toFixed(1)}</span>
                            <span className="text-sm text-muted-foreground">
                              ({craftsman.completed_orders} طلب)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={craftsman.is_verified ? "outline" : "default"}
                            onClick={() => handleVerifyCraftsman(craftsman.id, craftsman.is_verified)}
                          >
                            {craftsman.is_verified ? (
                              <>
                                <XCircle className="h-4 w-4 ml-1" />
                                إلغاء التوثيق
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
                            onClick={() => navigate(`/craftsman/${craftsman.id}`)}
                          >
                            عرض
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

      <Footer />
    </div>
  );
};

export default AdminDashboard;
