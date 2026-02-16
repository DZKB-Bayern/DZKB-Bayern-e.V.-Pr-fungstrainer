import React, { useState } from 'react';
import { validateAccessCode } from '../services/supabaseService';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const isValid = await validateAccessCode(accessCode.trim());
      if (isValid) {
        onLoginSuccess();
      } else {
        setError('Ungültiger oder inaktiver Zugangscode. Bitte prüfen Sie Ihre Eingabe.');
        setAccessCode('');
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-2xl text-center flex flex-col items-center animate-fade-in">
        <img 
          src="https://dzkb.bayern/wp-content/uploads/2024/09/Logo-DZKB-Hundefuehrerschein2024.jpg" 
          alt="DZKB Hundeführerschein Logo"
          className="w-64 h-auto mb-6"
        />
        <h1 className="text-3xl font-bold text-gray-800 tracking-wide">DZKB Bayern e.V.</h1>
        <p className="text-xl text-gray-600 mt-2">Theorie Test Prüfungen</p>
        
        <p className="text-gray-500 mt-8 mb-4">Bitte gib hier deinen persönlichen Zugangscode ein.</p>

        <form onSubmit={handleSubmit} className="w-full">
            <div className="space-y-4">
                <input 
                  type="text"
                  id="accessCode"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className={`w-full text-center text-lg font-medium text-gray-900 py-4 px-6 rounded-xl border-2 transition-all duration-300 ${
                    error 
                      ? 'border-red-400 bg-red-50 focus:ring-red-500/50' 
                      : 'bg-gray-100 border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0B79D0]/80 focus:border-transparent'
                  }`}
                  placeholder="Zugangscode"
                  required
                  disabled={isLoading}
                  aria-describedby={error ? "password-error" : undefined}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#0B79D0] text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:bg-[#0968b4] focus:outline-none focus:ring-4 focus:ring-[#0B79D0]/50 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Prüfe...' : 'Los geht\'s!'}
                </button>
            </div>
            {error && <p id="password-error" className="mt-3 text-sm text-red-600">{error}</p>}
        </form>
    </div>
  );
};

export default Login;
