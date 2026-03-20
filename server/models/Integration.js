import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema({
  formId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Form', 
    required: true 
  },
  type: {
    type: String,
    required: true,
    enum: ['webhook', 'google-sheets', 'slack', 'mailchimp', 'notion', 'discord', 'zapier']
  },
  name: { type: String, required: true },
  config: {
    // Webhook
    url: String,
    method: { type: String, default: 'POST' },
    headers: mongoose.Schema.Types.Mixed,
    
    // Google Sheets
    spreadsheetId: String,
    worksheetName: String,
    
    // Slack/Discord
    webhookUrl: String,
    channel: String,
    
    // Mailchimp
    apiKey: String,
    audienceId: String,
    
    // Notion
    databaseId: String,
    accessToken: String
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastTriggered: Date,
  triggerCount: { type: Number, default: 0 }
});

export default mongoose.model('Integration', integrationSchema);