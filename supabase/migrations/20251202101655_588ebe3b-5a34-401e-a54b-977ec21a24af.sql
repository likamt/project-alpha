-- إضافة دور العاملات المنزلية إلى الأدوار
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'house_worker';

-- إنشاء جدول العاملات المنزلية
CREATE TABLE IF NOT EXISTS public.house_workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  services TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  location TEXT,
  is_verified BOOLEAN DEFAULT false,
  rating NUMERIC DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  availability JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- تفعيل RLS
ALTER TABLE public.house_workers ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "الجميع يمكنهم رؤية العاملات"
ON public.house_workers
FOR SELECT
USING (true);

CREATE POLICY "العاملات يمكنهن إدراج بياناتهن"
ON public.house_workers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "العاملات يمكنهن تحديث بياناتهن"
ON public.house_workers
FOR UPDATE
USING (auth.uid() = user_id);

-- إضافة trigger للتحديث التلقائي
CREATE TRIGGER update_house_workers_updated_at
BEFORE UPDATE ON public.house_workers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();