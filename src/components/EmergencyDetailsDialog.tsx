import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  TextField,
  Chip,
  Divider,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationOnIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { getUrgencyLabel, TYPE_OPTIONS } from '../constants';
import { emergencyService } from '../services/api';

interface EmergencyDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  emergency: any;
  token: string | null;
  currentUserId: string | undefined;
  currentUserRole?: string;
  onEmergencyUpdated?: (updatedEmergency: any) => void;
}



const parseResources = (requiredResources: any): string[] => {
  try {
    if (typeof requiredResources === 'string') {
      return JSON.parse(requiredResources);
    }

    if (Array.isArray(requiredResources)) {
      return requiredResources;
    }

    return [];
  } catch {
    return [];
  }
};

export default function EmergencyDetailsDialog({
  open,
  onClose,
  emergency,
  currentUserRole,
  onEmergencyUpdated,
}: EmergencyDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    type: '',
    required_resources: '',
  });

  const canEditEmergency = currentUserRole === 'admin' || currentUserRole === 'coordinator';

  useEffect(() => {
    if (emergency) {
      const resources = parseResources(emergency.required_resources);

      setEditForm({
        title: emergency.title || '',
        description: emergency.description || '',
        type: emergency.type || 'Otro',
        required_resources: resources.join(', '),
      });

      setIsEditing(false);
      setSaveError('');
      setSaveSuccess('');
    }
  }, [emergency, open]);

  if (!emergency) return null;

  const resources = parseResources(emergency.required_resources);

  const handleClose = () => {
    setIsEditing(false);
    setSaveError('');
    setSaveSuccess('');
    onClose();
  };

  const handleSaveEmergency = async () => {
    setSaveError('');
    setSaveSuccess('');

    if (!editForm.title.trim() || !editForm.description.trim() || !editForm.type.trim()) {
      setSaveError('Completá título, descripción y tipo de emergencia.');
      return;
    }

    setSaving(true);

    try {
      const resourcesArray = editForm.required_resources
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item !== '');

      const data = await emergencyService.update(emergency.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        type: editForm.type,
        required_resources: resourcesArray,
      });

      onEmergencyUpdated?.(data);
      setSaveSuccess('Emergencia actualizada correctamente.');
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white',
        }}
      >
        <Box>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            {isEditing ? 'Editar emergencia' : emergency.title}
          </Typography>
          <Typography
            variant="caption"
            sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
          >
            <ScheduleIcon sx={{ fontSize: 14 }} />
            Creada el: {new Date(emergency.created_at).toLocaleString()}
          </Typography>
        </Box>

        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, overflowY: 'auto' }}>
        {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}
        {saveSuccess && <Alert severity="success" sx={{ mb: 2 }}>{saveSuccess}</Alert>}

        {!isEditing ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={getUrgencyLabel(emergency.urgency)}
                  color={emergency.urgency === 'critical' || emergency.urgency === 'high' ? 'error' : 'warning'}
                  size="small"
                  sx={{ fontWeight: 'bold', borderRadius: 1 }}
                />
                <Chip
                  label={emergency.type.toUpperCase()}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 'bold', borderRadius: 1 }}
                />
              </Box>

              {canEditEmergency && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                  sx={{ borderRadius: 2, fontWeight: 700, whiteSpace: 'nowrap' }}
                >
                  Editar
                </Button>
              )}
            </Box>

            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Descripción
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {emergency.description || 'No hay descripción disponible para esta emergencia.'}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
              <LocationOnIcon color="primary" sx={{ mt: 0.2 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Dirección / Ubicación
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {emergency.address || 'Ubicación señalada en el mapa'}
                </Typography>
                {emergency.distance !== undefined && (
                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, display: 'block' }}>
                    A {(emergency.distance / 1000).toFixed(2)} km de tu ubicación
                  </Typography>
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Recursos / Habilidades Requeridas
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {resources.length > 0 ? (
                resources.map((res: string, idx: number) => (
                  <Chip key={idx} label={res} size="small" sx={{ bgcolor: 'grey.200', fontWeight: 600 }} />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Cualquier ayuda es bienvenida.
                </Typography>
              )}
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Título de la emergencia"
              fullWidth
              required
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />

            <TextField
              label="Descripción"
              fullWidth
              required
              multiline
              minRows={3}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel id="edit-type-label">Tipo de emergencia</InputLabel>
              <Select
                labelId="edit-type-label"
                label="Tipo de emergencia"
                value={editForm.type}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
              >
                {TYPE_OPTIONS.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Especialidades requeridas"
              placeholder="Ej: primeros auxilios, cocina comunitaria, conducción"
              fullWidth
              value={editForm.required_resources}
              onChange={(e) => setEditForm({ ...editForm, required_resources: e.target.value })}
              helperText="Separá cada especialidad con una coma."
            />

            <Alert severity="info">
              La dirección y ubicación no se editan desde este formulario.
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, justifyContent: 'flex-end', gap: 1 }}>
        {isEditing ? (
          <>
            <Button
              onClick={() => setIsEditing(false)}
              variant="outlined"
              sx={{ borderRadius: 2 }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEmergency}
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              sx={{ borderRadius: 2 }}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Cerrar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}