// import mongoose
const mongoose = require('mongoose');
const { MONGODB_URI, PORT } = require('./utils/config');

// import the app from app.js
const app = require('./app');

// connect to the database
mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB!');

        // once database is connected, then start the server
        app
            .listen(PORT, () => {
                console.log(`Server running @ http://localhost:${PORT}`);
            })
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message);
    })