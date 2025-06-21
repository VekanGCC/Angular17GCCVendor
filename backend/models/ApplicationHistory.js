const mongoose = require('mongoose');

const applicationHistorySchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  
  previousStatus: {
    type: String,
    enum: ['applied', 'pending', 'shortlisted', 'interview', 'accepted', 'rejected', 'offer_created', 'onboarded', 'did_not_join', 'withdrawn', 'deleted', null]
  },
  
  status: {
    type: String,
    enum: ['applied', 'pending', 'shortlisted', 'interview', 'accepted', 'rejected', 'offer_created', 'onboarded', 'did_not_join', 'withdrawn', 'deleted'],
    required: true
  },
  
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
applicationHistorySchema.index({ application: 1, createdAt: -1 });
applicationHistorySchema.index({ updatedBy: 1 });

module.exports = mongoose.model('ApplicationHistory', applicationHistorySchema);