import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Chip,
  OutlinedInput,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';

const SKILLS_OPTIONS = [
  'Primeros Auxilios',
  'Conducción (Auto/Camioneta)',
  'Conducción (Camión)',
  'Búsqueda y Rescate',
  'Logística y Distribución',
  'Apoyo Psicológico',
  'Enfermería/Medicina',
  'Limpieza de escombros'
];

const PROVINCIAS = [
  'Buenos Aires',
  'Ciudad Autónoma de Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego, Antártida e Islas del Atlántico Sur',
  'Tucumán'
];

const fieldStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: '#fafbfc',
    transition: '0.2s',

    '&:hover': {
      bgcolor: '#ffffff',
    },

    '&.Mui-focused': {
      bgcolor: '#ffffff',
    },
  },
};

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    province: '',
    city: '',
    skills: [] as string[],
    role: 'volunteer'
  });
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [customSkill, setCustomSkill] = useState('');
  const [localidades, setLocalidades] = useState<string[]>([]);
  const [loadingLocalidades, setLoadingLocalidades] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSkillsChange = (event: any) => {
    const {
      target: { value },
    } = event;
    setFormData({
      ...formData,
      skills: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleAddCustomSkill = () => {
  const skill = customSkill.trim();

  if (!skill) return;

  const alreadyExists = formData.skills.some(
    (s) => s.toLowerCase() === skill.toLowerCase()
  );

  if (!alreadyExists) {
    setFormData({
      ...formData,
      skills: [...formData.skills, skill],
    });
  }

  setCustomSkill('');
};

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

  const handleProvinceChange = (newProvince: string) => {
    setFormData({ ...formData, province: newProvince, city: '' });
    setLocalidades([]);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailBlur = () => {
    if (formData.email && !validateEmail(formData.email)) {
      setEmailError('Ingresá un email válido (ej: usuario@dominio.com)');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(formData.email)) {
      setEmailError('Ingresá un email válido (ej: usuario@dominio.com)');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      
      login(data.token, data.user);
      navigate('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#f6f7f9',
      px: 2,
      py: 5,
    }}
  >
    <Box
      sx={{
        width: '100%',
        maxWidth: 1180,
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: '0.8fr 1.3fr',
        },
        borderRadius: 4,
        overflow: 'hidden',
        bgcolor: '#fff',
        boxShadow: '0 20px 60px rgba(0, 29, 50, 0.12)',
      }}
    >

      {/* PANEL IZQUIERDO */}
      <Box
        sx={{
          display: {
            xs: 'none',
            md: 'flex',
          },
          position: 'relative',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          p: 6,
          color: '#fff',
          background:
            'linear-gradient(145deg, #8f0010 0%, #b90014 55%, #d7192d 100%)',
        }}
      >
        {/* Círculos decorativos */}
        <Box
          sx={{
            position: 'absolute',
            width: 320,
            height: 320,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.06)',
            top: -130,
            right: -130,
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            width: 240,
            height: 240,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.05)',
            bottom: -100,
            left: -80,
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              width: 58,
              height: 58,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(10px)',
              mb: 4,
            }}
          >
            <VolunteerActivismOutlinedIcon sx={{ fontSize: 34 }} />
          </Box>

          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.75)',
              mb: 1,
            }}
          >
            Voluntariado
          </Typography>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              fontSize: '34px',
              lineHeight: 1.2,
              mb: 2.5,
            }}
          >
            Sumate a nuestra red
          </Typography>

          <Typography
            sx={{
              fontSize: '17px',
              lineHeight: 1.7,
              maxWidth: 380,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            Registrate como voluntario y colaborá en situaciones de
            emergencia donde tu ayuda puede hacer la diferencia.
          </Typography>
        </Box>

        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            mt: 8,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <GroupsOutlinedIcon />

            <Box>
              <Typography sx={{ fontWeight: 600 }}>
                Trabajo coordinado
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.75)' }}
              >
                Formá parte de equipos de asistencia.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <WorkspacePremiumOutlinedIcon />

            <Box>
              <Typography sx={{ fontWeight: 600 }}>
                Tus habilidades importan
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.75)' }}
              >
                Indicá tus especialidades para colaborar mejor.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <SecurityOutlinedIcon />

            <Box>
              <Typography sx={{ fontWeight: 600 }}>
                Información protegida
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.75)' }}
              >
                Tus datos forman parte de tu perfil de voluntario.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* PANEL DEL FORMULARIO */}
      <Box
        sx={{
          px: {
            xs: 3,
            sm: 5,
            md: 7,
          },
          py: {
            xs: 4,
            md: 6,
          },
        }}
      >
        {/* TÍTULO */}
        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              color: '#b90014',
              fontWeight: 700,
              fontSize: '14px',
              mb: 1,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Crear cuenta
          </Typography>

          <Typography
            variant="h4"
            sx={{
              color: '#001d32',
              fontWeight: 700,
              mb: 1,
              fontSize: {
                xs: '27px',
                sm: '32px',
              },
            }}
          >
            Registro de Voluntario
          </Typography>

          <Typography color="text.secondary">
            Completá tus datos personales para formar parte de la red de
            asistencia.
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
            }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>

          {/* DATOS PERSONALES */}
          <Typography
            sx={{
              fontWeight: 700,
              color: '#001d32',
              mb: 2,
              fontSize: '15px',
            }}
          >
            Datos personales
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
              },
              gap: 2,
            }}
          >
            <TextField
              label="Nombre completo"
              name="full_name"
              fullWidth
              required
              value={formData.full_name}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineOutlinedIcon
  sx={{ color: 'text.secondary' }}
