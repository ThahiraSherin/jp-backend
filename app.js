// import express
const express = require('express');

const cookieParser = require('cookie-parser');
const cors = require('cors');

// import router
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const applicationRoutes = require('./routes/applications');
const errorHandler = require('./middleware/errorHandler');
const { FRONTEND_URL } = require('./utils/config');
const morgan = require('morgan');

// create an Express application
const app = express();

// CORS configuration - allow frontend origin from config
app.use(cors({
    origin: require('./utils/config').FRONTEND_URL,
    credentials: true
}));

app.use(morgan('dev')); // logging middleware

// middlware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// middleware to handle url encoded bodies
app.use(express.urlencoded({ extended: true }));

// middleware to parse cookies
app.use(cookieParser());

// Routes
app.use('/auth', authRoutes);
app.use('/jobs', jobRoutes);
app.use('/applications', applicationRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);

// health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

// error handling middleware
app.use(errorHandler);

// handle 404 errors
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// export the app
module.exports = app;