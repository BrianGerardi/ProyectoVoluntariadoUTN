/**
 * @file api.ts
 * @description Servicios para la comunicación con la API Backend.
 * Utiliza un cliente `fetch` customizado para inyectar automáticamente el token JWT
 * en los encabezados de autorización.
 */

import { API_BASE_URL } from '../config';
import type { User, Emergency, Assignment, Message } from '../types';

/**
 * Obtiene el token JWT almacenado localmente.
 * @returns {string | null} El token JWT o null si no existe.
 */
const getToken = () => localStorage.getItem('token');

/**
 * Cliente `fetch` centralizado que maneja la inyección del JWT y el parseo de errores.
 * @template T El tipo de la respuesta esperada.
 * @param {string} endpoint - La ruta del endpoint (ej. '/api/users/profile').
 * @param {RequestInit} [options={}] - Opciones de la petición fetch.
 * @returns {Promise<T>} La promesa con la respuesta parseada en formato JSON.
 * @throws Lanzará un error si el código HTTP no es 2xx, extrayendo el mensaje de la API si existe.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error del servidor HTTP: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * @namespace emergencyService
 * @description Métodos para interactuar con el recurso Emergencias.
 */
export const emergencyService = {
  /**
   * Obtiene la lista de emergencias activas.
   * Si se provee lat/lng, el backend incluye la distancia calculada.
   * @param {number} [lat] - Latitud de ubicación de referencia.
   * @param {number} [lng] - Longitud de ubicación de referencia.
   * @returns {Promise<Emergency[]>}
   */
  async getAll(lat?: number, lng?: number): Promise<Emergency[]> {
    let path = '/api/emergencies';
    if (lat !== undefined && lng !== undefined) {
      path += `?lat=${lat}&lng=${lng}`;
    }
    return request<Emergency[]>(path);
  },

  /**
   * Crea una nueva alerta de emergencia.
   * @param {Object} data - Datos de la emergencia.
   * @returns {Promise<Emergency>}
   */
  async create(data: {
    title: string;
    description: string;
    type: string;
    urgency: string;
    latitude: string;
    longitude: string;
    address: string;
    required_resources: string[];
  }): Promise<Emergency> {
    return request<Emergency>('/api/emergencies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Elimina una emergencia y todos sus registros asociados.
   * @param {string} id - ID de la emergencia.
   * @returns {Promise<{ success?: string; error?: string }>}
   */
  async delete(id: string): Promise<{ success?: string; error?: string }> {
    return request<{ success?: string; error?: string }>(`/api/emergencies/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Obtiene la lista de voluntarios asignados o postulados a una emergencia.
   * @param {string} id - ID de la emergencia.
   * @returns {Promise<Assignment[]>}
   */
  async getAssignments(id: string): Promise<Assignment[]> {
    return request<Assignment[]>(`/api/emergencies/${id}/assignments`);
  },

  /**
   * Actualiza los datos descriptivos de una emergencia existente.
   * @param {string} id - ID de la emergencia.
   * @param {Object} data - Nuevos datos.
   * @returns {Promise<Emergency>}
   */
  async update(id: string, data: {
    title: string;
    description: string;
    type: string;
    required_resources: string[];
  }): Promise<Emergency> {
    return request<Emergency>(`/api/emergencies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
};

/**
 * @namespace assignmentService
 * @description Métodos para interactuar con las asignaciones y postulaciones de los voluntarios.
 */
export const assignmentService = {
  /**
   * Registra la postulación del usuario autenticado a una emergencia.
   * @param {string} emergencyId - ID de la emergencia.
   * @returns {Promise<Assignment>}
   */
  async postulate(emergencyId: string): Promise<Assignment> {
    return request<Assignment>('/api/assignments', {
      method: 'POST',
      body: JSON.stringify({ emergency_id: emergencyId }),
    });
  },

  /**
   * Obtiene todas las asignaciones históricas y actuales del usuario autenticado.
   * @returns {Promise<Assignment[]>}
   */
  async getMy(): Promise<Assignment[]> {
    return request<Assignment[]>('/api/assignments/my');
  },

  /**
   * Actualiza únicamente el estado de una postulación (asignado, cancelado, etc.).
   * @param {string} id - ID de la asignación.
   * @param {string} status - Nuevo estado.
   * @returns {Promise<Assignment>}
   */
  async updateStatus(id: string, status: string): Promise<Assignment> {
    return request<Assignment>(`/api/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Actualiza el estado y la tarea específica de un voluntario en una emergencia.
   * Usado principalmente por coordinadores.
   * @param {string} id - ID de la asignación.
   * @param {string} status - Nuevo estado.
   * @param {string} assignedTask - Descripción de la tarea encomendada.
   * @returns {Promise<Assignment>}
   */
  async updateAssignment(id: string, status: string, assignedTask: string): Promise<Assignment> {
    return request<Assignment>(`/api/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, assigned_task: assignedTask }),
    });
  }
};

/**
 * @namespace messageService
 * @description Métodos para el sistema de chat interno de las emergencias.
 */
export const messageService = {
  /**
   * Obtiene todos los mensajes de un grupo de emergencia.
   * @param {string} emergencyId - ID de la emergencia.
   * @returns {Promise<Message[]>}
   */
  async getMessages(emergencyId: string): Promise<Message[]> {
    return request<Message[]>(`/api/emergencies/${emergencyId}/messages`);
  },

  /**
   * Envía un nuevo mensaje a un grupo de emergencia.
   * @param {string} emergencyId - ID de la emergencia.
   * @param {string} content - Contenido del mensaje.
   * @param {boolean} [isImportant] - Si es `true` y el usuario es coordinador, se fija como importante.
   * @returns {Promise<Message>}
   */
  async sendMessage(emergencyId: string, content: string, isImportant?: boolean): Promise<Message> {
    return request<Message>(`/api/emergencies/${emergencyId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, is_important: isImportant }),
    });
  }
};

/**
 * @namespace userService
 * @description Métodos de gestión de cuentas de usuario y perfiles.
 */
export const userService = {
  /**
   * Obtiene el perfil completo del usuario autenticado actualmente.
   * @returns {Promise<User>}
   */
  async getProfile(): Promise<User> {
    return request<User>('/api/users/profile');
  },

  /**
   * Obtiene el perfil público de otro usuario por su ID.
   * @param {string} id - ID del usuario objetivo.
   * @returns {Promise<User>}
   */
  async getProfileById(id: string): Promise<User> {
    return request<User>(`/api/users/${id}`);
  },

  /**
   * Actualiza la información personal, ubicación y habilidades del usuario.
   * @param {Partial<User>} data - Datos modificados del usuario.
   * @returns {Promise<{ token: string; user: User }>} Contiene un token refrescado con la nueva info.
   */
  async updateProfile(data: Partial<User>): Promise<{ token: string; user: User }> {
    return request<{ token: string; user: User }>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
};
