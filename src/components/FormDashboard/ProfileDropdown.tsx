import React from 'react';
import { User, BarChart3, Settings, LogOut, Edit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFormData } from './FormDataContext';
import { useState } from 'react';

interface FormItem {
  _id: string;
  title: string;
  description: string;
  responses?: number;
  views?: number;
  status: 'published' | 'draft' | 'closed';
}

interface ProfileDropdownProps {
  onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onClose }) => {
  const { user, logout, getInitials, updateProfile } = useAuth();
  const { forms } = useFormData();
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || ''
  });
  const [saving, setSaving] = useState(false);

  const totalResponses = forms.reduce((sum: number, form: FormItem) => sum + (form.responses || 0), 0);
  const totalViews = forms.reduce((sum: number, form: FormItem) => sum + (form.views || 0), 0);
  const activeForms = forms.filter((form: FormItem) => form.status === 'published').length;

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const success = await updateProfile(profileData);
      if (success) {
        setShowProfileEdit(false);
        onClose();
      }
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (showProfileEdit) {
    return (
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-sm shadow-lg border border-gray-200 py-4 z-50">
        <div className="px-4 py-2 border-b border-gray-100">
          <h3 className="font-medium text-gray-900">Edit Profile</h3>
        </div>
        
        <form onSubmit={handleProfileUpdate} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Avatar URL
            </label>
            <input
              type="url"
              value={profileData.avatar}
              onChange={(e) => setProfileData(prev => ({ ...prev, avatar: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowProfileEdit(false)}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="absolute right-0 mt-2 w-64 bg-white rounded-sm shadow-lg border border-gray-200 py-2 z-50">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
              {getInitials()}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-gray-100">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Quick Stats</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{forms.length}</div>
            <div className="text-xs text-gray-500">Total Forms</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{totalResponses}</div>
            <div className="text-xs text-gray-500">Responses</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{totalViews}</div>
            <div className="text-xs text-gray-500">Views</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{activeForms}</div>
            <div className="text-xs text-gray-500">Published</div>
          </div>
        </div>
      </div>

      <div className="py-2">
        <button 
          onClick={() => setShowProfileEdit(true)}
          className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <User className="w-4 h-4" />
          <span>Edit Profile</span>
        </button>
        <button className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors">
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>
        <button className="w-full flex items-center space-x-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
        <div className="border-t border-gray-100 my-2"></div>
        <button 
          onClick={() => {
            logout();
            onClose();
          }}
          className="w-full flex items-center space-x-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;