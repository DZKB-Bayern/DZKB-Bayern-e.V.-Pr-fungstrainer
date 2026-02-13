import React, { useState } from 'react';
import { Question } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface QuizProps {
  questions: Question[];
  userAnswers: number[][];
  onAnswerSelect: (questionIndex: number, answerIndex: number) => void;
  onSubmit: () => void;
}

const Quiz: React.FC<QuizProps> = ({ questions, userAnswers, onAnswerSelect, onSubmit }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const handleSubmitRequest = () => {
    setIsConfirmationModalOpen(true);
  };
  
  const handleConfirmSubmit = () => {
    setIsConfirmationModalOpen(false);
    onSubmit();
  };

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswers = userAnswers[currentQuestionIndex] || [];

  const getTypeBadgeClasses = (type?: string | null): string => {
    const baseClasses = "text-xs font-medium px-2.5 py-0.5 rounded-full ml-3 align-middle";
    const formattedType = (type === 'Multi') ? 'Multi' : 'Single';
    
    switch (formattedType) {
      case 'Single':
        return `${baseClasses} bg-blue-100 text-[#0B79D0]`;
      case 'Multi':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <>
      <div className="bg-slate-50 rounded-xl shadow-md w-full flex flex-col flex-grow overflow-hidden">
        {/* ===== HEADER (FIXED) ===== */}
        <div className="flex-shrink-0 p-4 sm:p-6 md:p-8">
          <div className="mb-4 sm:mb-6">
            <p className="text-sm text-gray-500">Frage {currentQuestionIndex + 1} von {questions.length}</p>
            <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
              <div className="bg-[#0B79D0] h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
            {questions.map((_, index) => {
              const isAnswered = userAnswers[index] && userAnswers[index].length > 0;
              const isCurrent = index === currentQuestionIndex;
              
              let buttonClasses = "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B79D0]";

              if (isCurrent) {
                buttonClasses += " bg-[#0B79D0] text-white";
              } else if (isAnswered) {
                buttonClasses += " bg-slate-300 text-slate-800 hover:bg-slate-400";
              } else {
                buttonClasses += " bg-slate-200 text-slate-600 hover:bg-slate-300";
              }

              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={buttonClasses}
                  aria-label={`Gehe zu Frage ${index + 1}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== CONTENT (SCROLLABLE) ===== */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 md:p-8 border-y border-slate-200">
          {currentQuestion.imageUrl && (
            <div className="mb-4 sm:mb-6">
              <img
                src={currentQuestion.imageUrl}
                alt={`Bild zur Frage: ${currentQuestion.questionText.substring(0, 50)}...`}
                className="w-full max-h-80 object-contain rounded-lg bg-slate-100"
              />
            </div>
          )}

          <div className="p-4 border-2 border-slate-200 rounded-lg bg-white mb-4 sm:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 inline whitespace-pre-wrap">{currentQuestion.questionText}</h2>
            <span className={getTypeBadgeClasses(currentQuestion.type)}>
                {currentQuestion.type === 'Multi' ? 'Multi' : 'Single'}
            </span>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => onAnswerSelect(currentQuestionIndex, index)}
                className={`w-full text-left p-3 sm:p-4 border-2 rounded-lg transition-all duration-200 text-gray-700 flex items-center
                  ${selectedAnswers.includes(index)
                    ? 'bg-blue-100 border-[#0B79D0] ring-2 ring-[#0B79D0]/50'
                    : 'bg-white border-slate-300 hover:bg-slate-100 hover:border-[#0B79D0]'
                  }`}
              >
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center border-2 border-slate-400 rounded-md mr-4">
                  {selectedAnswers.includes(index) && <div className="w-4 h-4 bg-[#0B79D0] rounded-sm"></div>}
                </div>
                <span className={`text-sm sm:text-base font-medium whitespace-pre-wrap ${selectedAnswers.includes(index) ? 'text-[#0B79D0]' : 'text-gray-700'}`}>{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ===== FOOTER (FIXED) ===== */}
        <div className="flex-shrink-0 p-4 sm:p-6 md:p-8">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={currentQuestionIndex === 0}
              className="bg-slate-200 text-slate-700 font-bold py-2 px-6 rounded-lg hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Zurück
            </button>
            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="bg-[#0B79D0] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#0968b4] transition-colors"
              >
                Weiter
              </button>
            ) : (
              <button
                onClick={handleSubmitRequest}
                className="bg-[#0B79D0] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#0968b4] transition-colors"
              >
                Abschicken
              </button>
            )}
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setIsConfirmationModalOpen(false)}
      />
    </>
  );
};

export default Quiz;