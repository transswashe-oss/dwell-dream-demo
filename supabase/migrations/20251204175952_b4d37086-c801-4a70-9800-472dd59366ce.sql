-- Add email column to profiles table for easier access
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Create policy to allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (EXISTS ( SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.is_admin = true));