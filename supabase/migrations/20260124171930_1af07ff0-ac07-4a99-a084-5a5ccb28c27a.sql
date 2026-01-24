-- إضافة حقل الاشتراك للعاملات والطاهيات
ALTER TABLE public.home_cooks 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

ALTER TABLE public.house_workers 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- إنشاء فهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_home_cooks_subscription_status ON public.home_cooks(subscription_status);
CREATE INDEX IF NOT EXISTS idx_house_workers_subscription_status ON public.house_workers(subscription_status);
CREATE INDEX IF NOT EXISTS idx_worker_bookings_worker_id ON public.worker_bookings(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_bookings_client_id ON public.worker_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_worker_bookings_status ON public.worker_bookings(status);