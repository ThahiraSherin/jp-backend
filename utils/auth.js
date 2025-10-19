// import jsonwebtoken library
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRE, NODE_ENV } = require('../utils/config');

// generate a JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRE
    });
};

// send token response with cookie
const sendTokenResponse = (user, statusCode, res) => {
    // create a token
    const token = generateToken(user._id);

    // set cookie options
    const options = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // JWT_EXPIRE in 7 days
        httpOnly: true, // prevent client-side access to the cookies
        secure: NODE_ENV === 'production', // use secure cookies in production
        sameSite: 'lax', // prevent CSRF attacks
    };

    // remove the password from the user object
    if (user && user.password) user.password = undefined;

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user
        });
};

module.exports = {
    generateToken,
    sendTokenResponse
};