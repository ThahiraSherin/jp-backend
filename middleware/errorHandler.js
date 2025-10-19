const { NODE_ENV } = require("../utils/config");

const errorHandler = (err, req, res, next) => {
    let error = { ...err };

    error.message = err.message;

    console.error('Error:', err);

    // Mongoose bad ObjectId error
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        error = { message, statusCode: 404 };
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = { message, statusCode: 400 };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, statusCode: 400 };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token has expired';
        error = { message, statusCode: 401 };
    }

    const response = {
        success: false,
        error: error.message || 'Server Error',
    };

    if (NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(error.statusCode || 500).json(response);
};

module.exports = errorHandler;