export interface Barrio {
  id: string;
  name: string;
}

export interface Distrito {
  id: string;
  name: string;
  barrios: Barrio[];
}

export interface Municipio {
  id: string;
  name: string;
  group?: string;
}

export const DISTRITOS_MALAGA: Distrito[] = [
  {
    id: "centro", name: "Centro (Distrito 1)",
    barrios: [
      { id: "centro-historico", name: "Centro Histórico" },
      { id: "la-merced", name: "La Merced" },
      { id: "la-goleta", name: "La Goleta" },
      { id: "ensanche-centro", name: "Ensanche Centro" },
      { id: "soho", name: "Soho" },
      { id: "la-victoria", name: "La Victoria" },
      { id: "la-malagueta", name: "La Malagueta" },
      { id: "lagunillas", name: "Lagunillas" },
      { id: "la-trinidad", name: "La Trinidad" },
    ],
  },
  {
    id: "este", name: "Este (Distrito 2)",
    barrios: [
      { id: "el-palo", name: "El Palo" },
      { id: "pedregalejo", name: "Pedregalejo" },
      { id: "el-candado", name: "El Candado" },
      { id: "el-morlaco", name: "El Morlaco" },
      { id: "el-limonar", name: "El Limonar" },
    ],
  },
  {
    id: "ciudad-jardin", name: "Ciudad Jardín (Distrito 3)",
    barrios: [
      { id: "ciudad-jardin-centro", name: "Ciudad Jardín" },
      { id: "mangas-verdes", name: "Mangas Verdes" },
      { id: "parque-del-sur", name: "Parque del Sur" },
    ],
  },
  {
    id: "bailen-miraflores", name: "Bailén-Miraflores (Distrito 4)",
    barrios: [
      { id: "gamarra", name: "Gamarra" },
      { id: "miraflores", name: "Miraflores de los Ángeles" },
      { id: "nueva-malaga", name: "Nueva Málaga" },
      { id: "suarez", name: "Suárez" },
      { id: "carlinda", name: "Carlinda" },
    ],
  },
  {
    id: "palma-palmilla", name: "Palma-Palmilla (Distrito 5)",
    barrios: [
      { id: "la-palmilla", name: "La Palmilla" },
      { id: "26-de-febrero", name: "26 de Febrero" },
    ],
  },
  {
    id: "cruz-humilladero", name: "Cruz de Humilladero (Distrito 6)",
    barrios: [
      { id: "la-aurora", name: "La Aurora" },
      { id: "tiro-de-pichon", name: "Tiro de Pichón" },
      { id: "el-duende", name: "El Duende" },
      { id: "intelhorce", name: "Intelhorce" },
      { id: "los-tilos", name: "Los Tilos" },
      { id: "santa-julia", name: "Santa Julia" },
      { id: "portada-alta", name: "Portada Alta" },
      { id: "la-barriguilla", name: "La Barriguilla" },
    ],
  },
  {
    id: "carretera-cadiz", name: "Carretera de Cádiz (Distrito 7)",
    barrios: [
      { id: "huelin", name: "Huelin" },
      { id: "la-paz", name: "La Paz" },
      { id: "la-princesa", name: "La Princesa" },
      { id: "nuevo-san-andres", name: "Nuevo San Andrés" },
      { id: "pacifico", name: "Pacífico" },
      { id: "san-andres", name: "San Andrés" },
      { id: "la-luz", name: "La Luz" },
      { id: "jardin-abadia", name: "Jardín de la Abadía" },
      { id: "el-torcal", name: "El Torcal" },
      { id: "parque-oeste", name: "Parque del Oeste" },
      { id: "la-termica-sacaba", name: "La Térmica-Sacaba" },
      { id: "los-guindos", name: "Los Guindos" },
      { id: "vistafranca", name: "Vistafranca" },
    ],
  },
  {
    id: "churriana", name: "Churriana (Distrito 8)",
    barrios: [
      { id: "churriana-centro", name: "Churriana Centro" },
      { id: "guadalmar", name: "Guadalmar" },
    ],
  },
  {
    id: "campanillas", name: "Campanillas (Distrito 9)",
    barrios: [
      { id: "campanillas-centro", name: "Campanillas" },
      { id: "santa-rosalia", name: "Santa Rosalía" },
      { id: "maqueda", name: "Maqueda" },
      { id: "huertecillas", name: "Huertecillas" },
      { id: "colmenarejo", name: "Colmenarejo" },
      { id: "castanetas", name: "Castañetas" },
      { id: "segovia", name: "Segovia" },
    ],
  },
  {
    id: "puerto-torre", name: "Puerto de la Torre (Distrito 10)",
    barrios: [
      { id: "los-verdiales", name: "Los Verdiales" },
    ],
  },
  {
    id: "teatinos", name: "Teatinos-Universidad (Distrito 11)",
    barrios: [
      { id: "teatinos", name: "Teatinos" },
      { id: "universidad", name: "Universidad" },
      { id: "los-manantiales", name: "Los Manantiales" },
      { id: "el-consul", name: "El Cónsul" },
    ],
  },
];

