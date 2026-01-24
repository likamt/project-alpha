import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Crown, RefreshCw, Bell, AlertTriangle, CheckCircle, XCircle, PauseCircle, DollarSign, TrendingUp, Calendar, Snowflake, Play } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Provider {
  id: string;
  user_id: string;
  subscription_status: string | null;
  subscription_tier: string | null;
  subscription_ends_at: string | null;
  subscription_started_at: string | null;
  monthly_tasks_count: number | null;
  completed_orders: number | null;
  rating: number | null;
  location: string | null;
  country_id: string | null;
  city_id: string | null;
  profile?: {
    full_name: string;
    phone: string | null;
  };
  country?: { name_ar: string } | null;
  city?: { name_ar: string } | null;
  type: "cook" | "worker";
}

interface RevenueData {
  month: string;
  basic: number;
  premium: number;
  total: number;
}

const AdminSubscriptionsTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isFreezeDialogOpen, setIsFreezeDialogOpen] = useState(false);
  const [newTier, setNewTier] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [extensionDays, setExtensionDays] = useState<number>(30);
  const [freezeDays, setFreezeDays] = useState<number>(7);
  const [updating, setUpdating] = useState(false);
  const [countries, setCountries] = useState<{ id: string; name_ar: string }[]>([]);
  const [activeTab, setActiveTab] = useState("management");

  useEffect(() => {
    loadProviders();
    loadCountries();
  }, []);

  const loadCountries = async () => {
    const { data } = await supabase.from("countries").select("id, name_ar").eq("is_active", true);
    setCountries(data || []);
  };

  const loadProviders = async () => {
    setLoading(true);
    try {
      const [cooksData, workersData] = await Promise.all([
        supabase
          .from("home_cooks")
          .select(`
            id, user_id, subscription_status, subscription_tier, 
            subscription_ends_at, subscription_started_at, monthly_tasks_count,
            completed_orders, rating, location, country_id, city_id,
            profile:profiles(full_name, phone),
            country:countries(name_ar),
            city:cities(name_ar)
          `)
          .order("subscription_ends_at", { ascending: true }),
        supabase
          .from("house_workers")
          .select(`
            id, user_id, subscription_status, subscription_tier,
            subscription_ends_at, subscription_started_at, monthly_tasks_count,
            completed_orders, rating, location, country_id, city_id,
            profile:profiles(full_name, phone),
            country:countries(name_ar),
            city:cities(name_ar)
          `)
          .order("subscription_ends_at", { ascending: true }),
      ]);

      const cooks: Provider[] = (cooksData.data || []).map((c: any) => ({
        ...c,
        type: "cook" as const,
      }));

      const workers: Provider[] = (workersData.data || []).map((w: any) => ({
        ...w,
        type: "worker" as const,
      }));

      setProviders([...cooks, ...workers]);
    } catch (error) {
      console.error("Error loading providers:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async () => {
    if (!selectedProvider) return;
    setUpdating(true);

    try {
      const table = selectedProvider.type === "cook" ? "home_cooks" : "house_workers";
      const updates: any = {};

      if (newTier) updates.subscription_tier = newTier;
      if (newStatus) updates.subscription_status = newStatus;

      if (extensionDays > 0 && newStatus !== "expired") {
        const currentEnd = selectedProvider.subscription_ends_at 
          ? new Date(selectedProvider.subscription_ends_at) 
          : new Date();
        const newEnd = new Date(currentEnd);
        newEnd.setDate(newEnd.getDate() + extensionDays);
        updates.subscription_ends_at = newEnd.toISOString();
      }

      const { error } = await supabase
        .from(table)
        .update(updates)
        .eq("id", selectedProvider.id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث الاشتراك بنجاح",
      });

      setIsEditDialogOpen(false);
      loadProviders();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الاشتراك",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleFreezeSubscription = async () => {
    if (!selectedProvider || freezeDays <= 0) return;
    setUpdating(true);

    try {
      const table = selectedProvider.type === "cook" ? "home_cooks" : "house_workers";
      
      // تمديد تاريخ الانتهاء بعدد أيام التجميد
      const currentEnd = selectedProvider.subscription_ends_at 
        ? new Date(selectedProvider.subscription_ends_at) 
        : new Date();
      const newEnd = new Date(currentEnd);
      newEnd.setDate(newEnd.getDate() + freezeDays);

      const { error } = await supabase
        .from(table)
        .update({
          subscription_status: "frozen",
          subscription_ends_at: newEnd.toISOString(),
        })
        .eq("id", selectedProvider.id);

      if (error) throw error;

      // إرسال إشعار للمزود
      await supabase.from("notifications").insert({
        user_id: selectedProvider.user_id,
        title: "تم تجميد اشتراكك",
        message: `تم تجميد اشتراكك لمدة ${freezeDays} يوم. سيتم تمديد صلاحيتك تلقائياً.`,
        type: "subscription_frozen",
        priority: "high",
        link: selectedProvider.type === "cook" ? "/cook-dashboard" : "/worker-dashboard",
      });

      toast({
        title: "تم التجميد",
        description: `تم تجميد الاشتراك لمدة ${freezeDays} يوم`,
      });

      setIsFreezeDialogOpen(false);
      loadProviders();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تجميد الاشتراك",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUnfreezeSubscription = async (provider: Provider) => {
    try {
      const table = provider.type === "cook" ? "home_cooks" : "house_workers";

      const { error } = await supabase
        .from(table)
        .update({ subscription_status: "active" })
        .eq("id", provider.id);

      if (error) throw error;

      // إرسال إشعار
      await supabase.from("notifications").insert({
        user_id: provider.user_id,
        title: "تم إلغاء تجميد اشتراكك",
        message: "تم إلغاء تجميد اشتراكك. يمكنك الآن استقبال الطلبات مجدداً.",
        type: "subscription_unfrozen",
        priority: "normal",
        link: provider.type === "cook" ? "/cook-dashboard" : "/worker-dashboard",
      });

      toast({
        title: "تم إلغاء التجميد",
        description: "تم تفعيل الاشتراك مجدداً",
      });

      loadProviders();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSendReminder = async (provider: Provider) => {
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: provider.user_id,
        title: "تذكير بتجديد الاشتراك",
        message: `اشتراكك سينتهي قريباً. يرجى تجديد الاشتراك للاستمرار في استقبال الطلبات.`,
        type: "subscription_reminder",
        priority: "high",
        link: provider.type === "cook" ? "/cook-dashboard" : "/worker-dashboard",
      });

      if (error) throw error;

      toast({
        title: "تم الإرسال",
        description: "تم إرسال تذكير التجديد بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إرسال التذكير",
        variant: "destructive",
      });
    }
  };

  const handleBulkReminder = async () => {
    const expiringProviders = providers.filter((p) => {
      if (!p.subscription_ends_at) return false;
      const daysLeft = Math.ceil(
        (new Date(p.subscription_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysLeft <= 7 && daysLeft > 0;
    });

    if (expiringProviders.length === 0) {
      toast({
        title: "لا يوجد",
        description: "لا يوجد مزودين اشتراكهم على وشك الانتهاء",
      });
      return;
    }

    try {
      const notifications = expiringProviders.map((p) => ({
        user_id: p.user_id,
        title: "تذكير بتجديد الاشتراك",
        message: `اشتراكك سينتهي قريباً. يرجى تجديد الاشتراك للاستمرار في استقبال الطلبات.`,
        type: "subscription_reminder",
        priority: "high",
        link: p.type === "cook" ? "/cook-dashboard" : "/worker-dashboard",
      }));

      const { error } = await supabase.from("notifications").insert(notifications);

      if (error) throw error;

      toast({
        title: "تم الإرسال",
        description: `تم إرسال ${notifications.length} تذكير بنجاح`,
      });

      setIsReminderDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إرسال التذكيرات",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 ml-1" />نشط</Badge>;
      case "trial":
        return <Badge className="bg-blue-500 hover:bg-blue-600"><Crown className="w-3 h-3 ml-1" />تجريبي</Badge>;
      case "expired":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 ml-1" />منتهي</Badge>;
      case "frozen":
        return <Badge className="bg-cyan-500 hover:bg-cyan-600"><Snowflake className="w-3 h-3 ml-1" />مجمد</Badge>;
      default:
        return <Badge variant="secondary">غير محدد</Badge>;
    }
  };

  const getTierBadge = (tier: string | null) => {
    switch (tier) {
      case "premium":
        return <Badge className="bg-amber-500 hover:bg-amber-600"><Crown className="w-3 h-3 ml-1" />مميز (100 د.م)</Badge>;
      case "basic":
        return <Badge variant="outline">أساسي (50 د.م)</Badge>;
      default:
        return <Badge variant="secondary">غير محدد</Badge>;
    }
  };

  const getDaysLeft = (endDate: string | null) => {
    if (!endDate) return null;
    const days = Math.ceil(
      (new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const filteredProviders = providers.filter((p) => {
    const matchesSearch =
      p.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || p.subscription_status === filterStatus;
    const matchesType = filterType === "all" || p.type === filterType;
    const matchesCountry = filterCountry === "all" || p.country_id === filterCountry;
    return matchesSearch && matchesStatus && matchesType && matchesCountry;
  });

  // Stats
  const stats = {
    total: providers.length,
    active: providers.filter((p) => p.subscription_status === "active").length,
    trial: providers.filter((p) => p.subscription_status === "trial").length,
    expired: providers.filter((p) => p.subscription_status === "expired").length,
    frozen: providers.filter((p) => p.subscription_status === "frozen").length,
    expiringSoon: providers.filter((p) => {
      const days = getDaysLeft(p.subscription_ends_at);
      return days !== null && days <= 7 && days > 0;
    }).length,
    premium: providers.filter((p) => p.subscription_tier === "premium").length,
    basic: providers.filter((p) => p.subscription_tier === "basic").length,
  };

  // Revenue calculation
  const calculateMonthlyRevenue = (): RevenueData[] => {
    const monthlyData: Record<string, RevenueData> = {};
    
    providers.forEach((p) => {
      if (p.subscription_started_at && (p.subscription_status === "active" || p.subscription_status === "trial")) {
        const startDate = new Date(p.subscription_started_at);
        const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthKey, basic: 0, premium: 0, total: 0 };
        }
        
        if (p.subscription_tier === "premium") {
          monthlyData[monthKey].premium += 100;
        } else {
          monthlyData[monthKey].basic += 50;
        }
        monthlyData[monthKey].total = monthlyData[monthKey].basic + monthlyData[monthKey].premium;
      }
    });

    return Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 6);
  };

  const revenueData = calculateMonthlyRevenue();
  const totalMonthlyRevenue = stats.premium * 100 + stats.basic * 50;
  const expectedRevenue = stats.active * 75; // متوسط

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="bg-gradient-to-br from-background to-muted/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">الإجمالي</CardDescription>
            <CardTitle className="text-xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-green-700 dark:text-green-400">نشط</CardDescription>
            <CardTitle className="text-xl text-green-700 dark:text-green-400">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-blue-700 dark:text-blue-400">تجريبي</CardDescription>
            <CardTitle className="text-xl text-blue-700 dark:text-blue-400">{stats.trial}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-red-700 dark:text-red-400">منتهي</CardDescription>
            <CardTitle className="text-xl text-red-700 dark:text-red-400">{stats.expired}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/20 dark:to-cyan-900/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-cyan-700 dark:text-cyan-400">مجمد</CardDescription>
            <CardTitle className="text-xl text-cyan-700 dark:text-cyan-400">{stats.frozen}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-amber-700 dark:text-amber-400">ينتهي قريباً</CardDescription>
            <CardTitle className="text-xl text-amber-700 dark:text-amber-400">{stats.expiringSoon}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-purple-700 dark:text-purple-400">مميز</CardDescription>
            <CardTitle className="text-xl text-purple-700 dark:text-purple-400">{stats.premium}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-emerald-700 dark:text-emerald-400">الإيرادات</CardDescription>
            <CardTitle className="text-xl text-emerald-700 dark:text-emerald-400">{totalMonthlyRevenue} د.م</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            إدارة الاشتراكات
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            تقرير الإيرادات
          </TabsTrigger>
        </TabsList>

        {/* Management Tab */}
        <TabsContent value="management">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <CardTitle>إدارة الاشتراكات</CardTitle>
                  <CardDescription>إدارة اشتراكات العاملات والطباخات</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={loadProviders}>
                    <RefreshCw className="h-4 w-4 ml-2" />
                    تحديث
                  </Button>
                  <Button onClick={() => setIsReminderDialogOpen(true)}>
                    <Bell className="h-4 w-4 ml-2" />
                    إرسال تذكيرات ({stats.expiringSoon})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالاسم أو الموقع..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Select value={filterCountry} onValueChange={setFilterCountry}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="الدولة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الدول</SelectItem>
                    {countries.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="trial">تجريبي</SelectItem>
                    <SelectItem value="expired">منتهي</SelectItem>
                    <SelectItem value="frozen">مجمد</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="cook">طباخة</SelectItem>
                    <SelectItem value="worker">عاملة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الموقع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>المهام/الشهر</TableHead>
                      <TableHead>ينتهي في</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProviders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          لا يوجد نتائج
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProviders.map((provider) => {
                        const daysLeft = getDaysLeft(provider.subscription_ends_at);
                        const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
                        const isExpired = daysLeft !== null && daysLeft <= 0;
                        const isFrozen = provider.subscription_status === "frozen";

                        return (
                          <TableRow 
                            key={`${provider.type}-${provider.id}`} 
                            className={
                              isFrozen ? "bg-cyan-50 dark:bg-cyan-950/20" :
                              isExpiringSoon ? "bg-amber-50 dark:bg-amber-950/20" : 
                              isExpired ? "bg-red-50 dark:bg-red-950/20" : ""
                            }
                          >
                            <TableCell className="font-medium">
                              {provider.profile?.full_name || "غير محدد"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {provider.type === "cook" ? "طباخة" : "عاملة"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {provider.country?.name_ar && provider.city?.name_ar
                                ? `${provider.city.name_ar}، ${provider.country.name_ar}`
                                : provider.location || "-"}
                            </TableCell>
                            <TableCell>{getStatusBadge(provider.subscription_status)}</TableCell>
                            <TableCell>{getTierBadge(provider.subscription_tier)}</TableCell>
                            <TableCell>{provider.monthly_tasks_count || 0}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {provider.subscription_ends_at ? (
                                  <>
                                    <span className={
                                      isFrozen ? "text-cyan-600" :
                                      isExpiringSoon ? "text-amber-600" : 
                                      isExpired ? "text-red-600" : ""
                                    }>
                                      {new Date(provider.subscription_ends_at).toLocaleDateString("ar-MA")}
                                    </span>
                                    {isExpiringSoon && !isFrozen && (
                                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    )}
                                  </>
                                ) : (
                                  "-"
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedProvider(provider);
                                    setNewTier(provider.subscription_tier || "basic");
                                    setNewStatus(provider.subscription_status || "trial");
                                    setExtensionDays(30);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  تعديل
                                </Button>
                                {isFrozen ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleUnfreezeSubscription(provider)}
                                    title="إلغاء التجميد"
                                  >
                                    <Play className="h-4 w-4 text-green-500" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedProvider(provider);
                                      setFreezeDays(7);
                                      setIsFreezeDialogOpen(true);
                                    }}
                                    title="تجميد"
                                  >
                                    <Snowflake className="h-4 w-4 text-cyan-500" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSendReminder(provider)}
                                  title="إرسال تذكير"
                                >
                                  <Bell className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Report Tab */}
        <TabsContent value="revenue">
          <div className="grid gap-6">
            {/* Revenue Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                <CardHeader className="pb-2">
                  <CardDescription className="text-emerald-100">إجمالي الإيرادات الشهرية</CardDescription>
                  <CardTitle className="text-3xl">{totalMonthlyRevenue} د.م</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 text-emerald-100 text-sm">
                    <TrendingUp className="h-4 w-4" />
                    <span>من {stats.active + stats.trial} مشترك نشط</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>إيرادات الباقة الأساسية</CardDescription>
                  <CardTitle className="text-2xl">{stats.basic * 50} د.م</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{stats.basic} مشترك × 50 د.م</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>إيرادات الباقة المميزة</CardDescription>
                  <CardTitle className="text-2xl">{stats.premium * 100} د.م</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{stats.premium} مشترك × 100 د.م</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>الإيرادات المتوقعة (الشهر القادم)</CardDescription>
                  <CardTitle className="text-2xl">{expectedRevenue} د.م</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">بناءً على المشتركين النشطين</p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Revenue Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  تقرير الإيرادات الشهرية
                </CardTitle>
                <CardDescription>آخر 6 أشهر</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الشهر</TableHead>
                        <TableHead>الباقة الأساسية</TableHead>
                        <TableHead>الباقة المميزة</TableHead>
                        <TableHead>الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            لا توجد بيانات
                          </TableCell>
                        </TableRow>
                      ) : (
                        revenueData.map((row) => (
                          <TableRow key={row.month}>
                            <TableCell className="font-medium">{row.month}</TableCell>
                            <TableCell>{row.basic} د.م</TableCell>
                            <TableCell>{row.premium} د.م</TableCell>
                            <TableCell className="font-bold text-primary">{row.total} د.م</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Distribution by Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>توزيع الاشتراكات حسب النوع</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>طباخات</span>
                      <span className="font-bold">
                        {providers.filter(p => p.type === "cook" && p.subscription_status === "active").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>عاملات</span>
                      <span className="font-bold">
                        {providers.filter(p => p.type === "worker" && p.subscription_status === "active").length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>توزيع الاشتراكات حسب الفئة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Badge variant="outline">أساسي</Badge>
                      </span>
                      <span className="font-bold">{stats.basic}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Badge className="bg-amber-500">مميز</Badge>
                      </span>
                      <span className="font-bold">{stats.premium}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الاشتراك</DialogTitle>
            <DialogDescription>
              تعديل اشتراك {selectedProvider?.profile?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>حالة الاشتراك</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">تجريبي</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="expired">منتهي</SelectItem>
                  <SelectItem value="frozen">مجمد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>فئة الاشتراك</Label>
              <Select value={newTier} onValueChange={setNewTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">أساسي (50 د.م/شهر)</SelectItem>
                  <SelectItem value="premium">مميز (100 د.م/شهر)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>تمديد الاشتراك (أيام)</Label>
              <Input
                type="number"
                value={extensionDays}
                onChange={(e) => setExtensionDays(parseInt(e.target.value) || 0)}
                min={0}
                max={365}
              />
              <p className="text-xs text-muted-foreground">
                أدخل 0 لعدم التمديد، أو عدد الأيام للتمديد من تاريخ الانتهاء الحالي
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateSubscription} disabled={updating}>
              {updating && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Freeze Dialog */}
      <Dialog open={isFreezeDialogOpen} onOpenChange={setIsFreezeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Snowflake className="h-5 w-5 text-cyan-500" />
              تجميد الاشتراك
            </DialogTitle>
            <DialogDescription>
              تجميد اشتراك {selectedProvider?.profile?.full_name} مؤقتاً
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-cyan-50 dark:bg-cyan-950/20 p-4 rounded-lg">
              <p className="text-sm text-cyan-700 dark:text-cyan-400">
                عند تجميد الاشتراك، لن يتمكن المزود من استقبال طلبات جديدة، 
                وسيتم تمديد تاريخ انتهاء الاشتراك بنفس عدد أيام التجميد.
              </p>
            </div>

            <div className="space-y-2">
              <Label>مدة التجميد (أيام)</Label>
              <Input
                type="number"
                value={freezeDays}
                onChange={(e) => setFreezeDays(parseInt(e.target.value) || 0)}
                min={1}
                max={90}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFreezeDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleFreezeSubscription} disabled={updating} className="bg-cyan-500 hover:bg-cyan-600">
              {updating && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              <Snowflake className="h-4 w-4 ml-2" />
              تجميد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reminder Dialog */}
      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إرسال تذكيرات التجديد</DialogTitle>
            <DialogDescription>
              سيتم إرسال تذكير لجميع المزودين الذين اشتراكهم على وشك الانتهاء (خلال 7 أيام)
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium">سيتم إرسال {stats.expiringSoon} تذكير</p>
                <p className="text-sm text-muted-foreground">
                  للمزودين الذين اشتراكهم ينتهي خلال 7 أيام
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReminderDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleBulkReminder}>
              <Bell className="h-4 w-4 ml-2" />
              إرسال التذكيرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptionsTab;
