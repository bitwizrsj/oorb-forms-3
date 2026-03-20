import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Award, Clock, User, BarChart3 } from 'lucide-react';

interface TestResult {
  questionId: string;
  questionText: string;
  userAnswers: string[];
  correctAnswers: string[];
  isCorrect: boolean;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
}

interface TestResultsViewerProps {
  formId: string;
  responses: any[];
  form: any;
  onClose: () => void;
}

const TestResultsViewer: React.FC<TestResultsViewerProps> = ({
  formId,
  responses,
  form,
  onClose
}) => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    calculateTestResults();
  }, [responses, form]);

  const calculateTestResults = () => {
    if (!form || !responses.length) return;

    const questionFields = form.fields.filter((field: any) => field.type === 'question');
    const results: TestResult[] = [];
    let correctCount = 0;

    questionFields.forEach((field: any) => {
      const response = responses.find(r => r.fieldId === field.id);
      const userAnswers = response?.value || [];
      const correctAnswers = (field.questionOptions || [])
        .filter((option: any) => option.isCorrect)
        .map((option: any) => option.id);

      const isCorrect = 
        userAnswers.length === correctAnswers.length &&
        userAnswers.every((answer: string) => correctAnswers.includes(answer));

      if (isCorrect) correctCount++;

      results.push({
        questionId: field.id,
        questionText: field.questionText || field.label,
        userAnswers,
        correctAnswers,
        isCorrect,
        options: field.questionOptions || []
      });
    });

    setTestResults(results);
    setOverallScore(questionFields.length > 0 ? (correctCount / questionFields.length) * 100 : 0);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-sm shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-sm flex items-center justify-center">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Test Results</h2>
                <p className="text-gray-600">{form?.title}</p>
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
          {/* Overall Score */}
          <div className="bg-gray-50 rounded-sm p-6 mb-6">
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(overallScore)}`}>
                {Math.round(overallScore)}%
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getScoreBadgeColor(overallScore)}`}>
                {overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Needs Improvement'}
              </div>
              <div className="mt-4 text-sm text-gray-600">
                {testResults.filter(r => r.isCorrect).length} out of {testResults.length} questions correct
              </div>
            </div>
          </div>

          {/* Question Results */}
          <div className="space-y-6">
            {testResults.map((result, index) => (
              <div key={result.questionId} className="border border-gray-200 rounded-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-2">
                      Question {index + 1}: {result.questionText}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {result.isCorrect ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Correct</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-red-600">
                        <XCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Incorrect</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {result.options.map((option) => {
                    const isUserSelected = result.userAnswers.includes(option.id);
                    const isCorrectAnswer = option.isCorrect;
                    
                    let optionClass = 'p-3 border rounded-md ';
                    
                    if (isCorrectAnswer && isUserSelected) {
                      optionClass += 'bg-green-50 border-green-200 text-green-900';
                    } else if (isCorrectAnswer) {
                      optionClass += 'bg-green-50 border-green-200 text-green-900';
                    } else if (isUserSelected) {
                      optionClass += 'bg-red-50 border-red-200 text-red-900';
                    } else {
                      optionClass += 'bg-gray-50 border-gray-200 text-gray-700';
                    }

                    return (
                      <div key={option.id} className={optionClass}>
                        <div className="flex items-center justify-between">
                          <span>{option.text}</span>
                          <div className="flex items-center space-x-2">
                            {isUserSelected && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Your Answer
                              </span>
                            )}
                            {isCorrectAnswer && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Correct
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-sm p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {testResults.filter(r => r.isCorrect).length}
              </div>
              <div className="text-sm text-blue-800">Correct Answers</div>
            </div>
            
            <div className="bg-red-50 rounded-sm p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {testResults.filter(r => !r.isCorrect).length}
              </div>
              <div className="text-sm text-red-800">Incorrect Answers</div>
            </div>
            
            <div className="bg-gray-50 rounded-sm p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">
                {testResults.length}
              </div>
              <div className="text-sm text-gray-800">Total Questions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResultsViewer;