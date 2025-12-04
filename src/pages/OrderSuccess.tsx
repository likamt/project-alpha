import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, ArrowRight, Loader2 } from "lucide-react";

interface OrderDetails {
  id: string;
  quantity: number;
  total_amount: number;
  status: string;
  delivery_address: string | null;
  dish: {
    name: string;
  } | null;
  cook: {
    profile: {
      full_name: string;
    } | null;
  } | null;
}

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("food_orders")
        .select(`
          id,
          quantity,
          total_amount,
          status,
          delivery_address,
          dish:food_dishes(name),
          cook:home_cooks(profile:profiles(full_name))
        `)
        .eq("id", orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Navbar />
      
      <main className="flex-grow pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 rounded-full">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-green-600">تم الدفع بنجاح!</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {order ? (
                <div className="bg-muted rounded-lg p-4 text-right">
                  <h3 className="font-semibold mb-3">تفاصيل الطلب</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">رقم الطلب:</span>
                      <span className="font-mono text-xs">{order.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الطبق:</span>
                      <span>{order.dish?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الكمية:</span>
                      <span>{order.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الطاهية:</span>
                      <span>{order.cook?.profile?.full_name}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>المبلغ الإجمالي:</span>
                      <span className="text-orange-600">{order.total_amount} د.م</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">تم إتمام الدفع بنجاح</p>
              )}

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-right">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-800">نظام الدفع المؤقت</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      المبلغ محجوز بأمان حتى تأكيد استلام الطلب من كلا الطرفين.
                      بعد تأكيد التسليم سيتم تحويل المبلغ للطاهية.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button asChild className="bg-orange-500 hover:bg-orange-600">
                  <Link to="/my-orders">
                    متابعة طلباتي
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/home-cooking">
                    تصفح المزيد من الأطباق
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderSuccess;
