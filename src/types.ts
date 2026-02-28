export interface User {
  id: number;
  email: string;
  name: string;
  role: 'parent' | 'student';
  parentId?: number;
  gradeLevel?: string;
}

export interface Lesson {
  id: number;
  title: string;
  subject: string;
  grade_level: string;
  content: string;
  quiz_json: any;
  created_at: string;
}

export interface ProgressRecord {
  id: number;
  student_id: number;
  lesson_id: number;
  score: number;
  completed_at: string;
  title: string;
  subject: string;
}
