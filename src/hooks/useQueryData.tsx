import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/context/TenantContext";
import { Agency, Client, Property, User, Task, Document } from "@/types/crm";
import { useToast } from "@/hooks/use-toast";

// ---- Mappers ----
const toAgency = (r: any): Agency => ({ id: r.id, name: r.name, address: r.address || '', phone: r.phone || '', email: r.email || '', logo: r.logo || '', color: r.color || '#3B82F6' });
const toClient = (r: any): Client => ({ id: r.id, name: r.name, email: r.email || '', phone: r.phone || '', address: r.address || '', type: r.type, leadStatus: r.lead_status, propertyIds: r.property_ids || [], registeredAt: r.registered_at, notes: r.notes || '', agencyId: r.agency_id || '', category: r.category || '', lastContactedAt: r.last_contacted_at || '', contactCount: r.contact_count || 0, operationType: r.operation_type || 'compra' });
const toProperty = (r: any): Property => ({ id: r.id, title: r.title, address: r.address || '', type: r.type, status: r.status, price: Number(r.price) || 0, surface: Number(r.surface) || 0, bedrooms: r.bedrooms || 0, bathrooms: r.bathrooms || 0, photos: r.photos || [], agentId: r.agent_id || '', interestedClientIds: r.interested_client_ids || [], publishedAt: r.published_at || '', description: r.description || '', agencyId: r.agency_id || '', category: r.category || '', postal_code: r.postal_code || '', latitude: r.latitude != null ? Number(r.latitude) : null, longitude: r.longitude != null ? Number(r.longitude) : null, built_surface: Number(r.built_surface) || 0, plot_surface: Number(r.plot_surface) || 0, energy_cert: r.energy_cert || 'en_tramite', neighborhood: r.neighborhood || '', floor: r.floor != null ? Number(r.floor) : null, community_fees: Number(r.community_fees) || 0, ibi_annual: Number(r.ibi_annual) || 0, has_elevator: r.has_elevator || false, has_terrace: r.has_terrace || false, has_pool: r.has_pool || false, has_garage: r.has_garage || false, has_air_conditioning: r.has_air_conditioning || false, operationType: r.operation_type || 'venta', monthly_rent: Number(r.monthly_rent) || 0, condition: r.condition || '', unavailable_reason: r.unavailable_reason || '' });
const toUser = (r: any): User => ({ id: r.id, name: r.name, email: r.email || '', role: r.role as any, phone: r.phone || '', propertyIds: r.property_ids || [], clientIds: r.client_ids || [], avatar: r.avatar || '', agencyId: r.agency_id || '', accessType: r.access_type as any, permissions: r.permissions || [] });
const toTask = (r: any): Task => ({ id: r.id, title: r.title, type: r.type as any, status: r.status as any, priority: r.priority as any, dueDate: r.due_date || '', agentId: r.agent_id || '', clientId: r.client_id || '', propertyId: r.property_id || '', notes: r.notes || '', agencyId: r.agency_id || '', category: r.category || '' });
const toDocument = (r: any): Document => ({ id: r.id, name: r.name, type: r.type as any, file: r.file || '', uploadedAt: r.uploaded_at || '', propertyId: r.property_id || '' });

// ---- Activity Logger ----
const logActivity = async (tenantId: string | null, userId: string | undefined, action: string, entityType: string, entityId?: string, metadata?: Record<string, any>) => {
  if (!tenantId || !userId) return;
  try {
    await supabase.rpc('log_activity', {
      _tenant_id: tenantId,
      _user_id: userId,
      _action: action,
      _entity_type: entityType,
      _entity_id: entityId || null,
      _metadata: metadata || {},
    });
  } catch (e) {
    console.error('Activity log error:', e);
  }
};

