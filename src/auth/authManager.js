import bcrypt from "bcrypt";
import crypto from  "crypto";
import { sessions } from "../../server.js";

const users = {
    test: bcrypt.hashSync("test1",10),
    test2: bcrypt.hashSync("test2", 10)
}

export function validateLogin(username, password) {
    if (!users[username]) return null;
    const valid = bcrypt.compareSync(password, users[username]);
    if (!valid) return null;

    const token = crypto.randomUUID();
    sessions.set(username, token);
    return token;
}

export function validateToken(username, token) {
        return sessions.get(username) === token;
    }
