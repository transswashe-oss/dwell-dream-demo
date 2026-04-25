
-- Tighten the messages insert policy with basic validation instead of true
DROP POLICY IF EXISTS "Anyone can submit messages" ON public.messages;
CREATE POLICY "Anyone can submit valid messages" ON public.messages
  FOR INSERT
  WITH CHECK (
    length(trim(name)) > 0
    AND length(trim(email)) > 0
    AND email LIKE '%_@_%._%'
    AND length(trim(message)) > 0
    AND length(message) < 5000
  );
