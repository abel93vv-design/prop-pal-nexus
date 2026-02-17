import { Client, Property, User, Task } from '@/types/crm';

export const users: User[] = [
  { id: 'u1', name: 'Carlos Martínez', email: 'carlos@inmobiliaria.com', role: 'administrador', phone: '+34 612 345 678', propertyIds: ['p1','p2','p5'], clientIds: ['c1','c2'], avatar: '' },
  { id: 'u2', name: 'Ana García', email: 'ana@inmobiliaria.com', role: 'agente', phone: '+34 623 456 789', propertyIds: ['p3','p4'], clientIds: ['c3','c4'], avatar: '' },
  { id: 'u3', name: 'Luis Fernández', email: 'luis@inmobiliaria.com', role: 'agente', phone: '+34 634 567 890', propertyIds: ['p6','p7'], clientIds: ['c5','c6'], avatar: '' },
  { id: 'u4', name: 'María López', email: 'maria@inmobiliaria.com', role: 'marketing', phone: '+34 645 678 901', propertyIds: [], clientIds: [], avatar: '' },
];

export const properties: Property[] = [
  { id: 'p1', title: 'Ático luminoso en Salamanca', address: 'Calle Serrano 45, Madrid', type: 'piso', status: 'disponible', price: 485000, surface: 120, bedrooms: 3, bathrooms: 2, photos: [], agentId: 'u1', interestedClientIds: ['c1','c3'], publishedAt: '2025-12-01', description: 'Espectacular ático con terraza y vistas panorámicas.' },
  { id: 'p2', title: 'Casa adosada en Las Rozas', address: 'Urbanización El Pinar 12, Las Rozas', type: 'casa', status: 'disponible', price: 620000, surface: 250, bedrooms: 4, bathrooms: 3, photos: [], agentId: 'u1', interestedClientIds: ['c2'], publishedAt: '2025-11-15', description: 'Casa con jardín privado y piscina comunitaria.' },
  { id: 'p3', title: 'Local comercial en Gran Vía', address: 'Gran Vía 28, Madrid', type: 'local', status: 'reservado', price: 350000, surface: 85, bedrooms: 0, bathrooms: 1, photos: [], agentId: 'u2', interestedClientIds: ['c4'], publishedAt: '2025-10-20', description: 'Local en zona prime con gran flujo peatonal.' },
  { id: 'p4', title: 'Piso reformado en Chamberí', address: 'Calle Fuencarral 102, Madrid', type: 'piso', status: 'disponible', price: 390000, surface: 95, bedrooms: 2, bathrooms: 1, photos: [], agentId: 'u2', interestedClientIds: ['c1','c5'], publishedAt: '2026-01-05', description: 'Piso completamente reformado con acabados de lujo.' },
  { id: 'p5', title: 'Terreno en Pozuelo', address: 'Camino de las Huertas, Pozuelo', type: 'terreno', status: 'disponible', price: 280000, surface: 500, bedrooms: 0, bathrooms: 0, photos: [], agentId: 'u1', interestedClientIds: [], publishedAt: '2026-01-20', description: 'Parcela urbanizable con todos los servicios.' },
  { id: 'p6', title: 'Loft industrial en Malasaña', address: 'Calle San Andrés 8, Madrid', type: 'piso', status: 'vendido_alquilado', price: 310000, surface: 75, bedrooms: 1, bathrooms: 1, photos: [], agentId: 'u3', interestedClientIds: ['c6'], publishedAt: '2025-09-10', description: 'Loft con techos altos y estilo industrial.' },
  { id: 'p7', title: 'Chalet en La Moraleja', address: 'Av. de Europa 5, La Moraleja', type: 'casa', status: 'disponible', price: 1250000, surface: 450, bedrooms: 5, bathrooms: 4, photos: [], agentId: 'u3', interestedClientIds: ['c2','c5'], publishedAt: '2026-02-01', description: 'Chalet de lujo con piscina privada y jardín.' },
];

