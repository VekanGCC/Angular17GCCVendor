const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Requirement title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Requirement description is required'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  
  category: {
    type: String,
    required: [true, 'Requirement category is required'],
    enum: [
      'development',
      'design',
      'project_management',
      'qa_testing',
      'devops',
      'data_science',
      'content_writing',
      'marketing',
      'other'
    ]
  },
  
  skills: [{
    type: String,
    trim: true
  }],
  
  experience: {
    minYears: {
      type: Number,
      required: true,
      min: 0
    },
    level: {
      type: String,
      enum: ['junior', 'mid', 'senior', 'expert'],
      required: true
    }
  },
  
  duration: {
    type: Number, // in weeks
    required: true,
    min: 1
  },
  
  budget: {
    min: {
      type: Number,
      min: 0
    },
    max: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    type: {
      type: String,
      enum: ['hourly', 'fixed'],
      default: 'hourly'
    }
  },
  
  location: {
    remote: {
      type: Boolean,
      default: true
    },
    onsite: {
      type: Boolean,
      default: false
    },
    city: String,
    state: String,
    country: String
  },
  
  startDate: {
    type: Date,
    required: true
  },
  
  endDate: {
    type: Date
  },
  
  status: {
    type: String,
    enum: ['draft', 'open', 'in_progress', 'on_hold', 'completed', 'cancelled'],
    default: 'draft'
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
requirementSchema.index({ status: 1 });
requirementSchema.index({ category: 1, status: 1 });
requirementSchema.index({ 'skills': 1 });
requirementSchema.index({ createdBy: 1 });
requirementSchema.index({ assignedTo: 1 });
requirementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Requirement', requirementSchema);