import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Agency, Client, Document, Property, User, Task } from "@/types/crm";
import { monthlyData } from "@/data/mockData";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/context/TenantContext";
import { saveSnapshot } from "@/hooks/useSnapshots";

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

interface DataContextType {
  agencies: Agency[];
  clients: Client[];
  properties: Property[];
  users: User[];
  tasks: Task[];
  documents: Document[];
  monthlyData: typeof monthlyData;
  loading: boolean;
  addAgency: (a: Omit<Agency, "id">) => Promise<void>;
  updateAgency: (a: Agency) => Promise<void>;
  deleteAgency: (id: string) => Promise<void>;
  addClient: (c: Omit<Client, "id">) => Promise<void>;
  updateClient: (c: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addProperty: (p: Omit<Property, "id">) => Promise<void>;
  updateProperty: (p: Property) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  addUser: (u: Omit<User, "id">) => Promise<void>;
  updateUser: (u: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addTask: (t: Omit<Task, "id">) => Promise<void>;
  updateTask: (t: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addDocument: (d: Omit<Document, "id">) => Promise<void>;
  updateDocument: (d: Document) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

// Helper to map DB row to Agency
const toAgency = (r: any): Agency => ({ id: r.id, name: r.name, address: r.address || '', phone: r.phone || '', email: r.email || '', logo: r.logo || '', color: r.color || '#3B82F6' });
const toClient = (r: any): Client => ({ id: r.id, name: r.name, email: r.email || '', phone: r.phone || '', address: r.address || '', type: r.type, leadStatus: r.lead_status, propertyIds: r.property_ids || [], registeredAt: r.registered_at, notes: r.notes || '', agencyId: r.agency_id || '', category: r.category || '', lastContactedAt: r.last_contacted_at || '', contactCount: r.contact_count || 0, operationType: r.operation_type || 'compra' });
const toProperty = (r: any): Property => ({ id: r.id, title: r.title, address: r.address || '', type: r.type, status: r.status, price: Number(r.price) || 0, surface: Number(r.surface) || 0, bedrooms: r.bedrooms || 0, bathrooms: r.bathrooms || 0, photos: r.photos || [], agentId: r.agent_id || '', interestedClientIds: r.interested_client_ids || [], publishedAt: r.published_at || '', description: r.description || '', agencyId: r.agency_id || '', category: r.category || '', postal_code: r.postal_code || '', latitude: r.latitude != null ? Number(r.latitude) : null, longitude: r.longitude != null ? Number(r.longitude) : null, built_surface: Number(r.built_surface) || 0, plot_surface: Number(r.plot_surface) || 0, energy_cert: r.energy_cert || 'en_tramite', neighborhood: r.neighborhood || '', floor: r.floor != null ? Number(r.floor) : null, community_fees: Number(r.community_fees) || 0, ibi_annual: Number(r.ibi_annual) || 0, has_elevator: r.has_elevator || false, has_terrace: r.has_terrace || false, has_pool: r.has_pool || false, has_garage: r.has_garage || false, has_air_conditioning: r.has_air_conditioning || false, operationType: r.operation_type || 'venta', monthly_rent: Number(r.monthly_rent) || 0 });
const toUser = (r: any): User => ({ id: r.id, name: r.name, email: r.email || '', role: r.role as any, phone: r.phone || '', propertyIds: r.property_ids || [], clientIds: r.client_ids || [], avatar: r.avatar || '', agencyId: r.agency_id || '', accessType: r.access_type as any, permissions: r.permissions || [], password: r.password || '' });
const toTask = (r: any): Task => ({ id: r.id, title: r.title, type: r.type as any, status: r.status as any, priority: r.priority as any, dueDate: r.due_date || '', agentId: r.agent_id || '', clientId: r.client_id || '', propertyId: r.property_id || '', notes: r.notes || '', agencyId: r.agency_id || '', category: r.category || '' });
const toDocument = (r: any): Document => ({ id: r.id, name: r.name, type: r.type as any, file: r.file || '', uploadedAt: r.uploaded_at || '', propertyId: r.property_id || '' });

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { session, user } = useAuth();
  const { tenantId } = useTenant();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    // Properties are public, always fetch
    const pr = await supabase.from('properties').select('*');
    if (pr.data) setProperties(pr.data.map(toProperty));

    if (session) {
      const [ag, cl, us, ta, doc] = await Promise.all([
        supabase.from('agencies').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('team_members').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('documents').select('*'),
      ]);
      if (ag.data) setAgencies(ag.data.map(toAgency));
      if (cl.data) setClients(cl.data.map(toClient));
      if (us.data) setUsers(us.data.map(toUser));
      if (ta.data) setTasks(ta.data.map(toTask));
      if (doc.data) setDocuments(doc.data.map(toDocument));
    }
    setLoading(false);
  }, [session]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // --- AGENCIES ---
  const addAgency = async (a: Omit<Agency, "id">) => {
    const { data, error } = await supabase.from('agencies').insert({ name: a.name, address: a.address, phone: a.phone, email: a.email, logo: a.logo, color: a.color, tenant_id: tenantId }).select().single();
    if (data) { setAgencies(prev => [...prev, toAgency(data)]); logActivity(tenantId, user?.id, 'create', 'agency', data.id, { name: a.name }); }
  };
  const updateAgency = async (a: Agency) => {
    await supabase.from('agencies').update({ name: a.name, address: a.address, phone: a.phone, email: a.email, logo: a.logo, color: a.color }).eq('id', a.id);
    setAgencies(prev => prev.map(x => x.id === a.id ? a : x));
    logActivity(tenantId, user?.id, 'update', 'agency', a.id, { name: a.name });
  };
  const deleteAgency = async (id: string) => {
    const name = agencies.find(x => x.id === id)?.name;
    await supabase.from('agencies').update({ deleted_at: new Date().toISOString() } as any).eq('id', id);
    setAgencies(prev => prev.filter(x => x.id !== id));
    logActivity(tenantId, user?.id, 'delete', 'agency', id, { name });
  };

  // --- CLIENTS ---
  const addClient = async (c: Omit<Client, "id">) => {
    const { data } = await supabase.from('clients').insert({
      name: c.name, email: c.email, phone: c.phone, address: c.address, type: c.type,
      lead_status: c.leadStatus, property_ids: c.propertyIds, notes: c.notes,
      agency_id: c.agencyId || null, category: c.category, last_contacted_at: c.lastContactedAt || null,
      contact_count: c.contactCount, tenant_id: tenantId, operation_type: c.operationType,
    }).select().single();
    if (data) { setClients(prev => [...prev, toClient(data)]); logActivity(tenantId, user?.id, 'create', 'client', data.id, { name: c.name }); }
  };
  const updateClient = async (c: Client) => {
    await supabase.from('clients').update({
      name: c.name, email: c.email, phone: c.phone, address: c.address, type: c.type,
      lead_status: c.leadStatus, property_ids: c.propertyIds, notes: c.notes,
      agency_id: c.agencyId || null, category: c.category, last_contacted_at: c.lastContactedAt || null,
      contact_count: c.contactCount, operation_type: c.operationType,
    }).eq('id', c.id);
    setClients(prev => prev.map(x => x.id === c.id ? c : x));
    logActivity(tenantId, user?.id, 'update', 'client', c.id, { name: c.name });
  };
  const deleteClient = async (id: string) => {
    const name = clients.find(x => x.id === id)?.name;
    await supabase.from('clients').update({ deleted_at: new Date().toISOString() } as any).eq('id', id);
    setClients(prev => prev.filter(x => x.id !== id));
    logActivity(tenantId, user?.id, 'delete', 'client', id, { name });
  };

  // --- PROPERTIES ---
  const addProperty = async (p: Omit<Property, "id">) => {
    const { data } = await supabase.from('properties').insert({
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
    if (data) { setProperties(prev => [...prev, toProperty(data)]); logActivity(tenantId, user?.id, 'create', 'property', data.id, { title: p.title }); }
  };
  const updateProperty = async (p: Property) => {
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
    setProperties(prev => prev.map(x => x.id === p.id ? p : x));
    logActivity(tenantId, user?.id, 'update', 'property', p.id, { title: p.title });
  };
  const deleteProperty = async (id: string) => {
    const title = properties.find(x => x.id === id)?.title;
    await supabase.from('properties').update({ deleted_at: new Date().toISOString() } as any).eq('id', id);
    setProperties(prev => prev.filter(x => x.id !== id));
    logActivity(tenantId, user?.id, 'delete', 'property', id, { title });
  };

  // --- TEAM MEMBERS (Users) ---
  const addUser = async (u: Omit<User, "id">) => {
    const { data } = await supabase.from('team_members').insert({
      name: u.name, email: u.email, role: u.role, phone: u.phone, property_ids: u.propertyIds,
      client_ids: u.clientIds, avatar: u.avatar, agency_id: u.agencyId || null,
      access_type: u.accessType, permissions: u.permissions, password: u.password,
      tenant_id: tenantId,
    }).select().single();
    if (data) { setUsers(prev => [...prev, toUser(data)]); logActivity(tenantId, user?.id, 'create', 'team_member', data.id, { name: u.name }); }
  };
  const updateUser = async (u: User) => {
    await supabase.from('team_members').update({
      name: u.name, email: u.email, role: u.role, phone: u.phone, property_ids: u.propertyIds,
      client_ids: u.clientIds, avatar: u.avatar, agency_id: u.agencyId || null,
      access_type: u.accessType, permissions: u.permissions, password: u.password,
    }).eq('id', u.id);
    setUsers(prev => prev.map(x => x.id === u.id ? u : x));
    logActivity(tenantId, user?.id, 'update', 'team_member', u.id, { name: u.name });
  };
  const deleteUser = async (id: string) => {
    const name = users.find(x => x.id === id)?.name;
    await supabase.from('team_members').update({ deleted_at: new Date().toISOString() } as any).eq('id', id);
    setUsers(prev => prev.filter(x => x.id !== id));
    logActivity(tenantId, user?.id, 'delete', 'team_member', id, { name });
  };

  // --- TASKS ---
  const addTask = async (t: Omit<Task, "id">) => {
    const { data } = await supabase.from('tasks').insert({
      title: t.title, type: t.type, status: t.status, priority: t.priority,
      due_date: t.dueDate || null, agent_id: t.agentId || null, client_id: t.clientId || null,
      property_id: t.propertyId || null, notes: t.notes, agency_id: t.agencyId || null,
      category: t.category, tenant_id: tenantId,
    }).select().single();
    if (data) { setTasks(prev => [...prev, toTask(data)]); logActivity(tenantId, user?.id, 'create', 'task', data.id, { title: t.title }); }
  };
  const updateTask = async (t: Task) => {
    await supabase.from('tasks').update({
      title: t.title, type: t.type, status: t.status, priority: t.priority,
      due_date: t.dueDate || null, agent_id: t.agentId || null, client_id: t.clientId || null,
      property_id: t.propertyId || null, notes: t.notes, agency_id: t.agencyId || null,
      category: t.category,
    }).eq('id', t.id);
    setTasks(prev => prev.map(x => x.id === t.id ? t : x));
    logActivity(tenantId, user?.id, 'update', 'task', t.id, { title: t.title });
  };
  const deleteTask = async (id: string) => {
    const title = tasks.find(x => x.id === id)?.title;
    await supabase.from('tasks').update({ deleted_at: new Date().toISOString() } as any).eq('id', id);
    setTasks(prev => prev.filter(x => x.id !== id));
    logActivity(tenantId, user?.id, 'delete', 'task', id, { title });
  };

  // --- DOCUMENTS ---
  const addDocument = async (d: Omit<Document, "id">) => {
    const { data } = await supabase.from('documents').insert({
      name: d.name, type: d.type, file: d.file, property_id: d.propertyId || null,
      tenant_id: tenantId,
    }).select().single();
    if (data) { setDocuments(prev => [...prev, toDocument(data)]); logActivity(tenantId, user?.id, 'create', 'document', data.id, { name: d.name }); }
  };
  const updateDocument = async (d: Document) => {
    await supabase.from('documents').update({
      name: d.name, type: d.type, file: d.file, property_id: d.propertyId || null,
    }).eq('id', d.id);
    setDocuments(prev => prev.map(x => x.id === d.id ? d : x));
    logActivity(tenantId, user?.id, 'update', 'document', d.id, { name: d.name });
  };
  const deleteDocument = async (id: string) => {
    const name = documents.find(x => x.id === id)?.name;
    await supabase.from('documents').update({ deleted_at: new Date().toISOString() } as any).eq('id', id);
    setDocuments(prev => prev.filter(x => x.id !== id));
    logActivity(tenantId, user?.id, 'delete', 'document', id, { name });
  };

  return (
    <DataContext.Provider value={{
      agencies, clients, properties, users, tasks, documents, monthlyData, loading,
      addAgency, updateAgency, deleteAgency,
      addClient, updateClient, deleteClient,
      addProperty, updateProperty, deleteProperty,
      addUser, updateUser, deleteUser,
      addTask, updateTask, deleteTask,
      addDocument, updateDocument, deleteDocument,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};
