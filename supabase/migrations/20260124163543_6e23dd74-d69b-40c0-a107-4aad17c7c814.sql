-- إنشاء جداول التقييمات
CREATE TABLE IF NOT EXISTS public.food_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.food_orders(id) ON DELETE CASCADE,
  cook_id UUID NOT NULL REFERENCES public.home_cooks(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(order_id, client_id)
);

CREATE TABLE IF NOT EXISTS public.house_worker_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.house_workers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  service_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.food_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_worker_ratings ENABLE ROW LEVEL SECURITY;

-- سياسات التقييمات للطعام
CREATE POLICY "الجميع يمكنهم رؤية التقييمات" ON public.food_ratings FOR SELECT USING (true);
CREATE POLICY "العملاء يمكنهم إضافة تقييمات" ON public.food_ratings FOR INSERT WITH CHECK (auth.uid() = client_id);

-- سياسات تقييمات العاملات
CREATE POLICY "الجميع يمكنهم رؤية تقييمات العاملات" ON public.house_worker_ratings FOR SELECT USING (true);
CREATE POLICY "العملاء يمكنهم إضافة تقييمات للعاملات" ON public.house_worker_ratings FOR INSERT WITH CHECK (auth.uid() = client_id);