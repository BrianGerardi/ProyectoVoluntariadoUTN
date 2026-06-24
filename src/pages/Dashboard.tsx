/**
 * @file Dashboard.tsx
 * @description Página principal del panel de control.
 * Muestra las emergencias activas, el mapa, las postulaciones del voluntario
 * y, para coordinadores/admin, herramientas de creación y gestión.
 *
 * La lógica de renderizado está delegada a sub-componentes:
 * - {@link EmergencyCard} — Tarjeta individual de emergencia
 * - {@link VolunteerAssignmentsList} — Panel lateral de tareas del voluntario
 * - {@link SafetyTips} — Consejos de seguridad
 * - {@link CoordinatorCreateForm} — Formulario de creación de emergencias
 * - {@link CoordinatorManagePanel} — Panel de gestión de voluntarios
 */
import React, { useState, useEffect } from 'react';
import {
  Typography, Grid, Card, CardContent, Box, Paper, Tabs, Tab,
} from '@mui/material';
import EmergencyMap from '../components/EmergencyMap';
import EmergencyDetailsDialog from '../components/EmergencyDetailsDialog';
import EmergencyCard from '../components/dashboard/EmergencyCard';
import VolunteerAssignmentsList from '../components/dashboard/VolunteerAssignmentsList';
import SafetyTips from '../components/dashboard/SafetyTips';
import CoordinatorCreateForm from '../components/dashboard/CoordinatorCreateForm';
import CoordinatorManagePanel from '../components/dashboard/CoordinatorManagePanel';
import { useAuth } from '../contexts/AuthContext';
import type { Emergency, Assignment } from '../types';
import { emergencyService, assignmentService } from '../services/api';

