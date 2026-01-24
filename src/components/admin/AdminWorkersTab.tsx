import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Home,
  Star,
} from "lucide-react";

interface HouseWorker {
  id: string;
  user_id: string;
  is_verified: boolean;
  rating: number;
  completed_orders: number;
  hourly_rate: number;
  location: string | null;
  subscription_status: string | null;
  created_at: string;
  profile?: { full_name: string; phone: string | null };
}

const AdminWorkersTab = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<HouseWorker[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("house_workers")
        .select(`
          *,
          profile:profiles(full_name, phone)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorkers(data || []);
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

  const handleVerify = async (workerId: string, isVerified: boolean) => {
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

      loadWorkers();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getSubscriptionBadge = (status: string | null) => {
    const config: Record<string, { label: string; className: string }> = {
      trial: { label: "تجريبي", className: "bg-blue-50 text-blue-700 border-blue-200" },
      active: { label: "نشط", className: "bg-green-50 text-green-700 border-green-200" },
      expired: { label: "منتهي", className: "bg-red-50 text-red-700 border-red-200" },
      cancelled: { label: "ملغي", className: "bg-gray-50 text-gray-700 border-gray-200" },
    };
    const conf = config[status || "trial"] || config.trial;
    return (
      <Badge variant="outline" className={conf.className}>
        {conf.label}
      </Badge>
    );
  };

  const filteredWorkers = workers.filter(
    (worker) =>
      worker.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              إدارة العاملات
            </CardTitle>
            <CardDescription>توثيق وإدارة حسابات العاملات المنزليات</CardDescription>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو المدينة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">المدينة</TableHead>
                <TableHead className="text-right">السعر/ساعة</TableHead>
                <TableHead className="text-right">التقييم</TableHead>
                <TableHead className="text-right">الاشتراك</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد عاملات
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell className="font-medium">
                      {worker.profile?.full_name || "عاملة"}
                    </TableCell>
                    <TableCell>{worker.location || "-"}</TableCell>
                    <TableCell>{worker.hourly_rate} د.م</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span>{worker.rating?.toFixed(1) || "0.0"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getSubscriptionBadge(worker.subscription_status)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          worker.is_verified
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }
                      >
                        {worker.is_verified ? "موثقة" : "غير موثقة"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/house-worker/${worker.id}`)}>
                            <Eye className="h-4 w-4 ml-2" />
                            عرض الملف
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVerify(worker.id, worker.is_verified)}>
                            {worker.is_verified ? (
                              <>
                                <XCircle className="h-4 w-4 ml-2" />
                                إلغاء التوثيق
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 ml-2" />
                                توثيق
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
  );
};

export default AdminWorkersTab;
