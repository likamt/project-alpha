import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, MoreVertical, UserCheck, UserX, Loader2, Users, 
  ShieldCheck, ShieldX, Mail, Phone, Calendar, Filter
} from "lucide-react";

interface User {
  id: string;
  full_name: string;
  phone: string | null;
  is_suspended: boolean;
  created_at: string;
  roles: string[];
}

const AdminUsersTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Load profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Load roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles = (profiles || []).map((profile) => ({
        ...profile,
        roles: roles
          ?.filter((r) => r.user_id === profile.id)
          .map((r) => r.role) || [],
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser) return;
    setUpdating(true);

    try {
      const newStatus = !selectedUser.is_suspended;
      
      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: newStatus })
        .eq("id", selectedUser.id);

      if (error) throw error;

      // Send notification to user
      await supabase.from("notifications").insert({
        user_id: selectedUser.id,
        title: newStatus ? "تم إيقاف حسابك" : "تم تفعيل حسابك",
        message: newStatus 
          ? "تم إيقاف حسابك من قبل الإدارة. تواصل معنا للمزيد من المعلومات."
          : "تم إعادة تفعيل حسابك. يمكنك الآن استخدام المنصة بشكل طبيعي.",
        type: newStatus ? "account_suspended" : "account_activated",
        priority: "high",
      });

      toast({
        title: "تم التحديث",
        description: newStatus ? "تم إيقاف الحساب" : "تم تفعيل الحساب",
      });

      setIsSuspendDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; className: string }> = {
      admin: { label: "مسؤول", className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800" },
      client: { label: "عميل", className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800" },
      home_cook: { label: "طاهية", className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800" },
      house_worker: { label: "عاملة", className: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800" },
      craftsman: { label: "حرفي", className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800" },
    };

    const config = roleConfig[role] || { label: role, className: "bg-gray-100 text-gray-700" };
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery);
    const matchesRole = filterRole === "all" || user.roles.includes(filterRole);
    const matchesStatus = 
      filterStatus === "all" || 
      (filterStatus === "active" && !user.is_suspended) ||
      (filterStatus === "suspended" && user.is_suspended);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Stats
  const stats = {
    total: users.length,
    active: users.filter(u => !u.is_suspended).length,
    suspended: users.filter(u => u.is_suspended).length,
    admins: users.filter(u => u.roles.includes("admin")).length,
    clients: users.filter(u => u.roles.includes("client")).length,
    providers: users.filter(u => u.roles.includes("home_cook") || u.roles.includes("house_worker")).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
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
        <Card className="bg-green-50 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-700 dark:text-green-400">نشط</CardDescription>
            <CardTitle className="text-2xl text-green-700 dark:text-green-400">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-red-700 dark:text-red-400">موقوف</CardDescription>
            <CardTitle className="text-2xl text-red-700 dark:text-red-400">{stats.suspended}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-amber-700 dark:text-amber-400">مسؤولين</CardDescription>
            <CardTitle className="text-2xl text-amber-700 dark:text-amber-400">{stats.admins}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-700 dark:text-blue-400">عملاء</CardDescription>
            <CardTitle className="text-2xl text-blue-700 dark:text-blue-400">{stats.clients}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-950/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-700 dark:text-purple-400">مزودين</CardDescription>
            <CardTitle className="text-2xl text-purple-700 dark:text-purple-400">{stats.providers}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                إدارة المستخدمين
              </CardTitle>
              <CardDescription>عرض وإدارة جميع المستخدمين وتفعيل/إيقاف الحسابات</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأدوار</SelectItem>
                <SelectItem value="admin">مسؤول</SelectItem>
                <SelectItem value="client">عميل</SelectItem>
                <SelectItem value="home_cook">طاهية</SelectItem>
                <SelectItem value="house_worker">عاملة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="suspended">موقوف</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الهاتف</TableHead>
                  <TableHead className="text-right">الأدوار</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ التسجيل</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا توجد نتائج
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow 
                      key={user.id}
                      className={user.is_suspended ? "bg-red-50/50 dark:bg-red-950/10" : ""}
                    >
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>
                        {user.phone ? (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <span key={role}>{getRoleBadge(role)}</span>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">لا توجد أدوار</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.is_suspended
                              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400"
                              : "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400"
                          }
                        >
                          {user.is_suspended ? (
                            <><ShieldX className="h-3 w-3 ml-1" />موقوف</>
                          ) : (
                            <><ShieldCheck className="h-3 w-3 ml-1" />نشط</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.created_at).toLocaleDateString("ar-MA")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setIsSuspendDialogOpen(true);
                              }}
                              className={user.is_suspended ? "text-green-600" : "text-red-600"}
                            >
                              {user.is_suspended ? (
                                <>
                                  <UserCheck className="h-4 w-4 ml-2" />
                                  تفعيل الحساب
                                </>
                              ) : (
                                <>
                                  <UserX className="h-4 w-4 ml-2" />
                                  إيقاف الحساب
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Suspend/Activate Dialog */}
      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedUser?.is_suspended ? (
                <><UserCheck className="h-5 w-5 text-green-500" /> تفعيل الحساب</>
              ) : (
                <><UserX className="h-5 w-5 text-red-500" /> إيقاف الحساب</>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.is_suspended
                ? `هل أنت متأكد من تفعيل حساب "${selectedUser?.full_name}"؟`
                : `هل أنت متأكد من إيقاف حساب "${selectedUser?.full_name}"؟`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className={`p-4 rounded-lg ${
              selectedUser?.is_suspended 
                ? "bg-green-50 dark:bg-green-950/20" 
                : "bg-red-50 dark:bg-red-950/20"
            }`}>
              <p className={`text-sm ${
                selectedUser?.is_suspended 
                  ? "text-green-700 dark:text-green-400" 
                  : "text-red-700 dark:text-red-400"
              }`}>
                {selectedUser?.is_suspended
                  ? "سيتمكن المستخدم من تسجيل الدخول واستخدام المنصة بشكل طبيعي."
                  : "لن يتمكن المستخدم من تسجيل الدخول أو استخدام المنصة حتى يتم تفعيل حسابه مجدداً."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuspendDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSuspendUser} 
              disabled={updating}
              variant={selectedUser?.is_suspended ? "default" : "destructive"}
            >
              {updating && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              {selectedUser?.is_suspended ? "تفعيل" : "إيقاف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersTab;
