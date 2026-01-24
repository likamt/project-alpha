-- إضافة عمود صور متعددة للأطباق
ALTER TABLE public.food_dishes 
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}'::text[];

-- نقل الصور الحالية من image_url إلى images
UPDATE public.food_dishes 
SET images = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND image_url != '' AND (images IS NULL OR array_length(images, 1) IS NULL);