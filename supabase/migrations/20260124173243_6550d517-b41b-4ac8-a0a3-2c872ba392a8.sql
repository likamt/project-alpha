-- إضافة عمود booking_id لربط التقييمات بالحجوزات
ALTER TABLE public.house_worker_ratings
ADD COLUMN booking_id uuid REFERENCES public.worker_bookings(id);

-- إنشاء index لتحسين الأداء
CREATE INDEX idx_house_worker_ratings_booking_id ON public.house_worker_ratings(booking_id);

-- إضافة constraint لمنع تقييم نفس الحجز مرتين
CREATE UNIQUE INDEX unique_booking_rating ON public.house_worker_ratings(booking_id) WHERE booking_id IS NOT NULL;