export const MUNICIPIOS_PROVINCIA: Municipio[] = [
  // Valle del Guadalhorce
  { id: "mun-cartama", name: "Cártama", group: "Valle del Guadalhorce" },
  { id: "mun-coin", name: "Coín", group: "Valle del Guadalhorce" },
  { id: "mun-alora", name: "Álora", group: "Valle del Guadalhorce" },
  { id: "mun-alhaurin-grande", name: "Alhaurín el Grande", group: "Valle del Guadalhorce" },
  { id: "mun-alhaurin-torre", name: "Alhaurín de la Torre", group: "Valle del Guadalhorce" },
  { id: "mun-pizarra", name: "Pizarra", group: "Valle del Guadalhorce" },
  // Costa del Sol Occidental
  { id: "mun-marbella", name: "Marbella", group: "Costa del Sol Occidental" },
  { id: "mun-estepona", name: "Estepona", group: "Costa del Sol Occidental" },
  { id: "mun-torremolinos", name: "Torremolinos", group: "Costa del Sol Occidental" },
  { id: "mun-benalmadena", name: "Benalmádena", group: "Costa del Sol Occidental" },
  { id: "mun-fuengirola", name: "Fuengirola", group: "Costa del Sol Occidental" },
  { id: "mun-mijas", name: "Mijas", group: "Costa del Sol Occidental" },
  // Costa del Sol Oriental / Axarquía
  { id: "mun-rincon-victoria", name: "Rincón de la Victoria", group: "Costa del Sol Oriental / Axarquía" },
  { id: "mun-velez-malaga", name: "Vélez-Málaga", group: "Costa del Sol Oriental / Axarquía" },
  { id: "mun-nerja", name: "Nerja", group: "Costa del Sol Oriental / Axarquía" },
  // Interior de Málaga
  { id: "mun-antequera", name: "Antequera", group: "Interior de Málaga" },
  { id: "mun-ronda", name: "Ronda", group: "Interior de Málaga" },
];

/** Get all zone IDs for "Toda Málaga" */
export function getAllMalagaZones(): string[] {
  const zones: string[] = [];
  for (const d of DISTRITOS_MALAGA) {
    zones.push(`distrito:${d.id}`);
    for (const b of d.barrios) {
      zones.push(`barrio:${b.id}`);
    }
  }
  for (const m of MUNICIPIOS_PROVINCIA) {
    zones.push(`municipio:${m.id}`);
  }
  return zones;
}

/** Get all zone IDs for a specific district */
export function getDistrictZones(districtId: string): string[] {
  const d = DISTRITOS_MALAGA.find(x => x.id === districtId);
  if (!d) return [];
  return [`distrito:${d.id}`, ...d.barrios.map(b => `barrio:${b.id}`)];
}

/** Get human-readable name from zone ID */
export function getZoneName(zoneId: string): string {
  const [type, id] = zoneId.split(":");
  if (type === "distrito") {
    return DISTRITOS_MALAGA.find(d => d.id === id)?.name || id;
  }
  if (type === "barrio") {
    for (const d of DISTRITOS_MALAGA) {
      const b = d.barrios.find(b => b.id === id);
      if (b) return b.name;
    }
    return id;
  }
  if (type === "municipio") {
    return MUNICIPIOS_PROVINCIA.find(m => m.id === id)?.name || id;
  }
  return zoneId;
}

/** Check if a property's neighborhood/address matches any selected zone */
export function matchesSelectedZones(
  propertyNeighborhood: string,
  propertyAddress: string,
  selectedZones: string[]
): { matches: boolean; matchedZone: string | null } {
  if (!selectedZones.length) return { matches: true, matchedZone: null };

  const propLower = (propertyNeighborhood + " " + propertyAddress).toLowerCase();

  for (const zoneId of selectedZones) {
    const zoneName = getZoneName(zoneId).toLowerCase();
    if (propLower.includes(zoneName)) {
      return { matches: true, matchedZone: getZoneName(zoneId) };
    }
  }
  return { matches: false, matchedZone: null };
}
