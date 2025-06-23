const mongoose = require('mongoose');

const vendorSkillSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillName: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Skill description is required'],
    trim: true
  },
  yearsOfExperience: {
    type: Number,
    required: [true, 'Years of experience is required'],
    min: [0, 'Years of experience cannot be negative']
  },
  proficiency: {
    type: String,
    required: [true, 'Proficiency level is required'],
    enum: ['beginner', 'intermediate', 'advanced', 'expert']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add indexes for faster queries
vendorSkillSchema.index({ vendor: 1, skillName: 1 });
vendorSkillSchema.index({ status: 1 });
vendorSkillSchema.index({ category: 1 });

module.exports = mongoose.model('VendorSkill', vendorSkillSchema); 