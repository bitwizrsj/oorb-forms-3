import React, { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface ConditionalRule {
  id: string;
  fieldId: string;
  condition: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string;
  action: 'show' | 'hide' | 'require' | 'skip_to';
  targetFieldId?: string;
}

interface ConditionalLogicProps {
  fields: any[];
  rules: ConditionalRule[];
  onRulesChange: (rules: ConditionalRule[]) => void;
}

const ConditionalLogic: React.FC<ConditionalLogicProps> = ({ fields, rules, onRulesChange }) => {
  const [showRules, setShowRules] = useState(false);

  const addRule = () => {
    const newRule: ConditionalRule = {
      id: `rule_${Date.now()}`,
      fieldId: fields[0]?.id || '',
      condition: 'equals',
      value: '',
      action: 'show',
      targetFieldId: fields[1]?.id || ''
    };
    onRulesChange([...rules, newRule]);
  };

  const updateRule = (ruleId: string, updates: Partial<ConditionalRule>) => {
    onRulesChange(rules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  const deleteRule = (ruleId: string) => {
    onRulesChange(rules.filter(rule => rule.id !== ruleId));
  };

  const conditions = [
    { value: 'equals', label: 'equals' },
    { value: 'not_equals', label: 'does not equal' },
    { value: 'contains', label: 'contains' },
    { value: 'greater_than', label: 'is greater than' },
    { value: 'less_than', label: 'is less than' }
  ];

  const actions = [
    { value: 'show', label: 'Show field' },
    { value: 'hide', label: 'Hide field' },
    { value: 'require', label: 'Make required' },
    { value: 'skip_to', label: 'Skip to field' }
  ];

  if (!showRules) {
    return (
      <div className="border border-gray-200 rounded-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Conditional Logic</h3>
            <p className="text-sm text-gray-600">Show or hide fields based on user responses</p>
          </div>
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Add Logic</span>
          </button>
        </div>
        {rules.length > 0 && (
          <div className="mt-3 text-sm text-gray-600">
            {rules.length} rule{rules.length !== 1 ? 's' : ''} configured
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-gray-900">Conditional Logic</h3>
          <p className="text-sm text-gray-600">Configure when fields should be shown or hidden</p>
        </div>
        <button
          onClick={() => setShowRules(false)}
          className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <EyeOff className="w-4 h-4" />
          <span>Hide</span>
        </button>
      </div>

      <div className="space-y-4">
        {rules.map((rule, index) => (
          <div key={rule.id} className="border border-gray-200 rounded-sm p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Rule {index + 1}</h4>
              <button
                onClick={() => deleteRule(rule.id)}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Source Field */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  When field
                </label>
                <select
                  value={rule.fieldId}
                  onChange={(e) => updateRule(rule.id, { fieldId: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  {fields.map(field => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <select
                  value={rule.condition}
                  onChange={(e) => updateRule(rule.id, { condition: e.target.value as any })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  {conditions.map(condition => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Value
                </label>
                <input
                  type="text"
                  value={rule.value}
                  onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                  placeholder="Enter value"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Action */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Then
                </label>
                <select
                  value={rule.action}
                  onChange={(e) => updateRule(rule.id, { action: e.target.value as any })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  {actions.map(action => (
                    <option key={action.value} value={action.value}>
                      {action.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Field (for show/hide/skip actions) */}
            {['show', 'hide', 'require', 'skip_to'].includes(rule.action) && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Target field
                </label>
                <select
                  value={rule.targetFieldId || ''}
                  onChange={(e) => updateRule(rule.id, { targetFieldId: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select field</option>
                  {fields.filter(field => field.id !== rule.fieldId).map(field => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={addRule}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-sm hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </button>
      </div>
    </div>
  );
};

export default ConditionalLogic;