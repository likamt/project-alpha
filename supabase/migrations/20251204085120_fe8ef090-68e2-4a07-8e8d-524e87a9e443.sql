-- إضافة سياسة تسمح للمستخدمين بإدراج دورهم الخاص
CREATE POLICY "users_can_insert_own_role" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);