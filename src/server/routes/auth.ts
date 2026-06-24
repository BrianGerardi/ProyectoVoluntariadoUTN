import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { JWT_SECRET } from '../config';

const router = Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { email, password, full_name, phone, city, province, skills, role } = req.body;

  try {
    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      res.status(400).json({ error: 'El email ya está registrado' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user
    const result = await pool.query(`
      INSERT INTO users (email, password_hash, full_name, role, phone, city, province, skills)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, full_name, role, phone, city, province, skills
    `, [email, password_hash, full_name, role || 'volunteer', phone, city, province, skills || []]);

    const user = result.rows[0];

    // Generate token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      res.status(400).json({ error: 'Credenciales inválidas' });
      return;
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ error: 'Credenciales inválidas' });
      return;
    }

    // Generate token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Remove password_hash from response
    delete user.password_hash;

    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

export default router;


