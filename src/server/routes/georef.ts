import { Router } from 'express';
import https from 'https';

const router = Router();

function fetchGeoref(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(data.message || `API returned ${res.statusCode}`));
          }
        } catch {
          reject(new Error('Failed to parse response'));
        }
      });
    }).on('error', reject);
  });
}

// Proxy para la API de Georef Argentina - Localidades
router.get('/localidades', async (req, res) => {
  const { provincia, nombre } = req.query;

  if (!provincia || !nombre || String(nombre).length < 2) {
    res.json({ localidades: [] });
    return;
  }

  try {
    const apiUrl = `https://apis.datos.gob.ar/georef/api/localidades?provincia=${encodeURIComponent(String(provincia))}&nombre=${encodeURIComponent(String(nombre))}&max=15&campos=nombre`;
    const data = await fetchGeoref(apiUrl);
    // Deduplicar nombres
    const nombres = [...new Set(data.localidades.map((l: any) => l.nombre))];
    res.json({ localidades: nombres });
  } catch (err: any) {
    console.error('Georef API error:', err.message);
    res.json({ localidades: [], error: err.message });
  }
});

export default router;
