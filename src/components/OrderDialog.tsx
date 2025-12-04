import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart, MapPin, Clock, CreditCard } from "lucide-react";

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dish: {
    id: string;
    name: string;
    price: number;
    preparation_time_minutes: number | null;
  } | null;
}

const OrderDialog = ({ open, onOpenChange, dish }: OrderDialogProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const totalAmount = dish ? dish.price * quantity : 0;
  const platformFee = Math.round(totalAmount * 10) / 100; // 10%

  const handleOrder = async () => {
    if (!dish) return;

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "يرجى تسجيل الدخول لإتمام الطلب",
        variant: "destructive",
      });
      onOpenChange(false);
      navigate("/auth");
      return;
    }

    if (!deliveryAddress.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان التوصيل",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-food-order", {
        body: {
          dish_id: dish.id,
          quantity,
          delivery_address: deliveryAddress,
          delivery_notes: deliveryNotes,
        },
      });

      if (error) throw error;

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إنشاء الطلب",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!dish) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-orange-500" />
            طلب {dish.name}
          </DialogTitle>
          <DialogDescription>
            أدخل تفاصيل الطلب والتوصيل
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Quantity */}
          <div className="space-y-2">
            <Label>الكمية</Label>
            <div className="flex items-center gap-3">
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </Button>
              <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              عنوان التوصيل *
            </Label>
            <Input
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="المدينة، الحي، الشارع، رقم المنزل..."
            />
          </div>

          {/* Delivery Notes */}
          <div className="space-y-2">
            <Label>ملاحظات إضافية</Label>
            <Textarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="أي تعليمات خاصة للتوصيل..."
              rows={2}
            />
          </div>

          {/* Order Summary */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>سعر الوحدة:</span>
              <span>{dish.price} د.م</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>الكمية:</span>
              <span>×{quantity}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>المجموع:</span>
              <span className="text-orange-600">{totalAmount} د.م</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <Clock className="h-3 w-3" />
              <span>وقت التحضير: ~{dish.preparation_time_minutes || 60} دقيقة</span>
            </div>
          </div>

          {/* Escrow Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <CreditCard className="h-4 w-4 inline ml-1" />
            <strong>نظام الدفع الآمن:</strong> المبلغ سيُحجز حتى تأكيد استلام الطلب من كلا الطرفين.
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button 
            onClick={handleOrder} 
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري المعالجة...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 ml-2" />
                الدفع ({totalAmount} د.م)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDialog;
