import React, { useState } from 'react';
import { validateAccessCode } from '../services/supabaseService';
import { requestAccessCodeByEmail } from '../services/accessCodeSelfService';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Self-service modal
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotIsLoading, setForgotIsLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const isValid = await validateAccessCode(accessCode.trim());
      if (isValid) {
        onLoginSuccess();
      } else {
        setError('Ungültiger oder inaktiver Zugangscode.');
      }
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage(null);
    setForgotIsLoading(true);

    try {
      // Always show neutral message (no account enumeration)
      await requestAccessCodeByEmail(forgotEmail);
      setForgotMessage(
        'Wenn die E-Mail-Adresse bei uns hinterlegt ist, wurde der Zugangscode soeben an diese Adresse gesendet.'
      );
    } catch {
      setForgotMessage(
        'Wenn die E-Mail-Adresse bei uns hinterlegt ist, wurde der Zugangscode soeben an diese Adresse gesendet.'
      );
    } finally {
      setForgotIsLoading(false);
    }
  };

  const closeForgot = () => {
    setIsForgotOpen(false);
    setForgotEmail('');
    setForgotIsLoading(false);
    setForgotMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img src="/app-icon.png" alt="DZKB Bayern e.V." className="w-16 h-16 mb-3" />
          <h1 className="text-2xl font-bold text-slate-800 text-center">
            DZKB Bayern e.V.
          </h1>
          <p className="text-slate-500 text-center mt-1">Prüfungstrainer</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="accessCode" className="block text-sm font-medium text-slate-700 mb-1">
              Zugangscode
            </label>
            <input
              id="accessCode"
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="z. B. BRAV-PFOTE-123"
              className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:bg-slate-400"
          >
            {isLoading ? 'Prüfe...' : 'Anmelden'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsForgotOpen(true)}
              className="text-sm text-sky-700 hover:underline"
            >
              Code vergessen?
            </button>
          </div>
        </form>
      </div>

      {isForgotOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Zugangscode per E-Mail anfordern</h2>
            <p className="text-sm text-slate-600 mb-4">
              Gib die E-Mail-Adresse ein, mit der dein Zugangscode erstellt wurde.
            </p>

            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@example.de"
                className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />

              {forgotMessage && (
                <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  {forgotMessage}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForgot}
                  className="flex-1 border border-slate-300 text-slate-800 font-bold py-3 px-4 rounded-xl hover:bg-slate-50"
                  disabled={forgotIsLoading}
                >
                  Schließen
                </button>
                <button
                  type="submit"
                  disabled={forgotIsLoading}
                  className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:bg-slate-400"
                >
                  {forgotIsLoading ? 'Sende...' : 'Code senden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
