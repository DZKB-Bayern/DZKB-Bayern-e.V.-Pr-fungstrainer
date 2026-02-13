import React from 'react';
import QuestionMarkIcon from './icons/QuestionMarkIcon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in"
      onClick={onCancel}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md text-center transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
          <QuestionMarkIcon className="h-8 w-8 text-[#0B79D0]" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Quiz beenden?</h2>
        <p className="text-gray-600 mb-6">
          Bist du bereit für die Auswertung?
          <br />
          Du kannst deine Antworten danach nicht mehr ändern.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onCancel}
            className="w-full bg-slate-200 text-slate-700 font-bold py-3 px-5 rounded-lg hover:bg-slate-300 transition-colors"
          >
            Noch einmal prüfen
          </button>
          <button
            onClick={onConfirm}
            className="w-full bg-[#0B79D0] text-white font-bold py-3 px-5 rounded-lg hover:bg-[#0968b4] transition-colors"
          >
            Test auswerten
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;