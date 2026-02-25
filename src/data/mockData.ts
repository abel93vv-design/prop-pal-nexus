import { Agency, Client, Document, Property, User, Task } from '@/types/crm';

export const agencies: Agency[] = [
  { id: 'a1', name: 'InmoCentro Madrid', address: 'Calle Serrano 12, Madrid', phone: '+34 910 111 222', email: 'info@inmocentro.com', logo: '', color: '#f59e0b' },
  { id: 'a2', name: 'Costa Homes Marbella', address: 'Av. del Mar 5, Marbella', phone: '+34 952 333 444', email: 'info@costahomes.com', logo: '', color: '#3b82f6' },
];

export const users: User[] = [
  { id: 'u1', name: 'Carlos Martínez', email: 'carlos@inmobiliaria.com', role: 'admin_global', phone: '+34 612 345 678', propertyIds: ['p1','p2','p5'], clientIds: ['c1','c2'], avatar: '', agencyId: 'a1', accessType: 'total', permissions: ['ver_clientes','ver_propiedades','ver_tareas','editar_clientes','editar_propiedades','editar_tareas','eliminar_registros','publicar_propiedades'], password: '••••••••' },
  { id: 'u2', name: 'Ana García', email: 'ana@inmobiliaria.com', role: 'agente', phone: '+34 623 456 789', propertyIds: ['p3','p4'], clientIds: ['c3','c4'], avatar: '', agencyId: 'a1', accessType: 'solo_inmobiliaria', permissions: ['ver_clientes','ver_propiedades','ver_tareas','editar_clientes','editar_propiedades','editar_tareas','publicar_propiedades'], password: '••••••••' },
  { id: 'u3', name: 'Luis Fernández', email: 'luis@inmobiliaria.com', role: 'agente', phone: '+34 634 567 890', propertyIds: ['p6','p7'], clientIds: ['c5','c6'], avatar: '', agencyId: 'a2', accessType: 'solo_inmobiliaria', permissions: ['ver_clientes','ver_propiedades','ver_tareas','editar_clientes','editar_propiedades','editar_tareas'], password: '••••••••' },
  { id: 'u4', name: 'María López', email: 'maria@inmobiliaria.com', role: 'personalizado', phone: '+34 645 678 901', propertyIds: [], clientIds: [], avatar: '', agencyId: 'a1', accessType: 'personalizado', permissions: ['ver_propiedades','publicar_propiedades'], password: '••••••••' },
];

const defaultPropExtras = { postal_code: '', latitude: null, longitude: null, built_surface: 0, plot_surface: 0, energy_cert: 'en_tramite', neighborhood: '', floor: null, community_fees: 0, ibi_annual: 0, has_elevator: false, has_terrace: false, has_pool: false, has_garage: false, has_air_conditioning: false, operationType: 'venta' as const, monthly_rent: 0 };

