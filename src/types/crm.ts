export type ClientType = 'comprador' | 'vendedor' | 'arrendador' | 'arrendatario';
export type LeadStatus = 'nuevo' | 'contactado' | 'en_negociacion' | 'cerrado';
export type PropertyType = 'piso' | 'casa' | 'local' | 'terreno';
export type PropertyStatus = 'disponible' | 'reservado' | 'vendido_alquilado' | 'no_disponible';
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
  password: string;
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
