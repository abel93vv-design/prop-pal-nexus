import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";
import { toast } from "@/hooks/use-toast";

export interface PortalConnection {
  id: string;
  tenant_id: string;
  portal_name: string;
  display_name: string | null;
  slug: string | null;
  api_key: string;
  feed_url: string;
  feed_token: string;
  is_active: boolean;
  max_ads: number;
  accepted_requirements: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyPortalStatus {
  id: string;
  tenant_id: string;
  property_id: string;
  portal_name: string;
  is_published: boolean;
  published_at: string | null;
  validation_errors: string[];
  created_at: string;
  updated_at: string;
}

/** Portal identifier: "fotocasa" | "idealista" | "web:<slug>" */
export type PortalName = string;

export const isWebPortal = (portal: PortalName) => portal.startsWith("web:");

export interface PortalValidationError {
  field: string;
  message: string;
}


export function validatePropertyForPortal(property: any): PortalValidationError[] {
  const errors: PortalValidationError[] = [];

  const isRent = property.operationType === "alquiler" || property.operationType === "alquiler_opcion_compra";
  const effectivePrice = isRent ? (property.monthly_rent || property.price) : property.price;
  if (!effectivePrice || effectivePrice <= 0) {
    errors.push({ field: "price", message: isRent ? "Renta mensual es obligatoria" : "Precio es obligatorio" });
  }
  if (!property.address?.trim()) errors.push({ field: "address", message: "Ubicación exacta es obligatoria" });
  if (!property.postal_code?.trim()) errors.push({ field: "postal_code", message: "Código postal es obligatorio" });
  if (!property.surface || property.surface <= 0) errors.push({ field: "surface", message: "Superficie útil es obligatoria" });
  if (!property.photos || property.photos.length === 0) errors.push({ field: "photos", message: "Mínimo 1 foto de alta calidad" });

  if (property.type === "casa" && (!property.plot_surface || property.plot_surface <= 0)) {
    errors.push({ field: "plot_surface", message: "Superficie de parcela obligatoria para chalets" });
  }
  if (property.type === "piso") {
    if (!property.bedrooms || property.bedrooms <= 0) errors.push({ field: "bedrooms", message: "Nº de dormitorios obligatorio para pisos" });
    if (!property.bathrooms || property.bathrooms <= 0) errors.push({ field: "bathrooms", message: "Nº de baños obligatorio para pisos" });
  }

  return errors;
}

function generateFeedToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function usePortalConnections() {
  const { tenantId } = useTenant();
  const [connections, setConnections] = useState<PortalConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("portal_connections")
      .select("*")
      .eq("tenant_id", tenantId);
    if (!error && data) setConnections(data as unknown as PortalConnection[]);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const upsertConnection = async (portal_name: PortalName, updates: Partial<PortalConnection>) => {
    if (!tenantId) return;
    const existing = connections.find(c => c.portal_name === portal_name);
    if (existing) {
      const { error } = await supabase
        .from("portal_connections")
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", existing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase
        .from("portal_connections")
        .insert({ tenant_id: tenantId, portal_name, ...updates } as any);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    await fetchConnections();
    toast({ title: "Conexión guardada" });
  };

  const getConnection = (portal: PortalName) => connections.find(c => c.portal_name === portal);

  const getFeedUrl = (portal: PortalName): string | null => {
    const conn = getConnection(portal);
    if (!tenantId || !conn?.feed_token) return null;
    const base = import.meta.env.VITE_SUPABASE_URL;
    return `${base}/functions/v1/portal-feed?tenant_id=${tenantId}&portal=${portal}&token=${conn.feed_token}`;
  };

  const regenerateFeedToken = async (portal: PortalName) => {
    const existing = getConnection(portal);
    if (!existing) return;
    const { error } = await supabase
      .from("portal_connections")
      .update({ feed_token: generateFeedToken(), updated_at: new Date().toISOString() } as any)
      .eq("id", existing.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await fetchConnections();
    toast({
      title: "URL del feed regenerada",
      description: "La URL anterior ha dejado de funcionar. Actualiza la nueva URL en el portal.",
    });
  };

  return { connections, loading, upsertConnection, getConnection, getFeedUrl, regenerateFeedToken, refetch: fetchConnections };
}

export function usePropertyPortalStatus() {
  const { tenantId } = useTenant();
  const [statuses, setStatuses] = useState<PropertyPortalStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatuses = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("property_portal_status")
      .select("*")
      .eq("tenant_id", tenantId);
    if (!error && data) setStatuses(data as unknown as PropertyPortalStatus[]);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchStatuses(); }, [fetchStatuses]);

  const togglePublication = async (propertyId: string, portalName: PortalName, publish: boolean, validationErrors: PortalValidationError[] = []) => {
    if (!tenantId) return;

    const existing = statuses.find(s => s.property_id === propertyId && s.portal_name === portalName);
    if (existing) {
      const { error } = await supabase
        .from("property_portal_status")
        .update({
          is_published: publish,
          published_at: publish ? new Date().toISOString() : null,
          validation_errors: validationErrors as any,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", existing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase
        .from("property_portal_status")
        .insert({
          tenant_id: tenantId,
          property_id: propertyId,
          portal_name: portalName,
          is_published: publish,
          published_at: publish ? new Date().toISOString() : null,
          validation_errors: validationErrors as any,
        } as any);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    await fetchStatuses();
  };

  const bulkTogglePublication = async (propertyIds: string[], portalName: PortalName, publish: boolean) => {
    if (!tenantId || propertyIds.length === 0) return;
    const now = new Date().toISOString();

    const existing = statuses.filter(s => s.portal_name === portalName && propertyIds.includes(s.property_id));
    const existingIds = new Set(existing.map(e => e.property_id));

    if (existing.length > 0) {
      const { error } = await supabase
        .from("property_portal_status")
        .update({
          is_published: publish,
          published_at: publish ? now : null,
          updated_at: now,
        } as any)
        .in("id", existing.map(e => e.id));
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }

    const toInsert = propertyIds
      .filter(id => !existingIds.has(id))
      .map(id => ({
        tenant_id: tenantId,
        property_id: id,
        portal_name: portalName,
        is_published: publish,
        published_at: publish ? now : null,
      }));
    if (toInsert.length > 0) {
      const { error } = await supabase
        .from("property_portal_status")
        .insert(toInsert as any);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }

    await fetchStatuses();
  };

  const getStatus = (propertyId: string, portalName: PortalName) =>
    statuses.find(s => s.property_id === propertyId && s.portal_name === portalName);

  const getPublishedCount = (portalName: PortalName) =>
    statuses.filter(s => s.portal_name === portalName && s.is_published).length;

  return { statuses, loading, togglePublication, bulkTogglePublication, getStatus, getPublishedCount, refetch: fetchStatuses };
}
