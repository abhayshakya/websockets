import express from 'express';
import bcrypt from 'bcrypt';
import { users } from '../../server.js';

const router = express.Router();

router.post('/', async (req, res) =>{
  const {username, password} = req.body;
  if(!username || !password) {
    return res.json({ success: false, message: "Username and Password is required"})
  }
  if(users.has(username)) {
    return res.json({ success: false, message: "User already exists"})
  }
  const hashed = await bcrypt.hash(password, 10)
  users.set(username, hashed);
  res.json({ success: true, message: "User Registered Successfully"});
});

export default router;