import React, { useState } from 'react';
import { Search, Star, Copy, Eye, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  rating: number;
  uses: number;
  preview: string;
  fields: any[];
}

interface TemplateLibraryProps {
  onSelectTemplate: (template: any) => void;
  onClose: () => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onSelectTemplate, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const templates: Template[] = [
    {
      id: 'job-application',
      title: 'Job Application Form',
      description: 'Complete job application with resume upload and screening questions',
      category: 'HR',
      rating: 4.8,
      uses: 1250,
      preview: 'Name, Email, Position, Experience, Resume Upload, Cover Letter',
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
      preview: 'Rating, Satisfaction, Recommendations, Comments',
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
      preview: 'Name, Email, Dietary Preferences, T-shirt Size, Special Requirements',
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
      preview: 'Name, Email, Company, Subject, Message',
      fields: [
        { type: 'text', label: 'Name', required: true },
        { type: 'email', label: 'Email', required: true },
        { type: 'text', label: 'Company', required: false },
        { type: 'select', label: 'Subject', options: ['General Inquiry', 'Sales', 'Support'], required: true },
        { type: 'textarea', label: 'Message', required: true }
      ]
    },
    {
      id: 'product-feedback',
      title: 'Product Feedback',
      description: 'Detailed product review with images and ratings',
      category: 'Product',
      rating: 4.5,
      uses: 670,
      preview: 'Product Rating, Features, Images, Recommendations',
      fields: [
        { type: 'rating', label: 'Product Rating', required: true },
        { type: 'checkbox', label: 'Liked Features', options: ['Design', 'Functionality', 'Price', 'Quality'], required: false },
        { type: 'file', label: 'Product Images', required: false },
        { type: 'radio', label: 'Would Recommend?', options: ['Yes', 'No', 'Maybe'], required: true },
        { type: 'textarea', label: 'Detailed Review', required: false }
      ]
    },
    {
      id: 'newsletter-signup',
      title: 'Newsletter Signup',
      description: 'Simple newsletter subscription form',
      category: 'Marketing',
      rating: 4.4,
      uses: 1800,
      preview: 'Email, Name, Interests, Frequency',
      fields: [
        { type: 'email', label: 'Email Address', required: true },
        { type: 'text', label: 'First Name', required: false },
        { type: 'checkbox', label: 'Interests', options: ['Technology', 'Business', 'Design', 'Marketing'], required: false },
        { type: 'radio', label: 'Email Frequency', options: ['Daily', 'Weekly', 'Monthly'], required: true }
      ]
    }
  ];

  const categories = ['all', 'HR', 'Survey', 'Events', 'Business', 'Product', 'Marketing'];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const useTemplate = (template: Template) => {
    const formData = {
      title: template.title,
      description: template.description,
      fields: template.fields.map((field, index) => ({
        ...field,
        id: `field_${Date.now()}_${index}`,
        placeholder: field.type === 'textarea' ? 'Enter your answer here...' : 'Enter your answer'
      })),
      status: 'draft'
    };
    
    onSelectTemplate(formData);
    toast.success(`Template "${template.title}" loaded successfully!`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-sm shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Template Library</h2>
              <p className="text-gray-600">Choose from professionally designed form templates</p>
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
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-2 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'All Categories' : category}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <div key={template.id} className="border border-gray-200 rounded-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.title}</h3>
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {template.category}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                
                <div className="text-xs text-gray-500 mb-4">
                  <strong>Fields:</strong> {template.preview}
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{template.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Copy className="w-4 h-4" />
                      <span>{template.uses} uses</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => useTemplate(template)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Use Template
                  </button>
                  <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateLibrary;