/*
 * Domain types shared by the mock data layer and the UI.
 * When Supabase is added, these map 1:1 onto database tables.
 */

export type Role = "staff" | "student";

/** The four kinds of content staff can create / upload. */
export type ContentType = "quiz" | "practical" | "written" | "other";

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  quiz: "Quiz (MCQ)",
  practical: "Lab Practical",
  written: "Written / Short Answer",
  other: "Other",
};

export interface Question {
  id: string;
  text: string;
  options: string[]; // exactly 4 for MCQ
  correctIndex: number; // 0-3
  marks: number;
}

export interface Attachment {
  name: string;
  size: string;
}

export interface LibraryItem {
  id: string;
  type: ContentType;
  title: string;
  subject: string;
  topic: string;
  description: string;
  questions: Question[]; // quiz only
  instructions: string; // practical / written
  inputOutput: string; // practical: sample input / output
  marks: number;
  wordLimit?: number; // written only
  attachments: Attachment[];
  createdAt: string; // ISO timestamp
  ownerId: string;
  ownerName: string;
  /** true when the item was uploaded by another staff member (Shared Library) */
  shared: boolean;
}

/** Payload used by the create / edit forms. */
export interface LibraryItemInput {
  type: ContentType;
  title: string;
  subject: string;
  topic: string;
  description: string;
  questions: Question[];
  instructions: string;
  inputOutput: string;
  marks: number;
  wordLimit?: number;
  attachments: Attachment[];
}

export interface Exam {
  id: string;
  itemId: string;
  title: string;
  subject: string;
  type: ContentType;
  durationMinutes: number;
  batch: string;
  /** ISO timestamp of the scheduled start — Start Exam unlocks at this time */
  startAt: string;
  shuffleQuestions: boolean;
  /** 0 = terminate on first violation, 1 = allow one warning */
  maxWarnings: number;
  createdBy: string;
  totalMarks: number;
  questions: Question[]; // snapshot of quiz questions at scheduling time
  description?: string | undefined; // written / practical / other: problem statement
  instructions?: string | undefined; // practical: aim & instructions
  wordLimit?: number | undefined; // written only
}

export interface ExamInput {
  itemId: string;
  examType: ContentType;
  durationMinutes: number;
  batch: string;
  startAt: string; // ISO timestamp
  shuffleQuestions: boolean;
  maxWarnings: number;
}

export type AttemptStatus = "active" | "submitted" | "terminated";

export type AnswerValue = number | string;

export interface Attempt {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  status: AttemptStatus;
  violations: number;
  startedAt: string;
  endedAt?: string;
  terminateReason?: string;
  score?: number | undefined;
  totalMarks?: number | undefined;
  answers: Record<string, AnswerValue>;
}

export interface ExamWithAttempt {
  exam: Exam;
  attempt: Attempt | null;
}

export interface AttemptWithExam {
  attempt: Attempt;
  exam: Exam;
}
