import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Trash2, Calendar, Clock, User, Menu, X, FileText, BarChart3, Award, File, Image, ExternalLink, Eye, FileArchive } from 'lucide-react';
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

// ─── File type helpers ─────────────────────────────────────────────────────────

const getFileExtension = (url: string) => {
  try {
    const clean = url.split('?')[0];
    return clean.split('.').pop()?.toLowerCase() || '';
  } catch {
    return '';
  }
};

const isImage = (url: string) =>
  ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(getFileExtension(url));

const isPDF = (url: string) => getFileExtension(url) === 'pdf' || url.includes('/raw/upload/');

const isDoc = (url: string) => ['doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'].includes(getFileExtension(url));

const getFileName = (url: string) => {
  try {
    const parts = url.split('/');
    return decodeURIComponent(parts[parts.length - 1].split('?')[0]);
  } catch {
    return 'Uploaded file';
  }
};

// Convert Cloudinary image URL to raw URL for PDFs (fix wrong resource type)
const toCorrectCloudinaryUrl = (url: string): string => {
  if (!url) return url;
  // If Cloudinary served a PDF via image/upload, convert to raw/upload
  if (url.includes('/image/upload/') && isPDF(url)) {
    return url.replace('/image/upload/', '/raw/upload/');
  }
  return url;
};

// ─── FilePreview component ─────────────────────────────────────────────────────

