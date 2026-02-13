
import React, { useState, useCallback } from 'react';
import { Question } from './types';
import TopicSelector from './components/TopicSelector';
import Quiz from './components/Quiz';
import Results from './components/Results';
import Loader from './components/Loader';
import Login from './components/Login';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import { generateQuiz } from './services/geminiService';
import { fetchRandomQuestions } from './services/supabaseService';

type GameState = 'config' | 'quiz' | 'results';
type View = 'user' | 'admin_login' | 'admin_panel';
export type QuizSource = 'ai' | 'db';
export type Verband = 'DZKB' | 'ProHunde';
export type SchulhundModuleType = 'schulhund' | 'hundefuehrerschein';

// Hilfsfunktion zur Normalisierung von Texten, um HTML-Entitäten und falsche Zeilenumbrüche zu korrigieren.
const normalizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  let normalized = String(text);

  try {
      // Verwendet den DOM-Parser des Browsers, um HTML-Entitäten wie &amp;, &#x000D;, etc. zu dekodieren.
      const textarea = document.createElement("textarea");
      textarea.innerHTML = normalized;
      normalized = textarea.value;
  } catch (e) {
      console.warn('Textarea konnte nicht zum Dekodieren verwendet werden.', e);
  }
  
  // Entfernt alle verbleibenden HTML-Tags nach dem Dekodieren
  normalized = normalized.replace(/<[^>]*>?/gm, '');

  // Normalisiert verschiedene Zeilenumbruchformate in ein einziges \n
  normalized = normalized
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Ersetzt mehrere aufeinanderfolgende Zeilenumbrüche durch einen einzigen
  normalized = normalized.replace(/(\n\s*)+/g, '\n');

  return normalized.trim();
};


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState>('config');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[][]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('user');

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleStartQuiz = useCallback(async (topic: string, numQuestions: number, source: QuizSource, schulhundModule: SchulhundModuleType) => {
    setIsLoading(true);
    setError(null);
    try {
      let fetchedQuestions: Question[];
      // Der 'ai'-Pfad ist von der Benutzeroberfläche nicht mehr erreichbar, bleibt aber für eine mögliche zukünftige Verwendung erhalten.
      if (source === 'ai') {
        fetchedQuestions = await generateQuiz(topic, numQuestions);
      } else {
        fetchedQuestions = await fetchRandomQuestions(numQuestions, schulhundModule);
      }

      // Normalisiere alle abgerufenen Fragen, um Text aus der Datenbank oder von der KI zu bereinigen
       const normalizedQuestions = fetchedQuestions.map(q => ({
        ...q,
        questionText: normalizeText(q.questionText),
        options: q.options.map(opt => normalizeText(opt)),
        category: normalizeText(q.category),
      }));

      // Mische die Antwortmöglichkeiten für jede Frage und aktualisiere den korrekten Index
      const questionsWithShuffledOptions = normalizedQuestions.map(question => {
        const correctAnswersText = question.correctAnswerIndices.map(i => question.options[i]);
        
        // Fisher-Yates-Shuffle-Algorithmus für eine gute Zufälligkeit
        const shuffledOptions = [...question.options];
        for (let i = shuffledOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
        }

        const newCorrectAnswerIndices = shuffledOptions
            .map((option, index) => (correctAnswersText.includes(option) ? index : -1))
            .filter(index => index !== -1)
            .sort((a, b) => a - b); // Sort for consistent order

        return {
          ...question,
          options: shuffledOptions,
          correctAnswerIndices: newCorrectAnswerIndices,
        };
      });


      setQuestions(questionsWithShuffledOptions);
      setUserAnswers(Array.from({ length: questionsWithShuffledOptions.length }, () => []));
      setGameState('quiz');
    } catch (err: any) {
      // FIX: Added curly braces to the catch block to correctly handle the error and fix parsing issues.
      setError(err.message || 'Fehler beim Abrufen des Quiz. Bitte versuchen Sie es später erneut.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const isMulti = questions[questionIndex].type === 'Multi';
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      const currentSelection = newAnswers[questionIndex] || [];
      
      if (isMulti) {
        const newSelection = currentSelection.includes(answerIndex)
          ? currentSelection.filter(i => i !== answerIndex)
          : [...currentSelection, answerIndex].sort((a, b) => a - b);
        newAnswers[questionIndex] = newSelection;
      } else {
        newAnswers[questionIndex] = [answerIndex];
      }
      return newAnswers;
    });
  };

  const handleSubmitQuiz = () => {
    setGameState('results');
  };

  const handleRestart = () => {
    setGameState('config');
    setQuestions([]);
    setUserAnswers([]);
    setError(null);
  };

  const handleLogoutAndRestart = () => {
    setGameState('config');
    setQuestions([]);
    setUserAnswers([]);
    setError(null);
    setIsAuthenticated(false);
  };

  const renderUserContent = () => {
    if (isLoading) {
      return <Loader message="Quiz wird geladen... Bitte haben Sie einen Moment Geduld." />;
    }

    if (error) {
        return (
            <div className="text-center p-8 bg-white rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Ein Fehler ist aufgetreten</h2>
                <p className="text-slate-700 mb-6">{error}</p>
                <button
                    onClick={handleRestart}
                    className="bg-[#0B79D0] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#0968b4] transition-colors duration-300"
                >
                    Zurück zum Start
                </button>
            </div>
        );
    }
    
    switch (gameState) {
      case 'quiz':
        return <Quiz 
          questions={questions} 
          userAnswers={userAnswers} 
          onAnswerSelect={handleAnswerSelect} 
          onSubmit={handleSubmitQuiz} 
        />;
      case 'config':
      default:
        return <TopicSelector onStartQuiz={handleStartQuiz} />;
    }
  };

  if (view === 'admin_login') {
    return (
      <div className="min-h-screen font-sans flex items-center justify-center p-4 bg-gradient-to-b from-slate-800 to-slate-900">
        <AdminLogin onLoginSuccess={() => setView('admin_panel')} onCancel={() => setView('user')} />
      </div>
    );
  }

  if (view === 'admin_panel') {
     return (
      <div className="min-h-screen font-sans flex flex-col items-center p-4 bg-slate-100">
        <AdminPanel onLogout={() => setView('user')} />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
       <div className="min-h-screen font-sans flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#007bff] to-[#a0d2ff]">
        <Login onLoginSuccess={handleLoginSuccess} />
         <footer className="w-full max-w-4xl mx-auto text-center py-4 absolute bottom-0">
          <button onClick={() => setView('admin_login')} className="text-blue-200 hover:text-white text-xs transition-colors">
            Admin
          </button>
        </footer>
      </div>
    );
  }

  if (gameState === 'results') {
    return <Results 
      questions={questions} 
      userAnswers={userAnswers} 
      onRestart={handleRestart} 
      onLogout={handleLogoutAndRestart}
    />;
  }
  
  const isQuizActive = gameState === 'quiz';

  return (
    <div className={`min-h-screen font-sans flex flex-col items-center p-4 bg-gradient-to-b from-[#007bff] to-[#a0d2ff] ${!isQuizActive && 'justify-center'}`}>
      <header className="w-full max-w-4xl mx-auto text-center mb-6 flex-shrink-0">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">DZKB Bayern e.V. Prüfungstrainer</h1>
        <p className="text-blue-100 mt-2 text-lg">Teste dein Wissen.</p>
      </header>
      <main className={`w-full max-w-4xl mx-auto flex ${isQuizActive ? 'flex-grow' : 'justify-center'}`}>
        {renderUserContent()}
      </main>
       <footer className="w-full max-w-4xl mx-auto text-center mt-8 text-blue-200 text-sm flex-shrink-0">
        <p>Unterstützt durch die Gemini API</p>
         <button onClick={() => setView('admin_login')} className="text-blue-200 hover:text-white text-xs transition-colors mt-2">
            Admin
          </button>
      </footer>
    </div>
  );
};

export default App;
