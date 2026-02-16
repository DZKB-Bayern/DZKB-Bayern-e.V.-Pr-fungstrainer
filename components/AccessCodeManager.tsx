import React, { useState, useEffect, useCallback } from 'react';
import { fetchAllAccessCodes, createAccessCode, updateAccessCode, deleteAccessCode } from '../services/supabaseService';
import { AccessCode } from '../types';
import ToggleSwitch from './ToggleSwitch';
import KeyIcon from './icons/KeyIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';

const ADJECTIVES = ['BRAV', 'FRECH', 'FRÖHLICH', 'VERSPIELT', 'TREU', 'CHARMANT', 'CLEVER', 'MUTIG', 'LIEB', 'TAPFER', 'NEUGIERIG', 'GLÜCKLICH', 'FLAUSCHIG', 'WACH', 'ENTSPANNT', 'SOUVERÄN', 'ZUVERLÄSSIG', 'LERNFREUDIG'];
const NOUNS = ['PFOTE', 'FELLNASE', 'WUFF', 'WELPE', 'SCHNAUZE', 'LECKERLI', 'KNOCHEN', 'SPIELZEUG', 'APPORT', 'TRAIL', 'DUMMY', 'HUNDEWIESE', 'GRUPPE', 'TRAINING', 'CLICKER', 'LEINE', 'HALSBAND'];

const generateReadableCode = (): string => {
  const randomAdj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const randomNoun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const randomNumber = Math.floor(Math.random() * 900) + 100;
  return `${randomAdj}-${randomNoun}-${randomNumber}`;
};

const AccessCodeManager: React.FC = () => {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadCodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedCodes = await fetchAllAccessCodes();
      setCodes(fetchedCodes);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Zugangscodes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const newCodeString = generateReadableCode();
      const newCode = await createAccessCode(newCodeString, studentName, studentEmail);
      setCodes(prev => [newCode, ...prev]);
      setStudentName('');
      setStudentEmail('');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen des Codes.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleStatus = async (codeToUpdate: AccessCode) => {
    // FIX: Refactored to correctly implement optimistic UI update with proper error handling.
    // The UI is updated immediately for responsiveness.
    setCodes(prev =>
      prev.map(c =>
        c.id === codeToUpdate.id ? { ...c, is_active: !c.is_active } : c,
      ),
    );

    try {
      await updateAccessCode(codeToUpdate.id, { is_active: !codeToUpdate.is_active });
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Aktualisieren des Status.');
      // If the API call fails, revert the UI change to reflect the actual state.
      setCodes(prev =>
        prev.map(c =>
          c.id === codeToUpdate.id
            ? { ...c, is_active: codeToUpdate.is_active }
            : c,
        ),
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen Zugangscode endgültig löschen möchten?')) {
      try {
        await deleteAccessCode(id);
        setCodes(prev => prev.filter(c => c.id !== id));
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Fehler beim Löschen des Codes.');
      }
    }
  };

  const handleCopyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4 inline-flex items-center gap-2"><KeyIcon className="w-6 h-6"/> Neuer Zugangscode</h2>
        <p className="text-sm text-gray-600 mb-4">Erstellen Sie einen neuen, einzigartigen Zugangscode für einen Studenten. Name und E-Mail sind erforderlich.</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Name des Studenten (erforderlich)"
            className="flex-grow p-2 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#0B79D0] focus:outline-none"
            required
          />
<input
  type="email"
  value={studentEmail}
  onChange={(e) => setStudentEmail(e.target.value)}
  placeholder="E-Mail-Adresse (erforderlich)"
  className="flex-grow p-2 border rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#0B79D0] focus:outline-none"
  required
/>
          <button
            onClick={handleGenerateCode}
            disabled={isGenerating || !studentName.trim() || !studentEmail.trim()}
            className="bg-green-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
          >
            {isGenerating ? 'Erstelle...' : 'Code erstellen'}
          </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Bestehende Zugangscodes ({codes.length})</h2>
        {error && <p className="text-red-600 font-semibold mb-4">{error}</p>}
        {isLoading ? (
          <p>Lade Zugangscodes...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-gray-600">
                  <th className="p-2">Code</th>
                  <th className="p-2">Student</th>
                  <th className="p-2">E-Mail</th>
                  <th className="p-2">Erstellt am</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {codes.map(code => (
                  <tr key={code.id} className="border-b text-gray-800 hover:bg-slate-50">
                    <td className="p-2 font-mono">
                      <div className="flex items-center gap-2">
                        {code.code}
                        <button onClick={() => handleCopyToClipboard(code.code)} className="text-slate-400 hover:text-[#0B79D0]">
                          {copiedCode === code.code ? <CheckIcon className="w-4 h-4 text-green-600" /> : <ClipboardIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="p-2">{code.student_name || <span className="text-gray-400">N/A</span>}</td>
                    <td className="p-2 text-sm text-gray-500">{code.email || <span className="text-gray-400">N/A</span>}</td>
                    <td className="p-2 text-sm text-gray-500">{formatDate(code.created_at)}</td>
                    <td className="p-2">
                       <ToggleSwitch 
                          enabled={code.is_active}
                          onChange={() => handleToggleStatus(code)}
                          ariaLabel={`Zugang für ${code.student_name || code.code} ${code.is_active ? 'deaktivieren' : 'aktivieren'}`}
                       />
                    </td>
                    <td className="p-2">
                      <button onClick={() => handleDelete(code.id)} className="text-red-500 font-semibold">
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessCodeManager;
