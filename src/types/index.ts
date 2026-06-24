/**
 * @file types/index.ts
 * @description Definiciones de tipos (interfaces) compartidos en toda la aplicación.
 * Representan las entidades principales del dominio del sistema.
 */

/**
 * Representa a un usuario del sistema (Voluntario, Coordinador o Administrador).
 */
export interface User {
  /** Identificador único UUID */
  id: string;
  /** Correo electrónico de inicio de sesión */
  email: string;
  /** Nombre completo del usuario */
  full_name: string;
  /** Rol de acceso en el sistema ('volunteer', 'coordinator', 'admin') */
  role: string;
  /** Número de teléfono de contacto */
  phone?: string;
  /** Ciudad de residencia para alertas de proximidad */
  city?: string;
  /** Provincia de residencia */
  province?: string;
  /** Lista de habilidades y especialidades (ej. Primeros Auxilios) */
  skills?: string[];
  /** Datos adicionales (foto de perfil, banner, biografía) */
  metadata?: Record<string, any>;
}

/**
 * Representa un evento de emergencia activo o pasado.
 */
export interface Emergency {
  /** Identificador único UUID */
  id: string;
  /** Título descriptivo corto */
  title: string;
  /** Descripción detallada de lo sucedido */
  description: string;
  /** Categoría del evento (Incendio, Terremoto, etc.) */
  type: string;
  /** Estado actual ('active', 'resolved', 'cancelled') */
  status: string;
  /** Nivel de prioridad ('low', 'medium', 'high', 'critical') */
  urgency: string;
  /** Dirección física aproximada o exacta */
  address: string;
  /** Coordenada de longitud en el mapa */
  longitude: number;
  /** Coordenada de latitud en el mapa */
  latitude: number;
  /** Perfiles requeridos para atención de la emergencia */
  required_resources: string[];
  /** Fecha de creación (ISO string) */
  created_at: string;
  /** (Opcional) Distancia en metros respecto al usuario actual */
  distance?: number;
}

/**
 * Representa la postulación o asignación de un voluntario a una emergencia.
 */
export interface Assignment {
  /** Identificador único UUID */
  id: string;
  /** ID de la emergencia a la que se postula */
  emergency_id: string;
  /** ID del usuario que se postula */
  user_id: string;
  /** Estado de la postulación ('pending', 'assigned', 'completed', 'cancelled') */
  status: string;
  /** Tarea específica delegada por el coordinador */
  assigned_task: string;
  /** Fecha de actualización (ISO string) */
  assigned_at: string;
  
  // ─── Campos extra (JOINs) cuando se solicita con detalles del voluntario
  full_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  province?: string;
  skills?: string[];
  
  // ─── Campos extra (JOINs) cuando se solicita con detalles de la emergencia
  emergency_title?: string;
  emergency_type?: string;
  emergency_urgency?: string;
  emergency_address?: string;
}

/**
 * Representa un mensaje de chat dentro de un grupo de emergencia.
 */
export interface Message {
  /** Identificador único UUID */
  id: string;
  /** ID de la emergencia al que pertenece el grupo */
  emergency_id: string;
  /** ID del usuario remitente */
  sender_id: string;
  /** Nombre del usuario remitente en el momento de envío */
  sender_name: string;
  /** Contenido de texto del mensaje */
  content: string;
  /** Fecha de envío (ISO string) */
  created_at: string;
  /** Datos adicionales, como banderas de importancia */
  metadata?: {
    important?: boolean;
  };
}

/**
 * Representa el conteo y detalle de notificaciones pendientes del usuario.
 */
export interface NotificationState {
  /** Nuevas emergencias cerca de la ciudad del usuario */
  nearbyEmergencies: Emergency[];
  /** Nuevos mensajes en los grupos de emergencia activos del usuario */
  newMessages: Message[];
  /** Total de notificaciones no leídas */
  totalCount: number;
}
