const express = require('express');
const {
    updateProfile,
    getProfile,
    uploadResume,
    uploadProfilePicture,
    addToFavorites,
    removeFromFavorites,
    getFavorites,
    deleteAccount
} = require('../controllers/users');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/upload-resume', upload.single('resume'), uploadResume);
router.post('/upload-profile-picture', upload.single('profilePicture'), uploadProfilePicture);
router.post('/favorites/:jobId', addToFavorites);
router.delete('/favorites/:jobId', removeFromFavorites);
router.get('/favorites', getFavorites);
router.delete('/account', deleteAccount);

module.exports = router;