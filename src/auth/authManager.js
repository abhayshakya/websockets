import jwt from 'jsonwebtoken';

export function validateToken(username, token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Verify both that the token is mathematically valid and matches the claimed user
        return decoded.username === username;
    } catch (err) {
        return false;
    }
}
