-- إصلاح سياسة الإشعارات لتكون أكثر أماناً
-- بدلاً من WITH CHECK (true)، نسمح فقط للنظام عبر service_role

-- حذف السياسة القديمة
DROP POLICY IF EXISTS "النظام يمكنه إنشاء إشعارات" ON public.notifications;

-- إنشاء سياسة جديدة تسمح للمستخدم المستهدف أو للنظام بإنشاء إشعارات
-- هذا أفضل من true لأنه يتحقق من أن user_id موجود
CREATE POLICY "إنشاء إشعارات للمستخدم" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  -- يمكن للنظام (service_role) أو للمستخدم نفسه إنشاء إشعار له
  auth.uid() = user_id OR auth.role() = 'service_role'
);