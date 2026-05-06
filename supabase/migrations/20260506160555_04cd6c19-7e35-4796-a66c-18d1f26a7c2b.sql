ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_stages;
ALTER TABLE public.pipeline_stages REPLICA IDENTITY FULL;