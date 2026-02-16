
import { createClient } from '@supabase/supabase-js';
import { Question, AccessCode } from '../types';

// ===================================================================================
// WICHTIGER HINWEIS: Ersetzen Sie die folgenden zwei Zeilen durch Ihre
// tatsächlichen Supabase-Projektdaten. Sie finden diese in Ihrem Supabase-Dashboard
// unter "Project Settings" -> "API".
// ===================================================================================
export const SUPABASE_URL = 'https://prfvdhjbyhvpovusdlzk.supabase.co'; // <-- HIER IHRE URL EINFÜGEN
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByZnZkaGpieWh2cG92dXNkbHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzU1NzMsImV4cCI6MjA4NjU1MTU3M30.bW07S4k8t0J4Gr0R5Zbe3BZpEmNL0a_CSaZGfTMeaZY'; // <-- HIER IHREN PUBLIC ANON KEY EINFÜGEN


if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('IHRE_SUPABASE_URL')) {
  console.error("Supabase URL und Key sind nicht konfiguriert. Bitte ersetzen Sie die Platzhalter in services/supabaseService.ts.");
  // Wir werfen hier keinen Fehler, damit die App nicht abstürzt, aber die Konsole wird eine klare Meldung anzeigen.
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
export const fetchRandomQuestions = async (count: number): Promise<Question[]> => {
    if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

    const { data, error } = await supabase
        .from('questions')
        .select('*');

    if (error) {
        console.error('Fehler beim Abrufen der Fragen aus Supabase:', error);
        throw new Error('Fragen konnten nicht aus der Datenbank geladen werden.');
    }

    if (!data || data.length === 0) {
        throw new Error(`Keine Fragen in der Datenbank gefunden, die den Kriterien entsprechen.`);
    }
    
    // Mische das Array und wähle die ersten 'count' Elemente aus.
    const shuffled = data.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count) as Question[];
};

/**
 * Holt alle Fragen aus der Datenbank.
 */
export const fetchAllQuestions = async (): Promise<Question[]> => {
    if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('Fehler beim Abrufen aller Fragen:', error);
        throw new Error('Fragen konnten nicht geladen werden.');
    }
    return data as Question[];
};

/**
 * Erstellt eine neue Frage in der Datenbank.
 */
export const createQuestion = async (question: Omit<Question, 'id' | 'created_at'>): Promise<Question> => {
    if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

    const { data, error } = await supabase
        .from('questions')
        .insert([question])
        .select()
        .single();

    if (error) {
        console.error('Fehler beim Erstellen der Frage:', error);
        throw new Error('Frage konnte nicht erstellt werden.');
    }
    return data as Question;
};


/**
 * Aktualisiert eine bestehende Frage in der Datenbank.
 */
export const updateQuestion = async (question: Question): Promise<Question> => {
    if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");
    if (!question.id) throw new Error("Frage benötigt eine ID zum Aktualisieren.");

    const { id, created_at, ...updateData } = question;

    const { data, error } = await supabase
        .from('questions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Fehler beim Aktualisieren der Frage:', error);
        throw new Error('Frage konnte nicht aktualisiert werden.');
    }
    return data as Question;
};

/**
 * Löscht eine Frage aus der Datenbank.
 */
export const deleteQuestion = async (id: number): Promise<void> => {
    if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

    const { data, error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id)
        .select();

    if (error) {
        console.error('Fehler beim Löschen der Frage:', error);
        throw new Error('Frage konnte nicht gelöscht werden.');
    }

    // Wenn RLS den Löschvorgang verhindert, ist der Fehler 'null', aber es werden keine Daten zurückgegeben.
    // Wir prüfen, ob der Löschvorgang tatsächlich erfolgreich war.
    if (!data || data.length === 0) {
      console.error('Löschen der Frage fehlgeschlagen: Zeile nicht gefunden oder keine Berechtigung.');
      throw new Error('Frage konnte nicht gelöscht werden. Möglicherweise fehlt die Berechtigung oder die Frage existiert nicht mehr.');
    }
};

/**
 * Löscht mehrere Fragen auf einmal aus der Datenbank.
 * @param ids Ein Array von IDs der zu löschenden Fragen.
 */
export const deleteMultipleQuestions = async (ids: number[]): Promise<void> => {
    if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");
    if (ids.length === 0) return;

    const { error } = await supabase
        .from('questions')
        .delete()
        .in('id', ids);

    if (error) {
        console.error('Fehler beim Löschen mehrerer Fragen:', error);
        throw new Error('Die ausgewählten Fragen konnten nicht gelöscht werden.');
    }
};


// === ACCESS CODE FUNCTIONS ===

/**
 * Validiert, ob ein Zugangscode existiert und aktiv ist.
 * @param code Der zu validierende Zugangscode.
 * @returns Ein Promise, das bei Gültigkeit zu true, andernfalls zu false aufgelöst wird.
 */
