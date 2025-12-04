-- جدول طلبات الطعام مع نظام الدفع المؤقت
CREATE TABLE public.food_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES auth.users(id),
  cook_id uuid NOT NULL REFERENCES public.home_cooks(id),
  dish_id uuid NOT NULL REFERENCES public.food_dishes(id),
  
  -- تفاصيل الطلب
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_amount numeric NOT NULL,
  platform_fee numeric NOT NULL DEFAULT 0,
  cook_amount numeric NOT NULL DEFAULT 0,
  
  -- معلومات التوصيل
  delivery_address text,
  delivery_notes text,
  scheduled_delivery_at timestamp with time zone,
  
  -- حالة الطلب
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'preparing', 'ready', 'delivered', 'completed', 'cancelled', 'disputed')),
  
  -- Stripe والدفع المؤقت
  stripe_payment_intent_id text,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'held', 'released', 'refunded', 'disputed')),
  escrow_released_at timestamp with time zone,
  
  -- تأكيد الإنهاء
  client_confirmed_at timestamp with time zone,
  cook_confirmed_at timestamp with time zone,
  
  -- الإيصال
  receipt_generated_at timestamp with time zone,
  receipt_data jsonb,
  
  -- التواريخ
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.food_orders ENABLE ROW LEVEL SECURITY;

-- سياسات RLS
CREATE POLICY "العملاء يمكنهم رؤية طلباتهم"
ON public.food_orders FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "الطاهيات يمكنهن رؤية طلباتهن"
ON public.food_orders FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.home_cooks
  WHERE home_cooks.id = food_orders.cook_id
  AND home_cooks.user_id = auth.uid()
));

CREATE POLICY "العملاء يمكنهم إنشاء طلبات"
ON public.food_orders FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "العملاء والطاهيات يمكنهم تحديث الطلبات"
ON public.food_orders FOR UPDATE
USING (
  auth.uid() = client_id 
  OR EXISTS (
    SELECT 1 FROM public.home_cooks
    WHERE home_cooks.id = food_orders.cook_id
    AND home_cooks.user_id = auth.uid()
  )
);

-- Trigger للتحديث التلقائي
CREATE TRIGGER update_food_orders_updated_at
BEFORE UPDATE ON public.food_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- فهرس للأداء
CREATE INDEX idx_food_orders_client ON public.food_orders(client_id);
CREATE INDEX idx_food_orders_cook ON public.food_orders(cook_id);
CREATE INDEX idx_food_orders_status ON public.food_orders(status);