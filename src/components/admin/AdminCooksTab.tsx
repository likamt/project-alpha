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
  ChefHat,
  Star,
} from "lucide-react";

interface HomeCook {
  id: string;
  user_id: string;
  is_verified: boolean;
  rating: number;
  completed_orders: number;
  location: string | null;
  subscription_status: string | null;
  created_at: string;
  profile?: { full_name: string; phone: string | null };
}

const AdminCooksTab = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cooks, setCooks] = useState<HomeCook[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadCooks();
  }, []);

  const loadCooks = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("home_cooks")
        .select(`
          *,
          profile:profiles(full_name, phone)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCooks(data || []);
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

  const handleVerify = async (cookId: string, isVerified: boolean) => {
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

      loadCooks();
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

  const filteredCooks = cooks.filter(
    (cook) =>
      cook.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cook.location?.toLowerCase().includes(searchQuery.toLowerCase())
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
              <ChefHat className="h-5 w-5" />
              إدارة الطاهيات
            </CardTitle>
            <CardDescription>توثيق وإدارة حسابات الطاهيات</CardDescription>
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
                <TableHead className="text-right">التقييم</TableHead>
                <TableHead className="text-right">الطلبات</TableHead>
                <TableHead className="text-right">الاشتراك</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد طاهيات
                  </TableCell>
                </TableRow>
              ) : (
                filteredCooks.map((cook) => (
                  <TableRow key={cook.id}>
                    <TableCell className="font-medium">
                      {cook.profile?.full_name || "طاهية"}
                    </TableCell>
                    <TableCell>{cook.location || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span>{cook.rating?.toFixed(1) || "0.0"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{cook.completed_orders || 0}</TableCell>
                    <TableCell>{getSubscriptionBadge(cook.subscription_status)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          cook.is_verified
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }
                      >
                        {cook.is_verified ? "موثقة" : "غير موثقة"}
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
                          <DropdownMenuItem onClick={() => navigate(`/home-cook/${cook.id}`)}>
                            <Eye className="h-4 w-4 ml-2" />
                            عرض الملف
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVerify(cook.id, cook.is_verified)}>
                            {cook.is_verified ? (
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

export default AdminCooksTab;
