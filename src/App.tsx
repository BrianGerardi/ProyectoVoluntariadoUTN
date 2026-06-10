import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  useMediaQuery,
  useTheme,
  Menu,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Dashboard as DashboardIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';

import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import Profile from './pages/Profile';

const drawerWidth = 240;

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { logout, token } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const [notifications, setNotifications] = useState<{
    nearbyEmergencies: any[];
    newMessages: any[];
    totalCount: number;
  }>({ nearbyEmergencies: [], newMessages: [], totalCount: 0 });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const lastCheckedEmergencies = localStorage.getItem('lastCheckedEmergencies') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const lastCheckedMessages = localStorage.getItem('lastCheckedMessages') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const res = await fetch(`http://localhost:3001/api/users/notifications?lastCheckedEmergencies=${lastCheckedEmergencies}&lastCheckedMessages=${lastCheckedMessages}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications, location.pathname]);

  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { label: 'Mensajes', path: '/messages', icon: <ChatIcon /> },
    { label: 'Mi Perfil', path: '/profile', icon: <PersonIcon /> },
  ];

  const drawer = (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 4, px: 2 }}>
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 900 }}>
          Administración
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Panel de Control
        </Typography>
      </Box>
      <List sx={{ flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              component={Link}
              to={item.path}
              onClick={() => isMobile && setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                bgcolor: currentPath === item.path ? 'primary.50' : 'transparent',
                color: currentPath === item.path ? 'primary.main' : 'text.primary',
                '&:hover': { bgcolor: currentPath === item.path ? 'primary.100' : undefined },
              }}
            >
              <ListItemIcon sx={{ color: currentPath === item.path ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { sx: { fontWeight: currentPath === item.path ? 700 : 400 } } }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box>
        <ListItem disablePadding>
          <ListItemButton onClick={logout} sx={{ borderRadius: 2, color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'error.main' }}><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Cerrar Sesión" />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0px 1px 3px rgba(0,0,0,0.05)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
        elevation={0}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" component="div" sx={{ color: 'primary.main', fontWeight: 700 }}>
              Voluntariado Emergencias
            </Typography>
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
            {navItems.map((item) => (
              <Typography
                key={item.path}
                component={Link}
                to={item.path}
                variant="body2"
                sx={{
                  fontWeight: currentPath === item.path ? 700 : 500,
                  color: currentPath === item.path ? 'primary.main' : 'text.secondary',
                  borderBottom: currentPath === item.path ? '2px solid' : '2px solid transparent',
                  borderColor: currentPath === item.path ? 'primary.main' : 'transparent',
                  pb: 0.5,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {item.label === 'Dashboard' ? 'Emergencias' : item.label}
              </Typography>
            ))}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit" onClick={handleOpenNotifications}>
              <Badge badgeContent={notifications.totalCount} color="error">
                <NotificationsIcon color="action" />
              </Badge>
            </IconButton>
            <IconButton color="error" onClick={logout} title="Cerrar Sesión" aria-label="logout">
              <LogoutIcon />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseNotifications}
              slotProps={{ paper: { sx: { width: 320, maxHeight: 400, borderRadius: 2, mt: 1.5, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } } }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Notificaciones
                </Typography>
              </Box>
              
              {notifications.totalCount === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No tienes nuevas notificaciones
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {notifications.nearbyEmergencies.map((em) => (
                    <ListItem 
                      key={em.id} 
                      disablePadding
                      onClick={handleCloseNotifications}
                      sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                      <ListItemButton component={Link} to="/">
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                              ⚠️ Nueva emergencia cercana
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography variant="caption" color="text.primary" sx={{ display: 'block', fontWeight: 600 }}>
                                {em.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {em.address}
                              </Typography>
                            </>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  
                  {notifications.newMessages.map((msg) => (
                    <ListItem 
                      key={msg.id} 
                      disablePadding
                      onClick={handleCloseNotifications}
                      sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                      <ListItemButton component={Link} to="/messages">
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                              💬 Nuevo mensaje en {msg.emergency_title}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {msg.content}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid', borderColor: 'divider', bgcolor: 'rgba(241, 245, 249, 0.5)', mt: 8 } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, width: { md: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}>
        <Container maxWidth="lg" disableGutters>
          {children}
        </Container>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route 
        path="/" 
        element={
          <PrivateRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/messages" 
        element={
          <PrivateRoute>
            <MainLayout>
              <Messages />
            </MainLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <PrivateRoute>
            <MainLayout>
              <Profile />
            </MainLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/profile/:userId" 
        element={
          <PrivateRoute>
            <MainLayout>
              <Profile />
            </MainLayout>
          </PrivateRoute>
        } 
      />
    </Routes>
  );
}

export default App;
