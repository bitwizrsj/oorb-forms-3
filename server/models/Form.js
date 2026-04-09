import mongoose from 'mongoose';

const fieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: [
      'text', 'email', 'phone', 'textarea', 'select',
      'radio', 'checkbox', 'date', 'file', 'rating', 'question'
    ]
  },
  label: { type: String, required: true },
  placeholder: String,
  required: { type: Boolean, default: false },
  options: [String],
  validation: {
    minLength: Number,
    maxLength: Number,
    pattern: String
  },
  questionType: {
    type: String,
    enum: ['single-choice', 'multiple-choice'],
    required: function () {
      return this.type === 'question';
    }
  },
  questionText: String,
  questionOptions: [{
    id: String,
    text: String,
    isCorrect: { type: Boolean, default: false }
  }],
  googleDriveFolderId: String
});

const formSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  headerImage: String,
  fields: [fieldSchema],
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  settings: {
    allowMultipleResponses: { type: Boolean, default: true },
    requireLogin: { type: Boolean, default: true },
    showProgressBar: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    notificationEmail: { type: String, default: null },
    responseLimit: { type: Number, default: null },
    shuffleQuestions: { type: Boolean, default: false },
    confirmationPage: { type: Boolean, default: true },
    allowedEmailDomains: { type: [String], default: [] },
    googleSheets: {
      spreadsheetId: { type: String, default: null },
      sheetName: { type: String, default: 'Responses' },
      enabled: { type: Boolean, default: false }
    },
    customTheme: {
      primaryColor: { type: String, default: '#3B82F6' },
      backgroundColor: { type: String, default: '#FFFFFF' }
    },
    expiryDate: { type: Date, default: null },
    allowEditing: { type: Boolean, default: false },
    emailCopy: { type: Boolean, default: false },
    editingDuration: { type: Number, default: 0 } // in minutes, 0 means until form expires
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft'
  },
  shareUrl: { type: String, unique: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  responses: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  pendingCollaborators: [{
    email: String,
    token: String,
    invitedAt: { type: Date, default: Date.now }
  }]
});

formSchema.pre('save', function (next) {
  if (!this.shareUrl) {
    this.shareUrl = `form-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Form ||
  mongoose.model('Form', formSchema);
