const mongoose = require('mongoose');

const adminSkillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true,
    unique: true
  },
  category: {
    type: String,
    required: [true, 'Skill category is required'],
    enum: [
      'Programming Languages',
      'Frameworks & Libraries',
      'Databases',
      'Cloud Platforms',
      'DevOps & Tools',
      'Mobile Development',
      'Web Development',
      'Data Science & Analytics',
      'Cybersecurity',
      'Project Management',
      'Design & UX',
      'Quality Assurance',
      'Other'
    ]
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
adminSkillSchema.index({ name: 1 });
adminSkillSchema.index({ category: 1 });
adminSkillSchema.index({ isActive: 1 });

module.exports = mongoose.model('AdminSkill', adminSkillSchema);