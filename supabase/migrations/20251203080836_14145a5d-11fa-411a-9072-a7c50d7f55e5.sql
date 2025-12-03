-- Add home_cook to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'home_cook';

-- Create home_cooks table
CREATE TABLE public.home_cooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialties TEXT[] DEFAULT '{}',
    description TEXT,
    hourly_rate NUMERIC DEFAULT 0,
    location TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    rating NUMERIC DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    availability JSONB DEFAULT '{}',
    delivery_available BOOLEAN DEFAULT TRUE,
    min_order_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT home_cooks_user_id_key UNIQUE (user_id)
);

-- Create food_dishes table
CREATE TABLE public.food_dishes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cook_id UUID NOT NULL REFERENCES public.home_cooks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    preparation_time_minutes INTEGER DEFAULT 60,
    servings INTEGER DEFAULT 1,
    ingredients TEXT[] DEFAULT '{}',
    dietary_tags TEXT[] DEFAULT '{}',
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    rating NUMERIC DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.home_cooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_dishes ENABLE ROW LEVEL SECURITY;

-- RLS policies for home_cooks
CREATE POLICY "الجميع يمكنهم رؤية الطاهيات" ON public.home_cooks FOR SELECT USING (true);
CREATE POLICY "الطاهيات يمكنهن إدراج بياناتهن" ON public.home_cooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "الطاهيات يمكنهن تحديث بياناتهن" ON public.home_cooks FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for food_dishes
CREATE POLICY "الجميع يمكنهم رؤية الأطباق" ON public.food_dishes FOR SELECT USING (true);
CREATE POLICY "الطاهيات يمكنهن إضافة أطباق" ON public.food_dishes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.home_cooks WHERE id = cook_id AND user_id = auth.uid())
);
CREATE POLICY "الطاهيات يمكنهن تحديث أطباقهن" ON public.food_dishes FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.home_cooks WHERE id = cook_id AND user_id = auth.uid())
);
CREATE POLICY "الطاهيات يمكنهن حذف أطباقهن" ON public.food_dishes FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.home_cooks WHERE id = cook_id AND user_id = auth.uid())
);

-- Triggers for updated_at
CREATE TRIGGER update_home_cooks_updated_at BEFORE UPDATE ON public.home_cooks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_food_dishes_updated_at BEFORE UPDATE ON public.food_dishes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();