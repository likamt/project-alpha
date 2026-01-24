import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, Clock, CheckCircle, XCircle, Loader2, 
  ChefHat, AlertCircle, Receipt
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: string;
  payment_status: string;
  delivery_address: string | null;
  client_confirmed_at: string | null;
  created_at: string | null;
  dish: {
    name: string;
    image_url: string | null;
  } | null;
  cook: {
    profile: {
      full_name: string;
    } | null;
  } | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "في انتظار القبول", color: "bg-yellow-500" },
  accepted: { label: "تم القبول", color: "bg-blue-500" },
  preparing: { label: "جاري التحضير", color: "bg-orange-500" },
  ready: { label: "جاهز للتسليم", color: "bg-purple-500" },
  delivered: { label: "تم التوصيل", color: "bg-green-500" },
  completed: { label: "مكتمل", color: "bg-green-600" },
  cancelled: { label: "ملغي", color: "bg-red-500" },
};

const MyOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadOrders();
  }, []);

  const checkAuthAndLoadOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    await loadOrders(user.id);
  };

  const loadOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("food_orders")
        .select(`
          *,
          dish:food_dishes(name, image_url),
          cook:home_cooks(profile:profiles(full_name))
        `)
        .eq("client_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelivery = async (orderId: string) => {
    setConfirming(orderId);
    try {
      // تحديث الطلب مباشرة - الزبون يؤكد الاستلام
      const { error } = await supabase
        .from("food_orders")
        .update({
          client_confirmed_at: new Date().toISOString(),
          status: "completed",
          payment_status: "cash_paid",
        })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "تم تأكيد الاستلام!",
        description: "شكراً لك! تم إكمال الطلب بنجاح.",
      });

      // Reload orders
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await loadOrders(user.id);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setConfirming(null);
    }
  };

  const activeOrders = orders.filter(o => !["completed", "cancelled"].includes(o.status));
  const completedOrders = orders.filter(o => ["completed", "cancelled"].includes(o.status));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <Navbar />
        <main className="flex-grow pt-20 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
        </main>
        <Footer />
      </div>
    );
  }

  const OrderCard = ({ order }: { order: Order }) => {
    const status = statusLabels[order.status] || { label: order.status, color: "bg-gray-500" };
    const canConfirm = ["delivered", "ready"].includes(order.status) && !order.client_confirmed_at;

    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {order.dish?.image_url ? (
                <img src={order.dish.image_url} alt={order.dish.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <ChefHat className="h-8 w-8 text-orange-400" />
              )}
            </div>
            
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{order.dish?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {order.cook?.profile?.full_name} • الكمية: {order.quantity}
                  </p>
                </div>
                <Badge className={status.color}>{status.label}</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-bold text-orange-600">{order.total_amount} د.م</span>
                <span className="text-xs text-muted-foreground">
                  {order.created_at ? new Date(order.created_at).toLocaleDateString("ar-MA") : ""}
                </span>
              </div>

              {/* Cash payment status */}
              {order.payment_status === "cash_pending" && (
                <div className="mt-3 p-2 bg-orange-50 rounded text-xs text-orange-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  الدفع نقداً عند الاستلام
                </div>
              )}

              {/* Confirm button */}
              {canConfirm && (
                <Button 
                  onClick={() => confirmDelivery(order.id)}
                  disabled={confirming === order.id}
                  className="mt-3 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  {confirming === order.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 ml-2" />
                      تأكيد الاستلام والدفع
                    </>
                  )}
                </Button>
              )}

              {/* Completed */}
              {order.status === "completed" && (
                <div className="mt-3 p-2 bg-green-50 rounded text-xs text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  تم إكمال الطلب بنجاح
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Navbar />
      
      <main className="flex-grow pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <Package className="h-8 w-8 text-orange-500" />
            <h1 className="text-2xl font-bold">طلباتي</h1>
          </div>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا توجد طلبات</h3>
                <p className="text-muted-foreground mb-4">لم تقم بأي طلبات بعد</p>
                <Button onClick={() => navigate("/home-cooking")} className="bg-orange-500 hover:bg-orange-600">
                  تصفح الأطباق
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="active">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="active">نشطة ({activeOrders.length})</TabsTrigger>
                <TabsTrigger value="completed">مكتملة ({completedOrders.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                {activeOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد طلبات نشطة
                  </div>
                ) : (
                  activeOrders.map(order => <OrderCard key={order.id} order={order} />)
                )}
              </TabsContent>

              <TabsContent value="completed">
                {completedOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد طلبات مكتملة
                  </div>
                ) : (
                  completedOrders.map(order => <OrderCard key={order.id} order={order} />)
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyOrders;
