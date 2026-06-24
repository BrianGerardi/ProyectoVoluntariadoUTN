/**
 * @file Profile.tsx
 * @description Página de perfil de usuario. Permite visualizar y editar
 * datos personales, foto de perfil, banner, habilidades y ubicación.
 * Soporta vista propia y vista de otros usuarios (vía URL param).
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, Alert, Chip, Avatar,
  OutlinedInput, Select, MenuItem, FormControl, InputLabel,
  Checkbox, ListItemText, Autocomplete, CircularProgress,
  IconButton, Paper, Divider, Tooltip,
  Dialog, DialogContent, Slider, DialogTitle, DialogActions
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { userService } from '../services/api';
import { API_BASE_URL } from '../config';
import { SKILLS_OPTIONS, PROVINCIAS, ROLE_LABELS } from '../constants';
import type { User } from '../types';


interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  province: string;
  city: string;
  skills: string[];
  role: string;
  bio: string;
  description: string;
  profile_photo: string;
  banner: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
}

export default function Profile() {
  const { token, user, login } = useAuth();
  const { userId } = useParams<{ userId?: string }>();

  // ── Hooks (deben ir siempre antes de cualquier return) ────
  const isOwnProfile = !userId || userId === user?.id;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const emptyProfile: ProfileData = {
    full_name: '', email: '', phone: '', province: '', city: '',
    skills: [], role: 'volunteer', bio: '', description: '',
    profile_photo: '', banner: '', metadata: {},
  };
  const [profileData, setProfileData] = useState<ProfileData>(emptyProfile);
  const [editData, setEditData] = useState<ProfileData>(emptyProfile);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [customSkill, setCustomSkill] = useState('');
  const [localidades, setLocalidades] = useState<string[]>([]);
  const [loadingLocalidades, setLoadingLocalidades] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewField, setPreviewField] = useState<'profile_photo' | 'banner'>('profile_photo');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = userId
          ? await userService.getProfileById(userId)
          : await userService.getProfile();
        const meta = data.metadata || {};
        const loadedProfile = {
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          province: data.province || '',
          city: data.city || '',
          skills: data.skills || [],
          role: data.role || 'volunteer',
          bio: meta.bio || '',
          description: meta.description || '',
          profile_photo: meta.profile_photo || '',
          banner: meta.banner || '',
          metadata: meta,
        };
        setProfileData(loadedProfile);
        if (data.city) {
          setLocalidades([data.city]);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      }
    };
    if (token) fetchProfile();
  }, [token, userId]);

  const handleOpenEdit = () => {
    setEditData({ ...profileData });
    if (profileData.city) {
      setLocalidades([profileData.city]);
    } else {
      setLocalidades([]);
    }
    setIsEditOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditSkillsChange = (event: any) => {
    const { target: { value } } = event;
    setEditData({
      ...editData,
      skills: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleAddCustomSkill = () => {
    const skill = customSkill.trim();

    if (!skill) return;

    const alreadyExists = editData.skills.some(
      (s) => s.toLowerCase() === skill.toLowerCase()
    );

    if (!alreadyExists) {
      setEditData({
        ...editData,
        skills: [...editData.skills, skill],
      });
    }

    setCustomSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setEditData({
      ...editData,
      skills: editData.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  const allSkillsOptions = Array.from(
    new Set([...SKILLS_OPTIONS, ...editData.skills])
  ).filter((skill) => skill.trim() !== '');

  const fetchLocalidades = useCallback((provincia: string, search: string) => {
    clearTimeout(debounceTimer.current);
    if (!provincia || search.length < 2) {
      setLocalidades([]);
      return;
    }
    debounceTimer.current = setTimeout(async () => {
      setLoadingLocalidades(true);
      try {
        const url = `${API_BASE_URL}/api/georef/localidades?provincia=${encodeURIComponent(provincia)}&nombre=${encodeURIComponent(search)}`;
        const res = await fetch(url);
        const data = await res.json();
        setLocalidades(data.localidades || []);
      } catch (err) {
        console.error('Error buscando localidades:', err);
      } finally {
        setLoadingLocalidades(false);
      }
    }, 300);
  }, []);

  const handleEditProvinceChange = (newProvince: string) => {
    setEditData({ ...editData, province: newProvince, city: '' });
    setLocalidades([]);
  };

  // Compress image using canvas
  const compressImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = (h * maxWidth) / w;
            w = maxWidth;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (field: 'profile_photo' | 'banner') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar los 5MB');
      return;
    }

    try {
      const maxW = field === 'banner' ? 1400 : 500;
      const compressed = await compressImage(file, maxW, 0.8);
      setPreviewImage(compressed);
      setPreviewField(field);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    } catch {
      setError('Error al procesar la imagen');
    }
    e.target.value = '';
  };

  // Render the final cropped image via canvas
  const renderFinalImage = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!previewImage) return reject('No image');
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let outW: number, outH: number;
        // Preview container sizes (must match the dialog)
        let previewW: number, previewH: number;
        if (previewField === 'profile_photo') {
          outW = 300; outH = 300;
          previewW = 220; previewH = 220;
        } else {
          outW = 1200; outH = 340;
          previewW = 600; previewH = 220;
        }
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d')!;

        // Replicate CSS object-fit: cover
        const imgAspect = img.width / img.height;
        const outAspect = outW / outH;
        let drawW: number, drawH: number;
        if (imgAspect > outAspect) {
          // Image is wider than output: fit height, overflow width
          drawH = outH;
          drawW = outH * imgAspect;
        } else {
          // Image is taller than output: fit width, overflow height
          drawW = outW;
          drawH = outW / imgAspect;
        }

        // Apply zoom (scale from center)
        drawW *= zoom;
        drawH *= zoom;

        // Center the image, then apply offset (scaled from preview to output coords)
        const scaleX = outW / previewW;
        const scaleY = outH / previewH;
        const drawX = (outW - drawW) / 2 + offset.x * scaleX;
        const drawY = (outH - drawH) / 2 + offset.y * scaleY;

        if (previewField === 'profile_photo') {
          ctx.beginPath();
          ctx.arc(outW / 2, outH / 2, outW / 2, 0, Math.PI * 2);
          ctx.clip();
        }
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = previewImage;
    });
  };

  const handleImageSave = async () => {
    if (!previewImage) return;
    setSavingImage(true);
    setError('');

    try {
      const finalImage = await renderFinalImage();
      const newProfileData = { ...profileData, [previewField]: finalImage };
      const updatedMetadata = {
        ...newProfileData.metadata,
        bio: newProfileData.bio,
        description: newProfileData.description,
        profile_photo: newProfileData.profile_photo,
        banner: newProfileData.banner,
      };
      const data = await userService.updateProfile({
        full_name: newProfileData.full_name,
        phone: newProfileData.phone,
        province: newProfileData.province,
        city: newProfileData.city,
        skills: newProfileData.skills,
        role: newProfileData.role,
        metadata: updatedMetadata,
      });
      setProfileData(newProfileData);
      setSuccess(previewField === 'profile_photo' ? 'Foto de perfil actualizada' : 'Banner actualizado');
      if (user) {
        const nextUser = ('user' in data ? data.user : data) as User;
        const nextToken = ('token' in data ? data.token : token!);
        login(nextToken, nextUser);
      }
      setPreviewImage(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const updatedMetadata = {
        ...editData.metadata,
        bio: editData.bio,
        description: editData.description,
        profile_photo: editData.profile_photo,
        banner: editData.banner,
      };

      const data = await userService.updateProfile({
        full_name: editData.full_name,
        phone: editData.phone,
        province: editData.province,
        city: editData.city,
        skills: editData.skills,
        role: editData.role,
        metadata: updatedMetadata,
      });

      setSuccess('Perfil actualizado exitosamente');
      setProfileData({ ...editData });
      if (user) {
        const nextUser = ('user' in data ? data.user : data) as User;
        const nextToken = ('token' in data ? data.token : token!);
        login(nextToken, nextUser);
      }
      setIsEditOpen(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!token || !user) {
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3, border: '1px solid', borderColor: 'divider',
          p: { xs: 4, md: 6 }, textAlign: 'center', maxWidth: 520, mx: 'auto', mt: 6,
        }}
      >
        <PersonIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
          Mi Perfil
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, mb: 3 }}>
          Iniciá sesión para poder ver y editar tu perfil.
        </Typography>
        <Button variant="contained" component={Link} to="/login" sx={{ fontWeight: 'bold', borderRadius: 2 }}>
          Iniciar Sesión
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', pb: 4 }}>
      {/* Hidden file inputs */}
      <input
        type="file"
        accept="image/*"
        ref={photoInputRef}
        style={{ display: 'none' }}
        onChange={handleImageUpload('profile_photo')}
      />
      <input
        type="file"
        accept="image/*"
        ref={bannerInputRef}
        style={{ display: 'none' }}
        onChange={handleImageUpload('banner')}
      />

      {/* Banner */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 160, md: 220 },
          borderRadius: '16px 16px 0 0',
          overflow: 'hidden',
          background: profileData.banner
            ? `url(${profileData.banner}) center/cover no-repeat`
            : 'linear-gradient(135deg, #0052cb 0%, #00b4d8 50%, #48cae4 100%)',
          cursor: isOwnProfile ? 'pointer' : 'default',
          '&:hover .banner-overlay': {
            opacity: isOwnProfile ? 1 : 0,
          },
        }}
        onClick={isOwnProfile ? () => bannerInputRef.current?.click() : undefined}
      >
        {isOwnProfile && (
          <Box
            className="banner-overlay"
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.3s ease',
            }}
          >
            <Box sx={{ textAlign: 'center', color: '#fff' }}>
              <CameraIcon sx={{ fontSize: 36, mb: 0.5 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Cambiar banner
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Profile header section */}
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          borderRadius: '0 0 16px 16px',
          border: '1px solid',
          borderColor: 'divider',
          borderTop: 'none',
          px: { xs: 2, md: 4 },
          pb: 3,
          pt: { xs: 7, md: 8 },
          mb: 3,
        }}
      >
        {/* Avatar */}
        <Box
          sx={{
            position: 'absolute',
            top: { xs: -48, md: -56 },
            left: { xs: 16, md: 32 },
          }}
        >
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Avatar
              src={profileData.profile_photo || undefined}
              sx={{
                width: { xs: 96, md: 112 },
                height: { xs: 96, md: 112 },
                border: '4px solid',
                borderColor: 'background.paper',
                bgcolor: 'primary.main',
                fontSize: { xs: 36, md: 42 },
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              }}
            >
              {!profileData.profile_photo && profileData.full_name
                ? profileData.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : <PersonIcon sx={{ fontSize: 48 }} />
              }
            </Avatar>
            {isOwnProfile && (
              <Tooltip title="Cambiar foto de perfil">
                <IconButton
                  size="small"
                  onClick={() => photoInputRef.current?.click()}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: '#fff',
                    width: 32,
                    height: 32,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                >
                  <CameraIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Name + Role + Skills */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'flex-start' }, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {profileData.full_name || 'Sin nombre'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mt: 0.75 }}>
              <Chip
                label={ROLE_LABELS[profileData.role] || profileData.role}
                size="small"
                color="primary"
                sx={{ fontWeight: 600 }}
              />
              {profileData.skills.length > 0 && (
                <Typography variant="body2" color="text.disabled" sx={{ mx: 0.25 }}>•</Typography>
              )}
              {profileData.skills.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontWeight: 500,
                    borderRadius: '8px',
                    borderColor: 'grey.300',
                    color: 'text.secondary',
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              ))}
              {profileData.skills.length === 0 && (
                <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                  Sin aptitudes cargadas
                </Typography>
              )}
            </Box>
          </Box>
          {isOwnProfile && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={handleOpenEdit}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, flexShrink: 0 }}
            >
              Editar perfil
            </Button>
          )}
        </Box>

        {/* Description */}
        <Typography
          variant="body1"
          sx={{
            mt: 2,
            color: profileData.bio ? 'text.primary' : 'text.disabled',
            fontStyle: profileData.bio ? 'normal' : 'italic',
            lineHeight: 1.6,
          }}
        >
          {profileData.bio || "Sin descripción corta — Agregá una haciendo clic en 'Editar perfil'."}
        </Typography>

        {/* Info chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2.5 }}>
          {profileData.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <EmailIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2">{profileData.email}</Typography>
            </Box>
          )}
          {(profileData.city || profileData.province) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <LocationIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2">
                {[profileData.city, profileData.province].filter(Boolean).join(', ')}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Sobre mí */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', p: { xs: 3, md: 4 } }}>
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BadgeIcon sx={{ fontSize: 22, color: 'primary.main' }} /> Sobre mí
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: profileData.description ? 'text.primary' : 'text.disabled',
            fontStyle: profileData.description ? 'normal' : 'italic',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.7
          }}
        >
          {profileData.description || "Sin descripción aún. Hacé clic en 'Editar perfil' para agregar información sobre vos."}
        </Typography>
      </Paper>

      {/* ═══ Edit Profile Dialog ═══ */}
      <Dialog
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              p: 1
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Editar perfil</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1, pb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
              Información personal
            </Typography>
            <TextField
              label="Nombre Completo"
              name="full_name"
              fullWidth
              margin="dense"
              required
              value={editData.full_name}
              onChange={handleEditChange}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Teléfono"
              name="phone"
              fullWidth
              margin="dense"
              value={editData.phone}
              onChange={handleEditChange}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
              Ubicación
            </Typography>

            {/* Provincia */}
            <Autocomplete
              options={PROVINCIAS}
              value={editData.province || null}
              onChange={(_, newValue) => handleEditProvinceChange(newValue || '')}
              renderInput={(params) => (
                <TextField {...params} label="Provincia" margin="dense" required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              )}
              noOptionsText="No se encontró la provincia"
            />

            {/* Ciudad / Localidad */}
            <Autocomplete
              options={localidades}
              value={editData.city || null}
              disabled={!editData.province}
              loading={loadingLocalidades}
              filterOptions={(x) => x}
              onChange={(_, newValue) => setEditData({ ...editData, city: newValue || '' })}
              onInputChange={(_, newInputValue, reason) => {
                if (reason === 'input') {
                  fetchLocalidades(editData.province, newInputValue);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Ciudad / Localidad"
                  margin="dense"
                  required
                  helperText={!editData.province ? 'Seleccioná una provincia primero' : 'Escribí al menos 2 letras para buscar'}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              )}
              noOptionsText={loadingLocalidades ? 'Buscando...' : 'Escribí para buscar localidades'}
            />

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
              Aptitudes y Habilidades
            </Typography>

            <FormControl fullWidth margin="dense">
              <InputLabel id="skills-label">Especialidades / Habilidades</InputLabel>
              <Select
                labelId="skills-label"
                multiple
                open={skillsOpen}
                onOpen={() => setSkillsOpen(true)}
                onClose={() => setSkillsOpen(false)}
                value={editData.skills}
                onChange={handleEditSkillsChange}
                input={<OutlinedInput id="select-multiple-chip" label="Especialidades / Habilidades" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} color="primary" size="small" />
                    ))}
                  </Box>
                )}
                sx={{ borderRadius: 2 }}
                MenuProps={{
                  slotProps: {
                    paper: { sx: { maxHeight: 350 } }
                  }
                }}
              >
                {allSkillsOptions.map((skill) => (
                  <MenuItem key={skill} value={skill}>
                    <Checkbox checked={editData.skills.includes(skill)} />
                    <ListItemText primary={skill} />
                  </MenuItem>
                ))}
                <Box sx={{ position: 'sticky', bottom: 0, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', p: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    onClick={() => setSkillsOpen(false)}
                  >
                    Listo
                  </Button>
                </Box>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <TextField
                label="Otra especialidad"
                placeholder="Ej: Cocina comunitaria, albañilería, electricidad"
                fullWidth
                size="small"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSkill();
                  }
                }}
              />
              <Button
                variant="outlined"
                onClick={handleAddCustomSkill}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Agregar
              </Button>
            </Box>

            {editData.skills.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {editData.skills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    color="primary"
                    size="small"
                    onDelete={() => handleRemoveSkill(skill)}
                  />
                ))}
              </Box>
            )}

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
              Sobre mí y Presentación
            </Typography>
            <TextField
              label="Descripción corta"
              name="bio"
              fullWidth
              margin="dense"
              placeholder="Una frase corta que te describa (bio)..."
              value={editData.bio}
              onChange={handleEditChange}
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Sobre mí (Detalle)"
              multiline
              minRows={3}
              maxRows={6}
              fullWidth
              placeholder="Contá un poco sobre vos, tu experiencia y motivación como voluntario..."
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'grey.50' } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setIsEditOpen(false)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
            >
              {saving ? <CircularProgress size={20} color="inherit" /> : 'Guardar cambios'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ═══ Image Preview Dialog ═══ */}
      <Dialog
        open={!!previewImage}
        onClose={() => { setPreviewImage(null); }}
        maxWidth={previewField === 'banner' ? 'md' : 'sm'}
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: '#111',
            },
          },
        }}
      >
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          py: 2,
          bgcolor: 'rgba(255,255,255,0.05)',
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>
            {previewField === 'profile_photo' ? '📷 Vista previa — Foto de perfil' : '🖼️ Vista previa — Banner'}
          </Typography>
          <IconButton onClick={() => setPreviewImage(null)} sx={{ color: 'grey.400' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0, bgcolor: '#1a1a1a', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Interactive preview area */}
          {previewImage && (
            <Box
              sx={{
                position: 'relative',
                width: previewField === 'profile_photo' ? 220 : '100%',
                height: previewField === 'profile_photo' ? 220 : { xs: 160, md: 220 },
                mx: 'auto',
                my: previewField === 'profile_photo' ? 4 : 0,
                overflow: 'hidden',
                borderRadius: previewField === 'profile_photo' ? '50%' : 0,
                border: previewField === 'profile_photo' ? '3px solid rgba(255,255,255,0.15)' : 'none',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                boxShadow: previewField === 'profile_photo' ? '0 8px 32px rgba(0,0,0,0.5)' : 'none',
              }}
              onMouseDown={(e) => {
                setIsDragging(true);
                setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
              }}
              onMouseMove={(e) => {
                if (!isDragging) return;
                setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchStart={(e) => {
                const t = e.touches[0];
                setIsDragging(true);
                setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y });
              }}
              onTouchMove={(e) => {
                if (!isDragging) return;
                const t = e.touches[0];
                setOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
              }}
              onTouchEnd={() => setIsDragging(false)}
            >
              <Box
                component="img"
                src={previewImage}
                alt="Preview"
                draggable={false}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transformOrigin: 'center center',
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  pointerEvents: 'none',
                  transition: isDragging ? 'none' : 'transform 0.15s ease',
                }}
              />
            </Box>
          )}

          {/* Zoom controls */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 4,
            py: 2,
            width: '100%',
            maxWidth: 400,
            mx: 'auto',
          }}>
            <ZoomOutIcon sx={{ color: 'grey.500', fontSize: 20 }} />
            <Slider
              value={zoom}
              onChange={(_, v) => setZoom(v as number)}
              min={1}
              max={3}
              step={0.05}
              sx={{
                color: 'primary.main',
                '& .MuiSlider-thumb': {
                  width: 18,
                  height: 18,
                  '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 6px rgba(0,82,203,0.2)' },
                },
                '& .MuiSlider-rail': { bgcolor: 'grey.700' },
              }}
            />
            <ZoomInIcon sx={{ color: 'grey.500', fontSize: 20 }} />
          </Box>

          <Typography variant="caption" sx={{ color: 'grey.500', pb: 1 }}>
            Arrastrá para mover · Usá el slider para zoom
          </Typography>
        </DialogContent>

        {/* Actions */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.5,
          px: 3,
          py: 2,
          bgcolor: 'rgba(255,255,255,0.05)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <Button
            onClick={() => setPreviewImage(null)}
            startIcon={<CloseIcon />}
            sx={{
              color: 'grey.400',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImageSave}
            disabled={savingImage}
            variant="contained"
            startIcon={savingImage ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
            }}
          >
            {savingImage ? 'Guardando...' : 'Guardar'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
