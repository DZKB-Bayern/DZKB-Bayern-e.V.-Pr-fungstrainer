export interface Question {
  id?: number;
  created_at?: string;
  questionText: string;
  options: string[];
  correctAnswerIndices: number[];
  category?: string | null;
  type?: string | null;
  verband?: 'DZKB' | 'ProHunde' | null;
  imageUrl?: string | null;
}

export interface AccessCode {
  id: number;
  created_at: string;
  code: string;
  student_name: string | null;
  is_active: boolean;
}
