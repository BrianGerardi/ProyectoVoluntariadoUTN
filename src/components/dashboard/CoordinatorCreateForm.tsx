/**
 * @file CoordinatorCreateForm.tsx
 * @description Formulario para que coordinadores y administradores
 * publiquen nuevas emergencias. Incluye campos para título, descripción,
 * tipo, urgencia, dirección, recursos requeridos y coordenadas del mapa.
 */
import React from 'react';
import {
  Card, CardContent, Box, Typography, TextField, Button, Alert,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { AddLocationAlt as AddLocationIcon } from '@mui/icons-material';

interface CreationFormData {
  title: string;
  description: string;
  type: string;
  urgency: string;
  address: string;
  required_resources: string;
  latitude: string;
  longitude: string;
}

interface CoordinatorCreateFormProps {
  /** Estado actual del formulario de creación. */
  formData: CreationFormData;
  /** Handler para actualizar los campos del formulario. */
  onFormChange: (data: CreationFormData) => void;
  /** Handler de envío del formulario. */
  onSubmit: (e: React.FormEvent) => void;
  /** Mensaje de éxito después de crear una emergencia. */
  successMessage: string;
  /** Mensaje de error si la creación falla. */
  errorMessage: string;
}

export default function CoordinatorCreateForm({
  formData,
  onFormChange,
  onSubmit,
  successMessage,
  errorMessage,
}: CoordinatorCreateFormProps) {
  const updateField = (field: keyof CreationFormData, value: string) => {
    onFormChange({ ...formData, [field]: value });
  };

  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddLocationIcon color="primary" />
          Publicar Emergencia
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
          Completa el formulario y haz clic en el mapa de la derecha para fijar las coordenadas exactas de la alerta.
        </Typography>

        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
        {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

        <form onSubmit={onSubmit}>
          <TextField
            label="Título de la Emergencia"
            fullWidth size="small" margin="normal" required
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
          />
          <TextField
            label="Descripción"
            fullWidth size="small" margin="normal" multiline rows={3} required
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
          />
          <FormControl fullWidth size="small" margin="normal">
            <InputLabel id="type-select-label">Tipo de Emergencia</InputLabel>
            <Select
              labelId="type-select-label"
              value={formData.type}
              label="Tipo de Emergencia"
              onChange={(e) => updateField('type', e.target.value)}
            >
              <MenuItem value="Incendio">Incendio</MenuItem>
              <MenuItem value="Inundación">Inundación</MenuItem>
              <MenuItem value="Terremoto">Terremoto</MenuItem>
              <MenuItem value="Salud / Accidente">Salud / Accidente</MenuItem>
              <MenuItem value="Búsqueda y Rescate">Búsqueda y Rescate</MenuItem>
              <MenuItem value="Otro">Otro</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" margin="normal">
            <InputLabel id="urgency-select-label">Urgencia</InputLabel>
            <Select
              labelId="urgency-select-label"
              value={formData.urgency}
              label="Urgencia"
              onChange={(e) => updateField('urgency', e.target.value)}
            >
              <MenuItem value="low">Baja</MenuItem>
              <MenuItem value="medium">Media</MenuItem>
              <MenuItem value="high">Alta</MenuItem>
              <MenuItem value="critical">Crítica</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Dirección Física"
            placeholder="Calle, Número, Localidad"
            fullWidth size="small" margin="normal" required
            value={formData.address}
            onChange={(e) => updateField('address', e.target.value)}
          />
          <TextField
            label="Especialidades Requeridas (separadas por coma)"
            placeholder="Primeros Auxilios, Conducción"
            fullWidth size="small" margin="normal"
            value={formData.required_resources}
            onChange={(e) => updateField('required_resources', e.target.value)}
          />

          <Box sx={{ mt: 2, mb: 1, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed', borderColor: 'grey.300' }}>
            <Typography variant="caption" gutterBottom color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>
              Coordenadas del Suceso:
            </Typography>
            {formData.latitude && formData.longitude ? (
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                Lat: {formData.latitude} | Lng: {formData.longitude}
              </Typography>
            ) : (
              <Typography variant="caption" color="error" sx={{ fontWeight: '600' }}>
                * Falta marcar la ubicación en el mapa.
              </Typography>
            )}
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, py: 1.2, fontWeight: 700 }}
          >
            PUBLICAR EN EL MAPA
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
