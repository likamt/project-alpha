import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Loader2, ShoppingCart, ArrowRight, Eye } from "lucide-react";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";

interface FoodOrder {
  id: string;
  client_id: string;
  cook_id: string;
  dish_id: string;
  quantity: number;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  dish?: { name: string };
  cook?: { profile?: { full_name: string } };
}

const ORDER_STATUSES = [
  { value: "all", label: "الكل" },
  { value: "pending", label: "قيد الانتظار" },
  { value: "paid", label: "مدفوع" },
  { value: "preparing", label: "قيد التحضير" },
  { value: "ready", label: "جاهز" },
  { value: "delivered", label: "تم التوصيل" },
  { value: "completed", label: "مكتمل" },
  { value: "cancelled", label: "ملغي" },
];

const AdminOrdersTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("food_orders")
        .select(`
          *,
          dish:food_dishes(name),
          cook:home_cooks(profile:profiles(full_name))
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setOrders(data || []);
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

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("food_orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث حالة الطلب بنجاح",
      });

      loadOrders();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const flow: Record<string, string> = {
      pending: "paid",
      paid: "preparing",
      preparing: "ready",
      ready: "delivered",
      delivered: "completed",
    };
    return flow[currentStatus] || null;
  };

  const getNextStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      paid: "تأكيد الدفع",
      preparing: "بدء التحضير",
      ready: "جاهز للتوصيل",
      delivered: "تم التوصيل",
      completed: "اكتمال",
    };
    return labels[status] || status;
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch =
      order.dish?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.cook?.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
              <ShoppingCart className="h-5 w-5" />
              إدارة الطلبات
            </CardTitle>
            <CardDescription>متابعة وتحديث حالة الطلبات</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Order Flow Visual */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-3 font-medium">مسار الطلب:</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {["pending", "paid", "preparing", "ready", "delivered", "completed"].map((status, index, arr) => (
              <div key={status} className="flex items-center gap-2">
                <OrderStatusBadge status={status} />
                {index < arr.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الطبق</TableHead>
                <TableHead className="text-right">الطاهية</TableHead>
                <TableHead className="text-right">الكمية</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد طلبات
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const nextStatus = getNextStatus(order.status);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.dish?.name || "طبق"}
                      </TableCell>
                      <TableCell>
                        {order.cook?.profile?.full_name || "غير محدد"}
                      </TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell className="font-bold text-primary">
                        {Number(order.total_amount).toLocaleString()} د.م
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString("ar-MA")}
                      </TableCell>
                      <TableCell>
                        {nextStatus && order.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(order.id, nextStatus)}
                          >
                            {getNextStatusLabel(nextStatus)}
                          </Button>
                        )}
                        {order.status === "cancelled" && (
                          <span className="text-sm text-muted-foreground">ملغي</span>
                        )}
                        {order.status === "completed" && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            مكتمل
                          </Badge>
                        )}
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
  );
};

export default AdminOrdersTab;
