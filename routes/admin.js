const express = require('express');
const {
    getUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    getStats,
    getAllJobs,
    getAllApplications,
    deactivateUser,
    activateUser
} = require('../controllers/admin');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are admin only
router.use(protect);
router.use(authorize('admin'));

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/deactivate', deactivateUser);
router.put('/users/:id/activate', activateUser);
router.delete('/users/:id', deleteUser);

// Job management
router.get('/jobs', getAllJobs);

// Application management
router.get('/applications', getAllApplications);

// Statistics
router.get('/stats', getStats);

module.exports = router;