export const properties: Property[] = [
  { id: 'p1', title: 'Ático luminoso en Salamanca', address: 'Calle Serrano 45, Madrid', type: 'piso', status: 'disponible', price: 485000, surface: 120, bedrooms: 3, bathrooms: 2, photos: [], agentId: 'u1', interestedClientIds: ['c1','c3'], publishedAt: '2025-12-01', description: 'Espectacular ático con terraza y vistas panorámicas.', agencyId: 'a1', category: 'lujo', ...defaultPropExtras },
  { id: 'p2', title: 'Casa adosada en Las Rozas', address: 'Urbanización El Pinar 12, Las Rozas', type: 'casa', status: 'disponible', price: 620000, surface: 250, bedrooms: 4, bathrooms: 3, photos: [], agentId: 'u1', interestedClientIds: ['c2'], publishedAt: '2025-11-15', description: 'Casa con jardín privado y piscina comunitaria.', agencyId: 'a1', category: 'residencial', ...defaultPropExtras },
  { id: 'p3', title: 'Local comercial en Gran Vía', address: 'Gran Vía 28, Madrid', type: 'local', status: 'reservado', price: 350000, surface: 85, bedrooms: 0, bathrooms: 1, photos: [], agentId: 'u2', interestedClientIds: ['c4'], publishedAt: '2025-10-20', description: 'Local en zona prime con gran flujo peatonal.', agencyId: 'a1', category: 'comercial', ...defaultPropExtras },
  { id: 'p4', title: 'Piso reformado en Chamberí', address: 'Calle Fuencarral 102, Madrid', type: 'piso', status: 'disponible', price: 390000, surface: 95, bedrooms: 2, bathrooms: 1, photos: [], agentId: 'u2', interestedClientIds: ['c1','c5'], publishedAt: '2026-01-05', description: 'Piso completamente reformado con acabados de lujo.', agencyId: 'a1', category: 'residencial', ...defaultPropExtras },
  { id: 'p5', title: 'Terreno en Pozuelo', address: 'Camino de las Huertas, Pozuelo', type: 'terreno', status: 'disponible', price: 280000, surface: 500, bedrooms: 0, bathrooms: 0, photos: [], agentId: 'u1', interestedClientIds: [], publishedAt: '2026-01-20', description: 'Parcela urbanizable con todos los servicios.', agencyId: 'a1', category: 'suelo', ...defaultPropExtras },
  { id: 'p6', title: 'Loft industrial en Malasaña', address: 'Calle San Andrés 8, Madrid', type: 'piso', status: 'vendido_alquilado', price: 310000, surface: 75, bedrooms: 1, bathrooms: 1, photos: [], agentId: 'u3', interestedClientIds: ['c6'], publishedAt: '2025-09-10', description: 'Loft con techos altos y estilo industrial.', agencyId: 'a2', category: 'residencial', ...defaultPropExtras },
  { id: 'p7', title: 'Chalet en La Moraleja', address: 'Av. de Europa 5, La Moraleja', type: 'casa', status: 'disponible', price: 1250000, surface: 450, bedrooms: 5, bathrooms: 4, photos: [], agentId: 'u3', interestedClientIds: ['c2','c5'], publishedAt: '2026-02-01', description: 'Chalet de lujo con piscina privada y jardín.', agencyId: 'a2', category: 'lujo', ...defaultPropExtras },
];

export const clients: Client[] = [
  { id: 'c1', name: 'Pedro Sánchez Ruiz', email: 'pedro@email.com', phone: '+34 611 222 333', address: 'Calle Mayor 15, Madrid', type: 'comprador', leadStatus: 'en_negociacion', propertyIds: ['p1','p4'], registeredAt: '2025-11-20', notes: 'Busca piso de 2-3 habitaciones en zona centro.', agencyId: 'a1', category: 'premium', lastContactedAt: '2026-02-17', contactCount: 5, operationType: 'compra' },
  { id: 'c2', name: 'Laura Díaz', email: 'laura@email.com', phone: '+34 622 333 444', address: 'Av. de América 30, Madrid', type: 'comprador', leadStatus: 'contactado', propertyIds: ['p2','p7'], registeredAt: '2025-12-05', notes: 'Interesada en chalets y casas con jardín.', agencyId: 'a1', category: 'premium', lastContactedAt: '2026-02-10', contactCount: 3, operationType: 'compra' },
  { id: 'c3', name: 'Roberto Muñoz', email: 'roberto@email.com', phone: '+34 633 444 555', address: 'Paseo de la Castellana 80, Madrid', type: 'vendedor', leadStatus: 'nuevo', propertyIds: ['p1'], registeredAt: '2026-01-10', notes: 'Quiere vender su ático en Salamanca.', agencyId: 'a1', category: 'estandar', lastContactedAt: '', contactCount: 0, operationType: 'compra' },
  { id: 'c4', name: 'Isabel Torres', email: 'isabel@email.com', phone: '+34 644 555 666', address: 'Calle Alcalá 50, Madrid', type: 'arrendador', leadStatus: 'cerrado', propertyIds: ['p3'], registeredAt: '2025-10-01', notes: 'Local alquilado exitosamente.', agencyId: 'a1', category: 'comercial', lastContactedAt: '2026-01-15', contactCount: 8, operationType: 'alquiler' },
  { id: 'c5', name: 'Miguel Herrero', email: 'miguel@email.com', phone: '+34 655 666 777', address: 'Calle Princesa 22, Madrid', type: 'comprador', leadStatus: 'nuevo', propertyIds: ['p4','p7'], registeredAt: '2026-02-10', notes: 'Presupuesto alto, busca propiedad de lujo.', agencyId: 'a2', category: 'premium', lastContactedAt: '', contactCount: 0, operationType: 'compra' },
  { id: 'c6', name: 'Carmen Navarro', email: 'carmen@email.com', phone: '+34 666 777 888', address: 'Calle Goya 35, Madrid', type: 'arrendatario', leadStatus: 'contactado', propertyIds: ['p6'], registeredAt: '2026-01-25', notes: 'Busca alquiler en zona Malasaña/Chamberí.', agencyId: 'a2', category: 'estandar', lastContactedAt: '2026-02-05', contactCount: 2, operationType: 'alquiler' },
];

