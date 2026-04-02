import React, { useState } from 'react';
import { User, Mail, Lock, Shield, Check, AlertCircle, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const UserSettings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  
  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name is required');

    setUpdatingProfile(true);
    try {
      await updateProfile({ name, avatar });
      // updateProfile in context already shows success toast and updates user state
    } catch (error: any) {
      // updateProfile in context already handles errors
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error('All password fields are required');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters');
    }

    setChangingPassword(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your profile and security preferences</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Col: Instructions */}
        <div className="space-y-4">
          <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-2">
              <User className="w-4 h-4" /> Personal Information
            </h3>
            <p className="text-[12px] text-indigo-700/80 leading-relaxed">
              Your name and avatar will be visible to collaborators and on forms you create.
            </p>
          </div>
        </div>

        {/* Right Col: Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleUpdateProfile} className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-6 pb-6 border-b border-slate-50">
              <div className="relative group">
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-20 h-20 rounded-2xl object-cover ring-4 ring-slate-50" />
                ) : (
                  <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700 text-2xl font-bold ring-4 ring-slate-50">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="text-white w-6 h-6" />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-slate-900 text-lg">{name}</h4>
                <p className="text-slate-400 text-sm">{email}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    placeholder="Your Name"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative opacity-50">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Avatar URL</label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                placeholder="https://images.unsplash.com/photo-..."
              />
              <p className="text-[10px] text-slate-400 ml-1 italic">Link an image from the web to set as your profile picture.</p>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={updatingProfile}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-100 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {updatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {updatingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 pt-8 border-t border-slate-100">
        {/* Left Col: Instructions */}
        <div className="space-y-4">
          <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100">
            <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4" /> Security & Password
            </h3>
            <p className="text-[12px] text-rose-700/80 leading-relaxed">
              We recommend using a strong, unique password to protect your data and forms.
            </p>
          </div>
        </div>

        {/* Right Col: Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleChangePassword} className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm space-y-6">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm New Password</label>
                  <div className="relative">
                    <Check className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-sm disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
