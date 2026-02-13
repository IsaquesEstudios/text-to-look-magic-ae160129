-- Track last read timestamp per user per property for unread notifications
CREATE TABLE public.property_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  last_read_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE public.property_message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reads"
ON public.property_message_reads FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can upsert own reads"
ON public.property_message_reads FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reads"
ON public.property_message_reads FOR UPDATE
USING (user_id = auth.uid());