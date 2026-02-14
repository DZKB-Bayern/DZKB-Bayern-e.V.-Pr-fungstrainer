import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { saveQuestions, fetchAllQuestions, deleteQuestion, updateQuestion, createQuestion, deleteMultipleQuestions, uploadLearningGuide } from '../services/supabaseService';
import { Question } from '../types';
import { Verband } from '../App';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ImageIcon from './icons/ImageIcon';
import AccessCodeManager from './AccessCodeManager';
import KeyIcon from './icons/KeyIcon';
import QuestionMarkIcon from './icons/QuestionMarkIcon';

interface AdminPanelProps {
  onLogout: () => void;
}

type SortDirection = 'asc' | 'desc';
type SortableKeys = 'questionText' | 'type' | 'category' | 'verband';
type AdminView = 'questions' | 'accessCodes';

interface SortConfig {
    key: SortableKeys | null;
    direction: SortDirection;
}

// Helper function for text normalization as per user's request.
const normalizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  let normalized = String(text);

  try {
      // Use the browser's DOM parser to decode HTML entities like &amp;, &#x000D;, etc.
      const textarea = document.createElement("textarea");
      textarea.innerHTML = normalized;
      normalized = textarea.value;
  } catch (e) {
      console.warn('Could not use textarea for decoding, falling back.', e);
  }
  
  // Strip any remaining HTML tags after decoding
  normalized = normalized.replace(/<[^>]*>?/gm, '');

  // Normalize various line break formats to a single \n
  normalized = normalized
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Replace multiple consecutive line breaks (and whitespace between them) with a single one
  normalized = normalized.replace(/(\n\s*)+/g, '\n');

  return normalized.trim();
};


