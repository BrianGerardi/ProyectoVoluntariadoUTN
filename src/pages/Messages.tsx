import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Paper, List, ListItemButton, ListItemText,
  ListItemAvatar, Avatar, TextField, IconButton, Chip,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Button,
} from '@mui/material';
import {
  Send as SendIcon,
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon,
  Chat as ChatIcon,
  Group as GroupIcon,
  PushPin as PushPinIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Emergency, Assignment, Message } from '../types';
import { emergencyService, assignmentService, messageService } from '../services/api';
import { URGENCY_COLORS, URGENCY_LABELS, TYPE_EMOJI } from '../constants';

export default function Messages() {
  const { token, user } = useAuth();

  const canSendMessages = user?.role === 'admin' || user?.role === 'coordinator';
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
          const data = await emergencyService.getAll();
          const mapped = data.map((em: Emergency) => ({
            id: em.id,
            emergency_id: em.id,
            user_id: user?.id || '',
            status: 'assigned',
            assigned_task: '',
            assigned_at: new Date().toISOString(),
            emergency_title: em.title,
            emergency_type: em.type,
            emergency_urgency: em.urgency,
            emergency_address: em.address || 'Ubicación en mapa',
          } as Assignment));
          setAssignments(mapped);
        } else {
          const data = await assignmentService.getMy();
          // Only show active assigned status
          setAssignments(data.filter((a: Assignment) => a.status === 'assigned'));
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
      const data = await messageService.getMessages(emergencyId);
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, []);

  // When an emergency is selected, load messages and start polling
  useEffect(() => {
    if (!selectedEmergency) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    if (!canSendMessages || !newMessage.trim() || !selectedEmergency || sending) return;
    setSending(true);
    try {
      const msg = await messageService.sendMessage(
        selectedEmergency.emergency_id,
        newMessage.trim(),
        canHighlightMessage && isImportantMessage
      );
      setMessages((prev) => [...prev, msg]);
      setNewMessage('');
      setIsImportantMessage(false);
    } catch (err) {
      console.error('Failed to send message:', err);
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
  if (!token || !user) {
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3, border: '1px solid', borderColor: 'divider',
          p: { xs: 4, md: 6 }, textAlign: 'center', maxWidth: 520, mx: 'auto', mt: 6,
        }}
      >
        <ChatIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
          Mensajes de Coordinación
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, mb: 3 }}>
          Acá se muestran los mensajes de las emergencias. Iniciá sesión para anotarte como voluntario y ver los chats de coordinación.
        </Typography>
        <Button variant="contained" component={Link} to="/login" sx={{ fontWeight: 'bold', borderRadius: 2 }}>
          Iniciar Sesión
        </Button>
      </Paper>
    );
  }

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
                <Avatar sx={{ bgcolor: (a.emergency_urgency && URGENCY_COLORS[a.emergency_urgency]) || '#666', width: 42, height: 42, fontSize: 20 }}>
                  {(a.emergency_type && TYPE_EMOJI[a.emergency_type]) || '⚠️'}
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
                label={(a.emergency_urgency && URGENCY_LABELS[a.emergency_urgency]) || a.emergency_urgency || ''}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  bgcolor: (a.emergency_urgency && URGENCY_COLORS[a.emergency_urgency]) || '#666',
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
              <Avatar sx={{ bgcolor: (selectedEmergency.emergency_urgency && URGENCY_COLORS[selectedEmergency.emergency_urgency]) || '#666', width: 38, height: 38, fontSize: 18 }}>
                {(selectedEmergency.emergency_type && TYPE_EMOJI[selectedEmergency.emergency_type]) || '⚠️'}
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
                label={(selectedEmergency.emergency_urgency && URGENCY_LABELS[selectedEmergency.emergency_urgency]) || selectedEmergency.emergency_urgency || ''}
                size="small"
                sx={{ bgcolor: (selectedEmergency.emergency_urgency && URGENCY_COLORS[selectedEmergency.emergency_urgency]) || '#666', color: '#fff', fontWeight: 600, fontSize: '0.72rem' }}
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
          <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            {canSendMessages ? (
              <>
                {canHighlightMessage && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isImportantMessage}
                        onChange={(e) => setIsImportantMessage(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Fijar mensaje importante"
                    sx={{ mb: 1 }}
                  />
                )}

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
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
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                Solo los administradores y coordinadores pueden enviar mensajes en este grupo.
              </Typography>
            )}
          </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
