
import React, { useState } from 'react';
import { SUPABASE_URL } from '../services/supabaseService';
import DownloadIcon from './icons/DownloadIcon';

interface TopicSelectorProps {
  onStartQuiz: (topic: string, numQuestions: number) => void;
}

const TOPIC = "DZKB Hundeführerschein Theorieprüfung";
const questionOptions = [5, 10, 20, 60];

const guideVersion = (() => {
  try {
    return localStorage.getItem('guideVersion') || '';
  } catch (_) {
    return '';
  }
})();

const guideUrl = `${SUPABASE_URL}/storage/v1/object/public/learning_materials/studienleitfaden.pdf${guideVersion ? `?v=${guideVersion}` : ''}`;

const TopicSelector: React.FC<TopicSelectorProps> = ({ onStartQuiz }) => {
  const [numQuestions, setNumQuestions] = useState<number | null>(5);

  const handleStart = () => {
    if (numQuestions) {
      onStartQuiz(TOPIC, numQuestions);
    }
  };

  return (
    <div className="bg-slate-50 p-8 rounded-xl shadow-md animate-fade-in w-full max-w-2xl">
      <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">Quiz-Modus auswählen</h2>
      <p className="text-gray-600 text-center mb-8">Wähle die Anzahl der Fragen, um zu starten.</p>

      <div className="space-y-8">
          
          <div>
            <h3 className="text-lg font-semibold text-center text-slate-700 mb-4">Lernmaterialien</h3>
             <a
              href={guideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 bg-orange-400 text-white font-bold py-4 px-4 rounded-lg border-2 border-orange-400 hover:bg-orange-500 hover:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/50 transition-all duration-300"
            >
              <DownloadIcon className="w-6 h-6" />
              Hier kannst Du den Studienleitfaden herunterladen
            </a>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-center text-slate-700 mb-4">1. Anzahl der Fragen wählen</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {questionOptions.map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setNumQuestions(option)}
                  className={`p-4 rounded-lg text-center font-bold text-lg transition-all duration-200 border-2 
                    ${numQuestions === option 
                      ? 'bg-[#0B79D0] text-white border-[#0B79D0] ring-4 ring-[#0B79D0]/30' 
                      : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 hover:border-blue-400'
                    }`}
                >
                  {option} Fragen
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-center text-slate-700 mb-4">2. Quiz starten</h3>
            <div className="mt-4">
               <button
                type="button"
                onClick={handleStart}
                className="w-full bg-[#0B79D0] text-white font-bold py-4 px-4 rounded-lg hover:bg-[#0968b4] focus:outline-none focus:ring-4 focus:ring-[#0B79D0]/50 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                disabled={!numQuestions}
              >
                Quiz starten
              </button>
            </div>
          </div>
      </div>
    </div>
  );
};

export default TopicSelector;