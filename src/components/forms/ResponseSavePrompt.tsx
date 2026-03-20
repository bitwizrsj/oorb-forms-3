import React, { useState } from 'react';
import { Save, User, Mail, Lock, X } from 'lucide-react';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface ResponseSavePromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveResponse: (saveToAccount: boolean, userData?: any) => void;
  formTitle: string;
}

const ResponseSavePrompt: React.FC<ResponseSavePromptProps> = ({
  isOpen,
  onClose,
  onSaveResponse,
  formTitle
}) => {
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmitAnonymously = () => {
    onSaveResponse(false);
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await authAPI.login(loginData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      onSaveResponse(true, response.data.user);
      toast.success('Logged in and response saved to your account!');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-sm shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-sm flex items-center justify-center">
                <Save className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Save Your Response</h3>
                <p className="text-sm text-gray-600">Choose how to save your response</p>
              </div>
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
          {!showLogin ? (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-gray-600">
                  You're about to submit your response to <strong>"{formTitle}"</strong>
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setShowLogin(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In to Save to Account</span>
                </button>

                <div className="text-center text-sm text-gray-500">
                  <span>or</span>
                </div>

                <button
                  onClick={handleSubmitAnonymously}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Submit Anonymously
                </button>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs text-yellow-800">
                  <strong>Benefits of signing in:</strong> Track your responses, edit submissions, and get notified of updates.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-center mb-4">
                <h4 className="font-medium text-gray-900">Sign In to Your Account</h4>
                <p className="text-sm text-gray-600">Save this response to your account</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Signing In...' : 'Sign In & Save'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSubmitAnonymously}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Skip and submit anonymously
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResponseSavePrompt;