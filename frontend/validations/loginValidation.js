import { validateUsername } from "./registerValidation.js";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY_PREFIX = "loginAttempts:";

function getStorageKey(username) {
    return `${STORAGE_KEY_PREFIX}${username}`;
}

function loadLoginState(username) {
    if (!username) return { count: 0 };
    const entry = localStorage.getItem(getStorageKey(username));
    if (!entry) return { count: 0 };

    try {
        return JSON.parse(entry);
    } catch (error) {
        localStorage.removeItem(getStorageKey(username));
        return { count: 0 };
    }
}

function saveLoginState(username, state) {
    if (!username) return;
    localStorage.setItem(getStorageKey(username), JSON.stringify(state));
}

export function validateLogin(username, password) {
    const usernameError = validateUsername(username);
    if (usernameError) return usernameError;

    if (!password || password.length < 6) {
        return 'Password is required and must be at least 6 characters long';
    }

    return null;
}

export function canAttemptLogin(username) {
    const state = loadLoginState(username);

    if (state.lockedUntil && Date.now() < state.lockedUntil) {
        const remainingMs = state.lockedUntil - Date.now();
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        return {
            locked: true,
            message: `Too many failed login attempts. Try again in ${remainingMinutes} minute(s).`,
        };
    }

    return { locked: false };
}

export function recordFailedLogin(username) {
    if (!username) return;

    const state = loadLoginState(username);
    const currentCount = state.lockedUntil && Date.now() < state.lockedUntil ? 0 : (state.count || 0);
    const count = currentCount + 1;
    const nextState = { count };

    if (count > MAX_LOGIN_ATTEMPTS) {
        nextState.lockedUntil = Date.now() + LOCK_DURATION_MS;
        nextState.count = 0;
    }

    saveLoginState(username, nextState);
    return nextState;
}

export function clearLoginAttempts(username) {
    if (!username) return;
    localStorage.removeItem(getStorageKey(username));
}
