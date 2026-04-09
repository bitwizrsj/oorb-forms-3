import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Star, Upload, Send, CheckCircle, AlertCircle, FileText, Edit3, Eye, X } from 'lucide-react';
import { formAPI, responseAPI } from '../../services/api';
import FormHeader from './FormHeader';
import toast from 'react-hot-toast';
import FileUploadField from './FileUploadField';
import QuestionAnswerField from './QuestionAnswerField';

interface FormField {
  id: string;
  type: string;
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
}

interface Form {
  _id: string;
  title: string;
  description: string;
  fields: FormField[];
  status: string;
  headerImage?: string;
  settings?: {
    requireLogin?: boolean;
    allowMultipleResponses?: boolean;
    showProgressBar?: boolean;
    headerImage?: string;
    allowedEmailDomains?: string[];
    allowEditing?: boolean;
    emailCopy?: boolean;
    editingDuration?: number;
  };
  views?: number;
  responses?: number;
  createdAt?: string;
  estimatedTime?: number;
}

const FormRenderer: React.FC = () => {
  const { shareUrl } = useParams<{ shareUrl: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [startTime] = useState(Date.now());
  const [user, setUser] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const editResponseId = searchParams.get('edit');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showLoginRequired, setShowLoginRequired] = useState(false);
  const [domainDenied, setDomainDenied] = useState<string | null>(null);
  const [submittedResponseId, setSubmittedResponseId] = useState<string | null>(null);
  const [showSubmittedResponse, setShowSubmittedResponse] = useState(false);
  const [alreadySubmittedResponse, setAlreadySubmittedResponse] = useState<any>(null);
  const [hasCheckedSubmission, setHasCheckedSubmission] = useState(false);

  const formatValue = (value: any) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value?.toString() || 'No answer';
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!shareUrl) return;
      try {
        setLoading(true);
        const formRes = await formAPI.getFormByShareUrl(shareUrl);
        const formData = formRes.data;
        setForm(formData);

        // If in edit mode, fetch the response data
        if (editResponseId) {
          try {
            const responseRes = await responseAPI.getResponse(editResponseId);
            const responseData = responseRes.data;
            
            // Check editing duration limit
            if (formData.settings?.editingDuration > 0) {
              const minutesSinceSubmission = (Date.now() - new Date(responseData.submittedAt).getTime()) / (1000 * 60);
              if (minutesSinceSubmission > formData.settings.editingDuration) {
                setIsClosed(true);
                toast.error(`The time limit for editing (${formData.settings.editingDuration} minutes) has passed.`);
              }
            }

            // Map saved responses to the component state
            const initialResponses: Record<string, any> = {};
            responseData.responses.forEach((r: any) => {
              initialResponses[r.fieldId] = r.value;
            });
            setResponses(initialResponses);
            setIsEditMode(true);
          } catch (err) {
            console.error('Error fetching response for edit:', err);
            toast.error('Could not load your previous response.');
          }
        }

        // View count
        const sessionKey = `viewed_${formData._id}`;
        if (!sessionStorage.getItem(sessionKey)) {
          formAPI.incrementView(shareUrl).catch(err => console.error('Error incrementing view:', err));
          sessionStorage.setItem(sessionKey, 'true');
        }
        
        // Status checks
        if (formData.status === 'closed' || (formData.settings?.expiryDate && new Date() > new Date(formData.settings.expiryDate))) {
          setIsClosed(true);
        }

        // Calculate estimated time
        const estimatedTime = Math.ceil(formData.fields.length * 0.5);
        setForm(prev => prev ? { ...prev, estimatedTime } : null);
      } catch (error) {
        console.error('Error loading form:', error);
        toast.error('Failed to load form');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
      }
    }
  }, [shareUrl, editResponseId]);

  useEffect(() => {
    // Check login + domain restriction when form and user load
    if (form && form.settings?.requireLogin && !user) {
      setShowLoginRequired(true);
    } else {
      setShowLoginRequired(false);
    }

    // Domain restriction: check if user's email domain is allowed
    if (form && user) {
      const allowedDomains = form.settings?.allowedEmailDomains || [];
      if (allowedDomains.length > 0) {
        const userDomain = user.email?.split('@')[1]?.toLowerCase();
        const allowed = allowedDomains.some((d: string) => d.toLowerCase() === userDomain);
        if (!allowed) {
          setDomainDenied(allowedDomains.map((d: string) => '@' + d).join(', '));
        } else {
          setDomainDenied(null);
        }
      } else {
        setDomainDenied(null);
      }
    }
  }, [form, user]);

  useEffect(() => {
    const checkAlreadySubmitted = async () => {
      // Don't check until form is loaded, and only if we are NOT in edit mode.
      if (!form || isEditMode || !shareUrl) {
        setHasCheckedSubmission(true);
        return;
      }

      if (form.settings?.allowMultipleResponses === false) {
        let existingId = null;

        if (user) {
          try {
            const r = await responseAPI.getMyResponses();
            const existing = r.data.find((res: any) => res.shareUrl === shareUrl);
            if (existing) {
              existingId = existing._id;
            }
          } catch (e) { console.error(e); }
        } else {
          try {
            const local = JSON.parse(localStorage.getItem('oorb_submissions') || '{}');
            existingId = local[shareUrl];
          } catch (e) { console.error(e); }
        }

        if (existingId) {
          try {
            const resData = await responseAPI.getResponse(existingId);
            setAlreadySubmittedResponse(resData.data);
            
            const initialResponses: Record<string, any> = {};
            resData.data.responses.forEach((r: any) => {
              initialResponses[r.fieldId] = r.value;
            });
            setResponses(initialResponses);
            setSubmittedResponseId(existingId);
          } catch (e) {
             setAlreadySubmittedResponse({ _id: existingId, error: true });
             setSubmittedResponseId(existingId);
          }
        }
      }
      
      setHasCheckedSubmission(true);
    };

    checkAlreadySubmitted();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, user, isEditMode, shareUrl]);


  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return `${field.label} is required`;
    }

    if (value && field.validation) {
      const { minLength, maxLength, pattern } = field.validation;

      if (minLength && value.length < minLength) {
        return `${field.label} must be at least ${minLength} characters`;
      }

      if (maxLength && value.length > maxLength) {
        return `${field.label} must be no more than ${maxLength} characters`;
      }

      if (pattern && !new RegExp(pattern).test(value)) {
        return field.validation.errorMessage || `${field.label} format is invalid`;
      }
    }

    return null;
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!form) return false;

    const newErrors: Record<string, string> = {};

    form.fields.forEach(field => {
      const error = validateField(field, responses[field.id]);
      if (error) {
        newErrors[field.id] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form || !validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    // Check if login is required
    if (form.settings?.requireLogin && !user) {
      setShowLoginRequired(true);
      return;
    }

    // Skip modal and submit directly per user request
    // Default to form settings for editable/email copy if enabled
    const submissionOptions = {
      isEditable: form.settings?.allowEditing || false,
      emailCopyRequested: form.settings?.emailCopy || false
    };

    await submitResponse(!!user, user, submissionOptions);
  };

  const submitResponse = async (saveToAccount: boolean, userData?: any, options?: { isEditable: boolean; emailCopyRequested: boolean }) => {
    if (!form) return;

    setSubmitting(true);

    try {
      const formattedResponses = form.fields.map(field => ({
        fieldId: field.id,
        fieldLabel: field.label,
        fieldType: field.type,
        value: responses[field.id] || ''
      }));

      const completionTime = Math.round((Date.now() - startTime) / 1000);

      const payload = {
        formId: form._id,
        responses: formattedResponses,
        completionTime,
        userId: saveToAccount && userData ? userData._id : null,
        submitterInfo: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          userId: saveToAccount && userData ? userData._id : null,
          savedToAccount: saveToAccount
        },
        isEditable: options?.isEditable || false,
        emailCopyRequested: options?.emailCopyRequested || false
      };

      let newResponseId = editResponseId;
      if (isEditMode && editResponseId) {
        await responseAPI.updateResponse(editResponseId, {
          responses: formattedResponses,
          completionTime
        });
        toast.success('Response updated successfully!');
      } else {
        const res = await responseAPI.submitResponse(payload);
        newResponseId = res.data.responseId;
        toast.success('Form submitted successfully!');
        
        try {
          const localSubmitted = JSON.parse(localStorage.getItem('oorb_submissions') || '{}');
          if (shareUrl) {
            localSubmitted[shareUrl] = newResponseId;
            localStorage.setItem('oorb_submissions', JSON.stringify(localSubmitted));
          }
        } catch (e) { console.error('Error saving local submission state:', e); }
      }

      setSubmittedResponseId(newResponseId);
      setSubmitted(true);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to submit form';
      toast.error(errorMsg);
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const baseClasses = `w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors[field.id] ? 'border-red-300' : 'border-gray-300'
      }`;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div>
            <input
              type={field.type}
              placeholder={field.placeholder}
              value={responses[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={baseClasses}
            />
            {errors[field.id] && (
              <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[field.id]}</span>
              </div>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div>
            <textarea
              placeholder={field.placeholder}
              value={responses[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              rows={4}
              className={baseClasses}
            />
            {errors[field.id] && (
              <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[field.id]}</span>
              </div>
            )}
          </div>
        );

      case 'select':
        return (
          <div>
            <select
              value={responses[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={baseClasses}
            >
              <option value="">Choose an option</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
            {errors[field.id] && (
              <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[field.id]}</span>
              </div>
            )}
          </div>
        );

      case 'radio':
        return (
          <div>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <label key={index} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={responses[field.id] === option}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm sm:text-base">{option}</span>
                </label>
              ))}
            </div>
            {errors[field.id] && (
              <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[field.id]}</span>
              </div>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <label key={index} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    value={option}
                    checked={(responses[field.id] || []).includes(option)}
                    onChange={(e) => {
                      const currentValues = responses[field.id] || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter((v: string) => v !== option);
                      handleInputChange(field.id, newValues);
                    }}
                    className="text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <span className="text-sm sm:text-base">{option}</span>
                </label>
              ))}
            </div>
            {errors[field.id] && (
              <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[field.id]}</span>
              </div>
            )}
          </div>
        );

      case 'date':
        return (
          <div>
            <input
              type="date"
              value={responses[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={baseClasses}
            />
            {errors[field.id] && (
              <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[field.id]}</span>
              </div>
            )}
          </div>
        );

      case 'file': {
        // Dynamically search for a field labeled 'Name', 'Student Name', 'Full Name', etc.
        const nameField = form?.fields.find(f =>
          f.label.toLowerCase().includes('name') &&
          (f.type === 'text' || f.type === 'select')
        );
        const derivedSubfolderName = nameField ? responses[nameField.id] : undefined;

        return (
          <div>
            <FileUploadField
              value={responses[field.id] || ''}
              onChange={(value) => handleInputChange(field.id, value)}
              accept="*/*"
              maxSize={10}
              formId={form!._id}
              fieldId={field.id}
              subfolderName={derivedSubfolderName}
            />
            {errors[field.id] && (
              <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[field.id]}</span>
              </div>
            )}
          </div>
        );
      }

      case 'rating':
        return (
          <div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 sm:w-8 sm:h-8 cursor-pointer transition-colors ${(responses[field.id] || 0) >= star
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  onClick={() => handleInputChange(field.id, star)}
                />
              ))}
              {responses[field.id] && (
                <span className="ml-2 text-sm text-gray-600">
                  {responses[field.id]}/5
                </span>
              )}
            </div>
            {errors[field.id] && (
              <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[field.id]}</span>
              </div>
            )}
          </div>
        );

      case 'question':
        return (
          <div>
            <QuestionAnswerField
              field={field}
              onFieldUpdate={() => { }}
              isPreview={true}
              onAnswerSelect={(questionId, selectedOptions) => {
                handleInputChange(field.id, selectedOptions);
              }}
              selectedAnswers={responses[field.id] || []}
            />
            {errors[field.id] && (
              <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[field.id]}</span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Form Not Found</h1>
          <p className="text-gray-600">The form you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  if (form.status !== 'published') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Form Not Available</h1>
          <p className="text-gray-600">This form is not currently accepting responses.</p>
        </div>
      </div>
    );
  }

  // Domain restriction screen — shown when user is logged in but wrong domain
  if (isClosed) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="h-2 bg-slate-400" />
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Form Closed</h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              This form is no longer accepting responses. Please contact the form creator if you believe this is an error.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all"
            >
              Go Back Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (domainDenied) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="h-2 bg-red-500" />
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              This form is only accessible to users with the following email domains:
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {domainDenied.split(', ').map(d => (
                <span key={d} className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-bold rounded-full">
                  {d}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              You are signed in as <span className="font-semibold text-slate-600">{user?.email}</span>. Please sign in with an authorized account.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.setItem('returnUrl', window.location.pathname);
                window.location.href = '/login';
              }}
              className="mt-5 px-6 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all"
            >
              Sign in with a different account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (form && !hasCheckedSubmission && form.settings?.allowMultipleResponses === false && !isEditMode) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (alreadySubmittedResponse && !isEditMode) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[40px] shadow-2xl shadow-indigo-100/50 max-w-lg w-full p-12 text-center animate-in fade-in zoom-in duration-500 border border-slate-100">
          <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 transition-transform duration-1000">
            <CheckCircle className="w-12 h-12 text-amber-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">You have already filled the form</h2>
          <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10">
            This form is set to only accept a single response per person.
          </p>
          <div className="space-y-4">
            {form?.settings?.allowEditing && user && (
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                 <p className="text-sm text-slate-600 mb-4 font-semibold">Want to change something?</p>
                 <button
                   onClick={() => window.location.href = `/form/${shareUrl}?edit=${submittedResponseId}`}
                   className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                 >
                   <Edit3 className="w-4 h-4" />
                   Edit Your Response
                 </button>
              </div>
            )}
            {!alreadySubmittedResponse.error && (
              <button
                onClick={() => setShowSubmittedResponse(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all"
              >
                <Eye className="w-4 h-4" />
                See your response
              </button>
            )}
          </div>
        </div>

        {/* Local View Response Modal */}
        {showSubmittedResponse && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 text-left">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Your Response Details</h3>
                  <p className="text-slate-500 text-sm mt-0.5">Submitted answers for {form?.title}</p>
                </div>
                <button
                  onClick={() => setShowSubmittedResponse(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-4">
                  {form?.fields.map((field) => (
                    <div key={field.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <h5 className="font-semibold text-slate-700 text-sm mb-2">
                        {field.label}
                      </h5>
                      <p className="text-slate-900 font-medium break-words text-[15px]">
                        {formatValue(responses[field.id])}
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
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[40px] shadow-2xl shadow-indigo-100/50 max-w-lg w-full p-12 text-center animate-in fade-in zoom-in duration-500 border border-slate-100">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce transition-transform duration-1000">
            <CheckCircle className="w-12 h-12 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Form Submitted Successfully!</h2>
          <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10">
            Thank you for your response to <strong className="text-indigo-600 font-bold">"{form?.title}"</strong>.
          </p>
          <div className="space-y-4">
            {form?.settings?.allowEditing && user && (
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                 <p className="text-sm text-slate-600 mb-4 font-semibold">Want to change something?</p>
                 <button
                   onClick={() => window.location.href = `/form/${shareUrl}?edit=${submittedResponseId}`}
                   className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                 >
                   <Edit3 className="w-4 h-4" />
                   Edit Your Response
                 </button>
              </div>
            )}
            <button
              onClick={() => setShowSubmittedResponse(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all"
            >
              <Eye className="w-4 h-4" />
              See your response
            </button>
          </div>
        </div>

        {/* Local View Response Modal */}
        {showSubmittedResponse && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 text-left">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Your Response Details</h3>
                  <p className="text-slate-500 text-sm mt-0.5">Submitted answers for {form?.title}</p>
                </div>
                <button
                  onClick={() => setShowSubmittedResponse(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-4">
                  {form?.fields.map((field) => (
                    <div key={field.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <h5 className="font-semibold text-slate-700 text-sm mb-2">
                        {field.label}
                      </h5>
                      <p className="text-slate-900 font-medium break-words text-[15px]">
                        {formatValue(responses[field.id])}
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
  }

  return (
      <div className="min-h-screen bg-[#F0F4F8] pb-12">
      <FormHeader form={form} />

      <div className="max-w-3xl mx-auto px-4 relative z-10">
        <div className="bg-white rounded-b-[24px] shadow-sm border-x border-b border-slate-100 overflow-hidden -mt-1">
          {/* Progress Bar */}
          {form.settings?.showProgressBar && form.fields.length > 0 && (
            <div className="h-1.5 w-full bg-slate-50">
              <div
                className="bg-indigo-600 h-full rounded-r-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                style={{ width: `${(Object.keys(responses).length / form.fields.length) * 100}%` }}
              />
            </div>
          )}

          <div className="p-4 sm:p-10 lg:p-12 sm:pt-0">
            {/* User Status Indicator */}
            <div className="mb-6 sm:mb-10 p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-2.5 h-2.5 rounded-full ${user ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {user ? user.email : 'Anonymous Responder'}
                  </span>
                </div>
              </div>
              {user ? (
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.setItem('returnUrl', window.location.pathname);
                    window.location.href = '/login';
                  }}
                  className="px-4 py-1.5 bg-white border border-slate-200 text-indigo-600 text-[10px] sm:text-xs font-bold rounded-full hover:bg-indigo-50 hover:border-indigo-200 transition-all active:scale-[0.95] shadow-sm uppercase tracking-tight"
                >
                  Switch account
                </button>
              ) : (
                <button
                  onClick={() => {
                    localStorage.setItem('returnUrl', window.location.pathname);
                    window.location.href = '/login';
                  }}
                  className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-full hover:bg-slate-50 transition-colors"
                >
                  Sign in
                </button>
              )}
            </div>

            {/* Login Requirement Notice */}
            {form.settings?.requireLogin && !user && !showLoginRequired && (
              <div className="mb-10 p-6 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 mb-1">Sign in required</h4>
                  <p className="text-sm text-amber-700 mb-4">
                    You must be signed in to submit this form. Your progress will be saved once you log in.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        localStorage.setItem('returnUrl', window.location.pathname);
                        window.location.href = '/login';
                      }}
                      className="px-4 py-2 bg-amber-600 text-white font-bold rounded-xl text-sm hover:bg-amber-700 shadow-sm shadow-amber-200 transition-all"
                    >
                      Sign In Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
              {form.fields.map((field, idx) => (
                <div 
                  key={field.id} 
                  className="group transition-all duration-300"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <label className="block text-[15px] font-bold text-slate-800 mb-4 group-focus-within:text-indigo-600 transition-colors">
                    {field.label}
                    {field.required && <span className="text-rose-500 ml-1.5">*</span>}
                  </label>
                  <div className="relative">
                    {renderField(field)}
                  </div>
                </div>
              ))}

              <div className="pt-8 border-t border-slate-50">
                <button
                  type="submit"
                  disabled={submitting || (form.settings?.requireLogin && !user)}
                  className="w-full flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 active:scale-[0.98]"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
                      Submitting Response...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-3" />
                      Submit Form
                    </>
                  )}
                </button>
                <div className="mt-6 text-center">
                  <p className="text-xs text-slate-400 font-medium">
                    Never submit passwords through OORB Forms. 
                    <a href="#" className="text-indigo-500 ml-1 hover:underline">Report Abuse</a>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center pb-8 border-t border-slate-200 pt-8">
          <p className="text-sm font-bold text-slate-400 tracking-wide uppercase">Powered by</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">OORB<span className="text-indigo-600">FORMS</span></span>
          </div>
        </div>
      </div>

      {/* Login Required Modal */}
      {showLoginRequired && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Login Required</h3>
            </div>
            <div className="p-8">
              <p className="text-slate-600 mb-8 leading-relaxed">
                This form requires you to be logged in to submit a response. This helps us ensure data integrity and security.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    localStorage.setItem('returnUrl', window.location.pathname);
                    window.location.href = '/login';
                  }}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-md shadow-indigo-100"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('returnUrl', window.location.pathname);
                    window.location.href = '/register';
                  }}
                  className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98]"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No modal needed as per user request */}
    </div>
  );
};

export default FormRenderer;