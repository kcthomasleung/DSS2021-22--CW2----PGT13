const register_form = document.querySelector("#register_form");


function signup(email, password) {
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = hash(password + salt);
    return {
        email,
        salt,
        hashedPassword
    };
}

function hash(input) {
    return createHash('sha256').update(input).digest('hex');
}