export const clients: Client[] = [
  { id: 'c1', name: 'Pedro Sánchez Ruiz', email: 'pedro@email.com', phone: '+34 611 222 333', address: 'Calle Mayor 15, Madrid', type: 'comprador', leadStatus: 'en_negociacion', propertyIds: ['p1','p4'], registeredAt: '2025-11-20', notes: 'Busca piso de 2-3 habitaciones en zona centro.' },
  { id: 'c2', name: 'Laura Díaz', email: 'laura@email.com', phone: '+34 622 333 444', address: 'Av. de América 30, Madrid', type: 'comprador', leadStatus: 'contactado', propertyIds: ['p2','p7'], registeredAt: '2025-12-05', notes: 'Interesada en chalets y casas con jardín.' },
  { id: 'c3', name: 'Roberto Muñoz', email: 'roberto@email.com', phone: '+34 633 444 555', address: 'Paseo de la Castellana 80, Madrid', type: 'vendedor', leadStatus: 'nuevo', propertyIds: ['p1'], registeredAt: '2026-01-10', notes: 'Quiere vender su ático en Salamanca.' },
  { id: 'c4', name: 'Isabel Torres', email: 'isabel@email.com', phone: '+34 644 555 666', address: 'Calle Alcalá 50, Madrid', type: 'arrendador', leadStatus: 'cerrado', propertyIds: ['p3'], registeredAt: '2025-10-01', notes: 'Local alquilado exitosamente.' },
  { id: 'c5', name: 'Miguel Herrero', email: 'miguel@email.com', phone: '+34 655 666 777', address: 'Calle Princesa 22, Madrid', type: 'comprador', leadStatus: 'nuevo', propertyIds: ['p4','p7'], registeredAt: '2026-02-10', notes: 'Presupuesto alto, busca propiedad de lujo.' },
  { id: 'c6', name: 'Carmen Navarro', email: 'carmen@email.com', phone: '+34 666 777 888', address: 'Calle Goya 35, Madrid', type: 'arrendatario', leadStatus: 'contactado', propertyIds: ['p6'], registeredAt: '2026-01-25', notes: 'Busca alquiler en zona Malasaña/Chamberí.' },
];

export const tasks: Task[] = [
  { id: 't1', title: 'Llamar a Pedro sobre el ático', type: 'llamada', status: 'pendiente', dueDate: '2026-02-18T10:00', agentId: 'u1', clientId: 'c1', propertyId: 'p1', notes: 'Confirmar segunda visita.' },
  { id: 't2', title: 'Enviar documentación a Laura', type: 'email', status: 'pendiente', dueDate: '2026-02-17T14:00', agentId: 'u1', clientId: 'c2', propertyId: 'p2', notes: 'Enviar planos y memoria de calidades.' },
  { id: 't3', title: 'Visita local Gran Vía con Isabel', type: 'visita', status: 'completada', dueDate: '2026-02-15T11:00', agentId: 'u2', clientId: 'c4', propertyId: 'p3', notes: 'Visita realizada, contrato firmado.' },
  { id: 't4', title: 'Seguimiento Miguel - chalet', type: 'llamada', status: 'en_progreso', dueDate: '2026-02-19T09:00', agentId: 'u3', clientId: 'c5', propertyId: 'p7', notes: 'Muy interesado, posible oferta.' },
  { id: 't5', title: 'Recordar renovación contrato Carmen', type: 'recordatorio', status: 'pendiente', dueDate: '2026-02-20T08:00', agentId: 'u3', clientId: 'c6', propertyId: 'p6', notes: '' },
  { id: 't6', title: 'Preparar fotos del terreno Pozuelo', type: 'visita', status: 'pendiente', dueDate: '2026-02-21T16:00', agentId: 'u1', clientId: '', propertyId: 'p5', notes: 'Llevar dron para fotos aéreas.' },
  { id: 't7', title: 'Email marketing nuevas propiedades', type: 'email', status: 'en_progreso', dueDate: '2026-02-18T12:00', agentId: 'u4', clientId: '', propertyId: '', notes: 'Newsletter mensual.' },
];

export const monthlyData = [
  { month: 'Sep', ventas: 2, alquileres: 3, ingresos: 180000 },
  { month: 'Oct', ventas: 3, alquileres: 2, ingresos: 250000 },
  { month: 'Nov', ventas: 1, alquileres: 4, ingresos: 160000 },
  { month: 'Dic', ventas: 4, alquileres: 1, ingresos: 320000 },
  { month: 'Ene', ventas: 2, alquileres: 3, ingresos: 210000 },
  { month: 'Feb', ventas: 3, alquileres: 2, ingresos: 275000 },
];
