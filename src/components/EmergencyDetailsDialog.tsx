import React, { useState, useEffect, useRef } from 'react';
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
  Paper,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationOnIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

interface Message {
  id: string;
  emergency_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string;
}

interface EmergencyDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  emergency: any;
  token: string | null;
  currentUserId: string | undefined;
}

export default function EmergencyDetailsDialog({
  open,
  onClose,
  emergency,
}: EmergencyDetailsDialogProps) {
  if (!emergency) return null;

  // Format resources
  let resources: string[] = [];
  try {
    if (typeof emergency.required_resources === 'string') {
      resources = JSON.parse(emergency.required_resources);
    } else if (Array.isArray(emergency.required_resources)) {
      resources = emergency.required_resources;
    }
  } catch (e) {
    console.error('Error parsing resources', e);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
      {/* Dialog Header */}
      <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
        <Box>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            {emergency.title}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <ScheduleIcon sx={{ fontSize: 14 }} />
            Creada el: {new Date(emergency.created_at).toLocaleString()}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip
            label={emergency.urgency.toUpperCase()}
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
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: '600', display: 'block' }}>
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
      </DialogContent>

      <DialogActions sx={{ p: 2.5, justifyContent: 'flex-end' }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
