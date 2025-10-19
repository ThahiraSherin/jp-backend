const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coverLetter: {
        type: String,
        maxLength: [1000, 'Cover letter cannot be more than 1000 characters long']
    },
    resume: {
        type: String,
        required: [true, 'Resume is required']
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'shortlisted', 'interviewed', 'hired', 'rejected'],
        default: 'pending'
    },
    appliedAt: {
        type: Date,
        default: Date.now
    },
    reviewedAt: {
        type: Date
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String,
        maxLength: [500, 'Notes cannot be more than 500 characters long']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    interview: {
        scheduled: {
            type: Boolean,
            default: false
        },
        date: Date,
        time: String,
        location: String,
        type: {
            type: String,
            enum: ['in-person', 'phone', 'video'],

        },
        notes: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);