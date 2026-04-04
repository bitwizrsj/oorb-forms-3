import React, { useState, useEffect } from 'react';
import { X, UserPlus, Users, Mail, Trash2, Shield, Clock, Loader2 } from 'lucide-react';
import { collabAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Collaborator {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface PendingInvite {
  email: string;
  invitedAt: string;
}

interface CollaboratorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  formTitle: string;
}

const CollaboratorsModal: React.FC<CollaboratorsModalProps> = ({
  isOpen,
  onClose,
  formId,
  formTitle
}) => {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [owner, setOwner] = useState<Collaborator | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCollaborators();
    }
  }, [isOpen, formId]);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const response = await collabAPI.getCollaborators(formId);
      setCollaborators(response.data.collaborators);
      setPending(response.data.pending);
      setOwner(response.data.createdBy);
    } catch (error) {
      toast.error('Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    try {
      setInviting(true);
      await collabAPI.inviteCollaborator(formId, emailInput.trim());
      toast.success(`Invitation sent to ${emailInput}`);
      setEmailInput('');
      fetchCollaborators();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this collaborator?')) return;

    try {
      await collabAPI.removeCollaborator(formId, userId);
      toast.success('Collaborator removed');
      fetchCollaborators();
    } catch (error) {
      toast.error('Failed to remove collaborator');
    }
  };

  if (!isOpen) return null;

  const isOwner = user?._id === owner?._id;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
              <Users className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manage Collaborators</h2>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[250px]">
                {formTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          {/* Add Collaborator Form (Owner Only) */}
          {isOwner && (
            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-3">Invite by Email</label>
              <form onSubmit={handleInvite} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md shadow-indigo-100 flex items-center gap-2"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>Invite</span>
                </button>
              </form>
            </div>
          )}

          {/* Collaborators List */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">People with access</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Owner */}
                  {owner && (
                    <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                          {owner.avatar ? (
                            <img src={owner.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            owner.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{owner.name} <span className="ml-1 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-black tracking-tighter">Owner</span></p>
                          <p className="text-xs text-slate-500">{owner.email}</p>
                        </div>
                      </div>
                      <Shield className="w-4 h-4 text-slate-300 mr-2" />
                    </div>
                  )}

                  {/* Active Collaborators */}
                  {collaborators.map((collab) => (
                    <div key={collab._id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm">
                          {collab.avatar ? (
                             <img src={collab.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            collab.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{collab.name}</p>
                          <p className="text-xs text-slate-500">{collab.email}</p>
                        </div>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => handleRemove(collab._id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          title="Remove access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Pending Invites */}
                  {pending.map((item) => (
                    <div key={item.email} className="flex items-center justify-between p-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                      <div className="flex items-center gap-3 opacity-60">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">
                           <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.email}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                             <Clock className="w-3 h-3" />
                             <span>Invited {new Date(item.invitedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-1 bg-white border border-slate-200 rounded-lg mr-2">Pending</span>
                    </div>
                  ))}

                  {collaborators.length === 0 && pending.length === 0 && !loading && (
                    <div className="text-center py-8">
                       <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                          <Users className="w-6 h-6 text-slate-300" />
                       </div>
                       <p className="text-sm text-slate-400 font-medium">No collaborators added yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorsModal;
