import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/context/TenantContext";
import { toast } from "@/hooks/use-toast";

export interface PortalConnection {
  id: string;
  tenant_id: string;
  portal_name: string;
  api_key: string;
  feed_url: string;
  feed_token: string;
  is_active: boolean;
  max_ads: number;
  accepted_requirements: boolean;
  label: string | null;
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

// Portales con feed XML nativo. Las webs Inmocro usan portal_name = "web:<slug>".
export type PortalName = "fotocasa" | "idealista";
export type WebsitePortalName = `web:${string}`;

export const WEB_PREFIX = "web:";
export const isWebsitePortal = (name: string): name is WebsitePortalName => name.startsWith(WEB_PREFIX);

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

// La web propia es menos estricta que los portales: basta con lo mínimo para una ficha presentable.
export function validatePropertyForWeb(property: any): PortalValidationError[] {
  const errors: PortalValidationError[] = [];
  const isRent = property.operationType === "alquiler" || property.operationType === "alquiler_opcion_compra";
  const effectivePrice = isRent ? (property.monthly_rent || property.price) : property.price;
  if (!property.title?.trim()) errors.push({ field: "title", message: "El título es obligatorio" });
  if (!effectivePrice || effectivePrice <= 0) {
    errors.push({ field: "price", message: isRent ? "Renta mensual es obligatoria" : "Precio es obligatorio" });
  }
  if (!property.address?.trim()) errors.push({ field: "address", message: "Ubicación es obligatoria" });
  if (!property.photos || property.photos.length === 0) errors.push({ field: "photos", message: "Añade al menos 1 foto" });
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

  const getConnection = (portal: PortalName | string) => connections.find(c => c.portal_name === portal);

  // Conexiones de tipo web (portal_name = "web:<slug>"). Cada una alimenta un WordPress Inmocro.
  const websites = connections.filter(c => isWebsitePortal(c.portal_name));

  const getFeedUrl = (portal: PortalName | string): string | null => {
    const conn = getConnection(portal);
    if (!tenantId || !conn?.feed_token) return null;
    const base = import.meta.env.VITE_SUPABASE_URL;
    return `${base}/functions/v1/portal-feed?tenant_id=${tenantId}&portal=${encodeURIComponent(portal)}&token=${conn.feed_token}`;
  };

  // Da de alta un WordPress Inmocro como destino. slug debe coincidir con sites/<slug>/site.json.
  const addWebsite = async (slug: string, label: string) => {
    if (!tenantId) return;
    const clean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
    if (!clean) { toast({ title: "Slug no válido", variant: "destructive" }); return; }
    const portal_name = `${WEB_PREFIX}${clean}`;
    if (connections.some(c => c.portal_name === portal_name)) {
      toast({ title: "Esa web ya está conectada", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("portal_connections")
      .insert({
        tenant_id: tenantId,
        portal_name,
        label: label.trim() || clean,
        feed_token: generateFeedToken(),
        is_active: true,
        max_ads: 100000,
        accepted_requirements: true,
      } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await fetchConnections();
    toast({ title: "Web conectada", description: `Copia la URL del feed y ponla en site.json de "${clean}".` });
  };

  const setWebsiteActive = async (portal: string, is_active: boolean) => {
    const existing = getConnection(portal);
    if (!existing) return;
    const { error } = await supabase
      .from("portal_connections")
      .update({ is_active, updated_at: new Date().toISOString() } as any)
      .eq("id", existing.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await fetchConnections();
  };

  const removeWebsite = async (portal: string) => {
    const existing = getConnection(portal);
    if (!existing) return;
    const { error } = await supabase.from("portal_connections").delete().eq("id", existing.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await fetchConnections();
    toast({ title: "Web desconectada" });
  };

  const regenerateFeedToken = async (portal: PortalName | string) => {
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

  return {
    connections, websites, loading,
    upsertConnection, getConnection, getFeedUrl, regenerateFeedToken,
    addWebsite, setWebsiteActive, removeWebsite,
    refetch: fetchConnections,
  };
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

  const togglePublication = async (propertyId: string, portalName: PortalName | string, publish: boolean, validationErrors: PortalValidationError[] = []) => {
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

  const bulkTogglePublication = async (propertyIds: string[], portalName: PortalName | string, publish: boolean) => {
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

  const getStatus = (propertyId: string, portalName: PortalName | string) =>
    statuses.find(s => s.property_id === propertyId && s.portal_name === portalName);

  const getPublishedCount = (portalName: PortalName | string) =>
    statuses.filter(s => s.portal_name === portalName && s.is_published).length;

  return { statuses, loading, togglePublication, bulkTogglePublication, getStatus, getPublishedCount, refetch: fetchStatuses };
}
