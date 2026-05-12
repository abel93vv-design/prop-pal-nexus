import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole =
  | "super_admin"
  | "admin"
  | "socio"
  | "coordinadora"
  | "asesor"
  | "agent"
  | "viewer";

export type ModuleAction = "view" | "edit" | "delete";

export interface RolePermission {
  role: AppRole;
  module: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const ROLE_PRIORITY: AppRole[] = ["super_admin", "admin", "socio", "coordinadora", "asesor", "agent", "viewer"];

function pickPrimaryRole(roles: AppRole[]): AppRole | null {
  for (const r of ROLE_PRIORITY) if (roles.includes(r)) return r;
  return null;
}

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setTenantId(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const [{ data: profile }, { data: rolesData }] = await Promise.all([
        supabase.from("profiles").select("tenant_id").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role, tenant_id").eq("user_id", user.id),
      ]);

      if (cancelled) return;

      const tId = profile?.tenant_id || null;
      setTenantId(tId);

      const allRoles = (rolesData || []).map((r: any) => r.role as AppRole);
      const primary = pickPrimaryRole(allRoles);
      setRole(primary);

      if (tId) {
        const { data: perms } = await supabase
          .from("role_permissions")
          .select("role, module, can_view, can_edit, can_delete")
          .eq("tenant_id", tId);
        if (!cancelled) setPermissions((perms || []) as RolePermission[]);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const isSuperAdmin = role === "super_admin";
  const isAdmin = isSuperAdmin || role === "admin";

  const can = useCallback(
    (module: string, action: ModuleAction = "view"): boolean => {
      if (isSuperAdmin || role === "admin") return true;
      // Legacy users without a role: allow (matches DB fallback)
      if (!role) return true;
      const p = permissions.find((x) => x.role === role && x.module === module);
      if (!p) return false;
      if (action === "view") return p.can_view;
      if (action === "edit") return p.can_edit;
      return p.can_delete;
    },
    [role, permissions, isSuperAdmin]
  );

  return { role, tenantId, isAdmin, isSuperAdmin, permissions, can, loading };
};
