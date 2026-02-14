import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Question, AccessCode } from '../types';
import { SchulhundModuleType } from '../App';

// ===================================================================================
// Liest die Supabase-Zugangsdaten aus den Umgebungsvariablen (Vite: import.meta.env).
// Wichtig: import.meta.env existiert nur in einer echten Vite-Umgebung.
// ===================================================================================
const ENV = (import.meta as any)?.env ?? {};

export const SUPABASE_URL: string = ENV.VITE_SUPABASE_URL ?? '';
export const SUPABASE_KEY: string = ENV.VITE_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    'Supabase URL/Key sind nicht konfiguriert. Setze VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in Vercel (Environment Variables) und deploye neu.'
  );
}

// Supabase-Client nur erstellen, wenn URL & Key vorhanden sind (sonst null, damit die App nicht sofort abstürzt).
const supabase: SupabaseClient | null = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

/**
 * Speichert ein Array von Fragen in der Supabase-Datenbank.
 * @param questions Ein Array von Question-Objekten.
 */
export const saveQuestions = async (questions: Omit<Question, 'id' | 'created_at'>[]): Promise<void> => {
  if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

  const { error } = await supabase
    .from('questions')
    .insert(questions);

  if (error) {
    console.error('Fehler beim Speichern der Fragen in Supabase:', error);
    throw new Error('Fragen konnten nicht in der Datenbank gespeichert werden.');
  }
};


/**
 * Holt eine zufällige Anzahl von Fragen aus der Supabase-Datenbank.
 * @param count Die Anzahl der zufälligen Fragen, die abgerufen werden sollen.
 * @returns Ein Promise, das zu einem Array von Question-Objekten aufgelöst wird.
 */
export const fetchRandomQuestions = async (count: number, schulhundModule: SchulhundModuleType): Promise<Question[]> => {
  if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

  let query = supabase
    .from('questions')
    .select('*');

  if (schulhundModule === 'hundefuehrerschein') {
    query = query.not('category', 'eq', 'Spezialthema: Schul-, Therapie- und Besuchshunde');
  } else if (schulhundModule === 'schulhund') {
    query = query.eq('category', 'Spezialthema: Schul-, Therapie- und Besuchshunde');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fehler beim Abrufen der Fragen von Supabase:', error);
    throw new Error('Fragen konnten nicht von der Datenbank geladen werden.');
  }

  const shuffled = (data ?? []).sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count) as Question[];
};


/**
 * Holt Fragen basierend auf einer Kategorie aus der Supabase-Datenbank.
 * @param category Die Kategorie der Fragen.
 * @returns Ein Promise, das zu einem Array von Question-Objekten aufgelöst wird.
 */
export const fetchQuestionsByCategory = async (category: string): Promise<Question[]> => {
  if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('category', category);

  if (error) {
    console.error('Fehler beim Abrufen der Fragen von Supabase:', error);
    throw new Error('Fragen konnten nicht von der Datenbank geladen werden.');
  }

  return (data ?? []) as Question[];
};


/**
 * Holt alle Kategorien aus der Supabase-Datenbank.
 * @returns Ein Promise, das zu einem Array von Kategorie-Strings aufgelöst wird.
 */
export const fetchCategories = async (): Promise<string[]> => {
  if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

  const { data, error } = await supabase
    .from('questions')
    .select('category');

  if (error) {
    console.error('Fehler beim Abrufen der Kategorien von Supabase:', error);
    throw new Error('Kategorien konnten nicht von der Datenbank geladen werden.');
  }

  const categories = [...new Set((data ?? []).map((item: any) => item.category))].filter(Boolean);
  return categories;
};


/**
 * Löscht alle Fragen aus der Supabase-Datenbank.
 */
export const deleteAllQuestions = async (): Promise<void> => {
  if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

  const { error } = await supabase
    .from('questions')
    .delete()
    .neq('id', 0);

  if (error) {
    console.error('Fehler beim Löschen der Fragen in Supabase:', error);
    throw new Error('Fragen konnten nicht aus der Datenbank gelöscht werden.');
  }
};

