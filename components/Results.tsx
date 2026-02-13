import React from 'react';
import { Question } from '../types';
import CheckIcon from './icons/CheckIcon';
import XIcon from './icons/XIcon';

interface ResultsProps {
  questions: Question[];
  userAnswers: number[][];
  onRestart: () => void;
  onLogout: () => void;
}

const Results: React.FC<ResultsProps> = ({ questions, userAnswers, onRestart, onLogout }) => {
  const score = userAnswers.reduce((acc, selectedIndices, index) => {
    const question = questions[index];
    const userSelection = selectedIndices || [];
    const correctAnswers = question.correctAnswerIndices || [];

    // Sort both arrays to compare them regardless of selection order
    const sortedUser = [...userSelection].sort();
    const sortedCorrect = [...correctAnswers].sort();

    const isIdentical = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);

    return isIdentical ? acc + 1 : acc;
  }, 0);

  const scorePercentage = Math.round((score / questions.length) * 100);
  const PASSING_PERCENTAGE = 80;
  const isPassed = scorePercentage >= PASSING_PERCENTAGE;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#007bff] to-[#a0d2ff] font-sans overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-28">
        
        {/* Zusammenfassungs-Karte */}
        <div className={`rounded-xl mb-8 text-center relative overflow-hidden text-slate-800 min-h-[250px] flex items-center justify-center p-4`}>
           <img 
             src="https://dzkb.bayern/wp-content/uploads/2026/02/Header-App.png"
             alt="Header-Grafik mit Pfotenabdruck und Wellen"
             className="absolute inset-0 w-full h-full object-cover"
             aria-hidden="true"
           />
           
           <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
               <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${isPassed ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                 {isPassed 
                   ? <CheckIcon className="w-10 h-10" /> 
                   : <XIcon className="w-10 h-10" />}
               </div>
              <h2 className="text-2xl font-bold mt-4">{isPassed ? 'Bestanden' : 'Nicht bestanden'}</h2>
              <p className="text-5xl font-bold my-2 text-[#0B79D0]">{scorePercentage}%</p>
              <p className="text-slate-600">{score} / {questions.length} richtig</p>
           </div>
        </div>

        {/* Detailauswertung */}
        <h3 className="text-xl font-bold mb-4 text-white drop-shadow-md">Detailauswertung</h3>
        <div className="space-y-4">
          {questions.map((question, index) => {
            const userSelection = userAnswers[index] || [];
            const correctAnswers = question.correctAnswerIndices || [];
            const sortedUser = [...userSelection].sort();
            const sortedCorrect = [...correctAnswers].sort();
            const wasAnsweredCorrectly = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);

            return (
              <div key={index} className="bg-white text-slate-800 rounded-xl p-5">
                {question.imageUrl && (
                  <div className="mb-4">
                    <img 
                      src={question.imageUrl} 
                      alt={`Bild zur Frage: ${question.questionText.substring(0, 50)}...`}
                      className="w-full max-h-64 object-contain rounded-lg bg-slate-100"
                    />
                  </div>
                )}
                <div className="flex items-start mb-4">
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold text-white ${wasAnsweredCorrectly ? 'bg-green-500' : 'bg-red-500'}`}>
                    {index + 1}
                  </span>
                  <p className="font-semibold text-lg whitespace-pre-wrap">{question.questionText}</p>
                </div>

                <div className="space-y-3">
                  {question.options.map((option, optionIndex) => {
                    const isCorrectOption = question.correctAnswerIndices.includes(optionIndex);
                    const isUserSelection = userAnswers[index]?.includes(optionIndex);
                    
                    let optionContainerClasses = "p-3 rounded-lg border-2";
                    let optionTextClasses = "text-slate-800";
                    let subText: React.ReactNode | null = null;
                    let radioOrIcon: React.ReactNode;

                    if (isCorrectOption && isUserSelection) {
                      optionContainerClasses += " bg-green-50 border-green-500";
                      optionTextClasses = "text-green-800 font-semibold";
                      subText = <span className="text-xs font-extrabold tracking-wider text-green-800 bg-green-100 border border-green-300 rounded-md px-2 py-1 inline-block uppercase">Richtig gewählt</span>;
                      radioOrIcon = <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mr-3 flex-shrink-0"><CheckIcon className="w-4 h-4 text-white" /></div>;
                    } else if (!isCorrectOption && isUserSelection) {
                      optionContainerClasses += " bg-red-50 border-red-500";
                      optionTextClasses = "text-red-800 font-semibold";
                      subText = <span className="text-xs font-extrabold tracking-wider text-red-800 bg-red-100 border border-red-300 rounded-md px-2 py-1 inline-block uppercase">Falsch gewählt</span>;
                      radioOrIcon = <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center mr-3 flex-shrink-0"><XIcon className="w-4 h-4 text-white" /></div>;
                    } else if (isCorrectOption && !isUserSelection) {
                      optionContainerClasses += " bg-white border-dashed border-green-500";
                      optionTextClasses = "text-green-700";
                      subText = <span className="text-xs font-extrabold tracking-wider text-green-800 bg-green-100 border border-green-300 rounded-md px-2 py-1 inline-block uppercase">Richtige Lösung</span>;
                      radioOrIcon = <div className="w-6 h-6 rounded-full border-2 border-slate-400 flex items-center justify-center mr-3 flex-shrink-0"><CheckIcon className="w-4 h-4 text-green-500" /></div>;
                    } else {
                      optionContainerClasses += " bg-white border-slate-300";
                      optionTextClasses = "text-slate-600";
                      radioOrIcon = <div className="w-6 h-6 rounded-full border-2 border-slate-400 mr-3 flex-shrink-0"></div>;
                    }
                    
                    return (
                      <div key={optionIndex} className={optionContainerClasses}>
                        <div className="flex items-start">
                          {radioOrIcon}
                          <span className={`${optionTextClasses} whitespace-pre-wrap`}>{option}</span>
                        </div>
                        {subText && (
                          <div className="pl-9 mt-2">
                            {subText}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Fixierter Footer-Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/50 backdrop-blur-sm border-t border-white/20">
        <div className="max-w-3xl mx-auto p-4">
           <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onRestart} 
                className="w-full bg-[#0B79D0] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#0968b4] transition-colors"
              >
                Neuer Test
              </button>
              <button 
                onClick={onLogout} 
                className="w-full bg-slate-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Zurück zur Startseite
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Results;