export const tasks: Task[] = [
  { id: 't1', title: 'Llamar a Pedro sobre el ático', type: 'llamada', status: 'pendiente', priority: 'alta', dueDate: '2026-02-18T10:00', agentId: 'u1', clientId: 'c1', propertyId: 'p1', notes: 'Confirmar segunda visita.', agencyId: 'a1', category: 'seguimiento' },
  { id: 't2', title: 'Enviar documentación a Laura', type: 'email', status: 'pendiente', priority: 'media', dueDate: '2026-02-17T14:00', agentId: 'u1', clientId: 'c2', propertyId: 'p2', notes: 'Enviar planos y memoria de calidades.', agencyId: 'a1', category: 'documentacion' },
  { id: 't3', title: 'Visita local Gran Vía con Isabel', type: 'visita', status: 'completada', priority: 'alta', dueDate: '2026-02-15T11:00', agentId: 'u2', clientId: 'c4', propertyId: 'p3', notes: 'Visita realizada, contrato firmado.', agencyId: 'a1', category: 'visita' },
  { id: 't4', title: 'Seguimiento Miguel - chalet', type: 'llamada', status: 'en_progreso', priority: 'alta', dueDate: '2026-02-19T09:00', agentId: 'u3', clientId: 'c5', propertyId: 'p7', notes: 'Muy interesado, posible oferta.', agencyId: 'a2', category: 'seguimiento' },
  { id: 't5', title: 'Recordar renovación contrato Carmen', type: 'recordatorio', status: 'pendiente', priority: 'media', dueDate: '2026-02-20T08:00', agentId: 'u3', clientId: 'c6', propertyId: 'p6', notes: '', agencyId: 'a2', category: 'contratos' },
  { id: 't6', title: 'Preparar fotos del terreno Pozuelo', type: 'visita', status: 'pendiente', priority: 'baja', dueDate: '2026-02-21T16:00', agentId: 'u1', clientId: '', propertyId: 'p5', notes: 'Llevar dron para fotos aéreas.', agencyId: 'a1', category: 'marketing' },
  { id: 't7', title: 'Email marketing nuevas propiedades', type: 'email', status: 'en_progreso', priority: 'baja', dueDate: '2026-02-18T12:00', agentId: 'u4', clientId: '', propertyId: '', notes: 'Newsletter mensual.', agencyId: 'a1', category: 'marketing' },
];

export const documents: Document[] = [
  { id: 'd1', name: 'Nota Simple Ático Salamanca', type: 'nota_simple', file: '', uploadedAt: '2025-12-02', propertyId: 'p1' },
  { id: 'd2', name: 'Contrato Arras Local Gran Vía', type: 'contrato', file: '', uploadedAt: '2026-02-10', propertyId: 'p3' },
  { id: 'd3', name: 'Fotos Chalet Moraleja', type: 'fotos', file: '', uploadedAt: '2026-02-05', propertyId: 'p7' },
];

export const monthlyData = [
  { month: 'Sep', ventas: 2, alquileres: 3, ingresos: 180000 },
  { month: 'Oct', ventas: 3, alquileres: 2, ingresos: 250000 },
  { month: 'Nov', ventas: 1, alquileres: 4, ingresos: 160000 },
  { month: 'Dic', ventas: 4, alquileres: 1, ingresos: 320000 },
  { month: 'Ene', ventas: 2, alquileres: 3, ingresos: 210000 },
  { month: 'Feb', ventas: 3, alquileres: 2, ingresos: 275000 },
];