/**
 * Holt alle Fragen aus der Supabase-Datenbank.
 * @returns Ein Promise, das zu einem Array von Question-Objekten aufgelöst wird.
 */
export const fetchAllQuestions = async (): Promise<Question[]> => {
  if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fehler beim Abrufen aller Fragen von Supabase:', error);
    throw new Error('Fragen konnten nicht von der Datenbank geladen werden.');
  }

  return (data ?? []) as Question[];
};

/**
 * Löscht eine einzelne Frage aus der Supabase-Datenbank.
 * @param id Die ID der zu löschenden Frage.
 */
export const deleteQuestion = async (id: string): Promise<void> => {
  if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Löschen der Frage in Supabase:', error);
    throw new Error('Die Frage konnte nicht gelöscht werden.');
  }
};

/**
 * Aktualisiert eine einzelne Frage in der Supabase-Datenbank.
 * @param id Die ID der zu aktualisierenden Frage.
 * @param updates Ein Objekt mit den zu aktualisierenden Feldern.
 */
export const updateQuestion = async (id: string, updates: Partial<Question>): Promise<void> => {
  if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

  const { error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Aktualisieren der Frage in Supabase:', error);
    throw new Error('Die Frage konnte nicht aktualisiert werden.');
  }
};

/**
 * Überprüft einen Zugangscode.
 * @param code Der zu überprüfende Zugangscode.
 * @returns Ein Promise, das zu einem boolean aufgelöst wird.
 */
export const verifyAccessCode = async (code: string): Promise<boolean> => {
  if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

  const { data, error } = await supabase
    .from('access_codes')
    .select('*')
    .eq('code', code)
    .single();

  if (error) {
    console.error('Fehler beim Überprüfen des Zugangscodes:', error);
    return false;
  }

  return !!data;
};

/**
 * Alias für ältere Komponenten/Imports:
 * components/Login.tsx importiert validateAccessCode.
 */
export const validateAccessCode = async (code: string): Promise<boolean> => {
  return verifyAccessCode(code);
};

/**
 * Holt alle Zugangscodes aus der Supabase-Datenbank.
 * @returns Ein Promise, das zu einem Array von AccessCode-Objekten aufgelöst wird.
 */
export const fetchAccessCodes = async (): Promise<AccessCode[]> => {
  if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

  const { data, error } = await supabase
    .from('access_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fehler beim Abrufen der Zugangscodes:', error);
    throw new Error('Zugangscodes konnten nicht von der Datenbank geladen werden.');
  }

  return (data ?? []) as AccessCode[];
};

/**
 * Speichert einen neuen Zugangscode in der Supabase-Datenbank.
 * @param code Der zu speichernde Zugangscode.
 */
export const saveAccessCode = async (code: string): Promise<void> => {
  if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

  const { error } = await supabase
    .from('access_codes')
    .insert([{ code }]);

  if (error) {
    console.error('Fehler beim Speichern des Zugangscodes in Supabase:', error);
    throw new Error('Zugangscode konnte nicht gespeichert werden.');
  }
};

/**
 * Löscht einen Zugangscode aus der Supabase-Datenbank.
 * @param id Die ID des zu löschenden Zugangscodes.
 */
export const deleteAccessCode = async (id: string): Promise<void> => {
  if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

  const { error } = await supabase
    .from('access_codes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Fehler beim Löschen des Zugangscodes in Supabase:', error);
    throw new Error('Zugangscode konnte nicht gelöscht werden.');
  }
};

/**
 * Überprüft, ob eine E-Mail-Adresse ein Admin ist.
 * @param email Die zu überprüfende E-Mail-Adresse.
 * @returns Ein Promise, das zu einem boolean aufgelöst wird.
 */
export const isAdmin = async (email: string): Promise<boolean> => {
  if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

  const { data, error } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', email)
    .single();

  if (error) {
    console.error('Fehler beim Überprüfen des Admin-Status:', error);
    return false;
  }

  return !!data;
};
