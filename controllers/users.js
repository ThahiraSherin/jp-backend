const User = require('../models/User');
const Job = require('../models/Job');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('favorites');

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const fieldsToUpdate = {};
        const allowedFields = [
            'name', 'phone', 'profile.bio', 'profile.skills', 'profile.experience',
            'profile.education', 'profile.location', 'profile.website',
            'profile.linkedin', 'profile.github', 'company.name', 'company.description',
            'company.website', 'company.location', 'company.industry', 'company.size'
        ];

        // Handle nested objects
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                if (key.startsWith('profile.') || key.startsWith('company.')) {
                    const [parent, child] = key.split('.');
                    if (!fieldsToUpdate[parent]) {
                        fieldsToUpdate[parent] = {};
                    }
                    fieldsToUpdate[parent][child] = req.body[key];
                } else {
                    fieldsToUpdate[key] = req.body[key];
                }
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user.id,
            fieldsToUpdate,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Upload resume
// @route   POST /api/users/upload-resume
// @access  Private
const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { 'profile.resume': req.file.path },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Resume uploaded successfully',
            resumePath: req.file.path,
            user
        });
    } catch (error) {
        console.error('Upload resume error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Upload profile picture
// @route   POST /api/users/upload-profile-picture
// @access  Private
const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { 'profile.profilePicture': req.file.path },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Profile picture uploaded successfully',
            imagePath: req.file.path,
            user
        });
    } catch (error) {
        console.error('Upload profile picture error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Add job to favorites
// @route   POST /api/users/favorites/:jobId
// @access  Private
const addToFavorites = async (req, res) => {
    try {
        const { jobId } = req.params;

        // Check if job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        const user = await User.findById(req.user.id);

        // Check if already in favorites
        if (user.favorites.includes(jobId)) {
            return res.status(400).json({
                success: false,
                message: 'Job is already in favorites'
            });
        }

        user.favorites.push(jobId);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Job added to favorites'
        });
    } catch (error) {
        console.error('Add to favorites error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Remove job from favorites
// @route   DELETE /api/users/favorites/:jobId
// @access  Private
const removeFromFavorites = async (req, res) => {
    try {
        const { jobId } = req.params;

        const user = await User.findById(req.user.id);

        user.favorites = user.favorites.filter(fav => fav.toString() !== jobId);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Job removed from favorites'
        });
    } catch (error) {
        console.error('Remove from favorites error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get user's favorite jobs
// @route   GET /api/users/favorites
// @access  Private
const getFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'favorites',
            populate: {
                path: 'postedBy',
                select: 'name company.name'
            }
        });

        res.status(200).json({
            success: true,
            favorites: user.favorites
        });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
const deleteAccount = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user.id);

        res.cookie('token', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        });

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    uploadResume,
    uploadProfilePicture,
    addToFavorites,
    removeFromFavorites,
    getFavorites,
    deleteAccount
};