
-- Subscribers table
CREATE TABLE public.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.subscribers
  FOR INSERT WITH CHECK (
    length(trim(email)) > 0 AND email LIKE '%_@_%._%'
  );

CREATE POLICY "Admins view subscribers" ON public.subscribers
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update subscribers" ON public.subscribers
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete subscribers" ON public.subscribers
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Promotional messages table
CREATE TABLE public.promotional_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.promotional_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage promotional messages" ON public.promotional_messages
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_promotional_messages_updated_at
BEFORE UPDATE ON public.promotional_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
