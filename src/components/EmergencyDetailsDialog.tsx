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
  token,
  currentUserId,
}: EmergencyDetailsDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchMessages = async () => {
    if (!emergency || !token) return;
    try {
      const res = await fetch(`http://localhost:3001/api/emergencies/${emergency.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Fetch messages initially and set up polling
  useEffect(() => {
    if (open && emergency) {
      setLoadingMessages(true);
      fetchMessages().finally(() => setLoadingMessages(false));

      const interval = setInterval(() => {
        fetchMessages();
      }, 4000); // Poll every 4 seconds

      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [open, emergency, token]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !emergency || !token) return;

    try {
      const res = await fetch(`http://localhost:3001/api/emergencies/${emergency.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        const sentMsg = await res.json();
        setMessages((prev) => [...prev, sentMsg]);
        setNewMessage('');
      } else {
        console.error('Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

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
      maxWidth="md"
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

      <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: '60vh' }}>
        {/* Left Side: Emergency Info */}
        <Box sx={{ width: { xs: '100%', md: '45%' }, p: 3, overflowY: 'auto', borderRight: { md: '1px solid' }, borderColor: 'divider' }}>
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
        </Box>

        {/* Right Side: Chat Panel */}
        <Box sx={{ width: { xs: '100%', md: '55%' }, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
              <WarningIcon color="warning" sx={{ fontSize: 18 }} />
              Chat de Coordinación y Asistencia
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Canal interno para coordinar tareas entre voluntarios y coordinadores.
            </Typography>
          </Box>

          {/* Message List */}
          <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', bgcolor: 'grey.100', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {loadingMessages ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ my: 'auto' }}>
                Cargando mensajes...
              </Typography>
            ) : messages.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ my: 'auto' }}>
                No hay mensajes en este chat. Escribe un mensaje para iniciar la coordinación.
              </Typography>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === currentUserId;
                return (
                  <Box
                    key={msg.id}
                    sx={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', mb: 0.2, px: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px', fontWeight: 'bold' }}>
                        {isMe ? 'Tú' : msg.sender_name}
                      </Typography>
                    </Box>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 1.5,
                        bgcolor: isMe ? 'primary.main' : 'background.paper',
                        color: isMe ? 'primary.contrastText' : 'text.primary',
                        borderRadius: isMe ? '12px 12px 0px 12px' : '12px 12px 12px 0px',
                      }}
                    >
                      <Typography variant="body2">{msg.content}</Typography>
                    </Paper>
                    <Box sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', mt: 0.2, px: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '9px' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Send Input */}
          <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, bgcolor: 'background.paper', display: 'flex', gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <TextField
              placeholder="Escribe un mensaje de coordinación..."
              size="small"
              fullWidth
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!newMessage.trim()}
              sx={{ borderRadius: 2, minWidth: 50, p: 1 }}
            >
              <SendIcon />
            </Button>
          </Box>
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
