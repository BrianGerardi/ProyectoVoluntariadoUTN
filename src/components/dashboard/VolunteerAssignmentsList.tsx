/**
 * @file VolunteerAssignmentsList.tsx
 * @description Panel lateral que muestra las postulaciones y tareas asignadas
 * al voluntario autenticado. Incluye estado de cada asignación y detalles
 * de la tarea cuando fue aceptado por un coordinador.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Card, CardContent, Box, Typography, Chip, Button,
  List, ListItem, ListItemText, Divider,
} from '@mui/material';
import {
  LocationOn as LocationOnIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
} from '@mui/icons-material';
import type { Assignment } from '../../types';

interface VolunteerAssignmentsListProps {
  /** Si el usuario tiene sesión activa. */
  isAuthenticated: boolean;
  /** Lista de asignaciones del usuario actual. */
  assignments: Assignment[];
}

export default function VolunteerAssignmentsList({
  isAuthenticated,
  assignments,
}: VolunteerAssignmentsListProps) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentTurnedInIcon color="primary" />
          Mis Tareas y Ayudas
        </Typography>

        {!isAuthenticated ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
              Iniciá sesión para ver tus tareas y postulaciones.
            </Typography>
            <Button
              variant="outlined"
              component={Link}
              to="/login"
              fullWidth
              size="small"
              sx={{ fontWeight: 'bold', borderRadius: 2 }}
            >
              Iniciar Sesión
            </Button>
          </Box>
        ) : assignments.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
            No te has postulado a ninguna emergencia todavía.
          </Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {assignments.map((as, idx) => (
              <React.Fragment key={as.id}>
                <ListItem sx={{ px: 0, py: 1.5, alignItems: 'flex-start' }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {as.emergency_title}
                        </Typography>
                        <Chip
                          label={as.status === 'assigned' ? 'Asignado' : as.status === 'pending' ? 'Pendiente' : as.status}
                          color={as.status === 'assigned' ? 'success' : 'warning'}
                          size="small"
                          sx={{ height: 20, fontSize: '10px', fontWeight: 'bold' }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <LocationOnIcon sx={{ fontSize: 12 }} />
                          {as.emergency_address || 'Dirección no provista'}
                        </Typography>
                        {as.status === 'assigned' && as.assigned_task && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1, borderLeft: '3px solid', borderColor: 'success.main' }}>
                            <Typography variant="caption" color="success.main" sx={{ display: 'block', fontWeight: 'bold' }}>
                              Tarea asignada:
                            </Typography>
                            <Typography variant="caption" color="text.primary">
                              {as.assigned_task}
                            </Typography>
                          </Box>
                        )}
                      </>
                    }
                  />
                </ListItem>
                {idx < assignments.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
