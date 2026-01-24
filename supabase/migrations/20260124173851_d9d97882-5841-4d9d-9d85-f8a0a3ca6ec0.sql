-- جدول الترجمات
CREATE TABLE public.translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code text NOT NULL,
  translation_key text NOT NULL,
  translation_value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(language_code, translation_key)
);

-- جدول الدول
CREATE TABLE public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  name_fr text,
  code text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- جدول المدن
CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid REFERENCES public.countries(id) ON DELETE CASCADE NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  name_fr text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- إضافة عمود is_suspended للمستخدمين
ALTER TABLE public.profiles ADD COLUMN is_suspended boolean DEFAULT false;

-- Enable RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- سياسات الترجمات
CREATE POLICY "الجميع يمكنهم قراءة الترجمات"
ON public.translations FOR SELECT
USING (true);

CREATE POLICY "المسؤولون يمكنهم إدارة الترجمات"
ON public.translations FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- سياسات الدول
CREATE POLICY "الجميع يمكنهم قراءة الدول"
ON public.countries FOR SELECT
USING (true);

CREATE POLICY "المسؤولون يمكنهم إدارة الدول"
ON public.countries FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- سياسات المدن
CREATE POLICY "الجميع يمكنهم قراءة المدن"
ON public.cities FOR SELECT
USING (true);

CREATE POLICY "المسؤولون يمكنهم إدارة المدن"
ON public.cities FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_translations_key ON public.translations(translation_key);
CREATE INDEX idx_translations_lang ON public.translations(language_code);
CREATE INDEX idx_cities_country ON public.cities(country_id);

-- بيانات المغرب الأولية
INSERT INTO public.countries (code, name_ar, name_en, name_fr) VALUES
('MA', 'المغرب', 'Morocco', 'Maroc');

INSERT INTO public.cities (country_id, name_ar, name_en, name_fr)
SELECT id, 'الدار البيضاء', 'Casablanca', 'Casablanca' FROM public.countries WHERE code = 'MA'
UNION ALL
SELECT id, 'الرباط', 'Rabat', 'Rabat' FROM public.countries WHERE code = 'MA'
UNION ALL
SELECT id, 'مراكش', 'Marrakech', 'Marrakech' FROM public.countries WHERE code = 'MA'
UNION ALL
SELECT id, 'فاس', 'Fez', 'Fès' FROM public.countries WHERE code = 'MA'
UNION ALL
SELECT id, 'طنجة', 'Tangier', 'Tanger' FROM public.countries WHERE code = 'MA'
UNION ALL
SELECT id, 'أكادير', 'Agadir', 'Agadir' FROM public.countries WHERE code = 'MA';