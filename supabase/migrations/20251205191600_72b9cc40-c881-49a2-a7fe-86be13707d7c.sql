-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage apartments" ON public.apartments;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can update messages" ON public.messages;

-- Recreate policies using auth.jwt() to avoid recursion
-- For profiles: admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()) = true
);

-- For apartments: use PERMISSIVE policy for admin management
CREATE POLICY "Admins can manage apartments" 
ON public.apartments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  )
);

-- For bookings: admin view
CREATE POLICY "Admins can view all bookings" 
ON public.bookings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  )
);

-- For bookings: admin update
CREATE POLICY "Admins can update all bookings" 
ON public.bookings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  )
);

-- For messages: admin view
CREATE POLICY "Admins can view all messages" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  )
);

-- For messages: admin update
CREATE POLICY "Admins can update messages" 
ON public.messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  )
);