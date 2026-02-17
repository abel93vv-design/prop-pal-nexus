export type ClientType = 'comprador' | 'vendedor' | 'arrendador' | 'arrendatario';
export type LeadStatus = 'nuevo' | 'contactado' | 'en_negociacion' | 'cerrado';
export type PropertyType = 'piso' | 'casa' | 'local' | 'terreno';
export type PropertyStatus = 'disponible' | 'reservado' | 'vendido_alquilado';
export type UserRole = 'administrador' | 'agente' | 'marketing';
export type TaskType = 'llamada' | 'email' | 'visita' | 'recordatorio';
export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada';

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
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  dueDate: string;
  agentId: string;
  clientId: string;
  propertyId: string;
  notes: string;
}
