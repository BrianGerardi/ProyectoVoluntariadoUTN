import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
} from '@mui/material';

import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';

import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user);
      navigate('/');
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
        py: 4,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 1050,
          minHeight: 600,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '1fr 1fr',
          },
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 29, 50, 0.12)',
          bgcolor: 'white',
        }}
      >
        {/* PANEL IZQUIERDO */}
        <Box
          sx={{
            display: {
              xs: 'none',
              md: 'flex',
            },
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            p: 6,
            color: 'white',
            background:
              'linear-gradient(145deg, #8f0010 0%, #b90014 55%, #d7192d 100%)',
          }}
        >
          {/* decoración */}
          <Box
            sx={{
              position: 'absolute',
              width: 320,
              height: 320,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.06)',
              top: -120,
              right: -120,
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              width: 220,
              height: 220,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.05)',
              bottom: -80,
              left: -60,
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
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: '32px',
              }}
            >
              Voluntariado
            </Typography>

            <Typography
              sx={{
                fontSize: '18px',
                lineHeight: 1.6,
                maxWidth: 380,
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              Una plataforma para conectar voluntarios, coordinadores y
              organizaciones ante situaciones de emergencia.
            </Typography>
          </Box>

          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SecurityOutlinedIcon />
              <Typography sx={{ color: 'rgba(255,255,255,0.92)' }}>
                Gestión segura de voluntarios
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <GroupsOutlinedIcon />
              <Typography sx={{ color: 'rgba(255,255,255,0.92)' }}>
                Coordinación ante emergencias
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* PANEL DERECHO */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: {
              xs: 2,
              sm: 5,
              md: 6,
            },
            py: 5,
          }}
        >
          <Card
            elevation={0}
            sx={{
              width: '100%',
              maxWidth: 410,
              boxShadow: 'none',
              bgcolor: 'transparent',
            }}
          >
            <CardContent sx={{ p: 0 }}>
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
                  Bienvenido
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: '#001d32',
                    mb: 1,
                    fontSize: {
                      xs: '28px',
                      sm: '32px',
                    },
                  }}
                >
                  Inicia sesión
                </Typography>

                <Typography color="text.secondary">
                  Ingresa tus datos para acceder a la plataforma.
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
                <TextField
  label="Email"
  type="email"
  fullWidth
  required
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="nombre@correo.com"
  slotProps={{
    input: {
      startAdornment: (
        <InputAdornment position="start">
          <EmailOutlinedIcon sx={{ color: 'text.secondary' }} />
        </InputAdornment>
      ),
    },
  }}
  sx={{
    mb: 2.5,
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
  }}
/>

                <TextField
                  label="Contraseña"
                  type="password"
                  fullWidth
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  },
                }}
                  sx={{
                    mb: 3,
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
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: '16px',
                    fontWeight: 600,
                    bgcolor: '#b90014',
                    boxShadow: '0 8px 20px rgba(185, 0, 20, 0.22)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#9f0011',
                      boxShadow: '0 10px 24px rgba(185, 0, 20, 0.3)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  Iniciar sesión
                </Button>

                <Box
                  sx={{
                    mt: 3,
                    pt: 3,
                    borderTop: '1px solid #e8eaed',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    ¿No tienes cuenta?{' '}
                    <Link
                      to="/register"
                      style={{
                        color: '#b90014',
                        textDecoration: 'none',
                        fontWeight: 700,
                      }}
                    >
                      Regístrate
                    </Link>
                  </Typography>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}