import React, { useState } from 'react';
import { validateAccessCode, requestAccessCodeByEmail } from '../services/supabaseService';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Self-Service: Code vergessen?
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotIsLoading, setForgotIsLoading] = useState(false);
  const [forgotInfo, setForgotInfo] = useState<string | null>(null);

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

  const openForgot = () => {
    setIsForgotOpen(true);
    setForgotEmail('');
    setForgotInfo(null);
    setForgotIsLoading(false);
  };

  const closeForgot = () => {
    setIsForgotOpen(false);
    setForgotEmail('');
    setForgotInfo(null);
    setForgotIsLoading(false);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotIsLoading(true);
    setForgotInfo(null);

    const neutralMessage =
      'Wenn die E-Mail-Adresse bei uns hinterlegt ist, wurde der Zugangscode soeben an diese Adresse gesendet.';

    try {
      await requestAccessCodeByEmail(forgotEmail);
      setForgotInfo(neutralMessage);
    } catch (err) {
      // bewusst neutral, um keine Informationen preiszugeben
      setForgotInfo(neutralMessage);
    } finally {
      setForgotIsLoading(false);
    }
  };

  return (
    <>
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

            <button
              type="button"
              onClick={openForgot}
              className="w-full text-sm text-[#0B79D0] font-semibold hover:underline"
            >
              Code vergessen?
            </button>
          </div>

          {error && <p id="password-error" className="mt-3 text-sm text-red-600">{error}</p>}
        </form>
      </div>

      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Zugangscode anfordern</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Bitte gib die E-Mail-Adresse ein, die beim Zugangscode hinterlegt ist.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForgot}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="Schließen"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleForgotSubmit} className="mt-4">
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="E-Mail-Adresse"
                required
                disabled={forgotIsLoading}
                className="w-full text-left text-base font-medium text-gray-900 py-3 px-4 rounded-xl border-2 bg-gray-100 border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0B79D0]/80 focus:border-transparent transition-all duration-300"
              />

              {forgotInfo && (
                <div className="mt-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-3">
                  {forgotInfo}
                </div>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeForgot}
                  disabled={forgotIsLoading}
                  className="w-1/2 bg-gray-100 text-gray-800 font-bold py-3 px-4 rounded-xl hover:bg-gray-200 transition-all duration-300 disabled:opacity-60"
                >
                  Schließen
                </button>
                <button
                  type="submit"
                  disabled={forgotIsLoading}
                  className="w-1/2 bg-[#0B79D0] text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-[#0968b4] focus:outline-none focus:ring-4 focus:ring-[#0B79D0]/50 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {forgotIsLoading ? 'Sende...' : 'Senden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