const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<AdminView>('questions');

  // State for file import
  const [file, setFile] = useState<File | null>(null);
  const [uploadVerband, setUploadVerband] = useState<Verband | ''>('');
  const [isImporting, setIsImporting] = useState(false);
  
  // State for question management
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [verbandFilter, setVerbandFilter] = useState<'all' | Verband>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Single' | 'Multi'>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(new Set());


  // State for modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // State for Learning Guide
  const [guideFile, setGuideFile] = useState<File | null>(null);
  const [isUploadingGuide, setIsUploadingGuide] = useState(false);


  // General state
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  const fetchQuestions = useCallback(async () => {
    setIsLoadingQuestions(true);
    try {
      const questions = await fetchAllQuestions();
      setAllQuestions(questions);
    } catch (err: any) {
      setError(err.message || "Fehler beim Laden der Fragen.");
    } finally {
      setIsLoadingQuestions(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const formatQuestionType = useCallback((type?: string | null): string => {
    if (type === 'Single Choice' || type === 'Single') return 'Single';
    if (type === 'Multiple Choice' || type === 'Multi') return 'Multi';
    return type || 'N/A';
  }, []);
  
  // File Upload and Analysis Logic
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleImportCSV = useCallback(async () => {
    if (!file || !uploadVerband) return;

    const fileName = file.name.toLowerCase();
    if (file.type !== 'text/csv' && !fileName.endsWith('.csv')) {
        setError("Bitte wählen Sie eine gültige CSV-Datei aus. Andere Dateitypen werden nicht mehr unterstützt.");
        setFile(null);
        return;
    }

    setIsImporting(true);
    setError(null);
    setSuccessMessage(null);

    try {
        const textContent = await file.text();
        const cleanText = textContent.startsWith('\ufeff') ? textContent.substring(1) : textContent;
        
        const workbook = XLSX.read(cleanText, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const jsonData = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

        const allParsedQuestions: Omit<Question, 'id' | 'created_at'>[] = [];

        for (const row of jsonData) {
            const questionText = normalizeText(row['Frage']);
            if (!questionText) continue;

            const options: string[] = [];
            for (let i = 1; i <= 8; i++) {
                const answer = row[`Antwort ${i}`];
                if (answer && String(answer).trim()) {
                    options.push(normalizeText(String(answer)));
                }
            }

            if (options.length === 0) continue;

            const correctAnswerIndices: number[] = [];
            for (let i = 1; i <= options.length; i++) {
                 if (String(row[`Antwort ${i} korrekt`]).toLowerCase() === 'richtig') {
                    correctAnswerIndices.push(i - 1);
                }
            }

            if (correctAnswerIndices.length === 0) continue;

            const question: Omit<Question, 'id' | 'created_at'> = {
                questionText,
                options,
                correctAnswerIndices,
                category: normalizeText(row['Kategorie'] || 'Allgemein'),
                type: String(row['Fragetyp']).startsWith('Single') ? 'Single' : 'Multi',
                verband: uploadVerband,
            };
            allParsedQuestions.push(question);
        }
        
        if (allParsedQuestions.length === 0) {
          throw new Error("Es konnten keine Fragen aus der CSV-Datei extrahiert werden. Überprüfen Sie das Spaltenformat (z.B. 'Frage', 'Antwort 1', 'Antwort 1 korrekt').");
        }
        
        await saveQuestions(allParsedQuestions);

        showSuccessMessage(`${allParsedQuestions.length} Fragen erfolgreich importiert!`);
        fetchQuestions();
        setFile(null);
        setUploadVerband('');

    } catch (err: any) {
        setError(err.message || "Ein unbekannter Fehler ist aufgetreten.");
    } finally {
        setIsImporting(false);
    }
  }, [file, fetchQuestions, uploadVerband]);

  // Learning Guide Upload Logic
  const handleGuideFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].type === 'application/pdf') {
        setGuideFile(e.target.files[0]);
        setError(null);
      } else {
        setError("Bitte wählen Sie eine PDF-Datei aus.");
        setGuideFile(null);
      }
    }
  };

  const handleUploadGuide = async () => {
    if (!guideFile) return;
    setIsUploadingGuide(true);
    setError(null);
    try {
      await uploadLearningGuide(guideFile);
      showSuccessMessage("Studienleitfaden erfolgreich hochgeladen!");
      setGuideFile(null);
    } catch (err: any) {
      setError(err.message || "Fehler beim Hochladen des Leitfadens.");
    } finally {
      setIsUploadingGuide(false);
    }
  };

  // Question Management Logic
  const handleOpenEditModal = (question?: Question) => {
    setEditingQuestion(question || { questionText: '', options: ['', '', '', ''], correctAnswerIndices: [0], category: 'Hundeführerschein', type: 'Single', verband: 'DZKB', imageUrl: '' });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingQuestion(null);
  };

  const handleSaveQuestion = async (questionToSave: Question) => {
    try {
      if (questionToSave.id) {
        await updateQuestion(questionToSave);
        showSuccessMessage('Frage erfolgreich aktualisiert.');
      } else {
        await createQuestion(questionToSave);
        showSuccessMessage('Frage erfolgreich erstellt.');
      }
      fetchQuestions();
      handleCloseEditModal();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteRequest = (question: Question) => {
    setQuestionToDelete(question);
  };

  const handleDeleteConfirmed = async () => {
    if (!questionToDelete) return;
    try {
      await deleteQuestion(questionToDelete.id!);
      showSuccessMessage('Frage erfolgreich gelöscht.');
      setQuestionToDelete(null);
      fetchQuestions();
    } catch (err: any) {
      setError(err.message);
      setQuestionToDelete(null);
    }
  };
  
  const handleBulkDeleteConfirmed = async () => {
    try {
      await deleteMultipleQuestions(Array.from(selectedQuestionIds));
      showSuccessMessage(`${selectedQuestionIds.size} Fragen erfolgreich gelöscht.`);
      setSelectedQuestionIds(new Set());
      setIsBulkDeleteModalOpen(false);
      fetchQuestions();
    } catch (err: any) {
      setError(err.message);
      setIsBulkDeleteModalOpen(false);
    }
  };

  const handleExportCSV = () => {
    const dataToExport = filteredAndSortedQuestions.map((q, index) => ({
      'Nr.': index + 1,
      Frage: q.questionText,
      Typ: formatQuestionType(q.type),
      Kategorie: q.category,
      Verband: q.verband,
      Antwort_A: q.options[0],
      Antwort_B: q.options[1],
      Antwort_C: q.options[2],
      Antwort_D: q.options[3],
      'Korrekte Indizes': q.correctAnswerIndices.join(', '),
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fragen");
    XLSX.writeFile(workbook, "fragen-export.csv", { bookType: "csv" });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Fragenkatalog - DZKB Bayern e.V.", 14, 22);
    
    autoTable(doc, {
        startY: 30,
        head: [['Nr.', 'Frage', 'Kategorie', 'Verband', 'Korrekte Antwort(en)']],
        body: filteredAndSortedQuestions.map((q, index) => [
            index + 1,
            q.questionText,
            q.category,
            q.verband,
            q.correctAnswerIndices.map(i => q.options[i]).join('; ')
        ]),
        styles: { overflow: 'linebreak', cellWidth: 'wrap', font: 'helvetica', fontSize: 8 },
        headStyles: { fillColor: [11, 121, 208] },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 30 },
            3: { cellWidth: 20 },
            4: { cellWidth: 40 }
        }
    });

    doc.save('fragen-katalog.pdf');
  };

  const categories = useMemo(() => ['all', ...Array.from(new Set(allQuestions.map(q => q.category).filter(Boolean)))], [allQuestions]) as string[];

  const requestSort = (key: SortableKeys) => {
      let direction: SortDirection = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const filteredAndSortedQuestions = useMemo(() => {
    let questions = allQuestions.filter(q => {
      const matchesCategory = categoryFilter === 'all' || q.category === categoryFilter;
      const matchesVerband = verbandFilter === 'all' || q.verband === verbandFilter;
      const matchesType = typeFilter === 'all' || formatQuestionType(q.type) === typeFilter;
      const matchesSearch = searchTerm === '' || 
        q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.options.some(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch && matchesVerband && matchesType;
    });

    if (sortConfig.key !== null) {
      questions.sort((a, b) => {
          const aValue = String(a[sortConfig.key!] ?? '').toLowerCase();
          const bValue = String(b[sortConfig.key!] ?? '').toLowerCase();
          
          if (sortConfig.direction === 'asc') {
              return aValue.localeCompare(bValue);
          } else {
              return bValue.localeCompare(aValue);
          }
      });
    }

    return questions;
  }, [allQuestions, searchTerm, categoryFilter, verbandFilter, typeFilter, sortConfig, formatQuestionType]);

  const handleSelectOne = (questionId: number) => {
    setSelectedQuestionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allFilteredIds = filteredAndSortedQuestions.map(q => q.id!);
      setSelectedQuestionIds(new Set(allFilteredIds));
    } else {
      setSelectedQuestionIds(new Set());
    }
  };

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const numSelected = selectedQuestionIds.size;
      const numFiltered = filteredAndSortedQuestions.length;
      selectAllCheckboxRef.current.checked = numSelected === numFiltered && numFiltered > 0;
      selectAllCheckboxRef.current.indeterminate = numSelected > 0 && numSelected < numFiltered;
    }
  }, [selectedQuestionIds, filteredAndSortedQuestions]);

  const handleSelectByCategory = () => {
    const ids = allQuestions.filter(q => q.category === categoryFilter).map(q => q.id!);
    setSelectedQuestionIds(prev => new Set([...prev, ...ids]));
    showSuccessMessage(`${ids.length} Fragen nach Kategorie '${categoryFilter}' zur Auswahl hinzugefügt.`);
  };

  const handleSelectByVerband = () => {
    const ids = allQuestions.filter(q => q.verband === verbandFilter).map(q => q.id!);
    setSelectedQuestionIds(prev => new Set([...prev, ...ids]));
    showSuccessMessage(`${ids.length} Fragen nach Verband '${verbandFilter}' zur Auswahl hinzugefügt.`);
  };

  const handleSelectByType = () => {
    const ids = allQuestions.filter(q => formatQuestionType(q.type) === typeFilter).map(q => q.id!);
    setSelectedQuestionIds(prev => new Set([...prev, ...ids]));
    showSuccessMessage(`${ids.length} Fragen vom Typ '${typeFilter}' zur Auswahl hinzugefügt.`);
  };

  const getTypeBadgeClasses = (type: string) => {
    const baseClasses = "text-xs font-medium px-2.5 py-0.5 rounded-full";
    switch (type) {
      case 'Single':
        return `${baseClasses} bg-blue-100 text-[#0B79D0]`;
      case 'Multi':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };


  const SortIndicator = ({ columnKey }: { columnKey: SortableKeys }) => {
    if (sortConfig.key !== columnKey) return <span className="ml-1 text-gray-300">↕</span>;
    if (sortConfig.direction === 'asc') return <span className="ml-1 text-[#0B79D0]">▲</span>;
    return <span className="ml-1 text-[#0B79D0]">▼</span>;
  };
  
  return (
    <div className="w-full min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-[#0B79D0] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <button onClick={onLogout} className="bg-white text-[#0B79D0] font-bold py-2 px-5 rounded-lg hover:bg-slate-100 transition-colors">
            Sign Out
          </button>
        </div>
      </header>

       {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setCurrentView('questions')}
                        className={`${
                            currentView === 'questions'
                                ? 'border-[#0B79D0] text-[#0B79D0]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center gap-2`}
                    >
                        <QuestionMarkIcon className="h-5 w-5" />
                        Fragen verwalten
                    </button>
                    <button
                        onClick={() => setCurrentView('accessCodes')}
                        className={`${
                            currentView === 'accessCodes'
                                ? 'border-[#0B79D0] text-[#0B79D0]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center gap-2`}
                    >
                        <KeyIcon className="h-5 w-5" />
                        Zugänge verwalten
                    </button>
                </nav>
            </div>
        </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {currentView === 'accessCodes' && <AccessCodeManager />}

        {currentView === 'questions' && (
          <>
            {/* Import/Export Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Lernmaterial verwalten */}
              <div className="bg-white p-6 rounded-xl shadow-lg lg:col-span-1">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Lernmaterial verwalten</h2>
                  <p className="text-sm text-gray-600 mb-4">Laden Sie hier den zentralen Studienleitfaden (PDF) für alle Studenten hoch. Eine neue Datei überschreibt die alte.</p>
                  <input type="file" onChange={handleGuideFileChange} accept=".pdf" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#0B79D0]/10 file:text-[#0B79D0] hover:file:bg-[#0B79D0]/20"/>
                  {guideFile && <button onClick={handleUploadGuide} disabled={isUploadingGuide} className="mt-4 w-full bg-green-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400">
                    {isUploadingGuide ? 'Wird hochgeladen...' : `"${guideFile.name}" hochladen`}
                  </button>}
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Daten Import</h2>
                <p className="text-sm text-gray-600 mb-4">Laden Sie eine CSV-Datei hoch und wählen Sie den zugehörigen Verband.</p>
                <div className="flex items-center space-x-4">
                  <input type="file" onChange={handleFileChange} accept=".csv" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#0B79D0]/10 file:text-[#0B79D0] hover:file:bg-[#0B79D0]/20"/>
                </div>
                 {file && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Verband für Import auswählen:</p>
                    <div className="flex gap-4">
                        {(['DZKB', 'ProHunde'] as const).map(v => (
                            <label key={v} className="flex items-center">
                                <input
                                    type="radio"
                                    name="uploadVerband"
                                    value={v}
                                    checked={uploadVerband === v}
                                    onChange={() => setUploadVerband(v)}
                                    className="h-4 w-4 text-[#0B79D0] focus:ring-[#0B79D0]"
                                />
                                <span className="ml-2 text-gray-700">{v}</span>
                            </label>
                        ))}
                    </div>
                  </div>
                )}
                {file && <button onClick={handleImportCSV} disabled={isImporting || !uploadVerband} className="mt-4 w-full bg-[#0B79D0] text-white font-bold py-2 px-5 rounded-lg hover:bg-[#0968b4] transition-colors disabled:bg-gray-400">
                  {isImporting ? 'Importiere...' : `"${file.name}" importieren`}
                </button>}
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                 <h2 className="text-xl font-bold text-gray-800 mb-4">Daten Export</h2>
                <p className="text-sm text-gray-600 mb-4">Wählen Sie ein Format, um den aktuellen Fragenkatalog zu exportieren.</p>
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <button onClick={handleExportCSV} className="flex-1 bg-slate-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-slate-700 transition-colors">
                    CSV Export
                    </button>
                    <button onClick={handleExportPDF} className="flex-1 bg-orange-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-orange-600 transition-colors">
                    PDF Katalog
                    </button>
                </div>
              </div>
            </div>

            {/* Question Management Table */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                <h2 className="text-xl font-bold text-gray-800">Fragen verwalten ({filteredAndSortedQuestions.length})</h2>
                <div className="flex items-center gap-4 w-full md:w-auto flex-wrap justify-end">
                  {selectedQuestionIds.size > 0 && (
                    <button onClick={() => setIsBulkDeleteModalOpen(true)} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap">
                      {selectedQuestionIds.size} Ausgewählte löschen
                    </button>
                  )}
                  <button onClick={() => handleOpenEditModal()} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap">+ Neue Frage</button>
                </div>
              </div>
              
               {/* Filters and Selection Tools */}
              <div className="border-t border-b border-gray-200 py-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Filters */}
                      <input type="text" placeholder="Suche..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="p-2 border rounded-lg w-full bg-white text-gray-900"/>
                      <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="p-2 border rounded-lg bg-white text-gray-900">
                        {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'Alle Kategorien' : cat}</option>)}
                      </select>
                      <select value={verbandFilter} onChange={e => setVerbandFilter(e.target.value as 'all' | Verband)} className="p-2 border rounded-lg bg-white text-gray-900">
                          <option value="all">Alle Verbände</option>
                          <option value="DZKB">DZKB</option>
                          <option value="ProHunde">ProHunde</option>
                      </select>
                      <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as 'all' | 'Single' | 'Multi')} className="p-2 border rounded-lg bg-white text-gray-900">
                          <option value="all">Alle Typen</option>
                          <option value="Single">Single</option>
                          <option value="Multi">Multi</option>
                      </select>
                  </div>
                  <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-600 mb-2">Markierungs-Werkzeuge</h3>
                      <div className="flex flex-wrap gap-2">
                          <button onClick={handleSelectByCategory} disabled={categoryFilter === 'all'} className="text-sm bg-blue-100 text-blue-800 font-medium py-1 px-3 rounded-full disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
                              Alle in Kategorie '{categoryFilter}' markieren
                          </button>
                          <button onClick={handleSelectByVerband} disabled={verbandFilter === 'all'} className="text-sm bg-blue-100 text-blue-800 font-medium py-1 px-3 rounded-full disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
                              Alle in Verband '{verbandFilter}' markieren
                          </button>
                           <button onClick={handleSelectByType} disabled={typeFilter === 'all'} className="text-sm bg-blue-100 text-blue-800 font-medium py-1 px-3 rounded-full disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
                              Alle vom Typ '{typeFilter}' markieren
                          </button>
                          {selectedQuestionIds.size > 0 && (
                            <button onClick={() => setSelectedQuestionIds(new Set())} className="text-sm bg-gray-200 text-gray-800 font-medium py-1 px-3 rounded-full">
                              Alle Markierungen aufheben
                            </button>
                          )}
                      </div>
                  </div>
              </div>
              
              {error && <p className="text-red-600 font-semibold mb-4">{error}</p>}
              {successMessage && <p className="text-green-600 font-semibold mb-4">{successMessage}</p>}

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-sm text-gray-600">
                      <th className="p-2 w-12">
                        <input
                          type="checkbox"
                          ref={selectAllCheckboxRef}
                          onChange={handleSelectAll}
                          className="h-4 w-4 rounded border-gray-300 text-[#0B79D0] focus:ring-[#0B79D0]"
                         />
                      </th>
                      <th className="p-2">Nr.</th>
                       <th className="p-2 cursor-pointer hover:bg-slate-100 select-none" onClick={() => requestSort('questionText')}>
                          <div className="flex items-center">Frage <SortIndicator columnKey="questionText" /></div>
                        </th>
                        <th className="p-2">Bild</th>
                        <th className="p-2 cursor-pointer hover:bg-slate-100 select-none" onClick={() => requestSort('type')}>
                          <div className="flex items-center">Typ <SortIndicator columnKey="type" /></div>
                        </th>
                        <th className="p-2 cursor-pointer hover:bg-slate-100 select-none" onClick={() => requestSort('category')}>
                          <div className="flex items-center">Kategorie <SortIndicator columnKey="category" /></div>
                        </th>
                        <th className="p-2 cursor-pointer hover:bg-slate-100 select-none" onClick={() => requestSort('verband')}>
                          <div className="flex items-center">Verband <SortIndicator columnKey="verband" /></div>
                        </th>
                      <th className="p-2">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingQuestions ? (<tr><td colSpan={8} className="text-center p-4">Lade Fragen...</td></tr>) 
                    : filteredAndSortedQuestions.map((q, index) => {
                      const formattedType = formatQuestionType(q.type);
                      return (
                        <tr key={q.id} className={`border-b text-gray-800 ${selectedQuestionIds.has(q.id!) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                          <td className="p-2">
                             <input
                                type="checkbox"
                                checked={selectedQuestionIds.has(q.id!)}
                                onChange={() => handleSelectOne(q.id!)}
                                className="h-4 w-4 rounded border-gray-300 text-[#0B79D0] focus:ring-[#0B79D0]"
                              />
                          </td>
                          <td className="p-2 text-center text-sm text-gray-500">{index + 1}</td>
                          <td className="p-2 max-w-md truncate">{q.questionText}</td>
                          <td className="p-2 text-center">{q.imageUrl && <ImageIcon className="w-5 h-5 text-slate-500" />}</td>
                          <td className="p-2">
                            <span className={getTypeBadgeClasses(formattedType)}>
                              {formattedType}
                            </span>
                          </td>
                          <td className="p-2">{q.category || 'N/A'}</td>
                          <td className="p-2">{q.verband || 'N/A'}</td>
                          <td className="p-2 flex gap-4">
                            <button onClick={() => handleOpenEditModal(q)} className="text-[#0B79D0] font-semibold">Edit</button>
                            <button onClick={() => handleDeleteRequest(q)} className="text-red-500 font-semibold">Delete</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {isEditModalOpen && editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleSaveQuestion}
        />
      )}

      {questionToDelete && (
        <DeleteConfirmationModal
            isOpen={!!questionToDelete}
            onClose={() => setQuestionToDelete(null)}
            onConfirm={handleDeleteConfirmed}
            question={questionToDelete}
        />
      )}

      {isBulkDeleteModalOpen && (
        <BulkDeleteConfirmationModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirm={handleBulkDeleteConfirmed}
          count={selectedQuestionIds.size}
        />
      )}
    </div>
  );
};


// Modal Component
interface EditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Question) => void;
  question: Question;
}

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({ isOpen, onClose, onSave, question }) => {
  const [editedQuestion, setEditedQuestion] = useState<Question>(question);

  useEffect(() => {
    setEditedQuestion(question);
  }, [question]);
  
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'type' && value === 'Single' && editedQuestion.correctAnswerIndices.length > 1) {
      // If switching to Single and multiple answers are selected, keep only the first one.
      setEditedQuestion(prev => ({...prev, [name]: value, correctAnswerIndices: [prev.correctAnswerIndices[0]] }));
    } else {
      setEditedQuestion(prev => ({...prev, [name]: value}));
    }
  };
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...editedQuestion.options];
    newOptions[index] = value;
    setEditedQuestion(prev => ({...prev, options: newOptions}));
  };
  
  const handleCorrectAnswerChange = (index: number) => {
    const isMulti = editedQuestion.type === 'Multi';
    if (isMulti) {
        const currentAnswers = editedQuestion.correctAnswerIndices || [];
        const newAnswers = currentAnswers.includes(index)
          ? currentAnswers.filter(i => i !== index)
          : [...currentAnswers, index].sort((a, b) => a - b);
        setEditedQuestion(prev => ({ ...prev, correctAnswerIndices: newAnswers }));
      } else {
        setEditedQuestion(prev => ({ ...prev, correctAnswerIndices: [index] }));
      }
  };

  if (!isOpen) return null;
  
  const isMulti = editedQuestion.type === 'Multi';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{editedQuestion.id ? 'Frage bearbeiten' : 'Neue Frage erstellen'}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fragetext</label>
            <textarea name="questionText" value={editedQuestion.questionText} onChange={handleTextChange} className="w-full p-2 border rounded mt-1 bg-gray-50 text-gray-900" rows={4}/>
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700">Bild-URL (Optional)</label>
              <input type="text" name="imageUrl" value={editedQuestion.imageUrl || ''} onChange={handleTextChange} placeholder="https://example.com/image.png" className="w-full p-2 border rounded mt-1 bg-gray-50 text-gray-900"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Kategorie</label>
              <input type="text" name="category" value={editedQuestion.category || ''} onChange={handleTextChange} className="w-full p-2 border rounded mt-1 bg-gray-50 text-gray-900"/>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Typ</label>
              <select name="type" value={editedQuestion.type || ''} onChange={handleTextChange} className="w-full p-2 border rounded mt-1 bg-white text-gray-900">
                  <option value="Single">Single</option>
                  <option value="Multi">Multi</option>
              </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Verband</label>
                <select name="verband" value={editedQuestion.verband || ''} onChange={handleTextChange} className="w-full p-2 border rounded mt-1 bg-white text-gray-900">
                    <option value="DZKB">DZKB</option>
                    <option value="ProHunde">ProHunde</option>
                </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Antworten (Korrekte Antwort/en markieren)</label>
            {editedQuestion.options.map((opt, index) => (
              <div key={index} className="flex items-center mt-2">
                <input 
                    type={isMulti ? "checkbox" : "radio"} 
                    name={`correctAnswer-${editedQuestion.id || 'new'}`}
                    checked={editedQuestion.correctAnswerIndices.includes(index)} 
                    onChange={() => handleCorrectAnswerChange(index)} 
                    className={`mr-3 h-5 w-5 ${isMulti ? 'rounded' : 'rounded-full'} text-[#0B79D0] focus:ring-[#0B79D0]`}
                />
                <input type="text" value={opt} onChange={(e) => handleOptionChange(index, e.target.value)} className="w-full p-2 border rounded bg-gray-50 text-gray-900"/>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button onClick={onClose} className="bg-slate-200 text-slate-700 font-bold py-2 px-5 rounded-lg hover:bg-slate-300">Abbrechen</button>
          <button onClick={() => onSave(editedQuestion)} disabled={editedQuestion.correctAnswerIndices.length === 0} className="bg-[#0B79D0] text-white font-bold py-2 px-5 rounded-lg hover:bg-[#0968b4] disabled:bg-gray-400">Speichern</button>
        </div>
      </div>
    </div>
  );
};

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    question: Question;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, question }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Löschen bestätigen</h2>
                <p className="text-gray-600 mb-6">Sind Sie sicher, dass Sie die folgende Frage endgültig löschen möchten?</p>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg mb-6">
                    <p className="font-semibold text-gray-700 truncate">{question.questionText}</p>
                </div>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="bg-slate-200 text-slate-700 font-bold py-2 px-5 rounded-lg hover:bg-slate-300">
                        Abbrechen
                    </button>
                    <button onClick={onConfirm} className="bg-red-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-red-700">
                        Löschen
                    </button>
                </div>
            </div>
        </div>
    );
};

interface BulkDeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    count: number;
}

const BulkDeleteConfirmationModal: React.FC<BulkDeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, count }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Löschen bestätigen</h2>
                <p className="text-gray-600 mb-6">Sind Sie sicher, dass Sie die <span className="font-bold">{count}</span> ausgewählten Fragen endgültig löschen möchten?</p>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="bg-slate-200 text-slate-700 font-bold py-2 px-5 rounded-lg hover:bg-slate-300">
                        Abbrechen
                    </button>
                    <button onClick={onConfirm} className="bg-red-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-red-700">
                        Löschen
                    </button>
                </div>
            </div>
        </div>
    );
};


export default AdminPanel;