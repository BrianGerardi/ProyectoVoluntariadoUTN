/**
 * @file CoordinatorManagePanel.tsx
 * @description Panel de gestión de voluntarios para coordinadores y administradores.
 * Permite seleccionar una emergencia activa, ver los voluntarios postulados,
 * actualizar su estado (asignado, pendiente, completado, cancelado),
 * asignarles tareas específicas y eliminar emergencias.
 */

import {
  Card, CardContent, Box, Typography, TextField, Button, Alert,
  FormControl, InputLabel, Select, MenuItem, Paper, Grid, Chip, Divider,
} from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';
import type { Emergency, Assignment } from '../../types';

interface AssignmentEdit {
  status: string;
  assigned_task: string;
}

interface CoordinatorManagePanelProps {
  /** Lista de emergencias disponibles para gestionar. */
  emergencies: Emergency[];
  /** ID de la emergencia seleccionada actualmente. */
  selectedEmergencyId: string;
  /** Handler para cambiar la emergencia seleccionada. */
  onSelectEmergency: (id: string) => void;
  /** Lista de voluntarios postulados para la emergencia seleccionada. */
  volunteers: Assignment[];
  /** Estado de edición de cada asignación (status + tarea). */
  assignmentEdits: { [assignmentId: string]: AssignmentEdit };
  /** Handler para cambiar un campo de edición de una asignación. */
  onEditChange: (assignmentId: string, field: string, value: string) => void;
  /** Handler para guardar cambios en una asignación. */
  onUpdateAssignment: (assignmentId: string) => void;
  /** Handler para eliminar una emergencia. */
  onDeleteEmergency: (emergencyId: string) => void;
  /** Mensaje de éxito. */
  successMessage: string;
  /** Mensaje de error. */
  errorMessage: string;
}

export default function CoordinatorManagePanel({
  emergencies,
  selectedEmergencyId,
  onSelectEmergency,
  volunteers,
  assignmentEdits,
  onEditChange,
  onUpdateAssignment,
  onDeleteEmergency,
  successMessage,
  errorMessage,
}: CoordinatorManagePanelProps) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon color="primary" />
          Gestionar Voluntarios y Tareas
        </Typography>

        {/* Selector de emergencia + botón eliminar */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
          <FormControl fullWidth size="small">
            <InputLabel id="manage-em-select-label">Seleccionar Emergencia</InputLabel>
            <Select
              labelId="manage-em-select-label"
              value={selectedEmergencyId}
              label="Seleccionar Emergencia"
              onChange={(e) => onSelectEmergency(e.target.value)}
            >
              <MenuItem value="">
                <em>Seleccionar alerta para coordinar...</em>
              </MenuItem>
              {emergencies.map((em) => (
                <MenuItem key={em.id} value={em.id}>
                  {em.title} ({em.type} - {em.address})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedEmergencyId && (
            <Button
              variant="contained"
              color="error"
              onClick={() => onDeleteEmergency(selectedEmergencyId)}
              sx={{ whiteSpace: 'nowrap', fontWeight: 'bold', height: 40, width: { xs: '100%', sm: 'auto' } }}
            >
              Eliminar Emergencia
            </Button>
          )}
        </Box>

        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
        {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

        {/* Contenido según selección */}
        {!selectedEmergencyId ? (
          <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography color="text.secondary">
              Selecciona una emergencia de la lista de arriba para gestionar a las personas postuladas.
            </Typography>
          </Box>
        ) : volunteers.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography color="text.secondary">
              Ningún voluntario se ha postulado a esta emergencia todavía.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {volunteers.map((vol) => {
              const edit = assignmentEdits[vol.id] || { status: vol.status, assigned_task: vol.assigned_task || '' };
              return (
                <Paper key={vol.id} variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                  <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                    {/* Info del voluntario */}
                    <Grid size={{ xs: 12, md: 5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {vol.full_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        <strong>Teléfono:</strong> {vol.phone || 'No provisto'} | <strong>Ciudad:</strong> {vol.city || 'No provista'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        <strong>Email:</strong> {vol.email}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {vol.skills && vol.skills.length > 0 ? (
                          vol.skills.map((skill: string, sIdx: number) => (
                            <Chip key={sIdx} label={skill} size="small" color="primary" variant="outlined" sx={{ fontSize: '10px', height: 18 }} />
                          ))
                        ) : (
                          <Chip label="Sin habilidades indicadas" size="small" variant="outlined" sx={{ fontSize: '10px', height: 18 }} />
                        )}
                      </Box>
                    </Grid>

                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, mx: 1 }} />

                    {/* Formulario de edición */}
                    <Grid container size={{ xs: 12, md: 6 }} spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel id={`status-label-${vol.id}`}>Estado</InputLabel>
                          <Select
                            labelId={`status-label-${vol.id}`}
                            value={edit.status}
                            label="Estado"
                            onChange={(e) => onEditChange(vol.id, 'status', e.target.value)}
                          >
                            <MenuItem value="pending">Pendiente</MenuItem>
                            <MenuItem value="assigned">Asignado</MenuItem>
                            <MenuItem value="completed">Completado</MenuItem>
                            <MenuItem value="cancelled">Cancelado</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                          label="Tarea Específica a Realizar"
                          placeholder="Ej. Entregar agua y frazadas"
                          fullWidth size="small"
                          value={edit.assigned_task}
                          onChange={(e) => onEditChange(vol.id, 'assigned_task', e.target.value)}
                          disabled={edit.status !== 'assigned'}
                        />
                      </Grid>
                      <Grid size={12} sx={{ textAlign: 'right' }}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => onUpdateAssignment(vol.id)}
                          sx={{ fontWeight: 'bold' }}
                        >
                          ACTUALIZAR ASIGNACIÓN
                        </Button>
                      </Grid>
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
