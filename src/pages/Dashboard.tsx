import React, { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  LocationOn as LocationOnIcon,
  Group as GroupIcon,
  Warning as WarningIcon,
  Handyman as HandIcon,
  Chat as ChatIcon,
  AddLocationAlt as AddLocationIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
} from '@mui/icons-material';
import EmergencyMap from '../components/EmergencyMap';
import EmergencyDetailsDialog from '../components/EmergencyDetailsDialog';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user, token } = useAuth();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [myAssignments, setMyAssignments] = useState<any[]>([]);
  
  // Dashboard Tab state: 0 = Voluntario, 1 = Coordinador
  const [currentTab, setCurrentTab] = useState(0);

  // Modal / Dialog for Emergency details & chat
  const [selectedEmergency, setSelectedEmergency] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // --- Coordinator State ---
  // Create emergency form
  const [creationForm, setCreationForm] = useState({
    title: '',
    description: '',
    type: 'Incendio',
    urgency: 'medium',
    address: '',
    required_resources: '',
    latitude: '',
    longitude: '',
  });
  const [creationStatus, setCreationStatus] = useState({ success: '', error: '' });
  const [tempNewLocation, setTempNewLocation] = useState<[number, number] | null>(null);

  // Manage volunteers form
  const [selectedEmergencyToManage, setSelectedEmergencyToManage] = useState<string>('');
  const [postulatedVolunteers, setPostulatedVolunteers] = useState<any[]>([]);
  const [managementStatus, setManagementStatus] = useState({ success: '', error: '' });
  const [assignmentEdits, setAssignmentEdits] = useState<{
    [assignmentId: string]: { status: string; assigned_task: string };
  }>({});

  // Request browser geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location", error);
          fetchEmergencies();
        }
      );
    } else {
      fetchEmergencies();
    }
  }, []);

  // Fetch emergencies when user location is available
  useEffect(() => {
    if (userLocation) {
      fetchEmergencies(userLocation[0], userLocation[1]);
    } else {
      fetchEmergencies();
    }
  }, [userLocation]);

  // Fetch user assignments on load
  useEffect(() => {
    if (token) {
      fetchMyAssignments();
    }
  }, [token]);

  const fetchEmergencies = async (lat?: number, lng?: number) => {
    try {
      let url = 'http://localhost:3001/api/emergencies';
      if (lat !== undefined && lng !== undefined) {
        url += `?lat=${lat}&lng=${lng}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setEmergencies(data);
    } catch (err) {
      console.error('Failed to fetch emergencies', err);
    }
  };

  const fetchMyAssignments = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/assignments/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyAssignments(data);
      }
    } catch (err) {
      console.error('Failed to fetch my assignments', err);
    }
  };

  const handlePostulate = async (emergencyId: string) => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emergency_id: emergencyId }),
      });
      
      if (res.ok) {
        // Refresh assignments and list
        fetchMyAssignments();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al postularse');
      }
    } catch (err) {
      console.error('Failed to postulate', err);
    }
  };

  // --- Coordinator Handlers ---
  const handleMapClick = (lat: number, lng: number) => {
    if (currentTab === 1) { // Only handle click if in coordinator tab
      setTempNewLocation([lat, lng]);
      setCreationForm((prev) => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }));
    }
  };

  const handleCreateEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreationStatus({ success: '', error: '' });

    if (!creationForm.latitude || !creationForm.longitude) {
      setCreationStatus({ success: '', error: 'Por favor, haz clic en el mapa para marcar la ubicación de la emergencia.' });
      return;
    }

    try {
      const resourcesArray = creationForm.required_resources
        ? creationForm.required_resources.split(',').map((r) => r.trim()).filter((r) => r !== '')
        : [];

      const res = await fetch('http://localhost:3001/api/emergencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: creationForm.title,
          description: creationForm.description,
          type: creationForm.type,
          urgency: creationForm.urgency,
          latitude: creationForm.latitude,
          longitude: creationForm.longitude,
          address: creationForm.address,
          required_resources: resourcesArray,
        }),
      });

      if (res.ok) {
        setCreationStatus({ success: 'Emergencia creada con éxito y publicada en el mapa.', error: '' });
        setCreationForm({
          title: '',
          description: '',
          type: 'Incendio',
          urgency: 'medium',
          address: '',
          required_resources: '',
          latitude: '',
          longitude: '',
        });
        setTempNewLocation(null);
        // Refresh emergencies list
        if (userLocation) {
          fetchEmergencies(userLocation[0], userLocation[1]);
        } else {
          fetchEmergencies();
        }
      } else {
        const data = await res.json();
        setCreationStatus({ success: '', error: data.error || 'No se pudo crear la emergencia.' });
      }
    } catch (err) {
      console.error(err);
      setCreationStatus({ success: '', error: 'Error de servidor al crear la emergencia.' });
    }
  };

  // Fetch volunteers postulated for chosen emergency
  useEffect(() => {
    const fetchVolunteers = async () => {
      if (!selectedEmergencyToManage || !token) {
        setPostulatedVolunteers([]);
        return;
      }
      try {
        const res = await fetch(`http://localhost:3001/api/emergencies/${selectedEmergencyToManage}/assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPostulatedVolunteers(data);
          
          // Pre-populate assignment edit state
          const initialEdits: any = {};
          data.forEach((item: any) => {
            initialEdits[item.id] = {
              status: item.status,
              assigned_task: item.assigned_task || '',
            };
          });
          setAssignmentEdits(initialEdits);
        }
      } catch (err) {
        console.error('Error fetching volunteers', err);
      }
    };

    fetchVolunteers();
  }, [selectedEmergencyToManage, token]);

  const handleAssignmentEditChange = (assignmentId: string, field: string, value: string) => {
    setAssignmentEdits((prev) => ({
      ...prev,
      [assignmentId]: {
        ...prev[assignmentId],
        [field]: value,
      },
    }));
  };

  const handleUpdateAssignment = async (assignmentId: string) => {
    setManagementStatus({ success: '', error: '' });
    const editData = assignmentEdits[assignmentId];
    if (!editData) return;

    try {
      const res = await fetch(`http://localhost:3001/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: editData.status,
          assigned_task: editData.assigned_task,
        }),
      });

      if (res.ok) {
        setManagementStatus({ success: 'Asignación de voluntario actualizada exitosamente.', error: '' });
        // Refresh volunteer lists
        const updatedRes = await fetch(`http://localhost:3001/api/emergencies/${selectedEmergencyToManage}/assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (updatedRes.ok) {
          const data = await updatedRes.json();
          setPostulatedVolunteers(data);
        }
        fetchMyAssignments(); // Also sync my assignments
      } else {
        const data = await res.json();
        setManagementStatus({ success: '', error: data.error || 'Error al actualizar asignación.' });
      }
    } catch (err) {
      console.error(err);
      setManagementStatus({ success: '', error: 'Error de servidor al guardar asignación.' });
    }
  };

  // Helper to open details dialog
  const handleOpenDetails = (emergencyId: string) => {
    const em = emergencies.find((e) => e.id === emergencyId);
    if (em) {
      setSelectedEmergency(em);
      setIsDetailsOpen(true);
    }
  };

  const isCoordinator = user?.role === 'coordinator' || user?.role === 'admin';

  return (
    <>
      {/* Top Header Section */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom color="text.primary" sx={{ fontWeight: 'bold' }}>
            Bienvenido/a, {user?.full_name || 'Voluntario'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isCoordinator 
              ? 'Panel de control. Gestiona alertas de emergencias y coordina voluntarios sobre el terreno.'
              : 'Tu ayuda es vital hoy. Revisa las emergencias activas cerca de ti y únete a un equipo.'}
          </Typography>
        </Box>

        {isCoordinator && (
          <Paper sx={{ borderRadius: 2 }} elevation={1}>
            <Tabs 
              value={currentTab} 
              onChange={(_, val) => setCurrentTab(val)}
              textColor="primary"
              indicatorColor="primary"
              aria-label="panels tabs"
            >
              <Tab label="Vista Voluntario" sx={{ fontWeight: 700 }} />
              <Tab label="Vista Coordinador" sx={{ fontWeight: 700 }} />
            </Tabs>
          </Paper>
        )}
      </Box>

      {/* TABS CONTAINER */}
      {currentTab === 0 ? (
        /* VOLUNTEER VIEW */
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Emergency Card List */}
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Emergencias Activas
              </Typography>

              {emergencies.length === 0 ? (
                <Card>
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No hay emergencias activas reportadas en este momento.</Typography>
                  </CardContent>
                </Card>
              ) : (
                emergencies.map((em) => {
                  // Check if user is postulated to this emergency
                  const assignment = myAssignments.find((a) => a.emergency_id === em.id);
                  const isPostulated = !!assignment;
                  const status = assignment?.status;
                  const assignedTask = assignment?.assigned_task;

                  return (
                    <Card key={em.id} sx={{ position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderRadius: 3 }}>
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: 6, 
                        height: '100%', 
                        bgcolor: em.urgency === 'critical' ? 'error.main' : em.urgency === 'high' ? 'error.light' : 'warning.main' 
                      }} />
                      <CardContent sx={{ p: 3, ml: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={em.urgency.toUpperCase()} 
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

                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                          {em.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                          {em.description}
                        </Typography>

                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid>
                            <Chip
                              icon={<LocationOnIcon sx={{ fontSize: '18px !important', color: 'primary.main' }} />}
                              label={em.address || "Ubicación en mapa"}
                              variant="outlined"
                              sx={{ border: 'none', bgcolor: 'rgba(0, 82, 203, 0.05)', fontWeight: 600 }}
                            />
                          </Grid>
                          {em.distance !== undefined && (
                            <Grid>
                              <Chip
                                icon={<GroupIcon sx={{ fontSize: '18px !important' }} />}
                                label={`A ${(em.distance / 1000).toFixed(1)} km`}
                                variant="outlined"
                                sx={{ border: 'none', bgcolor: 'rgba(73, 96, 124, 0.05)', fontWeight: 600 }}
                              />
                            </Grid>
                          )}
                        </Grid>

                        {/* Postulation feedback */}
                        {isPostulated && (
                          <Paper sx={{ p: 2, mb: 3, border: '1px solid', borderColor: status === 'assigned' ? 'success.light' : 'warning.light', bgcolor: status === 'assigned' ? 'rgba(46, 125, 50, 0.05)' : 'rgba(237, 108, 2, 0.05)' }} elevation={0}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              {status === 'assigned' ? <CheckCircleIcon color="success" /> : <PendingIcon color="warning" />}
                              <Typography variant="subtitle2" color={status === 'assigned' ? 'success.main' : 'warning.main'} sx={{ fontWeight: 'bold' }}>
                                {status === 'assigned' ? 'ASIGNADO' : 'POSTULACIÓN EN REVISIÓN'}
                              </Typography>
                            </Box>
                            {status === 'assigned' && assignedTask && (
                              <Typography variant="body2" sx={{ fontWeight: '500' }}>
                                <strong>Tarea Asignada:</strong> {assignedTask}
                              </Typography>
                            )}
                          </Paper>
                        )}

                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                          {!isPostulated ? (
                            <Button 
                              variant="contained" 
                              color="primary" 
                              startIcon={<HandIcon />}
                              onClick={() => handlePostulate(em.id)}
                              sx={{ py: 1.2, px: 3, fontWeight: 700, borderRadius: 2 }}
                            >
                              POSTULARME AHORA
                            </Button>
                          ) : (
                            <Button 
                              disabled 
                              variant="outlined"
                              sx={{ py: 1.2, px: 3, borderRadius: 2, fontWeight: 700 }}
                            >
                              {status === 'pending' && 'POSTULACIÓN PENDIENTE'}
                              {status === 'assigned' && 'ASIGNADO'}
                              {status === 'completed' && 'AYUDA FINALIZADA'}
                              {status === 'cancelled' && 'CANCELADO'}
                            </Button>
                          )}
                          
                          <Button 
                            variant="outlined" 
                            color="secondary" 
                            startIcon={<ChatIcon />}
                            onClick={() => handleOpenDetails(em.id)}
                            sx={{ py: 1.2, px: 3, fontWeight: 700, borderRadius: 2 }}
                          >
                            CHAT / DETALLES
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })
              )}

              {/* Map */}
              <Box sx={{ height: 400, borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <EmergencyMap 
                  userLocation={userLocation} 
                  emergencies={emergencies} 
                  onSelectEmergency={handleOpenDetails}
                />
              </Box>
            </Box>
          </Grid>

          {/* Side Column: Info and My Postulations */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* My Assignments list */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentTurnedInIcon color="primary" />
                    Mis Tareas y Ayudas
                  </Typography>

                  {myAssignments.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                      No te has postulado a ninguna emergencia todavía.
                    </Typography>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {myAssignments.map((as, idx) => (
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
                          {idx < myAssignments.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>

              {/* Tips / Instructions */}
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
            </Box>
          </Grid>
        </Grid>
      ) : (
        /* COORDINATOR VIEW */
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Creator Form */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddLocationIcon color="primary" />
                    Publicar Emergencia
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
                    Completa el formulario y haz clic en el mapa de la derecha para fijar las coordenadas exactas de la alerta.
                  </Typography>

                  {creationStatus.success && <Alert severity="success" sx={{ mb: 2 }}>{creationStatus.success}</Alert>}
                  {creationStatus.error && <Alert severity="error" sx={{ mb: 2 }}>{creationStatus.error}</Alert>}

                  <form onSubmit={handleCreateEmergency}>
                    <TextField
                      label="Título de la Emergencia"
                      fullWidth
                      size="small"
                      margin="normal"
                      required
                      value={creationForm.title}
                      onChange={(e) => setCreationForm({ ...creationForm, title: e.target.value })}
                    />
                    <TextField
                      label="Descripción"
                      fullWidth
                      size="small"
                      margin="normal"
                      multiline
                      rows={3}
                      required
                      value={creationForm.description}
                      onChange={(e) => setCreationForm({ ...creationForm, description: e.target.value })}
                    />
                    <FormControl fullWidth size="small" margin="normal">
                      <InputLabel id="type-select-label">Tipo de Emergencia</InputLabel>
                      <Select
                        labelId="type-select-label"
                        value={creationForm.type}
                        label="Tipo de Emergencia"
                        onChange={(e) => setCreationForm({ ...creationForm, type: e.target.value })}
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
                        value={creationForm.urgency}
                        label="Urgencia"
                        onChange={(e) => setCreationForm({ ...creationForm, urgency: e.target.value })}
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
                      fullWidth
                      size="small"
                      margin="normal"
                      required
                      value={creationForm.address}
                      onChange={(e) => setCreationForm({ ...creationForm, address: e.target.value })}
                    />
                    <TextField
                      label="Especialidades Requeridas (separadas por coma)"
                      placeholder="Primeros Auxilios, Conducción"
                      fullWidth
                      size="small"
                      margin="normal"
                      value={creationForm.required_resources}
                      onChange={(e) => setCreationForm({ ...creationForm, required_resources: e.target.value })}
                    />

                    <Box sx={{ mt: 2, mb: 1, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed', borderColor: 'grey.300' }}>
                      <Typography variant="caption" gutterBottom color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>
                        Coordenadas del Suceso:
                      </Typography>
                      {creationForm.latitude && creationForm.longitude ? (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          Lat: {creationForm.latitude} | Lng: {creationForm.longitude}
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
            </Box>
          </Grid>

          <Grid size={{ xs: 12, lg: 8 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Coordinator Map View */}
              <Box sx={{ height: 400, borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: 12, left: 50, zIndex: 1000, bgcolor: 'background.paper', p: 1, borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                    Modo Editor: Haz clic en el mapa para posicionar la nueva alerta.
                  </Typography>
                </Box>
                <EmergencyMap 
                  userLocation={userLocation} 
                  emergencies={emergencies} 
                  onMapClick={handleMapClick}
                  tempNewLocation={tempNewLocation}
                  onSelectEmergency={handleOpenDetails}
                />
              </Box>

              {/* Manage Postulations Panel */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon color="primary" />
                    Gestionar Voluntarios y Tareas
                  </Typography>

                  <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                    <InputLabel id="manage-em-select-label">Seleccionar Emergencia</InputLabel>
                    <Select
                      labelId="manage-em-select-label"
                      value={selectedEmergencyToManage}
                      label="Seleccionar Emergencia"
                      onChange={(e) => setSelectedEmergencyToManage(e.target.value)}
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

                  {managementStatus.success && <Alert severity="success" sx={{ mb: 2 }}>{managementStatus.success}</Alert>}
                  {managementStatus.error && <Alert severity="error" sx={{ mb: 2 }}>{managementStatus.error}</Alert>}

                  {!selectedEmergencyToManage ? (
                    <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography color="text.secondary">
                        Selecciona una emergencia de la lista de arriba para gestionar a las personas postuladas.
                      </Typography>
                    </Box>
                  ) : postulatedVolunteers.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography color="text.secondary">
                        Ningún voluntario se ha postulado a esta emergencia todavía.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {postulatedVolunteers.map((vol) => {
                        const edit = assignmentEdits[vol.id] || { status: vol.status, assigned_task: vol.assigned_task || '' };
                        return (
                          <Paper key={vol.id} variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                              {/* Volunteer profile info */}
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

                              {/* Form to update status and tasks */}
                              <Grid container size={{ xs: 12, md: 6 }} spacing={1.5} sx={{ alignItems: 'center' }}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                  <FormControl fullWidth size="small">
                                    <InputLabel id={`status-label-${vol.id}`}>Estado</InputLabel>
                                    <Select
                                      labelId={`status-label-${vol.id}`}
                                      value={edit.status}
                                      label="Estado"
                                      onChange={(e) => handleAssignmentEditChange(vol.id, 'status', e.target.value)}
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
                                    fullWidth
                                    size="small"
                                    value={edit.assigned_task}
                                    onChange={(e) => handleAssignmentEditChange(vol.id, 'assigned_task', e.target.value)}
                                    disabled={edit.status !== 'assigned'}
                                  />
                                </Grid>
                                <Grid size={12} sx={{ textAlign: 'right' }}>
                                  <Button
                                    variant="contained"
                                    color="success"
                                    size="small"
                                    onClick={() => handleUpdateAssignment(vol.id)}
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

            </Box>
          </Grid>
        </Grid>
      )}

      {/* Emergency details and Chat Dialog */}
      {selectedEmergency && (
        <EmergencyDetailsDialog
          open={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedEmergency(null);
          }}
          emergency={selectedEmergency}
          token={token}
          currentUserId={user?.id}
        />
      )}
    </>
  );
}
