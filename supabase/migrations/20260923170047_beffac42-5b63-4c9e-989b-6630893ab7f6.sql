ALTER TABLE public.zone_sheets ADD COLUMN exit_time time without time zone;
COMMENT ON COLUMN public.zone_sheets.exit_time IS 'Hora de salida del agente del portal (sheet_time = hora de entrada)';