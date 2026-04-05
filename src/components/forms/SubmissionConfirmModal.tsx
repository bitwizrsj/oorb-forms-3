import React from 'react';
import { Send, X } from 'lucide-react';

interface SubmissionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formTitle: string;
}

const SubmissionConfirmModal: React.FC<SubmissionConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  formTitle
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Send className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Confirm Submission</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-slate-600 leading-relaxed text-sm">
              You're about to submit your response to <strong className="text-slate-900 font-bold">"{formTitle}"</strong>. 
              Please confirm that you're ready to proceed.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-sm shadow-indigo-100"
            >
              Confirm & Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionConfirmModal;