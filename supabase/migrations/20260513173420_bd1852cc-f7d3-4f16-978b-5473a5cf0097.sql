ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS client_id uuid;
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);