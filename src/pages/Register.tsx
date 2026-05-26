import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, Chip, OutlinedInput, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    city: '',
    skills: [] as string[],
    role: 'volunteer'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSkillsChange = (event: any) => {
    const {
      target: { value },
    } = event;
    setFormData({
      ...formData,
      skills: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      
      login(data.token, data.user);
      navigate('/');
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
            />
            <TextField
              label="Teléfono"
              name="phone"
              fullWidth
              margin="normal"
              value={formData.phone}
              onChange={handleChange}
            />
            <TextField
              label="Ciudad de Residencia"
              name="city"
              fullWidth
              margin="normal"
              required
              value={formData.city}
              onChange={handleChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">Tipo de Usuario / Rol</InputLabel>
              <Select
                labelId="role-label"
                name="role"
                value={formData.role}
                label="Tipo de Usuario / Rol"
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <MenuItem value="volunteer">Voluntario</MenuItem>
                <MenuItem value="coordinator">Coordinador de Emergencia</MenuItem>
              </Select>
            </FormControl>
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
              >
                {SKILLS_OPTIONS.map((skill) => (
                  <MenuItem key={skill} value={skill}>
                    {skill}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
