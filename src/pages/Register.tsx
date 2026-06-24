import React, { useState, useRef, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert, Chip,
  OutlinedInput, Select, MenuItem, FormControl, InputLabel, Checkbox,
  ListItemText, Autocomplete
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

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
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', py: 4 }}>
      <Card sx={{ maxWidth: 500, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom color="primary" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
            Registro de Voluntario
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
            Únete a nuestra red de asistencia
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Nombre Completo"
              name="full_name"
              fullWidth
              margin="normal"
              required
              value={formData.full_name}
              onChange={handleChange}
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              fullWidth
              margin="normal"
              required
              value={formData.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              error={!!emailError}
              helperText={emailError}
            />
            <TextField
              label="Teléfono"
              name="phone"
              fullWidth
              margin="normal"
              value={formData.phone}
              onChange={handleChange}
            />

            {/* Provincia */}
            <Autocomplete
              options={PROVINCIAS}
              value={formData.province || null}
              onChange={(_, newValue) => handleProvinceChange(newValue || '')}
              renderInput={(params) => (
                <TextField {...params} label="Provincia" margin="normal" required />
              )}
              noOptionsText="No se encontró la provincia"
            />

            {/* Ciudad / Localidad */}
            <Autocomplete
              options={localidades}
              value={formData.city || null}
              disabled={!formData.province}
              loading={loadingLocalidades}
              filterOptions={(x) => x}
              onChange={(_, newValue) => setFormData({ ...formData, city: newValue || '' })}
              onInputChange={(_, newInputValue, reason) => {
                if (reason === 'input') {
                  fetchLocalidades(formData.province, newInputValue);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Ciudad / Localidad"
                  margin="normal"
                  required
                  helperText={!formData.province ? 'Seleccioná una provincia primero' : 'Escribí al menos 2 letras para buscar'}
                />
              )}
              noOptionsText={loadingLocalidades ? 'Buscando...' : 'Escribí para buscar localidades'}
            />

            <TextField
              label="Contraseña"
              name="password"
              type="password"
              fullWidth
              margin="normal"
              required
              value={formData.password}
              onChange={handleChange}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="skills-label">Especialidades / Habilidades</InputLabel>
              <Select
                labelId="skills-label"
                multiple
                open={skillsOpen}
                onOpen={() => setSkillsOpen(true)}
                onClose={() => setSkillsOpen(false)}
                value={formData.skills}
                onChange={handleSkillsChange}
                input={<OutlinedInput id="select-multiple-chip" label="Especialidades / Habilidades" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} color="primary" size="small" />
                    ))}
                  </Box>
                )}
                MenuProps={{
                  slotProps: {
                    paper: { sx: { maxHeight: 350 } }
                  }
                }}
              >
                {SKILLS_OPTIONS.map((skill) => (
                  <MenuItem key={skill} value={skill}>
                    <Checkbox checked={formData.skills.includes(skill)} />
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
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              Registrarse
            </Button>
            <Typography align="center" variant="body2">
              ¿Ya tienes cuenta? <Link to="/login" style={{ color: '#0052cb', textDecoration: 'none', fontWeight: 'bold' }}>Inicia sesión</Link>
            </Typography>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
