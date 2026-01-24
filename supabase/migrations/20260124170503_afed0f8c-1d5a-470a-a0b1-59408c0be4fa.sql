-- جدول حجوزات العاملات المنزليات
CREATE TABLE IF NOT EXISTS public.worker_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.house_workers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  service_type TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
);

-- جدول الإشعارات
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_type CHECK (type IN ('info', 'success', 'warning', 'error', 'booking', 'order', 'message'))
);

-- تفعيل RLS
ALTER TABLE public.worker_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- سياسات الحجوزات
CREATE POLICY "العملاء يمكنهم رؤية حجوزاتهم" ON public.worker_bookings 
FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "العاملات يمكنهن رؤية حجوزاتهن" ON public.worker_bookings 
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.house_workers 
  WHERE house_workers.id = worker_bookings.worker_id 
  AND house_workers.user_id = auth.uid()
));

CREATE POLICY "العملاء يمكنهم إنشاء حجوزات" ON public.worker_bookings 
FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "العملاء والعاملات يمكنهم تحديث الحجوزات" ON public.worker_bookings 
FOR UPDATE USING (
  auth.uid() = client_id OR EXISTS (
    SELECT 1 FROM public.house_workers 
    WHERE house_workers.id = worker_bookings.worker_id 
    AND house_workers.user_id = auth.uid()
  )
);

-- سياسات الإشعارات
CREATE POLICY "المستخدمون يمكنهم رؤية إشعاراتهم" ON public.notifications 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "النظام يمكنه إنشاء إشعارات" ON public.notifications 
FOR INSERT WITH CHECK (true);

CREATE POLICY "المستخدمون يمكنهم تحديث إشعاراتهم" ON public.notifications 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف إشعاراتهم" ON public.notifications 
FOR DELETE USING (auth.uid() = user_id);

-- تفعيل Realtime للإشعارات
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_bookings;