const softDeleteRecord = async (
  table: string,
  id: string,
  tenantId: string | null,
  userId: string | undefined,
) => {
  if (!tenantId) throw new Error('No se pudo identificar la inmobiliaria activa');
  if (!userId) throw new Error('Debes iniciar sesión para mover registros a la papelera');

  const rpcName = table === 'clients' ? 'soft_delete_client' : table === 'properties' ? 'soft_delete_property' : null;
  if (!rpcName) throw new Error('Este tipo de registro no tiene papelera configurada');

  const { error } = await (supabase as any).rpc(rpcName, { _id: id });

  if (error) throw error;
};

// ---- Query Hooks ----
export const useProperties = () => {
  const { session } = useAuth();
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: ['properties', session?.user?.id, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from('properties').select('*').eq('tenant_id', tenantId);
      if (error) throw error;
      return (data || []).map(toProperty);
    },
    enabled: !!session && !!tenantId,
  });
};

export const useClients = () => {
  const { session } = useAuth();
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: ['clients', session?.user?.id, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').eq('tenant_id', tenantId);
      if (error) throw error;
      return (data || []).map(toClient);
    },
    enabled: !!session && !!tenantId,
  });
};

export const useAgencies = () => {
  const { session } = useAuth();
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: ['agencies', session?.user?.id, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from('agencies').select('*').eq('tenant_id', tenantId);
      if (error) throw error;
      return (data || []).map(toAgency);
    },
    enabled: !!session && !!tenantId,
  });
};

export const useTeamMembers = () => {
  const { session } = useAuth();
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: ['team_members', session?.user?.id, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from('team_members').select('*').eq('tenant_id', tenantId);
      if (error) throw error;
      return (data || []).map(toUser);
    },
    enabled: !!session && !!tenantId,
  });
};

export const useTasks = () => {
  const { session } = useAuth();
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: ['tasks', session?.user?.id, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select('*').eq('tenant_id', tenantId);
      if (error) throw error;
      return (data || []).map(toTask);
    },
    enabled: !!session && !!tenantId,
  });
};

export const useDocuments = () => {
  const { session } = useAuth();
  const { tenantId } = useTenant();
  return useQuery({
    queryKey: ['documents', session?.user?.id, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from('documents').select('*').eq('tenant_id', tenantId);
      if (error) throw error;
      return (data || []).map(toDocument);
    },
    enabled: !!session && !!tenantId,
  });
};

