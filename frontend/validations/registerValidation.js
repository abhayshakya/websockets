export function validateUsername(username) {
    if (!username && username.length < 3) {
        return 'Username is required and must be at least 3 characters long';
    }

    const usernameRegex = /^[a-zA-z0-9]+$/;
    if(!usernameRegex.test(username)) {
        return 'Username can only contain letters and numbers';
    }
    return null;
}

export function validatePassword(password) {
    if (!password || password.length < 6 ) {
        return 'Password is required and must be atleast 6 characters';
    }

    return null; // no errors
}