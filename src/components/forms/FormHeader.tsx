import React from 'react';
import { Clock, Eye, Users, Calendar } from 'lucide-react';

interface FormHeaderProps {
  form: {
    title: string;
    description: string;
    views?: number;
    responses?: number;
    createdAt?: string;
    estimatedTime?: number;
    status?: string;
  };
  showStats?: boolean;
}

const FormHeader: React.FC<FormHeaderProps> = ({ form, showStats = false }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Status Badge */}
        {form.status && (
          <div className="mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(form.status)}`}>
              {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
            </span>
          </div>
        )}

        {/* Title and Description */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {form.title}
          </h1>
          {form.description && (
            <p className="text-lg text-gray-600 leading-relaxed">
              {form.description}
            </p>
          )}
        </div>

        {/* Form Stats */}
        {showStats && (
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
            {form.views !== undefined && (
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>{form.views.toLocaleString()} views</span>
              </div>
            )}
            
            {form.responses !== undefined && (
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{form.responses.toLocaleString()} responses</span>
              </div>
            )}
            
            {form.createdAt && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Created {formatDate(form.createdAt)}</span>
              </div>
            )}
            
            {form.estimatedTime && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>~{form.estimatedTime} min to complete</span>
              </div>
            )}
          </div>
        )}

        {/* Required Fields Notice */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-sm">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Note:</span> Fields marked with an asterisk (*) are required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FormHeader;