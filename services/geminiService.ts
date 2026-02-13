import { GoogleGenAI, Type } from "@google/genai";
import { Question } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const DEFAULT_PROMPT_TEMPLATE = `Erstelle ein Multiple-Choice-Quiz auf Deutsch mit {numQuestions} Fragen zum Thema "{topic}". Jede Frage sollte 4 Antwortmöglichkeiten haben. Gib für jede Frage an, ob nur eine Antwort ('Single') oder mehrere Antworten ('Multi') korrekt sein können. Gib für jede Frage eine passende Kategorie an, die sich auf das Thema "{topic}" bezieht. Die Fragen sollten für Studenten geeignet sein, die sich auf eine Abschlussprüfung vorbereiten. Die Schwierigkeit sollte angemessen sein. Gib die Antwort ausschließlich im JSON-Format zurück, das dem bereitgestellten Schema entspricht, und stelle sicher, dass 'correctAnswerIndices' ein Array von Zahlen ist. Füge keine Markdown-Formatierung oder andere Texte außerhalb des JSON-Objekts hinzu.`;

const questionSchema = {
    type: Type.OBJECT,
    properties: {
      questionText: { type: Type.STRING },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        minItems: 4,
        maxItems: 4,
      },
      correctAnswerIndices: { 
        type: Type.ARRAY,
        items: { type: Type.INTEGER } 
      },
      category: { type: Type.STRING },
      type: { type: Type.STRING, enum: ['Single', 'Multi'] },
    },
    required: ['questionText', 'options', 'correctAnswerIndices', 'category', 'type'],
};

const responseSchema = {
    type: Type.ARRAY,
    items: questionSchema,
};

export const generateQuiz = async (topic: string, numQuestions: number): Promise<Question[]> => {
  const promptTemplate = localStorage.getItem('admin_prompt_template') || DEFAULT_PROMPT_TEMPLATE;
  const prompt = promptTemplate
    .replace('{numQuestions}', String(numQuestions))
    .replace('{topic}', topic);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    // FIX: Add a check for response.text to prevent crash on undefined.
    const jsonText = response.text?.trim();
    if (!jsonText) {
      throw new Error("API hat ein leeres oder ungültiges Quiz zurückgegeben.");
    }
    const quizData = JSON.parse(jsonText);
    
    if (!Array.isArray(quizData) || quizData.length === 0) {
        throw new Error("API hat ein leeres oder ungültiges Quiz zurückgegeben.");
    }

    return quizData as Question[];
  } catch (error) {
    console.error("Fehler bei der Gemini-API-Anfrage:", error);
    throw new Error("Die Quizfragen konnten nicht generiert werden.");
  }
};

const structureSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING },
      content: { type: Type.STRING },
    },
    required: ['category', 'content'],
  },
};

export const structureAndExtractQuestions = async (
  textContent: string, 
  onProgress: (message: string) => void
): Promise<Omit<Question, 'explanation'>[]> => {
  
  // STEP 1: Structure the document
  onProgress('Struktur wird analysiert...');
  const structuringPrompt = `
    Analysiere das folgende Dokument. Identifiziere die Hauptabschnitte basierend auf Überschriften, Nummerierungen oder logischen thematischen Pausen.
    Gib für jeden identifizierten Abschnitt die Überschrift als 'category' und den dazugehörigen Text als 'content' zurück.
    Wenn keine klaren Überschriften vorhanden sind, aber der Text thematisch gruppiert erscheint, fasse ihn unter der Kategorie 'Allgemein' zusammen.
    Fasse den gesamten Inhalt des Dokuments in diesen Abschnitten zusammen. Gib das Ergebnis ausschließlich als JSON-Array zurück, das dem Schema entspricht.
    
    Dokumententext:
    ---
    ${textContent}
    ---
  `;

  let structuredData: { category: string; content: string }[];
  try {
    const structureResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: structuringPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: structureSchema,
      },
    });
    // FIX: Add a check for structureResponse.text to prevent crash on undefined.
    const structureResponseText = structureResponse.text?.trim();
    if (!structureResponseText) {
      throw new Error("Konnte keine Struktur im Dokument erkennen.");
    }
    structuredData = JSON.parse(structureResponseText);
    if (!Array.isArray(structuredData) || structuredData.length === 0) {
      throw new Error("Konnte keine Struktur im Dokument erkennen.");
    }
  } catch (error) {
    console.error("Fehler bei der Strukturierungs-API:", error);
    throw new Error("Die Dokumentenstruktur konnte nicht analysiert werden. Überprüfen Sie das Dateiformat.");
  }

  // STEP 2: Extract questions from each structured part
  onProgress(`Extrahiere Fragen aus ${structuredData.length} Abschnitten...`);
  
  const extractionPromises = structuredData.map(async (section) => {
    const extractionPrompt = `
      Der folgende Text stammt aus der Kategorie '${section.category}'.
      Analysiere den Text und extrahiere daraus ALLE Quizfragen. Jede Frage muss einen Fragetext, vier Antwortmöglichkeiten, eine oder mehrere korrekte Antworten und einen Typ haben.
      - Die Kategorie für ALLE extrahierten Fragen aus diesem Text muss '${section.category}' sein.
      - Bestimme den Typ als 'Single', wenn nur eine Antwort richtig ist, oder 'Multi', wenn mehrere Antworten richtig sein könnten.
      - Die korrekte Antwort kann als Text oder Buchstabe (A, B, C, D) angegeben sein; wandle sie in ein Array von korrekten Indizes (beginnend bei 0) um.
      - Gib das Ergebnis ausschließlich im JSON-Format zurück, das dem Schema entspricht. Wenn keine Fragen im Text gefunden werden, gib ein leeres Array zurück.

      Text aus Kategorie '${section.category}':
      ---
      ${section.content}
      ---
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: extractionPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });
      // FIX: Add a check for response.text to prevent crash on undefined.
      const responseText = response.text?.trim();
      if (!responseText) {
          return []; // Return empty array for this section if response is empty
      }
      const quizData = JSON.parse(responseText);
      // Ensure category is always set correctly, overriding any AI mistakes
      return (quizData as Question[]).map(q => ({ ...q, category: section.category }));
    } catch (error) {
      console.warn(`Fehler beim Extrahieren von Fragen aus der Kategorie '${section.category}':`, error);
      return []; // Return empty array for the failed section to not break the whole process
    }
  });

  const results = await Promise.all(extractionPromises);
  onProgress('Alle Abschnitte verarbeitet.');
  return results.flat(); // Flatten the array of arrays into a single array of questions
};