const FilePreview: React.FC<{ url: string; compact?: boolean }> = ({ url, compact = false }) => {
  const [pdfError, setPdfError] = useState(false);
  const fixedUrl = toCorrectCloudinaryUrl(url);
  const fileName = getFileName(fixedUrl);
  const ext = getFileExtension(fixedUrl).toUpperCase();

  if (isImage(url)) {
    return (
      <div className="mt-2">
        <a href={fixedUrl} target="_blank" rel="noopener noreferrer" className="group block relative">
          <img
            src={url}
            alt={fileName}
            className={`rounded-xl border border-slate-200 object-cover shadow-sm group-hover:shadow-md transition-all ${compact ? 'max-h-24 max-w-[160px]' : 'max-h-48 max-w-xs'}`}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl flex items-center justify-center transition-all">
            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
          </div>
        </a>
        <a
          href={fixedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <ExternalLink className="w-3 h-3" />
          Open full size
        </a>
      </div>
    );
  }

  if (isPDF(url) && !pdfError && !compact) {
    return (
      <div className="mt-2">
        <embed
          src={fixedUrl}
          type="application/pdf"
          className="w-full rounded-xl border border-slate-200 shadow-sm"
          style={{ height: '380px' }}
          onError={() => setPdfError(true)}
        />
        <a
          href={fixedUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <Download className="w-3 h-3" />
          Download PDF
        </a>
      </div>
    );
  }

  // Fallback — download button for PDF (compact mode or embed failed) and all other file types
  const iconColor = isPDF(url) ? 'text-red-500' : isDoc(url) ? 'text-blue-500' : 'text-slate-500';
  const bg = isPDF(url) ? 'bg-red-50 border-red-100' : isDoc(url) ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100';

  return (
    <div className={`mt-2 inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border ${bg}`}>
      <FileText className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} ${iconColor} flex-shrink-0`} />
      <div className="min-w-0">
        <p className={`font-semibold text-slate-800 truncate max-w-[180px] ${compact ? 'text-xs' : 'text-sm'}`}>{fileName}</p>
        {ext && <p className="text-[10px] text-slate-400 uppercase tracking-wider">{ext} file</p>}
      </div>
      <a
        href={fixedUrl}
        target="_blank"
        rel="noopener noreferrer"
        download={fileName}
        className={`flex-shrink-0 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all ${compact ? '' : 'shadow-sm'}`}
        title="Download file"
      >
        <Download className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
      </a>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────

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
    }
  };

  const loadResponses = async () => {
    setLoading(true);
    try {
      const response = await responseAPI.getResponses(formId, currentPage, 10);
      if (response.data.responses) {
        setResponses(response.data.responses);
        setTotalPages(response.data.pagination?.total || 1);
        if (response.data.form && !form) setForm(response.data.form);
      } else if (Array.isArray(response.data)) {
        setResponses(response.data);
        setTotalPages(1);
      } else {
        setResponses([]);
        setTotalPages(1);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('You do not have permission to view these responses');
      } else {
        toast.error('Failed to load responses.');
      }
      setResponses([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteResponse = async (responseId: string) => {
    if (!confirm('Are you sure you want to delete this response?')) return;
    try {
      await responseAPI.deleteResponse(responseId);
      setResponses(responses.filter(r => r._id !== responseId));
      toast.success('Response deleted successfully');
    } catch {
      toast.error('Failed to delete response');
    }
  };

  const formatValue = (value: any, fieldType: string): { text?: string; isFile: boolean } => {
    if (fieldType === 'file') return { isFile: true };
    if (Array.isArray(value)) return { text: value.join(', '), isFile: false };
    if (fieldType === 'rating') return { text: `${value}/5 ⭐`, isFile: false };
    if (fieldType === 'question') return { text: Array.isArray(value) ? `${value.length} option(s) selected` : 'No answer', isFile: false };
    return { text: value?.toString() || 'No answer', isFile: false };
  };

  const hasQuestions = form?.fields?.some((field: any) => field.type === 'question');

  const calculateTestScore = (response: Response) => {
    if (!form || !hasQuestions) return null;
    const questionFields = form.fields.filter((f: any) => f.type === 'question');
    let correct = 0;
    questionFields.forEach((field: any) => {
      const r = response.responses.find(r => r.fieldId === field.id);
      const userAnswers = r?.value || [];
      const correctAnswers = (field.questionOptions || []).filter((o: any) => o.isCorrect).map((o: any) => o.id);
      if (Array.isArray(userAnswers) && userAnswers.length === correctAnswers.length && userAnswers.every((a: string) => correctAnswers.includes(a))) correct++;
    });
    return questionFields.length > 0 ? (correct / questionFields.length) * 100 : 0;
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
              <button onClick={onBack} className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 flex-shrink-0 transition-colors">
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

            {responses.length > 0 && (
              <>
                <div className="hidden sm:flex items-center space-x-2">
                  <button onClick={() => { exportAPI.downloadExcel(formId); toast.success('Excel download started'); }} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm shadow-md transition-all">
                    <Download className="w-4 h-4" /><span>Excel</span>
                  </button>
                  <button onClick={() => { exportAPI.downloadCSV(formId); toast.success('CSV download started'); }} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm shadow-md transition-all">
                    <Download className="w-4 h-4" /><span>CSV</span>
                  </button>
                </div>
                <div className="sm:hidden">
                  <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <Menu className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden">
          <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Export</h2>
              <button onClick={() => setShowMobileMenu(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <button onClick={() => { exportAPI.downloadExcel(formId); setShowMobileMenu(false); }} className="w-full flex items-center space-x-3 px-4 py-3 bg-green-600 text-white rounded-lg">
                <Download className="w-5 h-5" /><span>Download Excel</span>
              </button>
              <button onClick={() => { exportAPI.downloadCSV(formId); setShowMobileMenu(false); }} className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-600 text-white rounded-lg">
                <Download className="w-5 h-5" /><span>Download CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {responses.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
              <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No responses yet</h3>
              <p className="text-gray-600">Share your form to start collecting responses.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {responses.map((response, index) => (
              <div key={response._id} className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-6 hover:shadow-lg transition-shadow">
                {/* Response header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                      Response #{(currentPage - 1) * 10 + index + 1}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(response.submittedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(response.submittedAt).toLocaleTimeString()}</span>
                      </div>
                      {response.completionTime && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs">{response.completionTime}s</span>
                      )}
                      {response.submitterInfo?.savedToAccount && (
                        <span className="flex items-center space-x-1 text-indigo-600">
                          <User className="w-3.5 h-3.5" /><span>Account</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button onClick={() => setSelectedResponse(response)} className="px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium transition-colors">
                      View Details
                    </button>
                    {hasQuestions && (
                      <button onClick={() => setShowTestResults(response)} className="px-3 py-1.5 text-purple-600 hover:bg-purple-50 rounded-lg text-sm font-medium transition-colors">
                        <Award className="w-4 h-4 inline mr-1" />Test Results
                      </button>
                    )}
                    <button onClick={() => deleteResponse(response._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete response">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Fields preview */}
                <div className="grid gap-3">
                  {hasQuestions && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-purple-900">Test Score</span>
                      <span className="text-lg font-black text-purple-600">{Math.round(calculateTestScore(response) || 0)}%</span>
                    </div>
                  )}

                  {response.responses.slice(0, 3).map((fieldResponse, fieldIndex) => {
                    const { text, isFile } = formatValue(fieldResponse.value, fieldResponse.fieldType);
                    return (
                      <div key={fieldIndex} className="border-l-4 border-indigo-400 pl-3 sm:pl-4 bg-indigo-50 rounded-r-xl p-2.5">
                        <h4 className="font-semibold text-gray-800 mb-1 text-sm">{fieldResponse.fieldLabel}</h4>
                        {isFile && fieldResponse.value ? (
                          <FilePreview url={fieldResponse.value} compact />
                        ) : (
                          <p className="text-gray-700 text-sm break-words">{text}</p>
                        )}
                      </div>
                    );
                  })}
                  {response.responses.length > 3 && (
                    <button onClick={() => setSelectedResponse(response)} className="text-sm text-indigo-500 pl-4 hover:text-indigo-700 font-medium text-left">
                      +{response.responses.length - 3} more fields → View all
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2 bg-white rounded-2xl shadow-md p-4">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm transition-colors">Previous</button>
                <span className="px-4 py-2 text-gray-700 text-sm font-medium">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm transition-colors">Next</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-900">Response Details</h3>
              <button onClick={() => setSelectedResponse(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-5">
                {selectedResponse.responses.map((fieldResponse, index) => {
                  const { text, isFile } = formatValue(fieldResponse.value, fieldResponse.fieldType);
                  return (
                    <div key={index} className="border-l-4 border-indigo-400 pl-4 bg-indigo-50 rounded-r-2xl p-4">
                      <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase tracking-wide text-indigo-700">
                        {fieldResponse.fieldLabel}
                      </h4>
                      {isFile && fieldResponse.value ? (
                        <FilePreview url={fieldResponse.value} />
                      ) : (
                        <p className="text-gray-700 break-words leading-relaxed">{text}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-4 text-xs text-gray-400 font-medium">
                  <span>Submitted: {new Date(selectedResponse.submittedAt).toLocaleString()}</span>
                  {selectedResponse.completionTime && <span>Time: {selectedResponse.completionTime}s</span>}
                  {selectedResponse.submitterInfo?.savedToAccount && <span className="text-indigo-500">✓ Saved to account</span>}
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