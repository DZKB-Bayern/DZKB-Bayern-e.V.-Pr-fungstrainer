import React, { useState } from 'react';
import { validateAdminCredentials } from '../services/supabaseService';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const isValid = await validateAdminCredentials(username, password);
      if (isValid) {
        onLoginSuccess();
      } else {
        setError('Falscher Benutzername oder Kennwort.');
        setPassword('');
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-2xl text-center flex flex-col items-center animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 tracking-wide">Admin-Bereich</h1>
        <p className="text-gray-500 mt-4 mb-6">Bitte geben Sie Ihre Anmeldedaten ein.</p>

        <form onSubmit={handleSubmit} className="w-full">
            <div className="space-y-4">
                 <input 
                  type="text"
                  id="admin-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full text-center text-lg font-medium text-gray-900 py-4 px-6 rounded-xl border-2 transition-all duration-300 bg-gray-100 border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0B79D0]/80 focus:border-transparent`}
                  placeholder="Benutzername"
                  required
                  autoComplete="username"
                  disabled={isLoading}
                />
                <input 
                  type="password"
                  id="admin-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full text-center text-lg font-medium text-gray-900 py-4 px-6 rounded-xl border-2 transition-all duration-300 ${
                    error 
                      ? 'border-red-400 bg-red-50 focus:ring-red-500/50' 
                      : 'bg-gray-100 border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0B79D0]/80 focus:border-transparent'
                  }`}
                  placeholder="Admin-Kennwort"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  aria-describedby={error ? "password-error" : undefined}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#0B79D0] text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:bg-[#0968b4] focus:outline-none focus:ring-4 focus:ring-[#0B79D0]/50 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Prüfe...' : 'Anmelden'}
                </button>
            </div>
            {error && <p id="password-error" className="mt-3 text-sm text-red-600">{error}</p>}
        </form>
         <button
            onClick={onCancel}
            className="mt-6 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            Zurück zur Hauptseite
          </button>
    </div>
  );
};

export default AdminLogin;