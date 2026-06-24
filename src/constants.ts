/**
 * @file constants.ts
 * @description Constantes compartidas de la aplicación.
 * Centraliza valores reutilizados en múltiples componentes
 * para mantener consistencia y evitar duplicación (principio DRY).
 */

// ─── Urgencias ───────────────────────────────────────────────

/** Mapa de colores por nivel de urgencia para indicadores visuales. */
export const URGENCY_COLORS: Record<string, string> = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  critical: '#9c27b0',
};

/** Etiquetas en español para cada nivel de urgencia. */
export const URGENCY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

/**
 * Devuelve la etiqueta de urgencia en mayúsculas.
 * Ejemplo: `'critical'` → `'CRÍTICA'`.
 */
export const getUrgencyLabel = (urgency: string): string => {
  return URGENCY_LABELS[urgency]?.toUpperCase() || urgency?.toUpperCase() || '';
};

// ─── Tipos de emergencia ─────────────────────────────────────

/** Emoji representativo para cada tipo de emergencia. */
export const TYPE_EMOJI: Record<string, string> = {
  'Incendio': '🔥',
  'Inundación': '🌊',
  'Terremoto': '🌍',
  'Salud / Accidente': '🚨',
  'Búsqueda y Rescate': '🔍',
  'Otro': '⚠️',
};

/** Lista de tipos de emergencia disponibles para formularios. */
export const TYPE_OPTIONS = [
  'Incendio',
  'Inundación',
  'Terremoto',
  'Salud / Accidente',
  'Búsqueda y Rescate',
  'Otro',
] as const;

// ─── Habilidades y Roles ─────────────────────────────────────

/** Lista de habilidades predefinidas para voluntarios. */
export const SKILLS_OPTIONS = [
  'Primeros Auxilios',
  'Conducción (Auto/Camioneta)',
  'Conducción (Camión)',
  'Búsqueda y Rescate',
  'Logística y Distribución',
  'Apoyo Psicológico',
  'Enfermería/Medicina',
  'Limpieza de escombros',
] as const;

/** Etiquetas en español para los roles del sistema. */
export const ROLE_LABELS: Record<string, string> = {
  volunteer: 'Voluntario',
  coordinator: 'Coordinador de Emergencia',
  admin: 'Administrador',
};

// ─── Provincias argentinas ───────────────────────────────────

/** Lista completa de provincias de la República Argentina. */
export const PROVINCIAS = [
  'Buenos Aires',
  'Ciudad Autónoma de Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego, Antártida e Islas del Atlántico Sur',
  'Tucumán',
] as const;