export const validateAccessCode = async (code: string): Promise<boolean> => {
  if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

  // Ablaufregel: Zugangscode ist maximal 12 Monate ab Erstellung gültig
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);

  const { data, error } = await supabase
    .from('access_codes')
    .select('id')
    .eq('code', code)
    .eq('is_active', true)
    .gte('created_at', cutoff.toISOString())
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: "Query returned no rows", was für ungültige Codes erwartet wird
    console.error('Fehler bei der Validierung des Zugangscodes:', error);
    return false;
  }

  return !!data;
};

/**
 * Holt alle Zugangscodes aus der Datenbank.
 */
export const fetchAllAccessCodes = async (): Promise<AccessCode[]> => {
    if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

    const { data, error } = await supabase
        .from('access_codes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Fehler beim Abrufen aller Zugangscodes:', error);
        throw new Error('Zugangscodes konnten nicht geladen werden.');
    }
    return data as AccessCode[];
};

/**
 * Erstellt einen neuen Zugangscode in der Datenbank.
 */
export const createAccessCode = async (code: string, studentName?: string | null): Promise<AccessCode> => {
    if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

    const { data, error } = await supabase
        .from('access_codes')
        .insert([{ code, student_name: studentName, is_active: true }])
        .select()
        .single();

    if (error) {
        console.error('Fehler beim Erstellen des Zugangscodes:', error);
        throw new Error('Zugangscode konnte nicht erstellt werden.');
    }
    return data as AccessCode;
};

/**
 * Aktualisiert einen bestehenden Zugangscode (z.B. den Aktivierungsstatus oder den Namen).
 */
export const updateAccessCode = async (id: number, updates: Partial<Omit<AccessCode, 'id' | 'created_at' | 'code'>>): Promise<AccessCode> => {
    if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

    const { data, error } = await supabase
        .from('access_codes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Fehler beim Aktualisieren des Zugangscodes:', error);
        throw new Error('Zugangscode konnte nicht aktualisiert werden.');
    }
    return data as AccessCode;
};

/**
 * Löscht einen Zugangscode aus der Datenbank.
 */
export const deleteAccessCode = async (id: number): Promise<void> => {
    if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

    const { error } = await supabase
        .from('access_codes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Fehler beim Löschen des Zugangscodes:', error);
        throw new Error('Zugangscode konnte nicht gelöscht werden.');
    }
};

// === ADMIN AUTHENTICATION ===

/**
 * Validiert die Anmeldeinformationen des Administrators gegen die Datenbank.
 * @param username Der vom Administrator eingegebene Benutzername.
 * @param password Das vom Administrator eingegebene Passwort.
 * @returns Ein Promise, das bei Gültigkeit zu true, andernfalls zu false aufgelöst wird.
 */
export const validateAdminCredentials = async (username: string, password: string): Promise<boolean> => {
  if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('username', username)
    .eq('password', password) // Direkter Vergleich. Für Produktionsumgebungen wird Hashing empfohlen.
    .single();

  if (error && error.code !== 'PGRST116') { // Ignoriere "no rows" Fehler
    console.error('Fehler bei der Admin-Validierung:', error);
    return false;
  }

  return !!data;
};


// === LEARNING MATERIALS ===

/**
 * Lädt den Studienleitfaden (PDF) in den Supabase Storage hoch.
 * Überschreibt eine vorhandene Datei, um sicherzustellen, dass immer nur die neueste Version verfügbar ist.
 * @param file Die PDF-Datei, die hochgeladen werden soll.
 */

export const createSignedLearningGuideUrl = async (): Promise<{ signedUrl: string | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .storage
      .from('learning_materials')
      .createSignedUrl('studienleitfaden.pdf', 60);

    if (error) {
      return { signedUrl: null, error: new Error(error.message) };
    }

    return { signedUrl: data?.signedUrl || null, error: null };
  } catch (e: any) {
    return { signedUrl: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
};

export const uploadLearningGuide = async (file: File): Promise<void> => {
  if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");

  const { data, error } = await supabase.storage
    .from('learning_materials')
    .upload('studienleitfaden.pdf', file, {
      cacheControl: '0',
      upsert: true, // Überschreibt die Datei, falls sie bereits existiert
    });

  if (error) {
    console.error('Fehler beim Hochladen des Studienleitfadens:', error);
    throw new Error('Der Studienleitfaden konnte nicht hochgeladen werden.');
  }
};

export const requestAccessCodeByEmail = async (email: string): Promise<boolean> => {
  if (!supabase) throw new Error("Supabase-Client nicht initialisiert.");
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail) return true;
  try {
    await supabase.functions.invoke("request-access-code", {
      body: { email: normalizedEmail },
    });
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};
