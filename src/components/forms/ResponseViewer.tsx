import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Trash2, Calendar, Clock, User, Menu, X, FileText, BarChart3, Award } from 'lucide-react';
import { responseAPI, exportAPI, formAPI } from '../../services/api';
import toast from 'react-hot-toast';
import TestResultsViewer from './TestResultsViewer';

interface Response {
  _id: string;
  responses: Array<{
    fieldId: string;
    fieldLabel: string;
    fieldType: string;
    value: any;
  }>;
  submittedAt: string;
  completionTime?: number;
  submitterInfo?: {
    userId?: string;
    savedToAccount?: boolean;
  };
}

interface Form {
  _id: string;
  title: string;
  description: string;
  fields: Array<{
    id: string;
    type: string;
    label: string;
    questionOptions?: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
  }>;
}

interface ResponseViewerProps {
  formId: string;
  onBack: () => void;
}

const ResponseViewer: React.FC<ResponseViewerProps> = ({ formId, onBack }) => {
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);
  const [showTestResults, setShowTestResults] = useState<Response | null>(null);

  useEffect(() => {
    loadForm();
    loadResponses();
  }, [formId, currentPage]);

  const loadForm = async () => {
    try {
      const response = await formAPI.getForm(formId);
      setForm(response.data);
    } catch (error) {
      toast.error('Failed to load form');
      console.error('Error loading form:', error);
    }
  };

  const loadResponses = async () => {
    setLoading(true);
    try {
      const response = await responseAPI.getResponses(formId, currentPage, 10);
      console.log('ResponseViewer: API response:', response.data);
      
      if (response.data.responses) {
        setResponses(response.data.responses);
        setTotalPages(response.data.pagination?.total || 1);
        
        // Update form data if available in response
        if (response.data.form && !form) {
          setForm(response.data.form);
        }
      } else if (Array.isArray(response.data)) {
        setResponses(response.data);
        setTotalPages(1);
      } else {
        console.warn('Unexpected response structure:', response.data);
        setResponses([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('ResponseViewer: Error loading responses:', error);
      
      if ((error as any).response?.status === 404) {
        toast.error('Form not found or no responses available');
      } else if ((error as any).response?.status === 403) {
        toast.error('You do not have permission to view these responses');
      } else {
        toast.error('Failed to load responses. Please try again.');
      }
      
      setResponses([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const deleteResponse = async (responseId: string) => {
    if (!confirm('Are you sure you want to delete this response?')) {
      return;
    }

    try {
      await responseAPI.deleteResponse(responseId);
      setResponses(responses.filter(r => r._id !== responseId));
      toast.success('Response deleted successfully');
    } catch (error) {
      toast.error('Failed to delete response');
      console.error('Error deleting response:', error);
    }
  };

  const downloadExcel = () => {
    exportAPI.downloadExcel(formId);
    toast.success('Excel download started');
  };

  const downloadCSV = () => {
    exportAPI.downloadCSV(formId);
    toast.success('CSV download started');
  };

  const formatValue = (value: any, fieldType: string) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (fieldType === 'rating') {
      return `${value}/5 stars`;
    }
    if (fieldType === 'question') {
      return Array.isArray(value) ? `${value.length} option(s) selected` : 'No answer';
    }
    return value?.toString() || 'No answer';
  };

  const hasQuestions = form?.fields?.some((field: any) => field.type === 'question');

  const calculateTestScore = (response: Response) => {
    if (!form || !hasQuestions) return null;
    
    const questionFields = form.fields.filter((field: any) => field.type === 'question');
    let correctCount = 0;
    
    questionFields.forEach((field: any) => {
      const responseField = response.responses.find(r => r.fieldId === field.id);
      const userAnswers = responseField?.value || [];
      const correctAnswers = (field.questionOptions || [])
        .filter((option: any) => option.isCorrect)
        .map((option: any) => option.id);
      
      const isCorrect = 
        Array.isArray(userAnswers) &&
        userAnswers.length === correctAnswers.length &&
        userAnswers.every((answer: string) => correctAnswers.includes(answer));
      
      if (isCorrect) correctCount++;
    });
    
    return questionFields.length > 0 ? (correctCount / questionFields.length) * 100 : 0;
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading responses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 flex-shrink-0 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{form?.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>{responses.length} responses</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Desktop Export Buttons */}
            {responses.length > 0 && (
              <div className="hidden sm:flex items-center space-x-2">
                <button
                  onClick={downloadExcel}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700 text-sm shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={downloadCSV}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 text-sm shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>CSV</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            {responses.length > 0 && (
              <div className="sm:hidden">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 rounded-sm hover:bg-gray-100 transition-colors"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden">
          <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Export Options</h2>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-sm hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2">
              <button
                onClick={() => {
                  downloadExcel();
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-green-600 text-white rounded-sm shadow-lg"
              >
                <Download className="w-5 h-5" />
                <span>Download Excel</span>
              </button>
              <button
                onClick={() => {
                  downloadCSV();
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-600 text-white rounded-sm shadow-lg"
              >
                <Download className="w-5 h-5" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {responses.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-md mx-auto">
              <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No responses yet</h3>
              <p className="text-gray-600">
                Share your form to start collecting responses.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {responses.map((response, index) => (
              <div key={response._id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 hover:shadow-xl transition-shadow">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Response #{(currentPage - 1) * 10 + index + 1}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(response.submittedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(response.submittedAt).toLocaleTimeString()}</span>
                      </div>
                      {response.completionTime && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{response.completionTime}s completion</span>
                        </div>
                      )}
                      {response.submitterInfo?.savedToAccount && (
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4 text-blue-500" />
                          <span className="text-blue-600">Saved to account</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedResponse(response)}
                      className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-sm text-sm transition-colors"
                    >
                      View Details
                    </button>
                    {hasQuestions && (
                      <button
                        onClick={() => setShowTestResults(response)}
                        className="px-3 py-1 text-purple-600 hover:bg-purple-50 rounded-sm text-sm transition-colors"
                      >
                        <Award className="w-4 h-4 inline mr-1" />
                        Test Results
                      </button>
                    )}
                    <button
                      onClick={() => deleteResponse(response._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-sm self-end sm:self-auto transition-colors"
                      title="Delete response"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid gap-3 sm:gap-4">
                  {hasQuestions && (
                    <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-900">Test Score</span>
                        <span className="text-lg font-bold text-purple-600">
                          {Math.round(calculateTestScore(response) || 0)}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {response.responses.slice(0, 3).map((fieldResponse, fieldIndex) => (
                    <div key={fieldIndex} className="border-l-4 border-blue-500 pl-3 sm:pl-4 bg-blue-50 rounded-r-lg p-2">
                      <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">
                        {fieldResponse.fieldLabel}
                      </h4>
                      <p className="text-gray-700 text-sm sm:text-base break-words">
                        {formatValue(fieldResponse.value, fieldResponse.fieldType)}
                      </p>
                    </div>
                  ))}
                  {response.responses.length > 3 && (
                    <div className="text-sm text-gray-500 pl-4">
                      +{response.responses.length - 3} more fields
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2 bg-white rounded-xl shadow-lg p-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm transition-colors"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-gray-700 text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Response Details</h3>
                <button
                  onClick={() => setSelectedResponse(null)}
                  className="p-2 hover:bg-gray-100 rounded-sm transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {selectedResponse.responses.map((fieldResponse, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 bg-blue-50 rounded-r-lg p-3">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {fieldResponse.fieldLabel}
                    </h4>
                    <p className="text-gray-700 break-words">
                      {formatValue(fieldResponse.value, fieldResponse.fieldType)}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div>Submitted: {new Date(selectedResponse.submittedAt).toLocaleString()}</div>
                  {selectedResponse.completionTime && (
                    <div>Completion time: {selectedResponse.completionTime}s</div>
                  )}
                  {selectedResponse.submitterInfo?.savedToAccount && (
                    <div className="text-blue-600">Saved to user account</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Results Modal */}
      {showTestResults && form && (
        <TestResultsViewer
          formId={formId}
          responses={showTestResults.responses}
          form={form}
          onClose={() => setShowTestResults(null)}
        />
      )}
    </div>
  );
};

export default ResponseViewer;