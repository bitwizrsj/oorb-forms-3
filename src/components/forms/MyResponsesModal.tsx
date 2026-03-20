import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, Clock, ExternalLink } from 'lucide-react';
import { responseAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface MyResponse {
  _id: string;
  formId: string;
  formTitle: string;
  responses: Array<{
    fieldLabel: string;
    value: any;
  }>;
  submittedAt: string;
  completionTime?: number;
}

interface MyResponsesModalProps {
  onClose: () => void;
}

const MyResponsesModal: React.FC<MyResponsesModalProps> = ({ onClose }) => {
  const [responses, setResponses] = useState<MyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<MyResponse | null>(null);

  useEffect(() => {
    loadMyResponses();
  }, []);

  const loadMyResponses = async () => {
    try {
      const response = await responseAPI.getMyResponses();
      setResponses(response.data);
    } catch (error) {
      console.error('Error loading my responses:', error);
      toast.error('Failed to load your responses');
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value?.toString() || 'No answer';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-sm shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">My Responses</h2>
              <p className="text-gray-600">Forms you have submitted responses to</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your responses...</p>
            </div>
          ) : responses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
              <p className="text-gray-600">You haven't submitted any form responses yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {responses.map((response) => (
                <div key={response._id} className="bg-gray-50 rounded-sm p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">{response.formTitle}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
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
                      </div>
                      <div className="grid gap-2">
                        {response.responses.slice(0, 2).map((fieldResponse, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium text-gray-700">{fieldResponse.fieldLabel}:</span>
                            <span className="ml-2 text-gray-600">{formatValue(fieldResponse.value)}</span>
                          </div>
                        ))}
                        {response.responses.length > 2 && (
                          <div className="text-sm text-gray-500">
                            +{response.responses.length - 2} more fields
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedResponse(response)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => window.open(`/form/${response.formId}`, '_blank')}
                        className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-sm shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Response Details</h3>
                <button
                  onClick={() => setSelectedResponse(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">{selectedResponse.formTitle}</h4>
                <div className="text-sm text-gray-500">
                  Submitted on {new Date(selectedResponse.submittedAt).toLocaleString()}
                </div>
              </div>
              
              <div className="space-y-4">
                {selectedResponse.responses.map((fieldResponse, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 bg-blue-50 rounded-r-lg p-3">
                    <h5 className="font-medium text-gray-900 mb-2">
                      {fieldResponse.fieldLabel}
                    </h5>
                    <p className="text-gray-700 break-words">
                      {formatValue(fieldResponse.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyResponsesModal;