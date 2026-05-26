import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretvoluntariado2026';

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const result = await pool.query('SELECT id, email, full_name, role, phone, city, skills, availability, metadata FROM users WHERE id = $1', [userId]);
    
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
  const { full_name, phone, city, skills, availability, metadata, role } = req.body;

  try {
    const result = await pool.query(`
      UPDATE users 
      SET full_name = $1, phone = $2, city = $3, skills = $4, availability = $5, metadata = $6, role = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING id, email, full_name, role, phone, city, skills, availability, metadata
    `, [full_name, phone, city, skills, availability, metadata, role || 'volunteer', userId]);

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

export default router;
