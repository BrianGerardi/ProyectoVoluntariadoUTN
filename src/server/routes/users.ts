import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { JWT_SECRET } from '../config';

const router = Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const result = await pool.query('SELECT id, email, full_name, role, phone, city, province, skills, availability, metadata FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// Update current user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { full_name, phone, city, province, skills, availability, metadata, role } = req.body;

  try {
    const result = await pool.query(`
      UPDATE users 
      SET full_name = $1, phone = $2, city = $3, province = $4, skills = $5, availability = $6, metadata = $7, role = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, email, full_name, role, phone, city, province, skills, availability, metadata
    `, [full_name, phone, city, province, skills, availability, metadata, role || 'volunteer', userId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const updatedUser = result.rows[0];
    const token = jwt.sign({ id: updatedUser.id, role: updatedUser.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ user: updatedUser, token });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// Get notifications (nearby emergencies and new messages)
router.get('/notifications', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { lastCheckedEmergencies, lastCheckedMessages } = req.query;

  try {
    // 1. Get user details
    const userRes = await pool.query('SELECT city, province FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    
    // Normalize city/province or default to empty strings to avoid null issues
    const city = userRes.rows[0].city || '';
    const province = userRes.rows[0].province || '';

    // 2. Query nearby emergencies created after lastCheckedEmergencies
    // If no timestamp is provided, default to 24 hours ago
    const emDate = lastCheckedEmergencies ? new Date(lastCheckedEmergencies as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    let nearbyEmergencies: any[] = [];
    if (city || province) {
      const nearbyEmRes = await pool.query(`
        SELECT e.id, e.title, e.address, e.created_at
        FROM emergencies e
        WHERE e.status = 'active'
          AND e.created_at > $1
          AND (
            (e.address ILIKE $2 AND $2 != '%%') OR 
            (e.address ILIKE $3 AND $3 != '%%')
          )
          AND NOT EXISTS (
            SELECT 1 FROM assignments a 
            WHERE a.emergency_id = e.id 
              AND a.user_id = $4
          )
      `, [emDate, `%${city}%`, `%${province}%`, userId]);
      nearbyEmergencies = nearbyEmRes.rows;
    }

    // 3. Query new messages created after lastCheckedMessages (excluding own messages)
    const msgDate = lastCheckedMessages ? new Date(lastCheckedMessages as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const newMsgsRes = await pool.query(`
      SELECT m.id, m.content, m.created_at, e.title as emergency_title
      FROM messages m
      JOIN assignments a ON m.emergency_id = a.emergency_id
      JOIN emergencies e ON m.emergency_id = e.id
      WHERE a.user_id = $1
        AND m.sender_id != $1
        AND m.created_at > $2
        AND a.status != 'cancelled'
    `, [userId, msgDate]);

    res.json({
      nearbyEmergencies,
      newMessages: newMsgsRes.rows,
      totalCount: nearbyEmergencies.length + newMsgsRes.rows.length
    });
  } catch (err) {
    console.error('Notifications fetch error:', err);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// Get user profile by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    const result = await pool.query('SELECT id, email, full_name, role, phone, city, province, skills, availability, metadata FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Profile fetch by id error:', err);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

export default router;

