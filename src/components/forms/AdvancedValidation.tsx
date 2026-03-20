import React from 'react';
import { Shield, AlertCircle } from 'lucide-react';

interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'phone' | 'url';
  value?: string | number;
  message?: string;
}

interface AdvancedValidationProps {
  field: any;
  onValidationChange: (validation: any) => void;
}

const AdvancedValidation: React.FC<AdvancedValidationProps> = ({ field, onValidationChange }) => {
  const validation = field.validation || {};

  const updateValidation = (key: string, value: any) => {
    onValidationChange({
      ...validation,
      [key]: value
    });
  };

  const validationTypes = [
    {
      key: 'minLength',
      label: 'Minimum Length',
      type: 'number',
      applicable: ['text', 'textarea', 'email']
    },
    {
      key: 'maxLength',
      label: 'Maximum Length',
      type: 'number',
      applicable: ['text', 'textarea', 'email']
    },
    {
      key: 'pattern',
      label: 'Custom Pattern (Regex)',
      type: 'text',
      applicable: ['text', 'email', 'phone']
    }
  ];

  const commonPatterns = [
    {
      name: 'Phone Number',
      pattern: '^[+]?[1-9]?[0-9]{7,15}$',
      description: 'International phone number format'
    },
    {
      name: 'Postal Code (US)',
      pattern: '^[0-9]{5}(-[0-9]{4})?$',
      description: 'US ZIP code format'
    },
    {
      name: 'Credit Card',
      pattern: '^[0-9]{13,19}$',
      description: 'Credit card number (13-19 digits)'
    },
    {
      name: 'URL',
      pattern: '^https?://[^\\s/$.?#].[^\\s]*$',
      description: 'Valid URL starting with http/https'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
        <Shield className="w-4 h-4" />
        <span>Advanced Validation</span>
      </div>

      {validationTypes
        .filter(type => type.applicable.includes(field.type))
        .map(validationType => (
          <div key={validationType.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {validationType.label}
            </label>
            <input
              type={validationType.type}
              value={validation[validationType.key] || ''}
              onChange={(e) => updateValidation(validationType.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={
                validationType.key === 'pattern' 
                  ? 'Enter regex pattern' 
                  : `Enter ${validationType.label.toLowerCase()}`
              }
            />
          </div>
        ))}

      {field.type === 'text' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Common Patterns
          </label>
          <div className="space-y-2">
            {commonPatterns.map((pattern, index) => (
              <button
                key={index}
                onClick={() => updateValidation('pattern', pattern.pattern)}
                className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">{pattern.name}</div>
                <div className="text-sm text-gray-600">{pattern.description}</div>
                <div className="text-xs text-gray-500 font-mono mt-1">{pattern.pattern}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Custom Error Message
        </label>
        <input
          type="text"
          value={validation.errorMessage || ''}
          onChange={(e) => updateValidation('errorMessage', e.target.value)}
          placeholder="Enter custom error message"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Leave empty to use default validation messages
        </p>
      </div>

      {validation.pattern && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-yellow-800">Pattern Preview</div>
              <div className="text-yellow-700 font-mono text-xs mt-1">
                {validation.pattern}
              </div>
              <div className="text-yellow-600 mt-1">
                Test your pattern thoroughly before publishing the form
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedValidation;