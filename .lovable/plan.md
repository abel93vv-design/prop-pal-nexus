

## Analysis: Current State vs. Requested Architecture

Your project **already implements** most of what this prompt asks for, but using Lovable Cloud (Supabase + Edge Functions) instead of NestJS/Prisma. Here's the honest mapping:

| Requested | Status | Notes |
|-----------|--------|-------|
| Multi-tenant with `tenant_id` | **Done** | RLS policies on all tables |
| `tenants` table | **Done** | Missing `updated_at`, `deleted_at` |
| Users/roles | **Done** | `profiles` + `user_roles` + `has_role()` |
| Properties CRUD | **Done** | Full table with RLS |
| Subdomain resolution | **Done** | `TenantContext.tsx` |
| Superadmin panel | **Done** | `Tenants.tsx` + edge functions |
| Tenant provisioning | **Done** | `provision-tenant` edge function |
| Password management | **Done** | `manage-tenant-admin` edge function |
| JWT auth | **Done** | Supabase Auth handles this |
| Soft delete | **Missing** | No `deleted_at` on any table |
| Activity logs | **Missing** | No `activity_logs` table |
| Rate limiting | **N/A** | Supabase provides this natively |
| API keys per tenant | **Missing** | Future feature |
| Webhooks per tenant | **Missing** | Future feature |
| Backups | **N/A** | Lovable Cloud handles automated backups |

### Important constraint

Lovable **cannot run Node.js, NestJS, Express, or Prisma**. The backend is Lovable Cloud (powered by PostgreSQL + Edge Functions). This is not a limitation — it's actually simpler and more scalable for your use case. You already have RLS-based tenant isolation, which is more secure than middleware-based filtering.

## Plan: Fill the gaps

### 1. Add soft delete infrastructure
- Add `deleted_at` (nullable timestamp) to: `tenants`, `clients`, `properties`, `tasks`, `team_members`, `agencies`, `documents`
- Add `updated_at` to `tenants`
- Update all RLS SELECT policies to add `AND deleted_at IS NULL`
- Replace frontend delete operations with `UPDATE ... SET deleted_at = now()`
- Add superadmin restore capability in Tenants panel

### 2. Create activity logs system
- New `activity_logs` table: `id`, `tenant_id`, `user_id`, `action` (text), `entity_type` (text), `entity_id` (uuid), `metadata` (jsonb), `created_at`
- RLS: tenant users can read/insert their own logs
- Create a `log_activity()` database function for easy logging
- Add logging calls to key operations (create/update/delete clients, properties, etc.)
- Add activity log viewer in the superadmin panel

### 3. Add superadmin impersonation view
- Allow superadmin to select a tenant and view their dashboard stats (count of clients, properties, tasks, team members)
- Add tenant detail panel showing aggregated data
- Keep using `manage-tenant-admin` edge function (service role) for cross-tenant reads

### 4. Prepare API keys per tenant (foundation)
- New `tenant_api_keys` table: `id`, `tenant_id`, `key_hash`, `name`, `is_active`, `created_at`, `last_used_at`
- Edge function to validate API keys for future external integrations
- UI in Settings for tenant admins to generate/revoke keys

### Technical details

**Soft delete migration (example):**
```sql
ALTER TABLE clients ADD COLUMN deleted_at timestamptz DEFAULT NULL;
ALTER TABLE properties ADD COLUMN deleted_at timestamptz DEFAULT NULL;
-- Update RLS to exclude soft-deleted rows
-- Replace DELETE operations with UPDATE SET deleted_at = now()
```

**Activity logs table:**
```sql
CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,        -- 'create', 'update', 'delete', 'restore'
  entity_type text NOT NULL,   -- 'client', 'property', 'task', etc.
  entity_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

**Estimated scope:** 4 steps, mainly database migrations + UI additions. No architecture rewrite needed — the foundation is solid.

