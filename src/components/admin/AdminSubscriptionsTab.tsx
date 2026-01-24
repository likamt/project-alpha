import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Crown, RefreshCw, Bell, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
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
  profile?: {
    full_name: string;
    phone: string | null;
  };
  type: "cook" | "worker";
}

const AdminSubscriptionsTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [newTier, setNewTier] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [extensionDays, setExtensionDays] = useState<number>(30);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const [cooksData, workersData] = await Promise.all([
        supabase
          .from("home_cooks")
          .select(`
            id, user_id, subscription_status, subscription_tier, 
            subscription_ends_at, subscription_started_at, monthly_tasks_count,
            completed_orders, rating, location,
            profile:profiles(full_name, phone)
          `)
          .order("subscription_ends_at", { ascending: true }),
        supabase
          .from("house_workers")
          .select(`
            id, user_id, subscription_status, subscription_tier,
            subscription_ends_at, subscription_started_at, monthly_tasks_count,
            completed_orders, rating, location,
            profile:profiles(full_name, phone)
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

  const handleSendReminder = async (provider: Provider) => {
    try {
      // Create notification for the provider
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
    return matchesSearch && matchesStatus && matchesType;
  });

  // Stats
  const stats = {
    total: providers.length,
    active: providers.filter((p) => p.subscription_status === "active").length,
    trial: providers.filter((p) => p.subscription_status === "trial").length,
    expired: providers.filter((p) => p.subscription_status === "expired").length,
    expiringSoon: providers.filter((p) => {
      const days = getDaysLeft(p.subscription_ends_at);
      return days !== null && days <= 7 && days > 0;
    }).length,
    premium: providers.filter((p) => p.subscription_tier === "premium").length,
  };

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>الإجمالي</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>نشط</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>تجريبي</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{stats.trial}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>منتهي</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.expired}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>ينتهي قريباً</CardDescription>
            <CardTitle className="text-2xl text-amber-600">{stats.expiringSoon}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>مميز</CardDescription>
            <CardTitle className="text-2xl text-amber-500">{stats.premium}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Actions */}
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
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="trial">تجريبي</SelectItem>
                <SelectItem value="expired">منتهي</SelectItem>
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
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      لا يوجد نتائج
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProviders.map((provider) => {
                    const daysLeft = getDaysLeft(provider.subscription_ends_at);
                    const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
                    const isExpired = daysLeft !== null && daysLeft <= 0;

                    return (
                      <TableRow key={`${provider.type}-${provider.id}`} className={isExpiringSoon ? "bg-amber-50 dark:bg-amber-950/20" : isExpired ? "bg-red-50 dark:bg-red-950/20" : ""}>
                        <TableCell className="font-medium">
                          {provider.profile?.full_name || "غير محدد"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {provider.type === "cook" ? "طباخة" : "عاملة"}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(provider.subscription_status)}</TableCell>
                        <TableCell>{getTierBadge(provider.subscription_tier)}</TableCell>
                        <TableCell>{provider.monthly_tasks_count || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {provider.subscription_ends_at ? (
                              <>
                                <span className={isExpiringSoon ? "text-amber-600" : isExpired ? "text-red-600" : ""}>
                                  {new Date(provider.subscription_ends_at).toLocaleDateString("ar-MA")}
                                </span>
                                {isExpiringSoon && (
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                )}
                              </>
                            ) : (
                              "-"
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSendReminder(provider)}
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
              <label className="text-sm font-medium">حالة الاشتراك</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">تجريبي</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="expired">منتهي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">فئة الاشتراك</label>
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
              <label className="text-sm font-medium">تمديد الاشتراك (أيام)</label>
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