// ---- Mutation Hooks ----
export const usePropertyMutations = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const { toast } = useToast();

  const add = useMutation({
    mutationFn: async (p: Omit<Property, "id">) => {
      const { data, error } = await supabase.from('properties').insert({
        title: p.title, address: p.address, type: p.type, status: p.status, price: p.price,
        surface: p.surface, bedrooms: p.bedrooms, bathrooms: p.bathrooms, photos: p.photos,
        agent_id: p.agentId || null, interested_client_ids: p.interestedClientIds,
        description: p.description, agency_id: p.agencyId || null, category: p.category,
        tenant_id: tenantId, postal_code: p.postal_code, latitude: p.latitude, longitude: p.longitude,
        built_surface: p.built_surface, plot_surface: p.plot_surface, energy_cert: p.energy_cert,
        neighborhood: p.neighborhood, floor: p.floor, community_fees: p.community_fees,
        ibi_annual: p.ibi_annual, has_elevator: p.has_elevator, has_terrace: p.has_terrace,
        has_pool: p.has_pool, has_garage: p.has_garage, has_air_conditioning: p.has_air_conditioning,
        operation_type: p.operationType, monthly_rent: p.monthly_rent,
      }).select().single();
      if (error) throw error;
      logActivity(tenantId, user?.id, 'create', 'property', data.id, { title: p.title });
      return toProperty(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async (p: Property) => {
      await supabase.from('properties').update({
        title: p.title, address: p.address, type: p.type, status: p.status, price: p.price,
        surface: p.surface, bedrooms: p.bedrooms, bathrooms: p.bathrooms, photos: p.photos,
        agent_id: p.agentId || null, interested_client_ids: p.interestedClientIds,
        description: p.description, agency_id: p.agencyId || null, category: p.category,
        postal_code: p.postal_code, latitude: p.latitude, longitude: p.longitude,
        built_surface: p.built_surface, plot_surface: p.plot_surface, energy_cert: p.energy_cert,
        neighborhood: p.neighborhood, floor: p.floor, community_fees: p.community_fees,
        ibi_annual: p.ibi_annual, has_elevator: p.has_elevator, has_terrace: p.has_terrace,
        has_pool: p.has_pool, has_garage: p.has_garage, has_air_conditioning: p.has_air_conditioning,
        operation_type: p.operationType, monthly_rent: p.monthly_rent,
      }).eq('id', p.id);
      logActivity(tenantId, user?.id, 'update', 'property', p.id, { title: p.title });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await softDeleteRecord('properties', id, tenantId, user?.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
    onError: (e: any) => toast({ title: "Error al eliminar", description: e.message, variant: "destructive" }),
  });

  return { addProperty: add.mutateAsync, updateProperty: update.mutateAsync, deleteProperty: remove.mutateAsync };
};

export const useClientMutations = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const { toast } = useToast();

  const add = useMutation({
    mutationFn: async (c: Omit<Client, "id">) => {
      const { data, error } = await supabase.from('clients').insert({
        name: c.name, email: c.email, phone: c.phone, address: c.address, type: c.type,
        lead_status: c.leadStatus, property_ids: c.propertyIds, notes: c.notes,
        agency_id: c.agencyId || null, category: c.category, last_contacted_at: c.lastContactedAt || null,
        contact_count: c.contactCount, tenant_id: tenantId, operation_type: c.operationType,
      }).select().single();
      if (error) throw error;
      logActivity(tenantId, user?.id, 'create', 'client', data.id, { name: c.name });
      return toClient(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async (c: Client) => {
      await supabase.from('clients').update({
        name: c.name, email: c.email, phone: c.phone, address: c.address, type: c.type,
        lead_status: c.leadStatus, property_ids: c.propertyIds, notes: c.notes,
        agency_id: c.agencyId || null, category: c.category, last_contacted_at: c.lastContactedAt || null,
        contact_count: c.contactCount, operation_type: c.operationType,
      }).eq('id', c.id);
      logActivity(tenantId, user?.id, 'update', 'client', c.id, { name: c.name });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await softDeleteRecord('clients', id, tenantId, user?.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
    onError: (e: any) => toast({ title: "Error al eliminar", description: e.message, variant: "destructive" }),
  });

  return { addClient: add.mutateAsync, updateClient: update.mutateAsync, deleteClient: remove.mutateAsync };
};

export const useAgencyMutations = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { tenantId } = useTenant();

  const add = useMutation({
    mutationFn: async (a: Omit<Agency, "id">) => {
      const { data, error } = await supabase.from('agencies').insert({ name: a.name, address: a.address, phone: a.phone, email: a.email, logo: a.logo, color: a.color, tenant_id: tenantId }).select().single();
      if (error) throw error;
      logActivity(tenantId, user?.id, 'create', 'agency', data.id, { name: a.name });
      return toAgency(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agencies'] }),
  });

  const update = useMutation({
    mutationFn: async (a: Agency) => {
      await supabase.from('agencies').update({ name: a.name, address: a.address, phone: a.phone, email: a.email, logo: a.logo, color: a.color }).eq('id', a.id);
      logActivity(tenantId, user?.id, 'update', 'agency', a.id, { name: a.name });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agencies'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('agencies').update({ deleted_at: new Date().toISOString() } as any).eq('id', id);
      logActivity(tenantId, user?.id, 'delete', 'agency', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agencies'] }),
  });

  return { addAgency: add.mutateAsync, updateAgency: update.mutateAsync, deleteAgency: remove.mutateAsync };
};

export const useTeamMemberMutations = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { tenantId } = useTenant();

  const add = useMutation({
    mutationFn: async (u: Omit<User, "id">) => {
      const { data, error } = await supabase.from('team_members').insert({
        name: u.name, email: u.email, role: u.role, phone: u.phone, property_ids: u.propertyIds,
        client_ids: u.clientIds, avatar: u.avatar, agency_id: u.agencyId || null,
        access_type: u.accessType, permissions: u.permissions, tenant_id: tenantId,
      }).select().single();
      if (error) throw error;
      logActivity(tenantId, user?.id, 'create', 'team_member', data.id, { name: u.name });
      return toUser(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team_members'] }),
  });

  const update = useMutation({
    mutationFn: async (u: User) => {
      await supabase.from('team_members').update({
        name: u.name, email: u.email, role: u.role, phone: u.phone, property_ids: u.propertyIds,
        client_ids: u.clientIds, avatar: u.avatar, agency_id: u.agencyId || null,
        access_type: u.accessType, permissions: u.permissions,
      }).eq('id', u.id);
      logActivity(tenantId, user?.id, 'update', 'team_member', u.id, { name: u.name });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team_members'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('team_members').update({ deleted_at: new Date().toISOString() } as any).eq('id', id);
      logActivity(tenantId, user?.id, 'delete', 'team_member', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team_members'] }),
  });

  return { addUser: add.mutateAsync, updateUser: update.mutateAsync, deleteUser: remove.mutateAsync };
};

export const useTaskMutations = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { tenantId } = useTenant();

  const add = useMutation({
    mutationFn: async (t: Omit<Task, "id">) => {
      const { data, error } = await supabase.from('tasks').insert({
        title: t.title, type: t.type, status: t.status, priority: t.priority,
        due_date: t.dueDate || null, agent_id: t.agentId || null, client_id: t.clientId || null,
        property_id: t.propertyId || null, notes: t.notes, agency_id: t.agencyId || null,
        category: t.category, tenant_id: tenantId,
      }).select().single();
      if (error) throw error;
      logActivity(tenantId, user?.id, 'create', 'task', data.id, { title: t.title });
      return toTask(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const update = useMutation({
    mutationFn: async (t: Task) => {
      await supabase.from('tasks').update({
        title: t.title, type: t.type, status: t.status, priority: t.priority,
        due_date: t.dueDate || null, agent_id: t.agentId || null, client_id: t.clientId || null,
        property_id: t.propertyId || null, notes: t.notes, agency_id: t.agencyId || null,
        category: t.category,
      }).eq('id', t.id);
      logActivity(tenantId, user?.id, 'update', 'task', t.id, { title: t.title });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('tasks').update({ deleted_at: new Date().toISOString() } as any).eq('id', id);
      logActivity(tenantId, user?.id, 'delete', 'task', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  return { addTask: add.mutateAsync, updateTask: update.mutateAsync, deleteTask: remove.mutateAsync };
};

export const useDocumentMutations = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { tenantId } = useTenant();

  const add = useMutation({
    mutationFn: async (d: Omit<Document, "id">) => {
      const { data, error } = await supabase.from('documents').insert({
        name: d.name, type: d.type, file: d.file, property_id: d.propertyId || null, tenant_id: tenantId,
      }).select().single();
      if (error) throw error;
      logActivity(tenantId, user?.id, 'create', 'document', data.id, { name: d.name });
      return toDocument(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });

  const update = useMutation({
    mutationFn: async (d: Document) => {
      await supabase.from('documents').update({
        name: d.name, type: d.type, file: d.file, property_id: d.propertyId || null,
      }).eq('id', d.id);
      logActivity(tenantId, user?.id, 'update', 'document', d.id, { name: d.name });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('documents').update({ deleted_at: new Date().toISOString() } as any).eq('id', id);
      logActivity(tenantId, user?.id, 'delete', 'document', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });

  return { addDocument: add.mutateAsync, updateDocument: update.mutateAsync, deleteDocument: remove.mutateAsync };
};
