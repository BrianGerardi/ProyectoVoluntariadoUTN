/**
 * @file SafetyTips.tsx
 * @description Tarjeta informativa con consejos de seguridad
 * para voluntarios que participan en emergencias.
 */
import {
  Card, CardContent, Typography,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

export default function SafetyTips() {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Consejos de Seguridad
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          1. Revisa constantemente las tareas asignadas por el coordinador antes de asistir al lugar.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          2. Utiliza el <strong>Chat de Coordinación</strong> para reportar tu llegada y comunicarte con tu equipo.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          3. No te expongas a riesgos innecesarios. Sigue siempre las indicaciones de protección civil.
        </Typography>
      </CardContent>
    </Card>
  );
}
