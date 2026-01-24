import { Card, CardContent } from "@/components/ui/card";
import StatsCard from "@/components/dashboard/StatsCard";
import {
  Users,
  ChefHat,
  Home,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalHomeCooks: number;
  totalHouseWorkers: number;
  totalFoodOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

interface AdminOverviewTabProps {
  stats: Stats;
}

const AdminOverviewTab = ({ stats }: AdminOverviewTabProps) => {
  const successRate = stats.totalFoodOrders > 0
    ? Math.round((stats.completedOrders / stats.totalFoodOrders) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          title="إجمالي الإيرادات"
          value={`${stats.totalRevenue.toLocaleString()} د.م`}
          icon={DollarSign}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          animationDelay="0.3s"
        />
      </div>

      {/* Orders Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <p className="text-2xl font-bold">{successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">إجمالي الطلبات</h3>
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{stats.totalFoodOrders}</div>
            <p className="text-sm text-muted-foreground mt-1">
              طلب طعام منذ البداية
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">متوسط قيمة الطلب</h3>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">
              {stats.completedOrders > 0
                ? Math.round(stats.totalRevenue / stats.completedOrders).toLocaleString()
                : 0}{" "}
              د.م
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              لكل طلب مكتمل
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverviewTab;
