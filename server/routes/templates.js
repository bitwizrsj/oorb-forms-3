import express from 'express';

const router = express.Router();

// Get all templates
router.get('/', async (req, res) => {
  try {
    const templates = [
      {
        id: 'job-application',
        title: 'Job Application Form',
        description: 'Complete job application with resume upload and screening questions',
        category: 'HR',
        rating: 4.8,
        uses: 1250,
        fields: [
          { type: 'text', label: 'Full Name', required: true },
          { type: 'email', label: 'Email Address', required: true },
          { type: 'phone', label: 'Phone Number', required: true },
          { type: 'select', label: 'Position', options: ['Frontend Developer', 'Backend Developer', 'Designer'], required: true },
          { type: 'radio', label: 'Experience Level', options: ['Entry Level', 'Mid Level', 'Senior Level'], required: true },
          { type: 'file', label: 'Resume', required: true },
          { type: 'textarea', label: 'Cover Letter', required: false }
        ]
      },
      {
        id: 'customer-feedback',
        title: 'Customer Feedback Survey',
        description: 'Comprehensive feedback form with ratings and suggestions',
        category: 'Survey',
        rating: 4.9,
        uses: 2100,
        fields: [
          { type: 'rating', label: 'Overall Rating', required: true },
          { type: 'radio', label: 'Satisfaction Level', options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'], required: true },
          { type: 'checkbox', label: 'What did you like?', options: ['Quality', 'Service', 'Price', 'Speed'], required: false },
          { type: 'textarea', label: 'Additional Comments', required: false }
        ]
      },
      {
        id: 'event-registration',
        title: 'Event Registration',
        description: 'Event signup with attendee details and preferences',
        category: 'Events',
        rating: 4.7,
        uses: 890,
        fields: [
          { type: 'text', label: 'Full Name', required: true },
          { type: 'email', label: 'Email', required: true },
          { type: 'select', label: 'Dietary Preferences', options: ['None', 'Vegetarian', 'Vegan', 'Gluten-Free'], required: false },
          { type: 'radio', label: 'T-shirt Size', options: ['S', 'M', 'L', 'XL', 'XXL'], required: false },
          { type: 'textarea', label: 'Special Requirements', required: false }
        ]
      },
      {
        id: 'contact-form',
        title: 'Contact Form',
        description: 'Simple contact form for lead generation',
        category: 'Business',
        rating: 4.6,
        uses: 3200,
        fields: [
          { type: 'text', label: 'Name', required: true },
          { type: 'email', label: 'Email', required: true },
          { type: 'text', label: 'Company', required: false },
          { type: 'select', label: 'Subject', options: ['General Inquiry', 'Sales', 'Support'], required: true },
          { type: 'textarea', label: 'Message', required: true }
        ]
      }
    ];

    const { category } = req.query;
    const filteredTemplates = category && category !== 'all' 
      ? templates.filter(template => template.category === category)
      : templates;

    res.json(filteredTemplates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get template by ID
router.get('/:id', async (req, res) => {
  try {
    const templates = [
      // ... same templates array as above
    ];
    
    const template = templates.find(t => t.id === req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;