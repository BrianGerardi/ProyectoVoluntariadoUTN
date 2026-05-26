import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Box, Typography, Button } from '@mui/material';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for user location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for emergencies
const emergencyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for temp/new emergency location
const tempNewIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to recenter map when location changes
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

// Component to handle map clicks
function MapEvents({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onClick) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

interface Emergency {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  urgency: string;
}

interface EmergencyMapProps {
  userLocation: [number, number] | null;
  emergencies: Emergency[];
  onMapClick?: (lat: number, lng: number) => void;
  tempNewLocation?: [number, number] | null;
  onSelectEmergency?: (emergencyId: string) => void;
}

export default function EmergencyMap({ 
  userLocation, 
  emergencies, 
  onMapClick, 
  tempNewLocation,
  onSelectEmergency 
}: EmergencyMapProps) {
  const defaultCenter: [number, number] = [-34.9205, -57.9536]; // Default to La Plata if no location
  const center = userLocation || defaultCenter;

  return (
    <Box sx={{ height: '100%', width: '100%', minHeight: 300, borderRadius: 2, overflow: 'hidden' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <strong>Tu Ubicación Actual</strong>
            </Popup>
          </Marker>
        )}
        
        {tempNewLocation && (
          <Marker position={tempNewLocation} icon={tempNewIcon}>
            <Popup>
              <strong>Nueva Ubicación Seleccionada</strong>
            </Popup>
          </Marker>
        )}

        <ChangeView center={center} />
        <MapEvents onClick={onMapClick} />

        {emergencies.map((em) => {
          if (!em.latitude || !em.longitude) return null;
          return (
            <Marker key={em.id} position={[em.latitude, em.longitude]} icon={emergencyIcon}>
              <Popup>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{em.title}</Typography>
                <Typography variant="body2" color="error" sx={{ mb: 1 }}>Urgencia: {em.urgency.toUpperCase()}</Typography>
                {onSelectEmergency && (
                  <Button 
                    size="small" 
                    variant="contained" 
                    onClick={() => onSelectEmergency(em.id)}
                    fullWidth
                  >
                    Ver Detalles / Chat
                  </Button>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </Box>
  );
}
