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

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/;
    if(!passwordRegex.test(password)) {
        return 'Password must contain at least one letter and one number';
    }

    return null; // no errors
}