import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { users } from '../../server.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { username, password} = req.body;
  if(!username || !password) {
    return res.json({ success: false, message: "Username and password required"});
  }
  const hash = users.get(username);
  if(!hash) {
    return res.json({ success: false, message:"invalid credentials"})
  }

  const match = await bcrypt.compare(password, hash);
  if (!match) {
    return res.json({ success: false, message: "Password is incorrect" });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ success: true, message: " login successful!!!", token });
})

export default router;