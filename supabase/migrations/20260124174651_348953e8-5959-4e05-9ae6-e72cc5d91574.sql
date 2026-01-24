-- تحديث جدول الرسائل لدعم أنواع مختلفة
ALTER TABLE public.messages 
ADD COLUMN message_type text DEFAULT 'text',
ADD COLUMN media_url text,
ADD COLUMN media_duration integer,
ADD COLUMN media_size integer;

-- جدول لتتبع حالة الكتابة
CREATE TABLE public.typing_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_partner_id uuid NOT NULL,
  is_typing boolean DEFAULT false,
  last_typed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, conversation_partner_id)
);

-- تحديث جدول الإشعارات لإضافة المزيد من الأنواع
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS action_url text;

-- Enable RLS
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- سياسات typing_indicators
CREATE POLICY "المستخدمون يمكنهم قراءة حالة الكتابة الموجهة لهم"
ON public.typing_indicators FOR SELECT
USING (conversation_partner_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "المستخدمون يمكنهم إدارة حالة كتابتهم"
ON public.typing_indicators FOR ALL
USING (user_id = auth.uid());

-- Enable realtime for typing indicators
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;

-- Index for faster lookups
CREATE INDEX idx_typing_indicators_partner ON public.typing_indicators(conversation_partner_id);
CREATE INDEX idx_messages_type ON public.messages(message_type);

-- إنشاء bucket للرسائل
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- سياسات التخزين للرسائل
CREATE POLICY "المستخدمون يمكنهم رفع ملفات الدردشة"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "الملفات المرفوعة للدردشة عامة"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');