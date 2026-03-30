import express from 'express';
import bcrypt from 'bcrypt';
import { users } from '../../server.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ success: false, message: "Username and Password is required" })
  }

  const existingUSer = users.get(username);
  if (existingUSer) {
    return res.json({ success: false, message: "Username already exists" });
  }

  if (users.has(username)) {
    return res.json({ success: false, message: "User already exists" })
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.json({ success: false, message: "Password must be a string and at least 6 characters long" });
  }

  const hashed = await bcrypt.hash(password, 10)
  users.set(username, hashed);
  res.json({ success: true, message: "User Registered Successfully" });
});

export default router;