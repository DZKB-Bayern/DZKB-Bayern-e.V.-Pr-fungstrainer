import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Question, AccessCode } from '../types';
import { SchulhundModuleType } from '../App';

const ENV = (import.meta as any)?.env ?? {};

export const SUPABASE_URL: string = ENV.VITE_SUPABASE_URL ?? '';
export const SUPABASE_KEY: string = ENV.VITE_SUPABASE_ANON_KEY ?? '';

const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const requireSupabase = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase nicht initialisiert (ENV fehlt)');
  }
  return supabase;
};

// ======================================================
// LOGIN / ACCESS CODES
// ======================================================

export const validateAccessCode = async (code: string): Promise<boolean> => {
  const { data, error } = await requireSupabase()
    .from('access_codes')
    .select('*')
    .eq('code', code)
    .single();

  if (error) return false;
  return !!data;
};

export const validateAdminCredentials = async (
  email: string,
  password: string
): Promise<boolean> => {
  const { data, error } = await requireSupabase()
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single();

  if (error) return false;
  return !!data;
};

// ======================================================
// QUESTIONS
// ======================================================

export const saveQuestions = async (
  questions: Omit<Question, 'id' | 'created_at'>[]
): Promise<void> => {
  const { error } = await requireSupabase().from('questions').insert(questions);
  if (error) throw error;
};

export const fetchRandomQuestions = async (
  count: number,
  schulhundModule: SchulhundModuleType
): Promise<Question[]> => {
  let query = requireSupabase().from('questions').select('*');

  if (schulhundModule === 'hundefuehrerschein') {
    query = query.not(
      'category',
      'eq',
      'Spezialthema: Schul-, Therapie- und Besuchshunde'
    );
  } else if (schulhundModule === 'schulhund') {
    query = query.eq(
      'category',
      'Spezialthema: Schul-, Therapie- und Besuchshunde'
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? [])
    .sort(() => 0.5 - Math.random())
    .slice(0, count) as Question[];
};

export const fetchQuestionsByCategory = async (
  category: string
): Promise<Question[]> => {
  const { data, error } = await requireSupabase()
    .from('questions')
    .select('*')
    .eq('category', category);

  if (error) throw error;
  return (data ?? []) as Question[];
};

export const fetchCategories = async (): Promise<string[]> => {
  const { data, error } = await requireSupabase()
    .from('questions')
    .select('category');

  if (error) throw error;
  return [...new Set((data ?? []).map((d: any) => d.category))].filter(Boolean);
};

export const fetchAllQuestions = async (): Promise<Question[]> => {
  const { data, error } = await requireSupabase()
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Question[];
};

export const deleteQuestion = async (id: string): Promise<void> => {
  const { error } = await requireSupabase()
    .from('questions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const updateQuestion = async (
  id: string,
  updates: Partial<Question>
): Promise<void> => {
  const { error } = await requireSupabase()
    .from('questions')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
};

// ======================================================
// ACCESS CODE MANAGER (wichtig für AccessCodeManager.tsx)
// ======================================================

/**
 * AccessCodeManager.tsx erwartet diese Exporte:
 * fetchAllAccessCodes, createAccessCode, updateAccessCode, deleteAccessCode
 */

export const fetchAllAccessCodes = async (): Promise<AccessCode[]> => {
  const { data, error } = await requireSupabase()
    .from('access_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as AccessCode[];
};

export const createAccessCode = async (
  newCode: Omit<AccessCode, 'id' | 'created_at'> | { code: string; is_active?: boolean }
): Promise<AccessCode> => {
  const { data, error } = await requireSupabase()
    .from('access_codes')
    .insert([newCode as any])
    .select('*')
    .single();

  if (error) throw error;
  return data as AccessCode;
};

export const updateAccessCode = async (
  id: string,
  updates: Partial<AccessCode>
): Promise<AccessCode> => {
  const { data, error } = await requireSupabase()
    .from('access_codes')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data as AccessCode;
};

export const deleteAccessCode = async (id: string): Promise<void> => {
  const { error } = await requireSupabase()
    .from('access_codes')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ======================================================
// ADMIN CHECK (falls genutzt)
// ======================================================

export const isAdmin = async (email: string): Promise<boolean> => {
  const { data, error } = await requireSupabase()
    .from('admin_users')
    .select('email')
    .eq('email', email)
    .single();

  if (error) return false;
  return !!data;
};
