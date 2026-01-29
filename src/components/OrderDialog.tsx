import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart, MapPin, Clock, Banknote, CheckCircle } from "lucide-react";
import LocationSelector from "./LocationSelector";

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dish: {
    id: string;
    name: string;
    price: number;
    preparation_time_minutes: number | null;
    cook_id: string;
  } | null;
}

const OrderDialog = ({ open, onOpenChange, dish }: OrderDialogProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [success, setSuccess] = useState(false);

  const totalAmount = dish ? dish.price * quantity : 0;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setQuantity(1);
      setDeliveryAddress("");
      setDeliveryNotes("");
      setSuccess(false);
    }
  }, [open]);

  const handleOrder = async () => {
    if (!dish) return;

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: t("auth.signIn"),
        description: t("auth.signInRequired"),
        variant: "destructive",
      });
      onOpenChange(false);
      navigate("/auth");
      return;
    }

    if (!deliveryAddress.trim()) {
      toast({
        title: t("common.error"),
        description: t("orders.enterDeliveryAddress"),
        variant: "destructive",
      });
      return;
    }

    if (!selectedCountryId || !selectedCityId) {
      toast({
        title: t("common.error"),
        description: t("common.selectLocation"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // إنشاء الطلب
      const { data: orderData, error: orderError } = await supabase.from("food_orders").insert({
        client_id: user.id,
        cook_id: dish.cook_id,
        dish_id: dish.id,
        quantity,
        unit_price: dish.price,
        total_amount: totalAmount,
        platform_fee: 0,
        cook_amount: totalAmount,
        delivery_address: deliveryAddress,
        delivery_notes: deliveryNotes,
        country_id: selectedCountryId,
        city_id: selectedCityId,
        status: "pending",
        payment_status: "pending",
      }).select().single();

      if (orderError) {
        console.error("Order creation error:", orderError);
        throw orderError;
      }

      // إرسال إشعار للطباخة (استخدام edge function)
      try {
        const { data: cookData } = await supabase
          .from("home_cooks")
          .select("user_id")
          .eq("id", dish.cook_id)
          .single();

        if (cookData) {
          await supabase.functions.invoke("send-notification", {
            body: {
              recipientId: cookData.user_id,
              type: "new_order",
              title: t("orders.newOrder"),
              message: `${t("orders.newOrderFor")} ${dish.name} - ${t("orders.quantity")}: ${quantity}`,
              link: "/cook-dashboard",
            },
          });
        }
      } catch (notifError) {
        console.log("Notification not sent:", notifError);
        // لا نريد فشل الطلب إذا فشل إرسال الإشعار
      }

      setSuccess(true);
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || t("common.tryAgain"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!dish) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        {success ? (
          // شاشة النجاح
          <div className="text-center py-8 space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-green-600">{t("orders.orderSuccess")}</h3>
            <p className="text-muted-foreground">{t("orders.orderSuccessDescription")}</p>
            <div className="bg-muted rounded-lg p-4 text-right space-y-2">
              <p><strong>{t("dishes.dishName")}:</strong> {dish.name}</p>
              <p><strong>{t("orders.quantity")}:</strong> {quantity}</p>
              <p><strong>{t("orders.totalAmount")}:</strong> {totalAmount} {t("common.currency")}</p>
              <p className="text-sm text-orange-600 flex items-center gap-1">
                <Banknote className="h-4 w-4" />
                {t("orders.cashPayment")}
              </p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                {t("common.close")}
              </Button>
              <Button onClick={() => navigate("/my-orders")} className="flex-1">
                {t("orders.viewOrders")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-orange-500" />
                {t("orders.orderDish")} {dish.name}
              </DialogTitle>
              <DialogDescription>
                {t("orders.enterDeliveryDetails")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Quantity */}
              <div className="space-y-2">
                <Label>{t("orders.quantity")}</Label>
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

              {/* Location Selection */}
              <LocationSelector
                selectedCountryId={selectedCountryId}
                selectedCityId={selectedCityId}
                onCountryChange={setSelectedCountryId}
                onCityChange={setSelectedCityId}
                required
              />

              {/* Delivery Address */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t("orders.deliveryAddress")} *
                </Label>
                <Input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder={t("orders.deliveryAddressPlaceholder")}
                />
              </div>

              {/* Delivery Notes */}
              <div className="space-y-2">
                <Label>{t("orders.deliveryNotes")}</Label>
                <Textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder={t("orders.deliveryNotesPlaceholder")}
                  rows={2}
                />
              </div>

              {/* Order Summary */}
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t("orders.unitPrice")}:</span>
                  <span>{dish.price} {t("common.currency")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t("orders.quantity")}:</span>
                  <span>×{quantity}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>{t("orders.totalAmount")}:</span>
                  <span className="text-orange-600">{totalAmount} {t("common.currency")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                  <Clock className="h-3 w-3" />
                  <span>{t("orders.preparationTime")}: ~{dish.preparation_time_minutes || 60} {t("common.minutes")}</span>
                </div>
              </div>

              {/* Cash Payment Notice */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700">
                <Banknote className="h-4 w-4 inline ml-1" />
                <strong>{t("orders.paymentMethod")}:</strong> {t("orders.cashOnDelivery")}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button 
                onClick={handleOrder} 
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 ml-2" />
                    {t("orders.confirmOrder")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderDialog;
