-- Enable RLS on realtime.messages (channel-level authorization)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to subscribe ONLY to their own tenant's pipeline channel
DROP POLICY IF EXISTS "Tenant members can read own pipeline channel" ON realtime.messages;
CREATE POLICY "Tenant members can read own pipeline channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.get_user_tenant_id() IS NOT NULL
  AND realtime.topic() = 'pipeline-' || public.get_user_tenant_id()::text
);

DROP POLICY IF EXISTS "Tenant members can write own pipeline channel" ON realtime.messages;
CREATE POLICY "Tenant members can write own pipeline channel"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_user_tenant_id() IS NOT NULL
  AND realtime.topic() = 'pipeline-' || public.get_user_tenant_id()::text
);