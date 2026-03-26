import express from 'express';
import { users } from '../../server.js';

const router = express.Router();

router.get("/users", (req, res) => {
    // users is a Map, so we use users.keys() to get the iterator
    res.json({ users: [...users.keys()] });
});

router.get('/sessions', (req, res)=> {
    // We migrated to secured JSON Web Tokens earlier, meaning sessions 
    // are no longer stored in memory at all! They are entirely stateless.
    res.json({ message: "In-memory sessions are deprecated because the app securely issues and validates stateless JWT signatures!" });
});

export default router;