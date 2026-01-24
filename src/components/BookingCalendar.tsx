import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ar, fr, es, de, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingCalendarProps {
  workerId: string;
  workerName: string;
  hourlyRate: number;
  availableDays?: string[];
  services?: string[];
  onBookingComplete?: () => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const BookingCalendar = ({ 
  workerId, 
  workerName, 
  hourlyRate, 
  availableDays = [], 
  services = [],
  onBookingComplete 
}: BookingCalendarProps) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const getLocale = () => {
    switch (i18n.language) {
      case 'ar': return ar;
      case 'fr': return fr;
      case 'es': return es;
      case 'de': return de;
      default: return enUS;
    }
  };

  const timeSlots: TimeSlot[] = [
    { time: "08:00", available: true },
    { time: "09:00", available: true },
    { time: "10:00", available: true },
    { time: "11:00", available: true },
    { time: "12:00", available: true },
    { time: "13:00", available: true },
    { time: "14:00", available: true },
    { time: "15:00", available: true },
    { time: "16:00", available: true },
    { time: "17:00", available: true },
    { time: "18:00", available: true },
    { time: "19:00", available: true },
    { time: "20:00", available: true },
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadExistingBookings();
    }
  }, [selectedDate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const loadExistingBookings = async () => {
    if (!selectedDate) return;
    
    try {
      const { data, error } = await supabase
        .from("worker_bookings")
        .select("*")
        .eq("worker_id", workerId)
        .eq("booking_date", format(selectedDate, "yyyy-MM-dd"))
        .in("status", ["pending", "confirmed"]);

      if (error) throw error;
      setExistingBookings(data || []);
    } catch (error) {
      console.error("Error loading bookings:", error);
    }
  };

  const isTimeSlotAvailable = (time: string) => {
    return !existingBookings.some(booking => {
      const startTime = booking.start_time.substring(0, 5);
      const endTime = booking.end_time.substring(0, 5);
      return time >= startTime && time < endTime;
    });
  };

  const isDayAvailable = (date: Date) => {
    if (availableDays.length === 0) return true;
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    return availableDays.includes(dayName);
  };

  const calculateTotal = () => {
    if (!selectedTimeSlot || !selectedEndTime) return 0;
    const startHour = parseInt(selectedTimeSlot.split(":")[0]);
    const endHour = parseInt(selectedEndTime.split(":")[0]);
    const hours = endHour - startHour;
    return hours * hourlyRate;
  };

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: t('auth.signIn'),
        description: t('houseWorker.noAccountPrompt'),
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate || !selectedTimeSlot || !selectedEndTime || !selectedService) {
      toast({
        title: t('common.error'),
        description: t('common.tryAgain'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("worker_bookings").insert({
        worker_id: workerId,
        client_id: user.id,
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: selectedTimeSlot,
        end_time: selectedEndTime,
        service_type: selectedService,
        notes: notes,
        total_amount: calculateTotal(),
        status: "pending",
      });

      if (error) throw error;

      // إرسال إشعار للعاملة
      const { data: workerData } = await supabase
        .from("house_workers")
        .select("user_id")
        .eq("id", workerId)
        .single();

      if (workerData) {
        await supabase.from("notifications").insert({
          user_id: workerData.user_id,
          title: t('orders.newOrder'),
          message: `${t('houseWorker.title')}: ${format(selectedDate, "PPP", { locale: getLocale() })} - ${selectedTimeSlot}`,
          type: "booking",
          link: "/worker-dashboard",
        });
      }

      toast({
        title: t('common.success'),
        description: t('orders.newOrder'),
      });

      setConfirmDialogOpen(false);
      resetForm();
      onBookingComplete?.();
    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDate(undefined);
    setSelectedTimeSlot("");
    setSelectedEndTime("");
    setSelectedService("");
    setNotes("");
  };

  const getServiceLabel = (serviceKey: string) => {
    const labels: Record<string, string> = {
      houseCleaning: t('houseWorker.services.houseCleaning'),
      laundry: t('houseWorker.services.laundry'),
      ironing: t('houseWorker.services.ironing'),
      organizing: t('houseWorker.services.organizing'),
      childcare: t('houseWorker.services.childcare'),
      eldercare: t('houseWorker.services.eldercare'),
      homeCooking: t('houseWorker.services.homeCooking'),
      comprehensive: t('houseWorker.services.comprehensive'),
    };
    return labels[serviceKey] || serviceKey;
  };

  return (
    <Card className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          {t('booking.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* التقويم */}
        <div>
          <Label className="mb-2 block">{t('booking.selectDate')}</Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={getLocale()}
            disabled={(date) => date < new Date() || !isDayAvailable(date)}
            className={cn("rounded-md border pointer-events-auto")}
          />
        </div>

        {/* اختيار الوقت */}
        {selectedDate && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <Label className="mb-2 block">{t('booking.selectTime')}</Label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {timeSlots.map((slot) => {
                  const available = isTimeSlotAvailable(slot.time);
                  return (
                    <Button
                      key={slot.time}
                      variant={selectedTimeSlot === slot.time ? "default" : "outline"}
                      size="sm"
                      disabled={!available}
                      onClick={() => {
                        setSelectedTimeSlot(slot.time);
                        // تعيين وقت الانتهاء تلقائياً بعد ساعتين
                        const hour = parseInt(slot.time.split(":")[0]) + 2;
                        setSelectedEndTime(`${hour.toString().padStart(2, "0")}:00`);
                      }}
                      className={cn(
                        "text-xs",
                        !available && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {slot.time}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* مدة الخدمة */}
            {selectedTimeSlot && (
              <div>
                <Label className="mb-2 block">{t('booking.duration')}</Label>
                <Select value={selectedEndTime} onValueChange={setSelectedEndTime}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('booking.selectEndTime')} />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots
                      .filter((slot) => {
                        const startHour = parseInt(selectedTimeSlot.split(":")[0]);
                        const slotHour = parseInt(slot.time.split(":")[0]);
                        return slotHour > startHour && slotHour <= startHour + 8;
                      })
                      .map((slot) => (
                        <SelectItem key={slot.time} value={slot.time}>
                          {slot.time} ({parseInt(slot.time) - parseInt(selectedTimeSlot)} {t('booking.hours')})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* اختيار الخدمة */}
            <div>
              <Label className="mb-2 block">{t('houseWorker.serviceCategory')}</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder={t('houseWorker.servicesOffered')} />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service} value={service}>
                      {getServiceLabel(service)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ملاحظات */}
            <div>
              <Label className="mb-2 block">{t('booking.notes')}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('booking.notesPlaceholder')}
                rows={3}
              />
            </div>

            {/* ملخص الحجز */}
            {selectedTimeSlot && selectedEndTime && selectedService && (
              <Card className="bg-muted">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>{t('booking.date')}:</span>
                    <span className="font-medium">
                      {format(selectedDate, "PPP", { locale: getLocale() })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('booking.time')}:</span>
                    <span className="font-medium">
                      {selectedTimeSlot} - {selectedEndTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('houseWorker.serviceCategory')}:</span>
                    <span className="font-medium">{getServiceLabel(selectedService)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                    <span>{t('orders.totalAmount')}:</span>
                    <span className="text-primary">{calculateTotal()} {t('common.currency')}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* زر الحجز */}
            <Button
              className="w-full bg-gradient-secondary hover:opacity-90"
              size="lg"
              disabled={!selectedTimeSlot || !selectedEndTime || !selectedService || loading}
              onClick={() => setConfirmDialogOpen(true)}
            >
              <CheckCircle className="h-5 w-5 ml-2" />
              {t('booking.confirm')}
            </Button>
          </div>
        )}

        {/* حوار التأكيد */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle>{t('booking.confirmTitle')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p>{t('booking.confirmMessage')}</p>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p><strong>{t('houseWorker.title')}:</strong> {workerName}</p>
                <p><strong>{t('booking.date')}:</strong> {selectedDate && format(selectedDate, "PPP", { locale: getLocale() })}</p>
                <p><strong>{t('booking.time')}:</strong> {selectedTimeSlot} - {selectedEndTime}</p>
                <p><strong>{t('orders.totalAmount')}:</strong> {calculateTotal()} {t('common.currency')}</p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleBooking} disabled={loading}>
                {loading ? t('common.loading') : t('common.confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BookingCalendar;