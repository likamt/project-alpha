import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskConfirmationButtonProps {
  taskId: string;
  taskType: "booking" | "food_order";
  providerId: string;
  providerName: string;
  onConfirmed?: () => void;
  disabled?: boolean;
}

const TaskConfirmationButton = ({
  taskId,
  taskType,
  providerId,
  providerName,
  onConfirmed,
  disabled = false,
}: TaskConfirmationButtonProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleConfirmTask = async () => {
    setLoading(true);

    try {
      const now = new Date().toISOString();

      if (taskType === "booking") {
        // تحديث الحجز مع تأكيد الزبون والتقييم
        const { error } = await supabase
          .from("worker_bookings")
          .update({
            client_confirmed_at: now,
            client_rating: rating,
            client_comment: comment || null,
            status: "completed",
          })
          .eq("id", taskId);

        if (error) throw error;
      } else {
        // تحديث طلب الطعام
        const { error } = await supabase
          .from("food_orders")
          .update({
            client_confirmed_at: now,
            status: "completed",
            payment_status: "cash_paid",
          })
          .eq("id", taskId);

        if (error) throw error;

        // إضافة التقييم للطباخة
        const { data: orderData } = await supabase
          .from("food_orders")
          .select("cook_id, client_id")
          .eq("id", taskId)
          .single();

        if (orderData) {
          await supabase.from("food_ratings").insert({
            order_id: taskId,
            cook_id: orderData.cook_id,
            client_id: orderData.client_id,
            rating: rating,
            comment: comment || null,
          });
        }
      }

      toast({
        title: t("common.success"),
        description: t("task.confirmedSuccess"),
      });

      setDialogOpen(false);
      onConfirmed?.();
    } catch (error: any) {
      console.error("Error confirming task:", error);
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        disabled={disabled}
        className="bg-green-600 hover:bg-green-700 text-white"
        size="lg"
      >
        <CheckCircle2 className="h-5 w-5 ml-2" />
        {t("task.confirmCompletion")}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              {t("task.confirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("task.confirmDescription", { name: providerName })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* نظام التقييم */}
            <div className="space-y-3">
              <Label className="text-base font-medium">{t("ratings.rateService")}</Label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "h-10 w-10 transition-colors",
                        star <= (hoveredRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      )}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {rating === 1 && t("ratings.poor")}
                {rating === 2 && t("ratings.fair")}
                {rating === 3 && t("ratings.good")}
                {rating === 4 && t("ratings.veryGood")}
                {rating === 5 && t("ratings.excellent")}
              </p>
            </div>

            {/* التعليق */}
            <div className="space-y-2">
              <Label>{t("ratings.addComment")} ({t("common.optional")})</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("ratings.commentPlaceholder")}
                rows={3}
              />
            </div>

            {/* تنبيه مهم */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              <strong className="block mb-1">{t("task.importantNote")}:</strong>
              {t("task.confirmationEffect")}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleConfirmTask}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                  {t("task.confirmAndRate")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskConfirmationButton;
