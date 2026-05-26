import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, Chip, OutlinedInput, Select, MenuItem, FormControl, InputLabel, Container } from '@mui/material';
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

export default function Profile() {
  const { token, user, login } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    city: '',
    skills: [] as string[],
    role: 'volunteer'
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setFormData({
            full_name: data.full_name || '',
            phone: data.phone || '',
            city: data.city || '',
            skills: data.skills || [],
            role: data.role || 'volunteer'
          });
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      }
    };
    if (token) fetchProfile();
  }, [token]);

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
    setSuccess('');
    try {
      const res = await fetch('http://localhost:3001/api/users/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      
      setSuccess('Perfil actualizado exitosamente');
      // Update local user context with new token and updated user data
      if (user) {
        login(data.token || token!, data.user || data);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4, mt: 8 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>Mi Perfil</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Actualiza tu información y habilidades para que podamos contactarte mejor.
          </Typography>

          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
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
              color="primary"
              sx={{ mt: 3 }}
            >
              Guardar Cambios
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
