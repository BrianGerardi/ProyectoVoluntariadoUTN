import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware to check if user has coordinator or admin role
const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'No autorizado para realizar esta acción' });
      return;
    }
    next();
  };
};

// --- EMERGENCY ROUTES ---

// 1. Get all active emergencies (with distance sorting if lat/lng are provided)
router.get('/emergencies', async (req, res) => {
  const { lat, lng } = req.query;
  try {
    let query = `
      SELECT 
        id, title, description, type, status, urgency, address,
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude,
        required_resources, created_at
      FROM emergencies
      WHERE status = 'active'
      ORDER BY created_at DESC
    `;

    if (lat && lng) {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        query = `
          SELECT 
            id, title, description, type, status, urgency, address,
            ST_X(location::geometry) as longitude,
            ST_Y(location::geometry) as latitude,
            required_resources, created_at,
            ST_Distance(location, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)) as distance
          FROM emergencies
          WHERE status = 'active'
          ORDER BY distance ASC
        `;
      }
    }

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching emergencies:', err);
    res.status(500).json({ error: 'Error al obtener emergencias de la base de datos' });
  }
});

// 2. Create a new emergency (Coordinator & Admin only)
router.post('/emergencies', authenticateToken, requireRole(['coordinator', 'admin']), async (req: AuthRequest, res) => {
  const { title, description, type, urgency, longitude, latitude, address, required_resources } = req.body;
  const created_by = req.user?.id;

  try {
    const result = await pool.query(`
      INSERT INTO emergencies 
        (title, description, type, urgency, location, address, required_resources, created_by)
      VALUES 
        ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8, $9)
      RETURNING 
        id, title, description, type, status, urgency, address,
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude,
        required_resources, created_at
    `, [
      title, 
      description, 
      type, 
      urgency, 
      parseFloat(longitude), 
      parseFloat(latitude), 
      address, 
      JSON.stringify(required_resources || []), 
      created_by
    ]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating emergency:', err);
    res.status(500).json({ error: 'Error al crear la emergencia' });
  }
});


// --- VOLUNTEER ASSIGNMENT ROUTES ---

// 3. Postulate to an emergency (Volunteer)
router.post('/assignments', authenticateToken, async (req: AuthRequest, res) => {
  const { emergency_id } = req.body;
  const user_id = req.user?.id;

  if (!emergency_id) {
    res.status(400).json({ error: 'ID de emergencia requerido' });
    return;
  }

  try {
    const result = await pool.query(`
      INSERT INTO assignments (emergency_id, user_id, status)
      VALUES ($1, $2, 'pending')
      ON CONFLICT (emergency_id, user_id) DO UPDATE SET status = 'pending'
      RETURNING *
    `, [emergency_id, user_id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error in postulation:', err);
    res.status(500).json({ error: 'Error al postularse a la emergencia' });
  }
});

// 4. Get current user's assignments
router.get('/assignments/my', authenticateToken, async (req: AuthRequest, res) => {
  const user_id = req.user?.id;
  try {
    const result = await pool.query(`
      SELECT 
        a.id, a.emergency_id, a.status, a.assigned_task, a.assigned_at,
        e.title as emergency_title, e.type as emergency_type, e.urgency as emergency_urgency,
        e.address as emergency_address,
        ST_X(e.location::geometry) as longitude,
        ST_Y(e.location::geometry) as latitude
      FROM assignments a
      JOIN emergencies e ON a.emergency_id = e.id
      WHERE a.user_id = $1
      ORDER BY a.assigned_at DESC
    `, [user_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching my assignments:', err);
    res.status(500).json({ error: 'Error al obtener tus asignaciones' });
  }
});

// 5. Get all assignments/volunteers for a specific emergency (Coordinator & Admin)
router.get('/emergencies/:id/assignments', authenticateToken, requireRole(['coordinator', 'admin']), async (req, res) => {
  const emergencyId = req.params.id;
  try {
    const result = await pool.query(`
      SELECT 
        a.id, a.emergency_id, a.user_id, a.status, a.assigned_task, a.assigned_at,
        u.full_name, u.email, u.phone, u.city, u.skills
      FROM assignments a
      JOIN users u ON a.user_id = u.id
      WHERE a.emergency_id = $1
      ORDER BY a.assigned_at DESC
    `, [emergencyId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching emergency assignments:', err);
    res.status(500).json({ error: 'Error al obtener los voluntarios asignados' });
  }
});

// 6. Update assignment status and task (Coordinator & Admin)
router.put('/assignments/:id', authenticateToken, requireRole(['coordinator', 'admin']), async (req, res) => {
  const assignmentId = req.params.id;
  const { status, assigned_task } = req.body;

  try {
    const result = await pool.query(`
      UPDATE assignments 
      SET status = $1, assigned_task = $2, assigned_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [status, assigned_task, assignmentId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Asignación no encontrada' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating assignment:', err);
    res.status(500).json({ error: 'Error al actualizar la asignación del voluntario' });
  }
});


// --- MESSAGE ROUTES ---

// 7. Get messages for an emergency chat
router.get('/emergencies/:id/messages', authenticateToken, async (req, res) => {
  const emergencyId = req.params.id;
  try {
    const result = await pool.query(`
      SELECT m.id, m.emergency_id, m.sender_id, m.content, m.created_at, u.full_name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.emergency_id = $1
      ORDER BY m.created_at ASC
    `, [emergencyId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching emergency messages:', err);
    res.status(500).json({ error: 'Error al obtener los mensajes de la emergencia' });
  }
});

// 8. Send a new message to an emergency chat
router.post('/emergencies/:id/messages', authenticateToken, async (req: AuthRequest, res) => {
  const emergencyId = req.params.id;
  const senderId = req.user?.id;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    res.status(400).json({ error: 'El contenido del mensaje no puede estar vacío' });
    return;
  }

  try {
    const messageResult = await pool.query(`
      INSERT INTO messages (emergency_id, sender_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [emergencyId, senderId, content]);

    const userResult = await pool.query('SELECT full_name FROM users WHERE id = $1', [senderId]);
    
    const responseData = {
      ...messageResult.rows[0],
      sender_name: userResult.rows[0].full_name
    };

    res.status(201).json(responseData);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Error al enviar el mensaje' });
  }
});

export default router;
