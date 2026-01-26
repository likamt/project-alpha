-- إصلاح Views لتكون آمنة باستخدام security_invoker
-- ===========================================

-- 1. إعادة إنشاء public_profiles مع security_invoker
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker=on) AS
SELECT 
  id,
  full_name,
  avatar_url,
  created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2. إعادة إنشاء public_home_cooks مع security_invoker
DROP VIEW IF EXISTS public.public_home_cooks;
CREATE VIEW public.public_home_cooks
WITH (security_invoker=on) AS
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

-- 3. إعادة إنشاء public_house_workers مع security_invoker
DROP VIEW IF EXISTS public.public_house_workers;
CREATE VIEW public.public_house_workers
WITH (security_invoker=on) AS
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

-- 4. إعادة إنشاء public_craftsmen مع security_invoker
DROP VIEW IF EXISTS public.public_craftsmen;
CREATE VIEW public.public_craftsmen
WITH (security_invoker=on) AS
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