-- ===========================================
-- إصلاح الثغرات الأمنية - حماية البيانات الحساسة
-- ===========================================

-- 1. إنشاء عرض (View) آمن للبروفايلات العامة بدون الهاتف
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  created_at
FROM public.profiles;

-- السماح للجميع بقراءة البروفايلات العامة
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2. إنشاء عرض آمن للطاهيات بدون معلومات الدفع
CREATE OR REPLACE VIEW public.public_home_cooks AS
SELECT 
  id,
  user_id,
  description,
  hourly_rate,
  min_order_amount,
  delivery_available,
  specialties,
  portfolio_images,
  rating,
  completed_orders,
  is_verified,
  country_id,
  city_id,
  location,
  availability,
  created_at
FROM public.home_cooks
WHERE is_verified = true;

GRANT SELECT ON public.public_home_cooks TO anon, authenticated;

-- 3. إنشاء عرض آمن للعاملات بدون معلومات الدفع
CREATE OR REPLACE VIEW public.public_house_workers AS
SELECT 
  id,
  user_id,
  description,
  hourly_rate,
  services,
  service_category,
  work_type,
  experience_years,
  nationality,
  languages,
  available_days,
  portfolio_images,
  rating,
  completed_orders,
  is_verified,
  country_id,
  city_id,
  location,
  availability,
  created_at
FROM public.house_workers
WHERE is_verified = true;

GRANT SELECT ON public.public_house_workers TO anon, authenticated;

-- 4. إنشاء عرض آمن للحرفيين
CREATE OR REPLACE VIEW public.public_craftsmen AS
SELECT 
  id,
  user_id,
  profession,
  description,
  hourly_rate,
  services,
  portfolio_images,
  rating,
  completed_orders,
  is_verified,
  location,
  availability,
  created_at
FROM public.craftsmen
WHERE is_verified = true;

GRANT SELECT ON public.public_craftsmen TO anon, authenticated;

-- 5. السماح للمستخدمين بحذف رسائلهم المرسلة
CREATE POLICY "المستخدمون يمكنهم حذف رسائلهم" 
ON public.messages 
FOR DELETE 
USING (auth.uid() = sender_id);

-- 6. إضافة سياسة لحذف الإشعارات (موجودة بالفعل لكن للتأكيد)
-- لا حاجة لإضافتها لأنها موجودة

-- 7. تحديث سياسة الإشعارات للسماح بالإدراج الصحيح
DROP POLICY IF EXISTS "النظام يمكنه إنشاء إشعارات" ON public.notifications;
CREATE POLICY "النظام يمكنه إنشاء إشعارات" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- 8. إنشاء دالة آمنة للتحقق من الدور بدون كشف البيانات
CREATE OR REPLACE FUNCTION public.user_has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.home_cooks 
    WHERE user_id = _user_id AND subscription_status = 'active'
    UNION
    SELECT 1 FROM public.house_workers 
    WHERE user_id = _user_id AND subscription_status = 'active'
  );
$$;