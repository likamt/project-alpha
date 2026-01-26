-- ===============================
-- إصلاحات أمنية شاملة للتطبيق
-- ===============================

-- 1. إزالة سياسة تسمح للمستخدمين بإضافة أدوار لأنفسهم (ثغرة أمنية خطيرة)
DROP POLICY IF EXISTS "users_can_insert_own_role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- 2. إنشاء سياسة آمنة - فقط الإدمن يمكنه إدارة الأدوار
CREATE POLICY "Only admins can manage roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 3. تحديث سياسة profiles لإخفاء الهاتف من المستخدمين غير المصرح لهم
DROP POLICY IF EXISTS "يمكن للجميع رؤية الملفات الشخصية" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can view profiles" ON public.profiles;

-- سياسة جديدة: المستخدم يرى ملفه + الإدمن يرى الكل
CREATE POLICY "Users can view own profile or admin can view all" ON public.profiles
FOR SELECT USING (
  auth.uid() = id 
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.home_cooks WHERE user_id = profiles.id
  )
  OR EXISTS (
    SELECT 1 FROM public.house_workers WHERE user_id = profiles.id
  )
);

-- 4. تحديث سياسة house_workers لإخفاء البيانات الحساسة
DROP POLICY IF EXISTS "الجميع يمكنهم رؤية العاملات" ON public.house_workers;
DROP POLICY IF EXISTS "Everyone can view workers" ON public.house_workers;

-- سياسة للقراءة العامة (بدون البيانات الحساسة - التحكم يكون في الكود)
CREATE POLICY "Public can view active workers" ON public.house_workers
FOR SELECT USING (is_verified = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 5. تحديث سياسة home_cooks لإخفاء البيانات الحساسة
DROP POLICY IF EXISTS "الجميع يمكنهم رؤية الطاهيات" ON public.home_cooks;
DROP POLICY IF EXISTS "Everyone can view cooks" ON public.home_cooks;

CREATE POLICY "Public can view home cooks" ON public.home_cooks
FOR SELECT USING (is_verified = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 6. تحديث سياسة craftsmen
DROP POLICY IF EXISTS "يمكن للجميع رؤية الحرفيين" ON public.craftsmen;
DROP POLICY IF EXISTS "Everyone can view craftsmen" ON public.craftsmen;

CREATE POLICY "Public can view craftsmen" ON public.craftsmen
FOR SELECT USING (is_verified = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 7. تحديث سياسة messages - المرسل والمستقبل فقط
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;

CREATE POLICY "Users can view their own messages" ON public.messages
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- 8. تأمين جدول food_orders - الزبون والطاهية فقط
DROP POLICY IF EXISTS "Users can view their food orders" ON public.food_orders;

CREATE POLICY "Users can view their food orders" ON public.food_orders
FOR SELECT USING (
  auth.uid() = client_id 
  OR EXISTS (SELECT 1 FROM public.home_cooks WHERE id = food_orders.cook_id AND user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- 9. تأمين جدول worker_bookings
DROP POLICY IF EXISTS "Users can view their bookings" ON public.worker_bookings;

CREATE POLICY "Users can view their bookings" ON public.worker_bookings
FOR SELECT USING (
  auth.uid() = client_id 
  OR EXISTS (SELECT 1 FROM public.house_workers WHERE id = worker_bookings.worker_id AND user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- 10. تأمين notifications - المستخدم يرى إشعاراته فقط
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

-- 11. سياسة تحديث الإشعارات
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;

CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

-- 12. تأمين push_tokens
DROP POLICY IF EXISTS "Users can manage own push tokens" ON public.push_tokens;

CREATE POLICY "Users can manage own tokens" ON public.push_tokens
FOR ALL USING (auth.uid() = user_id);