export default function Dashboard() {
  const { user, token } = useAuth();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [myAssignments, setMyAssignments] = useState<Assignment[]>([]);

  // Dashboard Tab state: 0 = Voluntario, 1 = Coordinador
  const [currentTab, setCurrentTab] = useState(0);

  // Modal / Dialog for Emergency details
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // --- Coordinator State ---
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

  // Manage volunteers
  const [selectedEmergencyToManage, setSelectedEmergencyToManage] = useState<string>('');
  const [postulatedVolunteers, setPostulatedVolunteers] = useState<Assignment[]>([]);
  const [managementStatus, setManagementStatus] = useState({ success: '', error: '' });
  const [assignmentEdits, setAssignmentEdits] = useState<{
    [assignmentId: string]: { status: string; assigned_task: string };
  }>({});

  const [emergencyAssignments, setEmergencyAssignments] = useState<{ [emId: string]: Assignment[] }>({});

  // ─── Data fetching ─────────────────────────────────────────

  const fetchEmergencies = async (lat?: number, lng?: number) => {
    try {
      const data = await emergencyService.getAll(lat, lng);
      setEmergencies(data);
    } catch (err) {
      console.error('Failed to fetch emergencies', err);
    }
  };

  const fetchMyAssignments = async () => {
    try {
      const data = await assignmentService.getMy();
      setMyAssignments(data);
    } catch (err) {
      console.error('Failed to fetch my assignments', err);
    }
  };

  const fetchAssignmentsForEmergency = async (emId: string) => {
    if (!token) return;
    try {
      const data = await emergencyService.getAssignments(emId);
      setEmergencyAssignments((prev) => ({ ...prev, [emId]: data }));
    } catch (err) {
      console.error('Failed to fetch emergency assignments', err);
    }
  };

  // ─── Effects ───────────────────────────────────────────────

  // Request browser geolocation on mount
  useEffect(() => {
    localStorage.setItem('lastCheckedEmergencies', new Date().toISOString());
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Error getting location', error);
          fetchEmergencies();
        }
      );
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchEmergencies();
    }
  }, []);

  // Fetch emergencies when user location is available
  useEffect(() => {
    if (userLocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchEmergencies(userLocation[0], userLocation[1]);
    } else {
      fetchEmergencies();
    }
  }, [userLocation]);

  // Fetch user assignments on load
  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMyAssignments();
    }
  }, [token]);

  // Load assignments for all emergencies if coordinator/admin
  useEffect(() => {
    const isCoord = user?.role === 'coordinator' || user?.role === 'admin';
    if (isCoord && token && emergencies.length > 0) {
      emergencies.forEach((em) => {
        fetchAssignmentsForEmergency(em.id);
      });
    }
  }, [emergencies, token, user]);

  // Fetch volunteers for selected emergency (coordinator panel)
  useEffect(() => {
    const fetchVolunteers = async () => {
      if (!selectedEmergencyToManage || !token) {
        setPostulatedVolunteers([]);
        return;
      }
      try {
        const data = await emergencyService.getAssignments(selectedEmergencyToManage);
        setPostulatedVolunteers(data);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const initialEdits: any = {};
        data.forEach((item: Assignment) => {
          initialEdits[item.id] = {
            status: item.status,
            assigned_task: item.assigned_task || '',
          };
        });
        setAssignmentEdits(initialEdits);
      } catch (err) {
        console.error('Error fetching volunteers', err);
      }
    };
    fetchVolunteers();
  }, [selectedEmergencyToManage, token]);

  // ─── Handlers ──────────────────────────────────────────────

  const handlePostulate = async (emergencyId: string) => {
    if (!token) return;
    try {
      await assignmentService.postulate(emergencyId);
      fetchMyAssignments();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.message || 'Error al postularse');
      console.error('Failed to postulate', err);
    }
  };

  const handleUpdateStatus = async (emId: string, assignmentId: string, status: string) => {
    if (!token) return;
    try {
      await assignmentService.updateStatus(assignmentId, status);
      fetchAssignmentsForEmergency(emId);
      fetchMyAssignments();
      if (selectedEmergencyToManage === emId) {
        const data = await emergencyService.getAssignments(selectedEmergencyToManage);
        setPostulatedVolunteers(data);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.message || 'Error al actualizar estado');
      console.error('Failed to update status', err);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (currentTab === 1) {
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

      await emergencyService.create({
        title: creationForm.title,
        description: creationForm.description,
        type: creationForm.type,
        urgency: creationForm.urgency,
        latitude: creationForm.latitude,
        longitude: creationForm.longitude,
        address: creationForm.address,
        required_resources: resourcesArray,
      });

      setCreationStatus({ success: 'Emergencia creada con éxito y publicada en el mapa.', error: '' });
      setCreationForm({
        title: '', description: '', type: 'Incendio', urgency: 'medium',
        address: '', required_resources: '', latitude: '', longitude: '',
      });
      setTempNewLocation(null);
      if (userLocation) {
        fetchEmergencies(userLocation[0], userLocation[1]);
      } else {
        fetchEmergencies();
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setCreationStatus({ success: '', error: err.message || 'Error al crear la emergencia.' });
    }
  };

  const handleAssignmentEditChange = (assignmentId: string, field: string, value: string) => {
    setAssignmentEdits((prev) => ({
      ...prev,
      [assignmentId]: { ...prev[assignmentId], [field]: value },
    }));
  };

  const handleUpdateAssignment = async (assignmentId: string) => {
    setManagementStatus({ success: '', error: '' });
    const editData = assignmentEdits[assignmentId];
    if (!editData) return;

    try {
      await assignmentService.updateAssignment(assignmentId, editData.status, editData.assigned_task);
      setManagementStatus({ success: 'Asignación de voluntario actualizada exitosamente.', error: '' });
      const data = await emergencyService.getAssignments(selectedEmergencyToManage);
      setPostulatedVolunteers(data);
      fetchMyAssignments();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setManagementStatus({ success: '', error: err.message || 'Error al guardar asignación.' });
    }
  };

  const handleDeleteEmergency = async (emergencyId: string) => {
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar esta emergencia? Esta acción no se puede deshacer y eliminará todas las postulaciones y mensajes asociados.');
    if (!confirmDelete) return;

    setManagementStatus({ success: '', error: '' });
    try {
      await emergencyService.delete(emergencyId);
      setManagementStatus({ success: 'Emergencia eliminada exitosamente.', error: '' });
      setSelectedEmergencyToManage('');
      if (userLocation) {
        fetchEmergencies(userLocation[0], userLocation[1]);
      } else {
        fetchEmergencies();
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setManagementStatus({ success: '', error: err.message || 'Error al eliminar la emergencia.' });
    }
  };

  const handleEmergencyUpdated = (updatedEmergency: Emergency) => {
    setEmergencies((prev) =>
      prev.map((em) => em.id === updatedEmergency.id ? { ...em, ...updatedEmergency } : em)
    );
    setSelectedEmergency((prev) =>
      prev ? { ...prev, ...updatedEmergency } : updatedEmergency
    );
  };

  const handleOpenDetails = (emergencyId: string) => {
    const em = emergencies.find((e) => e.id === emergencyId);
    if (em) {
      setSelectedEmergency(em);
      setIsDetailsOpen(true);
    }
  };

  // ─── Render ────────────────────────────────────────────────

  const isCoordinator = user?.role === 'coordinator' || user?.role === 'admin';

  return (
    <>
      {/* Encabezado + tabs de vista */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom color="text.primary" sx={{ fontWeight: 'bold' }}>
            Bienvenido/a, {user?.full_name || 'Invitado'}
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

      {/* Vista Voluntario */}
      {currentTab === 0 ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                emergencies.map((em) => (
                  <EmergencyCard
                    key={em.id}
                    emergency={em}
                    assignment={myAssignments.find((a) => a.emergency_id === em.id)}
                    emergencyAssignments={emergencyAssignments[em.id]}
                    isAuthenticated={!!token}
                    isCoordinator={isCoordinator}
                    onPostulate={handlePostulate}
                    onOpenDetails={handleOpenDetails}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))
              )}

              {/* Mapa */}
              <Box sx={{ height: 400, borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <EmergencyMap
                  userLocation={userLocation}
                  emergencies={emergencies}
                  onSelectEmergency={handleOpenDetails}
                />
              </Box>
            </Box>
          </Grid>

          {/* Panel lateral */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <VolunteerAssignmentsList
                isAuthenticated={!!token}
                assignments={myAssignments}
              />
              <SafetyTips />
            </Box>
          </Grid>
        </Grid>
      ) : (
        /* Vista Coordinador */
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 4 }}>
            <CoordinatorCreateForm
              formData={creationForm}
              onFormChange={setCreationForm}
              onSubmit={handleCreateEmergency}
              successMessage={creationStatus.success}
              errorMessage={creationStatus.error}
            />
          </Grid>

          <Grid size={{ xs: 12, lg: 8 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Mapa en modo editor */}
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

              <CoordinatorManagePanel
                emergencies={emergencies}
                selectedEmergencyId={selectedEmergencyToManage}
                onSelectEmergency={setSelectedEmergencyToManage}
                volunteers={postulatedVolunteers}
                assignmentEdits={assignmentEdits}
                onEditChange={handleAssignmentEditChange}
                onUpdateAssignment={handleUpdateAssignment}
                onDeleteEmergency={handleDeleteEmergency}
                successMessage={managementStatus.success}
                errorMessage={managementStatus.error}
              />
            </Box>
          </Grid>
        </Grid>
      )}

      {/* Diálogo de detalles de emergencia */}
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
          currentUserRole={user?.role}
          onEmergencyUpdated={handleEmergencyUpdated}
        />
      )}
    </>
  );
}
