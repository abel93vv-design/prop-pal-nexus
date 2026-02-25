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
}

export const DISTRITOS_MALAGA: Distrito[] = [
  {
    id: "centro", name: "Centro",
    barrios: [
      { id: "centro-historico", name: "Centro Histórico" },
      { id: "la-merced", name: "La Merced" },
      { id: "la-goleta", name: "La Goleta" },
      { id: "ensanche-centro", name: "Ensanche Centro" },
      { id: "soho", name: "Soho" },
    ],
  },
  {
    id: "este", name: "Este",
    barrios: [
      { id: "el-palo", name: "El Palo" },
      { id: "pedregalejo", name: "Pedregalejo" },
      { id: "el-candado", name: "El Candado" },
      { id: "el-morlaco", name: "El Morlaco" },
      { id: "rincon-de-la-victoria", name: "Rincón de la Victoria" },
    ],
  },
  {
    id: "ciudad-jardin", name: "Ciudad Jardín",
    barrios: [
      { id: "ciudad-jardin-centro", name: "Ciudad Jardín" },
      { id: "la-abejera", name: "La Abejera" },
      { id: "mangas-verdes", name: "Mangas Verdes" },
    ],
  },
  {
    id: "bailén-miraflores", name: "Bailén-Miraflores",
    barrios: [
      { id: "bailen", name: "Bailén" },
      { id: "miraflores", name: "Miraflores de los Ángeles" },
      { id: "gamarra", name: "Gamarra" },
      { id: "victoria", name: "Victoria" },
    ],
  },
  {
    id: "palma-palmilla", name: "Palma-Palmilla",
    barrios: [
      { id: "palma-palmilla-centro", name: "Palma-Palmilla" },
      { id: "la-palmilla", name: "La Palmilla" },
      { id: "26-de-febrero", name: "26 de Febrero" },
    ],
  },
  {
    id: "cruz-humilladero", name: "Cruz de Humilladero",
    barrios: [
      { id: "huelin", name: "Huelin" },
      { id: "la-princesa", name: "La Princesa" },
      { id: "la-aurora", name: "La Aurora" },
      { id: "la-paz", name: "La Paz" },
      { id: "nuevo-san-andres", name: "Nuevo San Andrés" },
    ],
  },
  {
    id: "carretera-cadiz", name: "Carretera de Cádiz",
    barrios: [
      { id: "la-luz", name: "La Luz" },
      { id: "pacífico", name: "Pacífico" },
      { id: "la-florida", name: "La Florida" },
      { id: "san-andres", name: "San Andrés" },
      { id: "tiro-de-pichon", name: "Tiro de Pichón" },
    ],
  },
  {
    id: "churriana", name: "Churriana",
    barrios: [
      { id: "churriana-centro", name: "Churriana Centro" },
      { id: "guadalmar", name: "Guadalmar" },
      { id: "alhaurin-torre", name: "Alhaurín de la Torre" },
    ],
  },
  {
    id: "campanillas", name: "Campanillas",
    barrios: [
      { id: "campanillas-centro", name: "Campanillas" },
      { id: "santa-rosalia", name: "Santa Rosalía" },
    ],
  },
  {
    id: "puerto-torre", name: "Puerto de la Torre",
    barrios: [
      { id: "puerto-torre-centro", name: "Puerto de la Torre" },
      { id: "los-verdiales", name: "Los Verdiales" },
    ],
  },
  {
    id: "teatinos", name: "Teatinos-Universidad",
    barrios: [
      { id: "teatinos", name: "Teatinos" },
      { id: "universidad", name: "Universidad" },
      { id: "los-manantiales", name: "Los Manantiales" },
      { id: "el-consul", name: "El Cónsul" },
    ],
  },
];

export const MUNICIPIOS_PROVINCIA: Municipio[] = [
  { id: "mun-cartama", name: "Cártama" },
  { id: "mun-coin", name: "Coín" },
  { id: "mun-alora", name: "Álora" },
  { id: "mun-alhaurin-grande", name: "Alhaurín el Grande" },
  { id: "mun-alhaurin-torre", name: "Alhaurín de la Torre" },
  { id: "mun-marbella", name: "Marbella" },
  { id: "mun-estepona", name: "Estepona" },
  { id: "mun-torremolinos", name: "Torremolinos" },
  { id: "mun-benalmadena", name: "Benalmádena" },
  { id: "mun-fuengirola", name: "Fuengirola" },
  { id: "mun-mijas", name: "Mijas" },
  { id: "mun-rincon-victoria", name: "Rincón de la Victoria" },
  { id: "mun-velez-malaga", name: "Vélez-Málaga" },
  { id: "mun-nerja", name: "Nerja" },
  { id: "mun-antequera", name: "Antequera" },
  { id: "mun-ronda", name: "Ronda" },
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
