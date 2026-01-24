-- إضافة حقول الموقع الجغرافي وفئة الاشتراك للعاملات
ALTER TABLE public.house_workers
ADD COLUMN IF NOT EXISTS country_id uuid REFERENCES public.countries(id),
ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.cities(id),
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium')),
ADD COLUMN IF NOT EXISTS monthly_tasks_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS acceptance_rate numeric DEFAULT 100;

-- إضافة حقول الموقع الجغرافي وفئة الاشتراك للطباخات
ALTER TABLE public.home_cooks
ADD COLUMN IF NOT EXISTS country_id uuid REFERENCES public.countries(id),
ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.cities(id),
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium')),
ADD COLUMN IF NOT EXISTS monthly_tasks_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS acceptance_rate numeric DEFAULT 100;

-- تحديث جدول حجوزات العاملات - إزالة أعمدة الدفع وإضافة تأكيد الزبون
ALTER TABLE public.worker_bookings
ADD COLUMN IF NOT EXISTS client_confirmed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS client_rating integer CHECK (client_rating >= 1 AND client_rating <= 5),
ADD COLUMN IF NOT EXISTS client_comment text,
ADD COLUMN IF NOT EXISTS country_id uuid REFERENCES public.countries(id),
ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.cities(id),
DROP COLUMN IF EXISTS total_amount;

-- تحديث جدول طلبات الطعام - تبسيط للدفع النقدي وإضافة تأكيد الزبون
ALTER TABLE public.food_orders
ADD COLUMN IF NOT EXISTS country_id uuid REFERENCES public.countries(id),
ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.cities(id),
DROP COLUMN IF EXISTS stripe_payment_intent_id,
DROP COLUMN IF EXISTS escrow_released_at,
DROP COLUMN IF EXISTS cook_confirmed_at,
DROP COLUMN IF EXISTS receipt_generated_at,
DROP COLUMN IF EXISTS receipt_data;

-- تحديث حقول الدفع في طلبات الطعام
ALTER TABLE public.food_orders
ALTER COLUMN payment_status SET DEFAULT 'cash_pending';

-- إنشاء دالة لتحديث إحصائيات العاملة عند تأكيد المهمة
CREATE OR REPLACE FUNCTION public.update_worker_stats_on_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- تحديث فقط عند تأكيد الزبون
  IF NEW.client_confirmed_at IS NOT NULL AND OLD.client_confirmed_at IS NULL THEN
    UPDATE public.house_workers
    SET 
      completed_orders = completed_orders + 1,
      monthly_tasks_count = monthly_tasks_count + 1,
      last_activity_at = NOW()
    WHERE id = NEW.worker_id;
    
    -- إضافة التقييم إذا موجود
    IF NEW.client_rating IS NOT NULL THEN
      INSERT INTO public.house_worker_ratings (worker_id, client_id, booking_id, rating, comment, service_type)
      VALUES (NEW.worker_id, NEW.client_id, NEW.id, NEW.client_rating, NEW.client_comment, NEW.service_type);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء trigger لتحديث إحصائيات العاملة
DROP TRIGGER IF EXISTS update_worker_stats_trigger ON public.worker_bookings;
CREATE TRIGGER update_worker_stats_trigger
  AFTER UPDATE ON public.worker_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_worker_stats_on_confirmation();

-- إنشاء دالة لتحديث إحصائيات الطباخة عند تأكيد المهمة
CREATE OR REPLACE FUNCTION public.update_cook_stats_on_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- تحديث فقط عند تأكيد الزبون
  IF NEW.client_confirmed_at IS NOT NULL AND OLD.client_confirmed_at IS NULL THEN
    UPDATE public.home_cooks
    SET 
      completed_orders = completed_orders + 1,
      monthly_tasks_count = monthly_tasks_count + 1,
      last_activity_at = NOW()
    WHERE id = NEW.cook_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء trigger لتحديث إحصائيات الطباخة
DROP TRIGGER IF EXISTS update_cook_stats_trigger ON public.food_orders;
CREATE TRIGGER update_cook_stats_trigger
  AFTER UPDATE ON public.food_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cook_stats_on_confirmation();

-- إنشاء دالة لتحديث فئة الاشتراك تلقائياً بناءً على النشاط الشهري
CREATE OR REPLACE FUNCTION public.update_subscription_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- إذا تجاوزت المهام الشهرية 15 مهمة، ترقية إلى premium
  IF NEW.monthly_tasks_count >= 15 THEN
    NEW.subscription_tier := 'premium';
  ELSE
    NEW.subscription_tier := 'basic';
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء triggers لتحديث فئة الاشتراك
DROP TRIGGER IF EXISTS update_worker_subscription_tier_trigger ON public.house_workers;
CREATE TRIGGER update_worker_subscription_tier_trigger
  BEFORE UPDATE ON public.house_workers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_tier();

DROP TRIGGER IF EXISTS update_cook_subscription_tier_trigger ON public.home_cooks;
CREATE TRIGGER update_cook_subscription_tier_trigger
  BEFORE UPDATE ON public.home_cooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_tier();

-- دالة لإعادة تعيين عداد المهام الشهرية (يمكن تشغيلها كل شهر)
CREATE OR REPLACE FUNCTION public.reset_monthly_tasks_count()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.house_workers SET monthly_tasks_count = 0;
  UPDATE public.home_cooks SET monthly_tasks_count = 0;
END;
$$;

-- إنشاء index للبحث الجغرافي السريع
CREATE INDEX IF NOT EXISTS idx_house_workers_location ON public.house_workers(country_id, city_id);
CREATE INDEX IF NOT EXISTS idx_home_cooks_location ON public.home_cooks(country_id, city_id);
CREATE INDEX IF NOT EXISTS idx_house_workers_ranking ON public.house_workers(rating DESC, completed_orders DESC, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_home_cooks_ranking ON public.home_cooks(rating DESC, completed_orders DESC, last_activity_at DESC);