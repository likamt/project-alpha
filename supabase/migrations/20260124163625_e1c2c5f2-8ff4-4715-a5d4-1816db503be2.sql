-- إضافة حقول جديدة للعاملات المنزليات
ALTER TABLE public.house_workers 
ADD COLUMN IF NOT EXISTS work_type TEXT DEFAULT 'flexible',
ADD COLUMN IF NOT EXISTS service_category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS age_range TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS available_days TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS work_hours_start TIME,
ADD COLUMN IF NOT EXISTS work_hours_end TIME;

-- دالة تحديث تقييم الطاهية
CREATE OR REPLACE FUNCTION update_cook_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.home_cooks
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM public.food_ratings
    WHERE cook_id = NEW.cook_id
  )
  WHERE id = NEW.cook_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- دالة تحديث تقييم العاملة
CREATE OR REPLACE FUNCTION update_worker_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.house_workers
  SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM public.house_worker_ratings
    WHERE worker_id = NEW.worker_id
  )
  WHERE id = NEW.worker_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- إنشاء المحفزات
DROP TRIGGER IF EXISTS trigger_update_cook_rating ON public.food_ratings;
CREATE TRIGGER trigger_update_cook_rating
AFTER INSERT ON public.food_ratings
FOR EACH ROW
EXECUTE FUNCTION update_cook_rating();

DROP TRIGGER IF EXISTS trigger_update_worker_rating ON public.house_worker_ratings;
CREATE TRIGGER trigger_update_worker_rating
AFTER INSERT ON public.house_worker_ratings
FOR EACH ROW
EXECUTE FUNCTION update_worker_rating();