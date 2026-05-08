import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

const sessions = new Map();

router.post('/', (req, res) => {
    const {token} = req.body;
    if(!token) {
        return res.json({
            success: false,
            message: "Token Required"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const username = decoded.username;

        if(sessions.has(username)) {
            sessions.delete(username);

            res.json({ success: true, message: "logout successful!!!" });
        }
    } catch (err) {
        res.json({ success:false, message:"Invalid Token" });
    }
 });

 export default router;