import React, { useState } from 'react';
import { Sparkles, Wand2, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// const DEEPSEEK_API_KEY = 'sk-your-deepseek-api-key'; // Replace with your actual API key
// const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
interface AIFormBuilderProps {
  onFormGenerated: (form: any) => void;
  onClose: () => void;
}

const AIFormBuilder: React.FC<AIFormBuilderProps> = ({ onFormGenerated, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const generateForm = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe the form you want to create');
      return;
    }

    setGenerating(true);

    try {
      const generatedForm = await generateFormWithAI(prompt);
      onFormGenerated(generatedForm);
      toast.success('Form generated successfully!');
    } catch (error) {
      console.error('AI form generation error:', error);
      toast.error('Failed to generate form. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // const generateFormWithAI = async (prompt: string) => {
  //   const systemPrompt = `You are a form builder AI. Generate a JSON form structure based on the user's description. 

  //   Return ONLY a valid JSON object with this structure:
  //   {
  //     "title": "Form Title",
  //     "description": "Form description",
  //     "fields": [
  //       {
  //         "type": "text|email|phone|textarea|select|radio|checkbox|date|file|rating",
  //         "label": "Field Label",
  //         "placeholder": "Placeholder text (optional)",
  //         "required": true|false,
  //         "options": ["option1", "option2"] // only for select, radio, checkbox
  //       }
  //     ]
  //   }

  //   Available field types: text, email, phone, textarea, select, radio, checkbox, date, file, rating
  //   Make the form practical and user-friendly based on the description.`;

  //   const response = await fetch(DEEPSEEK_API_URL, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
  //     },
  //     body: JSON.stringify({
  //       model: 'deepseek-chat',
  //       messages: [
  //         { role: 'system', content: systemPrompt },
  //         { role: 'user', content: prompt }
  //       ],
  //       temperature: 0.7,
  //       max_tokens: 2000,
  //     }),
  //   });

  //   if (!response.ok) {
  //     throw new Error(`API request failed: ${response.statusText}`);
  //   }

  //   const data = await response.json();
  //   const aiResponse = data.choices[0]?.message?.content;

  //   if (!aiResponse) {
  //     throw new Error('No response from AI');
  //   }

  //   try {
  //     // Extract JSON from the response (in case there's extra text)
  //     const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
  //     const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
  //     const formData = JSON.parse(jsonString);

  //     // Validate the structure
  //     if (!formData.title || !formData.fields || !Array.isArray(formData.fields)) {
  //       throw new Error('Invalid form structure from AI');
  //     }

  //     return {
  //       ...formData,
  //       status: 'draft'
  //     };
  //   } catch (parseError) {
  //     console.error('Failed to parse AI response:', aiResponse);
  //     throw new Error('Failed to parse AI response');
  //   }
  // };

  const generateFormWithAI = async (prompt: string) => {
    const systemPrompt = `You are a form builder AI. Generate a JSON form structure based on the user's description. 

  Return ONLY a valid JSON object with this structure:
  {
    "title": "Form Title",
    "description": "Form description",
    "fields": [
      {
        "type": "text|email|phone|textarea|select|radio|checkbox|date|file|rating",
        "label": "Field Label",
        "placeholder": "Placeholder text (optional)",
        "required": true|false,
        "options": ["option1", "option2"] // only for select, radio, checkbox
      }
    ]
  }

  Available field types: text, email, phone, textarea, select, radio, checkbox, date, file, rating
  Make the form practical and user-friendly based on the description.`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText || 'Bad Request'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
      const formData = JSON.parse(jsonString);

      // Validate the structure
      if (!formData.title || !formData.fields || !Array.isArray(formData.fields)) {
        throw new Error('Invalid form structure from AI');
      }

      // Inject unique IDs for each field to satisfy backend validation
      const fieldsWithIds = formData.fields.map((field: any, index: number) => ({
        ...field,
        id: field.id || `field_${Date.now()}_${index}`
      }));

      return {
        ...formData,
        fields: fieldsWithIds,
        status: 'draft'
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Failed to parse AI response');
    }
  };

  const generateFormFromPrompt = (prompt: string) => {
    // Simple AI simulation - in real implementation, this would call an AI API
    const lowerPrompt = prompt.toLowerCase();

    let fields = [];
    let title = 'Generated Form';
    let description = 'AI-generated form based on your requirements';

    if (lowerPrompt.includes('job') || lowerPrompt.includes('application')) {
      title = 'Job Application Form';
      description = 'Apply for a position at our company';
      fields = [
        {
          id: 'name',
          type: 'text',
          label: 'Full Name',
          placeholder: 'Enter your full name',
          required: true
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          placeholder: 'your.email@example.com',
          required: true
        },
        {
          id: 'phone',
          type: 'phone',
          label: 'Phone Number',
          placeholder: '+1 (555) 123-4567',
          required: true
        },
        {
          id: 'position',
          type: 'select',
          label: 'Position Applied For',
          required: true,
          options: ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'UI/UX Designer', 'Product Manager']
        },
        {
          id: 'experience',
          type: 'radio',
          label: 'Years of Experience',
          required: true,
          options: ['0-1 years', '2-3 years', '4-5 years', '6+ years']
        },
        {
          id: 'resume',
          type: 'file',
          label: 'Upload Resume',
          required: true
        },
        {
          id: 'cover_letter',
          type: 'textarea',
          label: 'Cover Letter',
          placeholder: 'Tell us why you want to work with us...',
          required: false
        }
      ];
    } else if (lowerPrompt.includes('feedback') || lowerPrompt.includes('survey')) {
      title = 'Feedback Survey';
      description = 'Help us improve by sharing your feedback';
      fields = [
        {
          id: 'rating',
          type: 'rating',
          label: 'Overall Rating',
          required: true
        },
        {
          id: 'satisfaction',
          type: 'radio',
          label: 'How satisfied are you with our service?',
          required: true,
          options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied']
        },
        {
          id: 'recommend',
          type: 'radio',
          label: 'Would you recommend us to others?',
          required: true,
          options: ['Definitely', 'Probably', 'Not Sure', 'Probably Not', 'Definitely Not']
        },
        {
          id: 'improvements',
          type: 'checkbox',
          label: 'What areas need improvement?',
          options: ['Customer Service', 'Product Quality', 'Pricing', 'Website Experience', 'Delivery Speed']
        },
        {
          id: 'comments',
          type: 'textarea',
          label: 'Additional Comments',
          placeholder: 'Share any additional feedback...',
          required: false
        }
      ];
    } else if (lowerPrompt.includes('contact') || lowerPrompt.includes('lead')) {
      title = 'Contact Form';
      description = 'Get in touch with us';
      fields = [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          placeholder: 'Your name',
          required: true
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'your.email@example.com',
          required: true
        },
        {
          id: 'company',
          type: 'text',
          label: 'Company',
          placeholder: 'Your company name',
          required: false
        },
        {
          id: 'subject',
          type: 'select',
          label: 'Subject',
          required: true,
          options: ['General Inquiry', 'Sales', 'Support', 'Partnership', 'Other']
        },
        {
          id: 'message',
          type: 'textarea',
          label: 'Message',
          placeholder: 'How can we help you?',
          required: true
        }
      ];
    } else {
      // Generic form based on keywords
      fields = [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          placeholder: 'Enter your name',
          required: true
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'your.email@example.com',
          required: true
        },
        {
          id: 'message',
          type: 'textarea',
          label: 'Message',
          placeholder: 'Your message...',
          required: true
        }
      ];
    }

    return {
      title,
      description,
      fields: fields.map((field, index) => ({
        ...field,
        id: `field_${Date.now()}_${index}`
      })),
      status: 'draft'
    };
  };

  const suggestions = [
    "Create a job application form with resume upload and skill assessment",
    "Build a customer feedback survey with rating and multiple choice questions",
    "Design a contact form for lead generation with company details",
    "Make an event registration form with dietary preferences and t-shirt size",
    "Create a product feedback form with image upload and rating system"
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-sm shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-sm flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">AI Form Builder</h2>
                <p className="text-gray-600">Describe your form and let AI create it for you</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your form
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Create a job application form with name, email, resume upload, and 3 multiple choice questions about experience..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick suggestions:</h3>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(suggestion)}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-md text-sm text-gray-700 transition-colors"
                >
                  <Wand2 className="w-4 h-4 inline mr-2 text-purple-500" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={generateForm}
              disabled={generating || !prompt.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Form
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFormBuilder;