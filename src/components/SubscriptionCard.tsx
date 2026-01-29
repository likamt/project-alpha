import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CreditCard,
  Crown,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  Sparkles,
} from "lucide-react";

interface SubscriptionCardProps {
  providerType: "home_cook" | "house_worker";
}

interface SubscriptionStatus {
  subscribed: boolean;
  status: string;
  subscription_end?: string;
  trial_ends_at?: string;
  trial_end?: string;
  days_left?: number;
}

const SubscriptionCard = ({ providerType }: SubscriptionCardProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        body: { provider_type: providerType },
      });

      if (error) throw error;
      setSubscription(data);
    } catch (error: any) {
      console.error("Error checking subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: { provider_type: providerType },
      });

      if (error) throw error;

      if (data?.url) {
        // فتح صفحة Stripe في نافذة جديدة لتجنب الشاشة البيضاء
        window.open(data.url, "_blank");
        toast({
          title: "تم فتح صفحة الدفع",
          description: "يرجى إكمال عملية الاشتراك في النافذة الجديدة",
        });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إنشاء الاشتراك",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const isTrialActive = subscription?.status === "trial" && subscription.days_left && subscription.days_left > 0;
  const isSubscribed = subscription?.subscribed && subscription.status === "active";
  const isTrialing = subscription?.status === "trialing";
  const isExpired = !subscription?.subscribed || subscription.status === "expired";

  const getTrialProgress = () => {
    if (!subscription?.days_left) return 100;
    return ((30 - subscription.days_left) / 30) * 100;
  };

  return (
    <Card className={`relative overflow-hidden ${isSubscribed ? "border-primary" : ""}`}>
      {isSubscribed && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50" />
      )}
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className={`h-5 w-5 ${isSubscribed ? "text-primary" : "text-muted-foreground"}`} />
            <CardTitle className="text-lg">حالة الاشتراك</CardTitle>
          </div>
          
          {isTrialActive && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Sparkles className="h-3 w-3 ml-1" />
              فترة تجريبية مجانية
            </Badge>
          )}
          
          {isSubscribed && (
            <Badge variant="default" className="bg-primary">
              <CheckCircle className="h-3 w-3 ml-1" />
              مشترك
            </Badge>
          )}
          
          {isTrialing && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Clock className="h-3 w-3 ml-1" />
              فترة تجريبية
            </Badge>
          )}
          
          {isExpired && (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 ml-1" />
              منتهي
            </Badge>
          )}
        </div>
        
        <CardDescription>
          {providerType === "home_cook" ? "اشتراك الطاهيات المنزليات" : "اشتراك العاملات المنزليات"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isTrialActive && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>الفترة التجريبية المجانية</span>
              <span className="font-semibold">{subscription.days_left} يوم متبقي</span>
            </div>
            <Progress value={getTrialProgress()} className="h-2" />
            <p className="text-xs text-muted-foreground">
              استمتعي بجميع المميزات مجاناً خلال الشهر الأول!
            </p>
          </div>
        )}

        {isSubscribed && subscription.subscription_end && (
          <div className="p-4 bg-primary/5 rounded-lg">
            <p className="text-sm text-muted-foreground">تاريخ التجديد:</p>
            <p className="font-semibold">
              {new Date(subscription.subscription_end).toLocaleDateString("ar-MA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}

        {isTrialing && subscription.trial_end && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-muted-foreground">تنتهي الفترة التجريبية:</p>
            <p className="font-semibold text-blue-800">
              {new Date(subscription.trial_end).toLocaleDateString("ar-MA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}

        {isExpired && (
          <div className="p-4 bg-red-50 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">انتهت فترة الاشتراك</p>
            </div>
            <p className="text-sm text-red-700">
              لتستمري في الظهور للعملاء وتلقي الطلبات، يرجى تجديد الاشتراك.
            </p>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">الاشتراك الشهري</span>
            <div className="text-left">
              <span className="text-2xl font-bold text-primary">99</span>
              <span className="text-sm text-muted-foreground"> د.م/شهر</span>
            </div>
          </div>

          <ul className="text-sm text-muted-foreground space-y-2 mb-4">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              ظهور في نتائج البحث
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              استقبال طلبات العملاء
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              التواصل المباشر مع العملاء
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              شهر أول مجاناً!
            </li>
          </ul>
        </div>

        <div className="flex gap-2">
          {(isExpired || isTrialActive) && (
            <Button
              className="flex-1"
              onClick={handleSubscribe}
              disabled={subscribing}
            >
              {subscribing ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 ml-2" />
                  {isTrialActive ? "اشتركي الآن" : "تجديد الاشتراك"}
                </>
              )}
            </Button>
          )}

          {(isSubscribed || isTrialing) && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleManageSubscription}
            >
              <Settings className="h-4 w-4 ml-2" />
              إدارة الاشتراك
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;
