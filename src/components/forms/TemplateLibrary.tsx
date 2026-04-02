import React, { useState } from 'react';
import { Search, Star, Copy, Eye, Plus, Layout, Sparkles, X, ChevronRight, Hash } from 'lucide-react';
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
      title: 'Job Application',
      description: 'Professional recruitment form with resume upload and screening q\'s',
      category: 'HR',
      rating: 4.8,
      uses: 1250,
      preview: 'Name, Email, Position, Experience, Resume...',
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
      title: 'Customer Satisfaction',
      description: 'Analyze user experience with ratings and open-ended suggestions',
      category: 'Survey',
      rating: 4.9,
      uses: 2100,
      preview: 'Rating, Satisfaction, Recommendations...',
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
      description: 'Streamline signup for webinars, workshops, or ceremonies',
      category: 'Events',
      rating: 4.7,
      uses: 890,
      preview: 'Name, Email, Dietary, T-shirt Size...',
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
      title: 'Lead Generation',
      description: 'Capture high-intent leads with essential business inquiries',
      category: 'Business',
      rating: 4.6,
      uses: 3200,
      preview: 'Name, Email, Company, Subject...',
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
      title: 'Product Review',
      description: 'Gather actionable insights on features and pricing models',
      category: 'Product',
      rating: 4.5,
      uses: 670,
      preview: 'Rating, Features, Images, Recommendations...',
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
      title: 'Growth & Newsletter',
      description: 'Build your audience with a simple, high-converting signup',
      category: 'Marketing',
      rating: 4.4,
      uses: 1800,
      preview: 'Email, Name, Interests, Frequency...',
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
    toast.success(`Template loaded!`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-6xl w-full mx-auto max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in duration-300">
        
        {/* Header Section */}
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-[18px] flex items-center justify-center shadow-xl shadow-indigo-100">
                <Layout className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Template Library
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Premium</span>
                </h2>
                <p className="text-[13px] text-slate-400 font-medium">Select a high-fidelity starting point for your workspace</p>
              </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300 text-slate-500 transition-all shadow-sm group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-8 bg-white" style={{ scrollbarWidth: 'none' }}>
          
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row items-center gap-4 mb-10">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search templates (e.g. 'Application')..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-transparent outline-none transition-all placeholder:text-slate-300 shadow-inner"
              />
            </div>
            
            <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap bg-slate-50 p-1 rounded-2xl border border-slate-200 w-full lg:w-auto self-start lg:self-center [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl text-[12px] font-bold tracking-tight transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {category === 'all' ? 'All Classes' : category}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-4">
            {filteredTemplates.map(template => (
              <div 
                key={template.id} 
                className="group relative bg-white border border-slate-200 rounded-[28px] p-6 hover:border-indigo-400 hover:shadow-[0_20px_50px_rgba(79,70,229,0.08)] transition-all duration-300 flex flex-col h-full overflow-hidden"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <Sparkles size={22} className={template.rating > 4.7 ? 'text-indigo-600' : ''} />
                    </div>
                    <div className="flex flex-col items-end">
                         <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-[11px] font-black">{template.rating}</span>
                         </div>
                         <span className="mt-1 text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none pr-1">Rating</span>
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-black text-slate-900 mb-1 leading-tight group-hover:text-indigo-600 transition-colors">
                        {template.title}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Hash size={10} /> {template.category}
                        </span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{template.uses.toLocaleString()} Uses</span>
                    </div>
                </div>
                
                <p className="text-[13px] text-slate-500 font-medium mb-6 line-clamp-2">
                  {template.description}
                </p>
                
                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center gap-3">
                   <button
                        onClick={() => useTemplate(template)}
                        className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-[18px] text-[13px] font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                        <Plus className="w-4 h-4" />
                        Select
                   </button>
                   <button className="w-12 h-12 flex items-center justify-center border border-slate-200 rounded-[18px] text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all">
                        <Eye size={18} />
                   </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
               <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm mx-auto mb-4">
                  <Search className="w-6 h-6 text-slate-300" />
               </div>
               <h3 className="text-lg font-black text-slate-900 mb-1">No templates found</h3>
               <p className="text-sm text-slate-400 font-medium">Try broadening your search or switching categories</p>
               <button 
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                className="mt-6 text-sm font-bold text-indigo-600 hover:text-indigo-700"
               >
                 Clear all filters
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateLibrary;