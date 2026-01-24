import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

interface OrderData {
  date: string;
  orders: number;
  revenue: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface CategoryData {
  name: string;
  orders: number;
  revenue: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const AdminAnalyticsTab = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [ordersData, setOrdersData] = useState<OrderData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<{ date: string; users: number; cooks: number; workers: number }[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    ordersGrowth: 0,
    avgOrderValue: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const days = parseInt(timeRange);
      const startDate = subDays(new Date(), days);
      const previousStartDate = subDays(startDate, days);

      // Load food orders for current period
      const { data: currentOrders } = await supabase
        .from("food_orders")
        .select("*, food_dishes(category)")
        .gte("created_at", startDate.toISOString());

      // Load food orders for previous period (for growth comparison)
      const { data: previousOrders } = await supabase
        .from("food_orders")
        .select("*")
        .gte("created_at", previousStartDate.toISOString())
        .lt("created_at", startDate.toISOString());

      // Process orders by date
      const dateRange = eachDayOfInterval({ start: startDate, end: new Date() });
      const ordersByDate: OrderData[] = dateRange.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayOrders = (currentOrders || []).filter(
          (o) => format(parseISO(o.created_at || ""), "yyyy-MM-dd") === dateStr
        );
        return {
          date: format(date, "dd MMM", { locale: ar }),
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0),
        };
      });
      setOrdersData(ordersByDate);

      // Process orders by status
      const statusCounts: Record<string, number> = {};
      (currentOrders || []).forEach((o) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });

      const statusLabels: Record<string, string> = {
        pending: "معلق",
        confirmed: "مؤكد",
        preparing: "قيد التحضير",
        ready: "جاهز",
        delivered: "تم التوصيل",
        completed: "مكتمل",
        cancelled: "ملغي",
      };

      const statusColors: Record<string, string> = {
        pending: "hsl(45, 93%, 47%)",
        confirmed: "hsl(217, 91%, 60%)",
        preparing: "hsl(262, 83%, 58%)",
        ready: "hsl(142, 76%, 36%)",
        delivered: "hsl(172, 66%, 50%)",
        completed: "hsl(142, 76%, 36%)",
        cancelled: "hsl(0, 84%, 60%)",
      };

      setStatusData(
        Object.entries(statusCounts).map(([status, value]) => ({
          name: statusLabels[status] || status,
          value,
          color: statusColors[status] || "hsl(var(--muted))",
        }))
      );

      // Process orders by category
      const categoryCounts: Record<string, { orders: number; revenue: number }> = {};
      (currentOrders || []).forEach((o: any) => {
        const category = o.food_dishes?.category || "أخرى";
        if (!categoryCounts[category]) {
          categoryCounts[category] = { orders: 0, revenue: 0 };
        }
        categoryCounts[category].orders += 1;
        categoryCounts[category].revenue += Number(o.total_amount) || 0;
      });

      setCategoryData(
        Object.entries(categoryCounts).map(([name, data]) => ({
          name,
          orders: data.orders,
          revenue: data.revenue,
        }))
      );

      // Calculate stats
      const currentRevenue = (currentOrders || [])
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      const previousRevenue = (previousOrders || [])
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

      const currentOrdersCount = (currentOrders || []).length;
      const previousOrdersCount = (previousOrders || []).length;

      const revenueGrowth = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;
      const ordersGrowth = previousOrdersCount > 0
        ? ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100
        : 0;

      setStats({
        totalRevenue: currentRevenue,
        revenueGrowth: Math.round(revenueGrowth),
        totalOrders: currentOrdersCount,
        ordersGrowth: Math.round(ordersGrowth),
        avgOrderValue: currentOrdersCount > 0 ? Math.round(currentRevenue / currentOrdersCount) : 0,
        conversionRate: 85, // Placeholder
      });

      // Load user growth data
      const { data: profiles } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", startDate.toISOString());

      const { data: cooks } = await supabase
        .from("home_cooks")
        .select("created_at")
        .gte("created_at", startDate.toISOString());

      const { data: workers } = await supabase
        .from("house_workers")
        .select("created_at")
        .gte("created_at", startDate.toISOString());

      const userGrowth = dateRange.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return {
          date: format(date, "dd MMM", { locale: ar }),
          users: (profiles || []).filter(
            (p) => format(parseISO(p.created_at || ""), "yyyy-MM-dd") === dateStr
          ).length,
          cooks: (cooks || []).filter(
            (c) => format(parseISO(c.created_at || ""), "yyyy-MM-dd") === dateStr
          ).length,
          workers: (workers || []).filter(
            (w) => format(parseISO(w.created_at || ""), "yyyy-MM-dd") === dateStr
          ).length,
        };
      });
      setUserGrowthData(userGrowth);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">التقارير والإحصائيات</h2>
          <p className="text-muted-foreground">تحليل شامل لأداء المنصة</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <Calendar className="h-4 w-4 ml-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">آخر 7 أيام</SelectItem>
            <SelectItem value="30">آخر 30 يوم</SelectItem>
            <SelectItem value="90">آخر 3 أشهر</SelectItem>
            <SelectItem value="365">آخر سنة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} د.م</p>
              </div>
              <div className={`flex items-center gap-1 text-sm ${stats.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                {stats.revenueGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(stats.revenueGrowth)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <div className={`flex items-center gap-1 text-sm ${stats.ordersGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                {stats.ordersGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(stats.ordersGrowth)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">متوسط قيمة الطلب</p>
              <p className="text-2xl font-bold">{stats.avgOrderValue} د.م</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">معدل التحويل</p>
              <p className="text-2xl font-bold">{stats.conversionRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">الإيرادات</TabsTrigger>
          <TabsTrigger value="orders">الطلبات</TabsTrigger>
          <TabsTrigger value="users">المستخدمين</TabsTrigger>
          <TabsTrigger value="categories">الفئات</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تطور الإيرادات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ordersData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value.toLocaleString()} د.م`, "الإيرادات"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>الطلبات اليومية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ordersData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [value, "طلب"]}
                      />
                      <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزيع حالات الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>نمو المستخدمين</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="users" name="المستخدمين" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="cooks" name="الطاهيات" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="workers" name="العاملات" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>الطلبات حسب الفئة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [value, "طلب"]}
                      />
                      <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الإيرادات حسب الفئة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="revenue"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value.toLocaleString()} د.م`, "الإيرادات"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalyticsTab;
