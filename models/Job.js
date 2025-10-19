const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    const mongoose = require('mongoose');

    const jobSchema = new mongoose.Schema({
        title: {
            type: String,
            required: [true, 'Please provide a job title'],
            trim: true,
            maxLength: [100, 'Job title cannot exceed 100 characters']
        },
        description: {
            type: String,
            required: [true, 'Please provide a job description'],
            maxLength: [2000, 'Job description cannot exceed 2000 characters']
        },
        requirements: {
            type: String,
            required: [true, 'Please provide job requirements'],
        },
        company: {
            type: String,
            required: [true, 'Please provide company name'],
        },
        location: {
            type: String,
            required: [true, 'Please provide job location'],
        },
        jobType: {
            type: String,
            required: [true, 'Please provide job type'],
            enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
        },
        category: {
            type: String,
            required: [true, 'Please provide job category'],
            enum: [
                'Technology',
                'Finance',
                'Healthcare',
                'Education',
                'Marketing',
                'Sales',
                'Human Resources',
                'Operations',
                'Customer Service',
                'Legal',
                'Other'
            ]
        },
        experienceLevel: {
            type: String,
            required: [true, 'Please provide experience level'],
            enum: ['entry-level', 'mid-level', 'senior-level', 'executive'],
        },
        salary: {
            min: {
                type: Number,
                required: [true, 'Please provide minimum salary'],
            },
            max: {
                type: Number,
                required: [true, 'Please provide maximum salary'],
            },
            currency: {
                type: String,
                default: 'USD'
            }
        },
        skills: [{
            type: String,
            required: true,
        }],
        benefits: [String],
        applicationDeadline: {
            type: Date,
            required: [true, 'Please provide application deadline'],
        },
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'closed', 'draft'],
            default: 'active',
        },
        applicationsCount: {
            type: Number,
            default: 0
        },
        views: {
            type: Number,
            default: 0
        },
        isRemote: {
            type: Boolean,
            default: false
        },
        tags: [String],
        slug: {
            type: String,
            unique: true,
            index: true
        }
    }, {
        timestamps: true
    });

    // simple slugify helper
    function slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    // generate slug before saving if missing
    jobSchema.pre('save', function (next) {
        if (!this.slug && this.title) {
            const shortId = this._id ? this._id.toString().slice(-6) : Date.now().toString(36).slice(-6);
            this.slug = `${slugify(this.title)}-${shortId}`;
        }
        next();
    });

    module.exports = mongoose.model('Job', jobSchema);