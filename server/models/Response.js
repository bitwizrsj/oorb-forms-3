import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true
  },
  responses: [{
    fieldId: { type: String, required: true },
    fieldLabel: { type: String, required: true },
    fieldType: { type: String, required: true },
    value: mongoose.Schema.Types.Mixed,
    files: [String]
  }],
  submittedAt: { type: Date, default: Date.now },
  submitterInfo: {
    ip: String,
    userAgent: String,
    location: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    savedToAccount: { type: Boolean, default: false }
  },
  completionTime: Number,
  isComplete: { type: Boolean, default: true }
});

export default mongoose.models.Response ||
  mongoose.model('Response', responseSchema);
