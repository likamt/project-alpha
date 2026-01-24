import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  Phone,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface Booking {
  id: string;
  worker_id: string;
  client_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  service_type: string;
  status: string;
  total_amount: number | null;
  notes: string | null;
  created_at: string;
  worker?: {
    id: string;
    hourly_rate: number;
    profile?: {
      full_name: string;
      phone: string | null;
      avatar_url: string | null;
    };
  };
}

const MyBookings = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("worker_bookings")
        .select(`
          *,
          worker:house_workers(
            id,
            hourly_rate,
            profile:profiles(full_name, phone, avatar_url)
          )
        `)
        .eq("client_id", user.id)
        .order("booking_date", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("worker_bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: "تم إلغاء الحجز بنجاح",
      });

      fetchBookings();
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; label: string; icon: React.ReactNode }> = {
      pending: {
        className: "bg-yellow-100 text-yellow-800 border-yellow-300",
        label: "في الانتظار",
        icon: <Clock className="h-3 w-3" />,
      },
      confirmed: {
        className: "bg-blue-100 text-blue-800 border-blue-300",
        label: "مؤكد",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      completed: {
        className: "bg-green-100 text-green-800 border-green-300",
        label: "مكتمل",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      cancelled: {
        className: "bg-red-100 text-red-800 border-red-300",
        label: "ملغي",
        icon: <XCircle className="h-3 w-3" />,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Badge variant="outline" className={`${config.className} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getServiceLabel = (serviceKey: string) => {
    const labels: Record<string, string> = {
      houseCleaning: "تنظيف المنازل",
      laundry: "غسيل الملابس",
      ironing: "كي الملابس",
      organizing: "ترتيب المنزل",
      childcare: "رعاية الأطفال",
      eldercare: "رعاية كبار السن",
      homeCooking: "طبخ منزلي",
      comprehensive: "مساعدة شاملة",
    };
    return labels[serviceKey] || serviceKey;
  };

  const filterBookings = (status: string) => {
    const today = new Date().toISOString().split("T")[0];
    
    if (status === "upcoming") {
      return bookings.filter(
        (b) => b.booking_date >= today && !["cancelled", "completed"].includes(b.status)
      );
    } else if (status === "completed") {
      return bookings.filter((b) => b.status === "completed");
    } else if (status === "cancelled") {
      return bookings.filter((b) => b.status === "cancelled");
    }
    return bookings;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
        <Navbar />
        <main className="flex-grow pt-24 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <Navbar />

      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">حجوزاتي</h1>
            <p className="text-muted-foreground">إدارة ومتابعة حجوزاتك مع العاملات المنزليات</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                قادمة
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                مكتملة
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                ملغية
              </TabsTrigger>
            </TabsList>

            {["upcoming", "completed", "cancelled"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <div className="grid gap-4">
                  {filterBookings(tab).length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">لا توجد حجوزات</p>
                        {tab === "upcoming" && (
                          <Button
                            className="mt-4"
                            onClick={() => navigate("/house-workers")}
                          >
                            استعرض العاملات
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    filterBookings(tab).map((booking) => (
                      <Card key={booking.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row gap-6">
                            {/* Worker Info */}
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                                {booking.worker?.profile?.avatar_url ? (
                                  <img
                                    src={booking.worker.profile.avatar_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="h-8 w-8 text-purple-600" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {booking.worker?.profile?.full_name || "عاملة"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {getServiceLabel(booking.service_type)}
                                </p>
                              </div>
                            </div>

                            {/* Booking Details */}
                            <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  التاريخ
                                </p>
                                <p className="font-medium">
                                  {format(new Date(booking.booking_date), "dd MMMM yyyy", {
                                    locale: isRTL ? ar : enUS,
                                  })}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  الوقت
                                </p>
                                <p className="font-medium">
                                  {booking.start_time} - {booking.end_time}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">الحالة</p>
                                {getStatusBadge(booking.status)}
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">المبلغ</p>
                                <p className="font-bold text-primary">
                                  {booking.total_amount || 0} د.م
                                </p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              {booking.status === "pending" && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleCancelBooking(booking.id)}
                                >
                                  <XCircle className="h-4 w-4 ml-1" />
                                  إلغاء
                                </Button>
                              )}
                              {booking.worker?.profile?.phone && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    (window.location.href = `tel:${booking.worker?.profile?.phone}`)
                                  }
                                >
                                  <Phone className="h-4 w-4 ml-1" />
                                  اتصل
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/house-worker/${booking.worker_id}`)}
                              >
                                <User className="h-4 w-4 ml-1" />
                                الملف
                              </Button>
                            </div>
                          </div>

                          {booking.notes && (
                            <div className="mt-4 p-3 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                ملاحظات:
                              </p>
                              <p className="text-sm mt-1">{booking.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyBookings;
