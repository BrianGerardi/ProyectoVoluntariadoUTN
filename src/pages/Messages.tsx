import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Paper, List, ListItemButton, ListItemText,
  ListItemAvatar, Avatar, TextField, IconButton, Chip,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Send as SendIcon,
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon,
  Chat as ChatIcon,
  Group as GroupIcon,
  PushPin as PushPinIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface Assignment {
  id: string;
  emergency_id: string;
  status: string;
  emergency_title: string;
  emergency_type: string;
  emergency_urgency: string;
  emergency_address: string;
}

interface Message {
  id: string;
  emergency_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  metadata?: {
    important?: boolean;
  };
  created_at: string;
}

const URGENCY_COLORS: Record<string, string> = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  critical: '#9c27b0',
};

const URGENCY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

const TYPE_EMOJI: Record<string, string> = {
  'Incendio': '🔥',
  'Inundación': '🌊',
  'Terremoto': '🌍',
  'Salud / Accidente': '🚨',
  'Búsqueda y Rescate': '🔍',
  'Otro': '⚠️',
};

export default function Messages() {
  const { token, user } = useAuth();
  const canHighlightMessage = user?.role === 'admin' || user?.role === 'coordinator';
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedEmergency, setSelectedEmergency] = useState<Assignment | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isImportantMessage, setIsImportantMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Fetch user's assignments or all emergencies depending on role
  useEffect(() => {
    localStorage.setItem('lastCheckedMessages', new Date().toISOString());
    const fetchChats = async () => {
      try {
        const isCoord = user?.role === 'coordinator' || user?.role === 'admin';
        if (isCoord) {
          const res = await fetch('http://localhost:3001/api/emergencies', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) {
            const mapped = data.map((em: any) => ({
              id: em.id,
              emergency_id: em.id,
              status: 'assigned',
              emergency_title: em.title,
              emergency_type: em.type,
              emergency_urgency: em.urgency,
              emergency_address: em.address || 'Ubicación en mapa',
            }));
            setAssignments(mapped);
          }
        } else {
          const res = await fetch('http://localhost:3001/api/assignments/my', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) {
            // Only show active assigned status
            setAssignments(data.filter((a: Assignment) => a.status === 'assigned'));
          }
        }
      } catch (err) {
        console.error('Error fetching chats:', err);
      } finally {
        setLoading(false);
      }
    };
    if (token && user) fetchChats();
  }, [token, user]);

  // Fetch messages for the selected emergency
  const fetchMessages = useCallback(async (emergencyId: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/emergencies/${emergencyId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [token]);

  // When an emergency is selected, load messages and start polling
  useEffect(() => {
    if (!selectedEmergency) {
      setMessages([]);
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    setLoadingMessages(true);
    fetchMessages(selectedEmergency.emergency_id).finally(() => setLoadingMessages(false));

    // Poll for new messages every 5 seconds
    pollRef.current = setInterval(() => {
      fetchMessages(selectedEmergency.emergency_id);
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedEmergency, fetchMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedEmergency || sending) return;
    setSending(true);
    try {
      const res = await fetch(`http://localhost:3001/api/emergencies/${selectedEmergency.emergency_id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
         content: newMessage.trim(),
          is_important: canHighlightMessage && isImportantMessage,
      }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage('');
        setIsImportantMessage(false);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Hoy';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };
  const pinnedImportantMessage = [...messages]
  .reverse()
  .find((msg) => msg.metadata?.important);
  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const dateKey = formatDate(msg.created_at);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === dateKey) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date: dateKey, messages: [msg] });
    }
  });

  // ─── No assignments: empty state ───
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (assignments.length === 0) {
    const isCoord = user?.role === 'coordinator' || user?.role === 'admin';
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          p: { xs: 4, md: 6 },
          textAlign: 'center',
          maxWidth: 520,
          mx: 'auto',
          mt: 6,
        }}
      >
        <ChatIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
          Sin mensajes
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {isCoord 
            ? 'No hay emergencias activas reportadas en este momento. Cuando publiques una emergencia desde el Dashboard, se habilitará un canal de chat automáticamente para coordinar a los voluntarios.'
            : 'No estás asignado a ninguna emergencia todavía. Cuando te postules y seas aceptado en una emergencia, se creará un grupo de chat automáticamente donde podrás coordinar con otros voluntarios.'}
        </Typography>
      </Paper>
    );
  }

  // ─── Mobile: show chat or list ───
  // ─── Desktop: side-by-side ───

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', gap: 0, maxWidth: 1100, mx: 'auto' }}>
      {/* ─── Sidebar: Emergency Groups ─── */}
      <Paper
        elevation={0}
        sx={{
          width: { xs: selectedEmergency ? 0 : '100%', md: 320 },
          minWidth: { md: 320 },
          display: { xs: selectedEmergency ? 'none' : 'flex', md: 'flex' },
          flexDirection: 'column',
          borderRadius: { xs: 3, md: '12px 0 0 12px' },
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Grupos de Emergencia
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {assignments.length} {assignments.length === 1 ? 'emergencia' : 'emergencias'}
          </Typography>
        </Box>
        <List sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          {assignments.map((a) => (
            <ListItemButton
              key={a.id}
              selected={selectedEmergency?.emergency_id === a.emergency_id}
              onClick={() => setSelectedEmergency(a)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.50',
                  '&:hover': { bgcolor: 'primary.100' },
                },
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: URGENCY_COLORS[a.emergency_urgency] || '#666', width: 42, height: 42, fontSize: 20 }}>
                  {TYPE_EMOJI[a.emergency_type] || '⚠️'}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={a.emergency_title}
                secondary={a.emergency_address || 'Sin dirección'}
                slotProps={{
                  primary: { sx: { fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
                  secondary: { sx: { fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
                }}
              />
              <Chip
                label={URGENCY_LABELS[a.emergency_urgency] || a.emergency_urgency}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  bgcolor: URGENCY_COLORS[a.emergency_urgency] || '#666',
                  color: '#fff',
                  height: 22,
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Paper>

      {/* ─── Chat Area ─── */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: { xs: selectedEmergency ? 'flex' : 'none', md: 'flex' },
          flexDirection: 'column',
          borderRadius: { xs: 3, md: '0 12px 12px 0' },
          border: '1px solid',
          borderColor: 'divider',
          borderLeft: { md: 'none' },
          overflow: 'hidden',
        }}
      >
        {!selectedEmergency ? (
          // No chat selected (desktop)
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'text.disabled', p: 4 }}>
            <GroupIcon sx={{ fontSize: 56, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Seleccioná una emergencia
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Elegí un grupo del panel izquierdo para ver los mensajes
            </Typography>
          </Box>
        ) : (
          <>
            {/* Chat header */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'rgba(241,245,249,0.5)' }}>
              <IconButton
                onClick={() => setSelectedEmergency(null)}
                sx={{ display: { xs: 'inline-flex', md: 'none' } }}
                size="small"
              >
                <ArrowBackIcon />
              </IconButton>
              <Avatar sx={{ bgcolor: URGENCY_COLORS[selectedEmergency.emergency_urgency], width: 38, height: 38, fontSize: 18 }}>
                {TYPE_EMOJI[selectedEmergency.emergency_type] || '⚠️'}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedEmergency.emergency_title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedEmergency.emergency_address}
                </Typography>
              </Box>
              <Chip
                icon={<WarningIcon sx={{ fontSize: 14, color: '#fff !important' }} />}
                label={URGENCY_LABELS[selectedEmergency.emergency_urgency]}
                size="small"
                sx={{ bgcolor: URGENCY_COLORS[selectedEmergency.emergency_urgency], color: '#fff', fontWeight: 600, fontSize: '0.72rem' }}
              />
            </Box>
            {pinnedImportantMessage && (
            <Box
              sx={{
                p: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'rgba(255, 193, 7, 0.15)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
              }}
            >
              <PushPinIcon sx={{ color: 'warning.main', mt: 0.2 }} />
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                  MENSAJE IMPORTANTE
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {pinnedImportantMessage.content}
                </Typography>
              </Box>
            </Box>
          )}
            {/* Messages */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
              {loadingMessages ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', pt: 8, color: 'text.disabled' }}>
                  <ChatIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
                  <Typography variant="body2">No hay mensajes aún. ¡Sé el primero en escribir!</Typography>
                </Box>
              ) : (
                groupedMessages.map((group) => (
                  <Box key={group.date}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                      <Chip label={group.date} size="small" sx={{ bgcolor: 'grey.200', fontWeight: 600, fontSize: '0.72rem' }} />
                    </Box>
                    {group.messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id;
                      return (
                        <Box
                          key={msg.id}
                          sx={{
                            display: 'flex',
                            justifyContent: isOwn ? 'flex-end' : 'flex-start',
                            mb: 1,
                          }}
                        >
                          <Box
                            sx={{
                              maxWidth: '75%',
                              bgcolor: isOwn ? 'primary.main' : 'background.paper',
                              color: isOwn ? '#fff' : 'text.primary',
                              borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              px: 2,
                              py: 1,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                              border: isOwn ? 'none' : '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            {!isOwn && (
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', display: 'block', mb: 0.25 }}>
                                {msg.sender_name}
                              </Typography>
                            )}
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}>
                              {msg.content}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                textAlign: 'right',
                                mt: 0.5,
                                opacity: 0.7,
                                fontSize: '0.68rem',
                              }}
                            >
                              {formatTime(msg.created_at)}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                ))
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'flex-end', bgcolor: 'background.paper' }}>
              {canHighlightMessage && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isImportantMessage}
                        onChange={(e) => setIsImportantMessage(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Mensaje importante"
                    sx={{ mr: 1, whiteSpace: 'nowrap' }}
                  />
                )}
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Escribí un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: 'grey.50',
                  },
                }}
              />
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                sx={{
                  bgcolor: 'primary.main',
                  color: '#fff',
                  width: 40,
                  height: 40,
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&.Mui-disabled': { bgcolor: 'grey.200', color: 'grey.400' },
                }}
              >
                {sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ fontSize: 20 }} />}
              </IconButton>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