/>
                  </InputAdornment>
                ),
              }}
              sx={fieldStyle}
            />

            <TextField
              label="Email"
              name="email"
              type="email"
              fullWidth
              required
              value={formData.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              error={!!emailError}
              helperText={emailError}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon
                      sx={{ color: 'text.secondary' }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={fieldStyle}
            />

            <TextField
              label="Teléfono"
              name="phone"
              fullWidth
              value={formData.phone}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneOutlinedIcon
                      sx={{ color: 'text.secondary' }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={fieldStyle}
            />

            <TextField
              label="Contraseña"
              name="password"
              type="password"
              fullWidth
              required
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon
                      sx={{ color: 'text.secondary' }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={fieldStyle}
            />
          </Box>

          {/* UBICACIÓN */}
          <Typography
            sx={{
              fontWeight: 700,
              color: '#001d32',
              mt: 4,
              mb: 2,
              fontSize: '15px',
            }}
          >
            Ubicación
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
              },
              gap: 2,
            }}
          >
            <Autocomplete
              options={PROVINCIAS}
              value={formData.province || null}
              onChange={(_, newValue) =>
                handleProvinceChange(newValue || '')
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Provincia"
                  required
                  sx={fieldStyle}
                />
              )}
              noOptionsText="No se encontró la provincia"
            />

            <Autocomplete
              options={localidades}
              value={formData.city || null}
              disabled={!formData.province}
              loading={loadingLocalidades}
              filterOptions={(x) => x}
              onChange={(_, newValue) =>
                setFormData({
                  ...formData,
                  city: newValue || '',
                })
              }
              onInputChange={(_, newInputValue, reason) => {
                if (reason === 'input') {
                  fetchLocalidades(
                    formData.province,
                    newInputValue
                  );
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Ciudad / Localidad"
                  required
                  sx={fieldStyle}
                  helperText={
                    !formData.province
                      ? 'Seleccioná una provincia primero'
                      : 'Escribí al menos 2 letras para buscar'
                  }
                />
              )}
              noOptionsText={
                loadingLocalidades
                  ? 'Buscando...'
                  : 'Escribí para buscar localidades'
              }
            />
          </Box>

          {/* HABILIDADES */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 4,
              mb: 2,
            }}
          >
            <WorkspacePremiumOutlinedIcon
              sx={{ color: '#b90014' }}
            />

            <Typography
              sx={{
                fontWeight: 700,
                color: '#001d32',
                fontSize: '15px',
              }}
            >
              Especialidades y habilidades
            </Typography>
          </Box>

          <FormControl
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#fafbfc',
              },
            }}
          >
            <InputLabel id="skills-label">
              Especialidades / Habilidades
            </InputLabel>

            <Select
              labelId="skills-label"
              multiple
              open={skillsOpen}
              onOpen={() => setSkillsOpen(true)}
              onClose={() => setSkillsOpen(false)}
              value={formData.skills}
              onChange={handleSkillsChange}
              input={
                <OutlinedInput
                  id="select-multiple-chip"
                  label="Especialidades / Habilidades"
                />
              }
              renderValue={(selected) => (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.7,
                  }}
                >
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={value}
                      size="small"
                      sx={{
                        bgcolor: '#fbeaec',
                        color: '#b90014',
                        fontWeight: 600,
                      }}
                    />
                  ))}
                </Box>
              )}
              MenuProps={{
                slotProps: {
                  paper: {
                    sx: {
                      maxHeight: 350,
                      borderRadius: 2,
                    },
                  },
                },
              }}
            >
              {SKILLS_OPTIONS.map((skill) => (
                <MenuItem key={skill} value={skill}>
                  <Checkbox
                    checked={formData.skills.includes(skill)}
                    sx={{
                      '&.Mui-checked': {
                        color: '#b90014',
                      },
                    }}
                  />
                  <ListItemText primary={skill} />
                </MenuItem>
              ))}

              <Box
                sx={{
                  position: 'sticky',
                  bottom: 0,
                  bgcolor: 'background.paper',
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  p: 1.5,
                }}
              >
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  onClick={() => setSkillsOpen(false)}
                  sx={{
                    bgcolor: '#b90014',
                    '&:hover': {
                      bgcolor: '#9f0011',
                    },
                  }}
                >
                  Listo
                </Button>
              </Box>
            </Select>
          </FormControl>

          {/* ESPECIALIDAD PERSONALIZADA */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: {
                xs: 'column',
                sm: 'row',
              },
              gap: 1.5,
              mt: 2,
            }}
          >
            <TextField
              label="Otra especialidad"
              placeholder="Ej: Cocina comunitaria, albañilería..."
              fullWidth
              value={customSkill}
              onChange={(e) =>
                setCustomSkill(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomSkill();
                }
              }}
              sx={fieldStyle}
            />

            <Button
              variant="outlined"
              onClick={handleAddCustomSkill}
              sx={{
                minWidth: 115,
                borderRadius: 2,
                borderColor: '#b90014',
                color: '#b90014',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#9f0011',
                  bgcolor: '#fff5f6',
                },
              }}
            >
              Agregar
            </Button>
          </Box>

          {/* REGISTRARSE */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{
              mt: 4,
              py: 1.5,
              borderRadius: 2,
              fontSize: '16px',
              fontWeight: 600,
              textTransform: 'none',
              bgcolor: '#b90014',
              boxShadow:
                '0 8px 20px rgba(185, 0, 20, 0.22)',
              transition: 'all 0.2s ease',

              '&:hover': {
                bgcolor: '#9f0011',
                boxShadow:
                  '0 10px 24px rgba(185, 0, 20, 0.3)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            Crear cuenta de voluntario
          </Button>

          <Box
            sx={{
              mt: 3,
              pt: 3,
              borderTop: '1px solid #e8eaed',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
            >
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                style={{
                  color: '#b90014',
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                Inicia sesión
              </Link>
            </Typography>
          </Box>
        </form>
      </Box>
    </Box>
  </Box>
);
}
