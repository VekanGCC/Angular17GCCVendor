const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  requirement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Requirement',
    required: true
  },
  
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },
  
  status: {
    type: String,
    enum: ['applied', 'pending', 'shortlisted', 'interview', 'accepted', 'rejected', 'offer_created', 'onboarded', 'did_not_join', 'withdrawn'],
    default: 'applied'
  },
  
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  
  proposedRate: {
    amount: Number,
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
  
  availability: {
    startDate: Date,
    hoursPerWeek: Number
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure one application per resource per requirement
applicationSchema.index({ requirement: 1, resource: 1 }, { unique: true });

// Other indexes for better performance
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdBy: 1 });
applicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);