import React from 'react';
import { Plus } from 'lucide-react';
import form3d from '../../asset/form.png';
import ai3d from '../../asset/ai.png';
import temp3d from '../../asset/temp.png';

interface CreateFormSectionProps {
  onCreateForm: () => void;
}

const CreateFormSection: React.FC<CreateFormSectionProps> = ({ onCreateForm }) => {
  return (
    <div className="px-4 sm:px-6 py-4 bg-white border-t border-gray-200">
      <div className="mb-8 mt-16 sm:mt-24">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Form</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Blank Form */}
          <div 
            onClick={onCreateForm}
            className="bg-blue-200 rounded-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-sm border-gray-200 flex items-center justify-center group-hover:border-blue-500 transition-colors relative">
                <img src={form3d} alt="form" className="object-contain" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Blank Form</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Start with a blank form and add your own questions
                </p>
              </div>
            </div>
          </div>

          {/* Create by AI */}
          <div className="bg-violet-200 rounded-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="w-16 h-20 sm:w-20 sm:h-24 bg-purple-50 rounded-sm flex items-center justify-center group-hover:border-purple-500 transition-colors relative">
                <img src={ai3d} alt="AI form" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Create by AI</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Let AI help you create a form based on your description
                </p>
              </div>
            </div>
          </div>

          {/* Use Template */}
          <div className="bg-green-200 rounded-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-all cursor-pointer group sm:col-span-2 lg:col-span-1">
            <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-sm flex items-center justify-center group-hover:border-green-500 transition-colors relative">
                <img src={temp3d} alt="template" className="object-contain" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Use Template</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Choose from pre-built templates for common use cases
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFormSection;