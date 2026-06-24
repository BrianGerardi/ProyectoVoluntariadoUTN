/**
 * @file EmergencyCard.tsx
 * @description Tarjeta individual de emergencia activa.
 * Muestra información resumida de la emergencia (urgencia, tipo, dirección, distancia),
 * el estado de postulación del usuario, y acciones como postularse o ver detalles.
 * Si el usuario es coordinador/admin, también muestra el panel de solicitudes.
 */

import { Link } from 'react-router-dom';
import {
  Card, CardContent, Box, Typography, Chip, Paper, Button,
  List, ListItem,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  LocationOn as LocationOnIcon,
  Group as GroupIcon,
  Handyman as HandIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import type { Emergency, Assignment } from '../../types';

interface EmergencyCardProps {
  /** Datos de la emergencia a renderizar. */
  emergency: Emergency;
  /** Asignación del usuario actual para esta emergencia (si existe). */
  assignment?: Assignment;
  /** Lista de voluntarios postulados para esta emergencia (solo coordinadores). */
  emergencyAssignments?: Assignment[];
  /** Si el usuario tiene sesión activa. */
  isAuthenticated: boolean;
  /** Si el usuario es coordinador o admin. */
  isCoordinator: boolean;
  /** Handler para postularse a la emergencia. */
  onPostulate: (emergencyId: string) => void;
  /** Handler para abrir el diálogo de detalles. */
  onOpenDetails: (emergencyId: string) => void;
  /** Handler para aceptar/rechazar un voluntario. */
  onUpdateStatus: (emergencyId: string, assignmentId: string, status: string) => void;
}

export default function EmergencyCard({
  emergency,
  assignment,
  emergencyAssignments,
  isAuthenticated,
  isCoordinator,
  onPostulate,
  onOpenDetails,
  onUpdateStatus,
}: EmergencyCardProps) {
  const em = emergency;
  const isPostulated = !!assignment;
  const status = assignment?.status;
  const assignedTask = assignment?.assigned_task;

  return (
    <Card sx={{ position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: 3 }}>
      {/* Barra lateral de urgencia */}
      <Box sx={{
        position: 'absolute',
        top: 0, left: 0,
        width: 6, height: '100%',
        bgcolor: em.urgency === 'critical' ? 'error.main' : em.urgency === 'high' ? 'error.light' : 'warning.main',
      }} />

      <CardContent sx={{ p: 3, ml: 1 }}>
        {/* Chips de urgencia y tipo + fecha */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={
                em.urgency === 'critical' ? 'CRÍTICA'
                  : em.urgency === 'high' ? 'ALTA'
                  : em.urgency === 'medium' ? 'MEDIA'
                  : em.urgency === 'low' ? 'BAJA'
                  : em.urgency.toUpperCase()
              }
              color={em.urgency === 'critical' || em.urgency === 'high' ? 'error' : 'warning'}
              size="small"
              sx={{ fontWeight: 700, borderRadius: 1 }}
            />
            <Chip
              label={em.type.toUpperCase()}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600, borderRadius: 1 }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {new Date(em.created_at).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        {/* Título y descripción */}
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          {em.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {em.description}
        </Typography>

        {/* Ubicación y distancia */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Chip
            icon={<LocationOnIcon sx={{ fontSize: '18px !important', color: 'primary.main' }} />}
            label={em.address || 'Ubicación en mapa'}
            variant="outlined"
            sx={{ border: 'none', bgcolor: 'rgba(0, 82, 203, 0.05)', fontWeight: 600 }}
          />
          {em.distance !== undefined && (
            <Chip
              icon={<GroupIcon sx={{ fontSize: '18px !important' }} />}
              label={`A ${(em.distance / 1000).toFixed(1)} km`}
              variant="outlined"
              sx={{ border: 'none', bgcolor: 'rgba(73, 96, 124, 0.05)', fontWeight: 600 }}
            />
          )}
        </Box>

        {/* Panel de estado de postulación */}
        {isPostulated && (
          <Paper
            sx={{
              p: 2, mb: 3,
              border: '1px solid',
              borderColor:
                status === 'assigned' || status === 'completed' ? 'success.light'
                  : status === 'cancelled' ? 'error.light'
                  : 'warning.light',
              bgcolor:
                status === 'assigned' || status === 'completed' ? 'rgba(46, 125, 50, 0.05)'
                  : status === 'cancelled' ? 'rgba(211, 47, 47, 0.05)'
                  : 'rgba(237, 108, 2, 0.05)',
            }}
            elevation={0}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: status === 'assigned' && assignedTask ? 0.5 : 0 }}>
              {status === 'assigned' || status === 'completed' ? (
                <CheckCircleIcon color="success" />
              ) : status === 'cancelled' ? (
                <WarningIcon color="error" />
              ) : (
                <PendingIcon color="warning" />
              )}
              <Typography
                variant="subtitle2"
                color={
                  status === 'assigned' || status === 'completed' ? 'success.main'
                    : status === 'cancelled' ? 'error.main'
                    : 'warning.main'
                }
                sx={{ fontWeight: 'bold' }}
              >
                {status === 'assigned' && 'ASIGNADO'}
                {status === 'completed' && 'AYUDA FINALIZADA'}
                {status === 'cancelled' && 'POSTULACIÓN CANCELADA'}
                {status === 'pending' && 'POSTULACIÓN EN REVISIÓN'}
              </Typography>
            </Box>
            {status === 'assigned' && assignedTask && (
              <Typography variant="body2" sx={{ fontWeight: 500, mt: 1 }}>
                <strong>Tarea asignada:</strong> {assignedTask}
              </Typography>
            )}
          </Paper>
        )}

        {/* Acciones */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Botón de postulación */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            {!isPostulated && (
              isAuthenticated ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<HandIcon />}
                  onClick={() => onPostulate(em.id)}
                  sx={{ py: 1.2, px: 3, fontWeight: 700, borderRadius: 2 }}
                >
                  POSTULARME AHORA
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<HandIcon />}
                  component={Link}
                  to="/login"
                  sx={{ py: 1.2, px: 3, fontWeight: 700, borderRadius: 2 }}
                >
                  INICIÁ SESIÓN PARA POSTULARTE
                </Button>
              )
            )}
          </Box>

          {/* Panel de solicitudes (coordinadores) */}
          {isCoordinator && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.300' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon color="primary" sx={{ fontSize: 20 }} />
                Solicitudes de Voluntarios ({emergencyAssignments?.length || 0})
              </Typography>
              {(!emergencyAssignments || emergencyAssignments.length === 0) ? (
                <Typography variant="caption" color="text.secondary">
                  No hay solicitudes para esta emergencia.
                </Typography>
              ) : (
                <List disablePadding>
                  {emergencyAssignments.map((vol) => (
                    <ListItem key={vol.id} disablePadding sx={{ py: 1, borderBottom: '1px solid', borderColor: 'grey.200', '&:last-child': { borderBottom: 'none' } }}>
                      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                          <Typography
                            component={Link}
                            to={`/profile/${vol.user_id}`}
                            variant="subtitle2"
                            sx={{ fontWeight: 'bold', textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                          >
                            {vol.full_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Estado: {vol.status === 'assigned' ? 'Aceptado' : vol.status === 'cancelled' ? 'Rechazado' : 'Pendiente'}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {vol.skills && vol.skills.length > 0 ? (
                              vol.skills.map((skill: string, sIdx: number) => (
                                <Chip key={sIdx} label={skill} size="small" variant="outlined" sx={{ fontSize: '10px', height: 16 }} />
                              ))
                            ) : (
                              <Chip label="Sin habilidades" size="small" variant="outlined" sx={{ fontSize: '10px', height: 16 }} />
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {vol.status !== 'assigned' && (
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => onUpdateStatus(em.id, vol.id, 'assigned')}
                              sx={{ fontSize: '11px', fontWeight: 'bold' }}
                            >
                              Aceptar
                            </Button>
                          )}
                          {vol.status !== 'cancelled' && (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => onUpdateStatus(em.id, vol.id, 'cancelled')}
                              sx={{ fontSize: '11px', fontWeight: 'bold' }}
                            >
                              Rechazar
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          )}

          {/* Botón ver detalles */}
          <Box>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<InfoIcon />}
              onClick={() => onOpenDetails(em.id)}
              sx={{ py: 1.2, px: 3, fontWeight: 700, borderRadius: 2 }}
            >
              VER DETALLES
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
