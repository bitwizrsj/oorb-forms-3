import React, { useState } from 'react';
import { Plus, Trash2, Check, X, HelpCircle } from 'lucide-react';

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionAnswerFieldProps {
  field: any;
  onFieldUpdate: (updates: any) => void;
  isPreview?: boolean;
  onAnswerSelect?: (questionId: string, selectedOptions: string[]) => void;
  selectedAnswers?: string[];
}

const QuestionAnswerField: React.FC<QuestionAnswerFieldProps> = ({
  field,
  onFieldUpdate,
  isPreview = false,
  onAnswerSelect,
  selectedAnswers = []
}) => {
  const [newOptionText, setNewOptionText] = useState('');

  const addOption = () => {
    if (!newOptionText.trim()) return;
    
    const newOption: QuestionOption = {
      id: `option_${Date.now()}`,
      text: newOptionText.trim(),
      isCorrect: false
    };
    
    const updatedOptions = [...(field.questionOptions || []), newOption];
    onFieldUpdate({ questionOptions: updatedOptions });
    setNewOptionText('');
  };

  const updateOption = (optionId: string, updates: Partial<QuestionOption>) => {
    const updatedOptions = (field.questionOptions || []).map((option: QuestionOption) =>
      option.id === optionId ? { ...option, ...updates } : option
    );
    onFieldUpdate({ questionOptions: updatedOptions });
  };

  const deleteOption = (optionId: string) => {
    const updatedOptions = (field.questionOptions || []).filter((option: QuestionOption) => 
      option.id !== optionId
    );
    onFieldUpdate({ questionOptions: updatedOptions });
  };

  const toggleCorrectAnswer = (optionId: string) => {
    const updatedOptions = (field.questionOptions || []).map((option: QuestionOption) => {
      if (field.questionType === 'single-choice') {
        // For single choice, only one can be correct
        return { ...option, isCorrect: option.id === optionId };
      } else {
        // For multiple choice, toggle the selected option
        return option.id === optionId ? { ...option, isCorrect: !option.isCorrect } : option;
      }
    });
    onFieldUpdate({ questionOptions: updatedOptions });
  };

  const handleAnswerSelection = (optionId: string) => {
    if (!onAnswerSelect) return;

    let newSelectedAnswers: string[];
    
    if (field.questionType === 'single-choice') {
      newSelectedAnswers = [optionId];
    } else {
      newSelectedAnswers = selectedAnswers.includes(optionId)
        ? selectedAnswers.filter(id => id !== optionId)
        : [...selectedAnswers, optionId];
    }
    
    onAnswerSelect(field.id, newSelectedAnswers);
  };

  if (isPreview) {
    return (
      <div className="space-y-3">
        <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-md">
          <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Question</p>
            <p className="text-sm text-blue-800">
              {field.questionType === 'single-choice' ? 'Select one answer' : 'Select all correct answers'}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          {(field.questionOptions || []).map((option: QuestionOption) => (
            <label key={option.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                type={field.questionType === 'single-choice' ? 'radio' : 'checkbox'}
                name={field.id}
                value={option.id}
                checked={selectedAnswers.includes(option.id)}
                onChange={() => handleAnswerSelection(option.id)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-900">{option.text}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question Type
        </label>
        <select
          value={field.questionType || 'single-choice'}
          onChange={(e) => onFieldUpdate({ questionType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="single-choice">Single Choice (One correct answer)</option>
          <option value="multiple-choice">Multiple Choice (Multiple correct answers)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question Text
        </label>
        <textarea
          value={field.questionText || ''}
          onChange={(e) => onFieldUpdate({ questionText: e.target.value })}
          placeholder="Enter your question here..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Answer Options
        </label>
        
        <div className="space-y-2 mb-3">
          {(field.questionOptions || []).map((option: QuestionOption, index: number) => (
            <div key={option.id} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md">
              <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
              
              <input
                type="text"
                value={option.text}
                onChange={(e) => updateOption(option.id, { text: e.target.value })}
                placeholder="Enter option text"
                className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
              
              <button
                onClick={() => toggleCorrectAnswer(option.id)}
                className={`p-1 rounded transition-colors ${
                  option.isCorrect 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
                title={option.isCorrect ? 'Correct answer' : 'Mark as correct'}
              >
                <Check className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => deleteOption(option.id)}
                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                title="Delete option"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            value={newOptionText}
            onChange={(e) => setNewOptionText(e.target.value)}
            placeholder="Add new option..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && addOption()}
          />
          <button
            onClick={addOption}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Mark the correct answer(s) by clicking the check icon. 
          {field.questionType === 'single-choice' 
            ? ' Only one answer can be marked as correct for single choice questions.'
            : ' Multiple answers can be marked as correct for multiple choice questions.'
          }
        </p>
      </div>
    </div>
  );
};

export default QuestionAnswerField;