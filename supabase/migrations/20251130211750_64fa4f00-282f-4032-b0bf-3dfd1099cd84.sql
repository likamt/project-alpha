-- إنشاء جداول قاعدة البيانات الأساسية

-- جدول الملفات الشخصية
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('client', 'craftsman', 'company', 'admin')),
  subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الحرفيين
CREATE TABLE IF NOT EXISTS public.craftsmen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  profession TEXT NOT NULL,
  description TEXT,
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  completed_orders INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  location TEXT,
  services TEXT[],
  availability JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الطلبات
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  craftsman_id UUID REFERENCES public.craftsmen(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  location TEXT,
  scheduled_date TIMESTAMPTZ,
  total_amount DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول التقييمات
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  craftsman_id UUID REFERENCES public.craftsmen(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الرسائل
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل RLS للأمان
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.craftsmen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للملفات الشخصية
CREATE POLICY "يمكن للجميع رؤية الملفات الشخصية" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "يمكن للمستخدمين تحديث ملفهم الشخصي" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "يمكن للمستخدمين إدراج ملفهم الشخصي" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- سياسات الأمان للحرفيين
CREATE POLICY "يمكن للجميع رؤية الحرفيين" 
  ON public.craftsmen FOR SELECT 
  USING (true);

CREATE POLICY "يمكن للحرفيين تحديث بياناتهم" 
  ON public.craftsmen FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "يمكن للحرفيين إدراج بياناتهم" 
  ON public.craftsmen FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- سياسات الأمان للطلبات
CREATE POLICY "يمكن للعملاء والحرفيين رؤية طلباتهم" 
  ON public.orders FOR SELECT 
  USING (
    auth.uid() = client_id OR 
    auth.uid() IN (SELECT user_id FROM public.craftsmen WHERE id = craftsman_id)
  );

CREATE POLICY "يمكن للعملاء إنشاء طلبات" 
  ON public.orders FOR INSERT 
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "يمكن للعملاء والحرفيين تحديث طلباتهم" 
  ON public.orders FOR UPDATE 
  USING (
    auth.uid() = client_id OR 
    auth.uid() IN (SELECT user_id FROM public.craftsmen WHERE id = craftsman_id)
  );

-- سياسات الأمان للتقييمات
CREATE POLICY "يمكن للجميع رؤية التقييمات" 
  ON public.ratings FOR SELECT 
  USING (true);

CREATE POLICY "يمكن للعملاء إضافة تقييمات" 
  ON public.ratings FOR INSERT 
  WITH CHECK (auth.uid() = client_id);

-- سياسات الأمان للرسائل
CREATE POLICY "يمكن للمستخدمين رؤية رسائلهم" 
  ON public.messages FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "يمكن للمستخدمين إرسال رسائل" 
  ON public.messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "يمكن للمستخدمين تحديث رسائلهم المستلمة" 
  ON public.messages FOR UPDATE 
  USING (auth.uid() = recipient_id);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_craftsmen_user_id ON public.craftsmen(user_id);
CREATE INDEX IF NOT EXISTS idx_craftsmen_profession ON public.craftsmen(profession);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_craftsman_id ON public.orders(craftsman_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_ratings_craftsman_id ON public.ratings(craftsman_id);

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء المشغلات
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_craftsmen_updated_at BEFORE UPDATE ON public.craftsmen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- إدراج بيانات تجريبية للحرفيين (اختياري)
-- سيتم إدراجها بعد تسجيل المستخدمين