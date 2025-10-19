// import express
const express = require('express');
const { register, login, logout } = require('../controllers/auth');
const { body } = require('express-validator');
const { getMe } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

// create a router object
const router = express.Router();

// Validation middleware for registration
const registrationValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['jobseeker', 'employer']).withMessage('Invalid role')
];

// login route validation
const loginValidation = [
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('password').notEmpty().withMessage('Password is required')
]

router.post('/register', registrationValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.get('/logout', logout);

// export the router
module.exports = router;