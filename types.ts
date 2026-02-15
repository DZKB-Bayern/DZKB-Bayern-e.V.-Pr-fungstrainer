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
  email: string;
  is_active: boolean;

  // Versand-Tracking (optional in der UI, aber im DB-Schema vorhanden)
  sent_at?: string | null;
  send_status?: string | null;
  send_error?: string | null;
}
