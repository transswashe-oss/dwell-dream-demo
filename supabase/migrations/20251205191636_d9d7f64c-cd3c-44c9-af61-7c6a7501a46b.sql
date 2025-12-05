-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()),
    false
  )
$$;

-- Drop and recreate the profiles policy to use the function
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin());

-- Update other policies to use the function
DROP POLICY IF EXISTS "Admins can manage apartments" ON public.apartments;
CREATE POLICY "Admins can manage apartments" 
ON public.apartments 
FOR ALL 
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
CREATE POLICY "Admins can view all bookings" 
ON public.bookings 
FOR SELECT 
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
CREATE POLICY "Admins can update all bookings" 
ON public.bookings 
FOR UPDATE 
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages" 
ON public.messages 
FOR SELECT 
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update messages" ON public.messages;
CREATE POLICY "Admins can update messages" 
ON public.messages 
FOR UPDATE 
USING (public.is_admin());