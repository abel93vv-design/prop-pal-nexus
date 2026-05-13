export type ClientType = 'comprador' | 'vendedor' | 'arrendador' | 'arrendatario';
export type LeadStatus = 'nuevo' | 'contactado' | 'en_negociacion' | 'cerrado' | 'inactivo';
export type PropertyType = 'piso' | 'casa' | 'local' | 'terreno' | 'parking';
export type PropertyStatus = 'disponible' | 'reservado' | 'vendido_alquilado' | 'no_disponible';
export type OperationType = 'venta' | 'alquiler' | 'ambos' | 'compra' | 'alquiler_opcion_compra';
export type PropertyCondition = '' | 'entrar_a_vivir' | 'a_reformar' | 'reformado' | 'traspaso' | 'cambio_de_uso' | 'urbano' | 'urbanizable' | 'rustico';
export type UserRole = 'admin_global' | 'admin_inmobiliaria' | 'agente' | 'personalizado';
export type TaskType = 'llamada' | 'email' | 'visita' | 'recordatorio';
export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada';
export type TaskPriority = 'baja' | 'media' | 'alta';
export type DocumentType = 'nota_simple' | 'contrato' | 'fotos' | 'otros';

export type Permission =
  | 'ver_clientes'
  | 'ver_propiedades'
  | 'ver_tareas'
  | 'editar_clientes'
  | 'editar_propiedades'
  | 'editar_tareas'
  | 'eliminar_registros'
  | 'publicar_propiedades';

export type AccessType = 'total' | 'solo_inmobiliaria' | 'personalizado';

export interface Agency {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo: string;
  color: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: ClientType;
  leadStatus: LeadStatus;
  propertyIds: string[];
  registeredAt: string;
  notes: string;
  agencyId: string;
  category: string;
  lastContactedAt: string;
  contactCount: number;
  operationType: OperationType;
}

export interface Property {
  id: string;
  title: string;
  address: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  surface: number;
  bedrooms: number;
  bathrooms: number;
  photos: string[];
  agentId: string;
  interestedClientIds: string[];
  publishedAt: string;
  description: string;
  agencyId: string;
  category: string;
  // New technical fields
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  built_surface: number;
  plot_surface: number;
  energy_cert: string;
  neighborhood: string;
  floor: number | null;
  community_fees: number;
  ibi_annual: number;
  has_elevator: boolean;
  has_terrace: boolean;
  has_pool: boolean;
  has_garage: boolean;
  has_air_conditioning: boolean;
  operationType: OperationType;
  monthly_rent: number;
  condition?: string;
  unavailable_reason?: string;
  listing_type?: 'ne' | 'noticia';
  ne_start_date?: string | null;
  ne_end_date?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  propertyIds: string[];
  clientIds: string[];
  avatar: string;
  agencyId: string;
  accessType: AccessType;
  permissions: Permission[];
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  agentId: string;
  clientId: string;
  propertyId: string;
  notes: string;
  agencyId: string;
  category: string;
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  file: string;
  uploadedAt: string;
  propertyId: string;
}
