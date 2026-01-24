import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BarChart3 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminOverviewTab from "@/components/admin/AdminOverviewTab";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminCooksTab from "@/components/admin/AdminCooksTab";
import AdminWorkersTab from "@/components/admin/AdminWorkersTab";
import AdminOrdersTab from "@/components/admin/AdminOrdersTab";
import AdminLocationsTab from "@/components/admin/AdminLocationsTab";
import AdminTranslationsTab from "@/components/admin/AdminTranslationsTab";
import AdminSettingsTab from "@/components/admin/AdminSettingsTab";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHomeCooks: 0,
    totalHouseWorkers: 0,
    totalFoodOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });

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
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverviewTab stats={stats} />;
      case "users":
        return <AdminUsersTab />;
      case "cooks":
        return <AdminCooksTab />;
      case "workers":
        return <AdminWorkersTab />;
      case "orders":
        return <AdminOrdersTab />;
      case "locations":
        return <AdminLocationsTab />;
      case "translations":
        return <AdminTranslationsTab />;
      case "settings":
        return <AdminSettingsTab />;
      default:
        return <AdminOverviewTab stats={stats} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
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
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Navbar />

      <main className="flex-grow pt-20">
        <div className="flex h-[calc(100vh-5rem)]">
          {/* Sidebar */}
          <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">لوحة تحكم المدير</h1>
                    <p className="text-sm text-muted-foreground">
                      مرحباً {userProfile?.full_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              {renderTabContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
