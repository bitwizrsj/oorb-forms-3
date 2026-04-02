import React from 'react';
import { X, Trash2 } from 'lucide-react';
import AdvancedValidation from './AdvancedValidation';
import QuestionAnswerField from './QuestionAnswerField';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'file' | 'rating' | 'question';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: any;
  questionType?: 'single-choice' | 'multiple-choice';
  questionText?: string;
  questionOptions?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  googleDriveFolderId?: string;
}

interface FieldEditorProps {
  field: FormField | undefined;
  updateField: (id: string, updates: Partial<FormField>) => void;
  deleteField: (id: string) => void;
  mobileFieldEditorOpen: boolean;
  setMobileFieldEditorOpen: (open: boolean) => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  updateField,
  deleteField,
  mobileFieldEditorOpen,
  setMobileFieldEditorOpen
}) => {
  if (!field) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`bg-white border-l border-gray-200 p-6 w-[min(20rem,100vw)] shadow-2xl fixed right-0 top-0 h-full z-50 md:relative md:z-0 flex-shrink-0 overflow-y-auto ${
        mobileFieldEditorOpen ? 'block' : 'hidden md:block'
      }`}
    >
      <div className="flex justify-between items-center mb-4 md:hidden">
        <h3 className="text-lg font-semibold">Field Settings</h3>
        <button
          onClick={() => setMobileFieldEditorOpen(false)}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Label
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => updateField(field.id, { label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {['text', 'email', 'phone', 'textarea'].includes(field.type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {field.type === 'file' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Drive Folder ID (Optional)
            </label>
            <input
              type="text"
              value={field.googleDriveFolderId || ''}
              onChange={(e) => updateField(field.id, { googleDriveFolderId: e.target.value })}
              placeholder="e.g. 1B2c3D4e5F6g..."
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for default. (Requires Google Drive Integration)
            </p>
          </div>
        )}

        {['radio', 'checkbox', 'select'].includes(field.type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Options
            </label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(field.options || [])];
                      newOptions[index] = e.target.value;
                      updateField(field.id, { options: newOptions });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => {
                      const newOptions = field.options?.filter((_, i) => i !== index);
                      updateField(field.id, { options: newOptions });
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
                  updateField(field.id, { options: newOptions });
                }}
                className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-sm text-gray-600 hover:bg-gray-50"
              >
                + Add Option
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="required"
            checked={field.required}
            onChange={(e) => updateField(field.id, { required: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="required" className="text-sm font-medium text-gray-700">
            Required field
          </label>
        </div>

        <AdvancedValidation
          field={field}
          onValidationChange={(validation) => updateField(field.id, { validation })}
        />

        {field.type === 'question' && (
          <QuestionAnswerField
            field={field}
            onFieldUpdate={(updates) => updateField(field.id, updates)}
          />
        )}

        <button
          onClick={() => deleteField(field.id)}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors shadow-lg"
        >
          Delete Field
        </button>
      </div>
    </div>
  );
};

export default FieldEditor;
