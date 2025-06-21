const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Resource name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Resource description is required'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  
  category: {
    type: String,
    required: [true, 'Resource category is required'],
    enum: [
      'developer',
      'designer',
      'project_manager',
      'qa_tester',
      'devops',
      'data_scientist',
      'content_writer',
      'marketing_specialist',
      'other'
    ]
  },
  
  skills: [{
    type: String,
    trim: true
  }],
  
  experience: {
    years: {
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
  
  availability: {
    status: {
      type: String,
      enum: ['available', 'partially_available', 'unavailable'],
      default: 'available'
    },
    hours_per_week: {
      type: Number,
      min: 0,
      max: 168
    },
    start_date: Date
  },
  
  rate: {
    hourly: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  location: {
    city: String,
    state: String,
    country: String,
    remote: {
      type: Boolean,
      default: true
    }
  },
  
  contact: {
    email: String,
    phone: String
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
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
resourceSchema.index({ category: 1, status: 1 });
resourceSchema.index({ 'skills': 1 });
resourceSchema.index({ createdBy: 1 });
resourceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Resource', resourceSchema);