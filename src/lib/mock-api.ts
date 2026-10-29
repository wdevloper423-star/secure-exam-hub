/*
 * Data access layer (mock, no backend yet).
 *
 * Every function is async and shaped like a future Supabase query, so the UI
 * never touches raw in-memory rows — only these functions. When the backend
 * lands, each body becomes a `supabase.from(...)` call (with RLS scoping the
 * same owner / student filters this file already applies).
 */
import type {
  AnswerValue,
  Attempt,
  AttemptWithExam,
  Exam,
  ExamInput,
  ExamWithAttempt,
  LibraryItem,
  LibraryItemInput,
  Question,
} from "./types";

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
/** ISO timestamp offset by N minutes from "now" (negative = past). */
const iso = (offsetMinutes: number) =>
  new Date(Date.now() + offsetMinutes * 60_000).toISOString();

// Current signed-in demo user. Matches the ids in lib/auth.tsx mock users.
export const CURRENT_STAFF = { id: "staff-1", name: "Dr. Ananya Sharma" };
export const CURRENT_STUDENT = { id: "student-1", name: "Aditya Verma", batch: "CS-3A" };

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const mkQ = (id: string, text: string, options: string[], correctIndex: number, marks = 1): Question => ({
  id,
  text,
  options,
  correctIndex,
  marks,
});

const DBMS_QUESTIONS: Question[] = [
  mkQ("q_dbms_1", "Which normal form requires all attributes to hold atomic (indivisible) values?", ["1NF", "2NF", "3NF", "BCNF"], 0),
  mkQ("q_dbms_2", "A relation is in BCNF if, for every non-trivial functional dependency X → Y, X is a…", ["Candidate key only", "Superkey", "Foreign key", "Prime attribute"], 1),
  mkQ("q_dbms_3", "Which normal form eliminates transitive dependencies?", ["1NF", "2NF", "3NF", "4NF"], 2),
  mkQ("q_dbms_4", "Which of the following is NOT a desirable property of a decomposition?", ["Lossless join", "Dependency preservation", "Increased redundancy", "Non-additive join"], 2, 2),
  mkQ("q_dbms_5", "Partial dependencies are removed by converting a table into…", ["2NF", "3NF", "BCNF", "4NF"], 0),
];

const DSA_QUESTIONS: Question[] = [
  mkQ("q_dsa_1", "What is the worst-case time complexity of Quick Sort?", ["O(n log n)", "O(n²)", "O(n)", "O(log n)"], 1),
  mkQ("q_dsa_2", "Which sorting algorithm is stable and guarantees O(n log n) in all cases?", ["Quick Sort", "Merge Sort", "Heap Sort", "Selection Sort"], 1),
  mkQ("q_dsa_3", "With an early-exit optimisation, the best case of Bubble Sort on a sorted array is…", ["O(n)", "O(n²)", "O(n log n)", "O(1)"], 0),
];

const MATH_QUESTIONS: Question[] = [
  mkQ("q_math_1", "If |A| = 3 and |B| = 4, how many relations exist from A to B?", ["12", "7", "81", "64"], 0),
  mkQ("q_math_2", "A relation that is reflexive, symmetric and transitive is called…", ["An equivalence relation", "A partial order", "A total order", "A function"], 0),
];

let libraryRows: LibraryItem[] = [
  {
    id: "li_dbms_quiz",
    type: "quiz",
    title: "Unit Test 1 — Normalization",
    subject: "Database Management Systems",
    topic: "Normalization & Functional Dependencies",
    description: "MCQ quiz covering 1NF through BCNF.",
    questions: DBMS_QUESTIONS,
    instructions: "",
    inputOutput: "",
    marks: DBMS_QUESTIONS.reduce((s, q) => s + q.marks, 0),
    attachments: [],
    createdAt: iso(-2 * 1440),
    ownerId: CURRENT_STAFF.id,
    ownerName: CURRENT_STAFF.name,
    shared: false,
  },
  {
    id: "li_shell_lab",
    type: "practical",
    title: "Shell Scripting — File Operations",
    subject: "Operating Systems Lab",
    topic: "Bash Scripting",
    description: "Hands-on lab to practise file traversal and reporting with bash.",
    questions: [],
    instructions:
      "Aim: Write a bash script `report.sh` that walks a given directory and prints: (1) file count grouped by extension, (2) the largest file, (3) files modified in the last 24 hours.",
    inputOutput:
      "Input: directory path as $1.\nOutput: table of extension → count, path of largest file, list of recently modified files.",
    marks: 10,
    attachments: [{ name: "sample-directory.zip", size: "314 KB" }],
    createdAt: iso(-3 * 1440),
    ownerId: CURRENT_STAFF.id,
    ownerName: CURRENT_STAFF.name,
    shared: false,
  },
  {
    id: "li_ada_written",
    type: "written",
    title: "Class Test — Greedy Algorithms",
    subject: "Design & Analysis of Algorithms",
    topic: "Greedy Techniques",
    description:
      "Q1. Prove the correctness of Huffman coding.\nQ2. Give one problem where a greedy strategy fails and explain why.",
    questions: [],
    instructions: "Answer both questions. Show all working.",
    inputOutput: "",
    marks: 10,
    wordLimit: 150,
    attachments: [],
    createdAt: iso(-9 * 1440),
    ownerId: CURRENT_STAFF.id,
    ownerName: CURRENT_STAFF.name,
    shared: false,
  },
  {
    id: "li_er_notes",
    type: "other",
    title: "Reference Notes — ER Modeling",
    subject: "Database Management Systems",
    topic: "Entity-Relationship Modeling",
    description: "Compiled notes and solved problems for ER modeling, shared with the class.",
    questions: [],
    instructions: "",
    inputOutput: "",
    marks: 0,
    attachments: [{ name: "er-modeling-notes.pdf", size: "1.2 MB" }],
    createdAt: iso(-5 * 1440),
    ownerId: CURRENT_STAFF.id,
    ownerName: CURRENT_STAFF.name,
    shared: false,
  },
  {
    id: "li_dsa_quiz",
    type: "quiz",
    title: "Sorting Algorithms Quiz",
    subject: "Data Structures & Algorithms",
    topic: "Sorting",
    description: "Quick check on complexity and stability of classic sorts.",
    questions: DSA_QUESTIONS,
    instructions: "",
    inputOutput: "",
    marks: DSA_QUESTIONS.reduce((s, q) => s + q.marks, 0),
    attachments: [],
    createdAt: iso(-12 * 1440),
    ownerId: CURRENT_STAFF.id,
    ownerName: CURRENT_STAFF.name,
    shared: false,
  },
  {
    id: "li_math_quiz",
    type: "quiz",
    title: "Unit Test — Sets & Relations",
    subject: "Discrete Mathematics",
    topic: "Sets, Relations, Functions",
    description: "Shared quiz bank contributed by Prof. R. Iyer.",
    questions: MATH_QUESTIONS,
    instructions: "",
    inputOutput: "",
    marks: MATH_QUESTIONS.reduce((s, q) => s + q.marks, 0),
    attachments: [],
    createdAt: iso(-6 * 1440),
    ownerId: "staff-2",
    ownerName: "Prof. R. Iyer",
    shared: true,
  },
  {
    id: "li_subnet_lab",
    type: "practical",
    title: "IPv4 Subnetting Lab",
    subject: "Computer Networks Lab",
    topic: "Subnetting",
    description: "Design subnets for a given network address and justify the masks used.",
    questions: [],
    instructions:
      "Given 192.168.10.0/24, design 6 subnets of roughly equal size. Document the mask, usable range and broadcast address of each.",
    inputOutput: "Input: number of required subnets.\nOutput: table of subnet mask, range, broadcast address.",
    marks: 15,
    attachments: [{ name: "subnetting-worksheet.xlsx", size: "88 KB" }],
    createdAt: iso(-4 * 1440),
    ownerId: "staff-3",
    ownerName: "Mohammed Khan (Lab Instructor)",
    shared: true,
  },
  {
    id: "li_sdlc_written",
    type: "written",
    title: "SDLC Phases — Short Answers",
    subject: "Software Engineering",
    topic: "Software Process Models",
    description: "Explain each phase of the SDLC with one real-world example.",
    questions: [],
    instructions: "Answer in your own words; diagrams optional.",
    inputOutput: "",
    marks: 10,
    wordLimit: 120,
    attachments: [],
    createdAt: iso(-8 * 1440),
    ownerId: "staff-4",
    ownerName: "Dr. S. Bose",
    shared: true,
  },
];

let examRows: Exam[] = [
  {
    id: "ex_dbms_now",
    itemId: "li_dbms_quiz",
    title: "Unit Test 1 — Normalization",
    subject: "Database Management Systems",
    type: "quiz",
    durationMinutes: 20,
    batch: "CS-3A",
    startAt: iso(-10), // opened 10 minutes ago → Start Exam is live
    shuffleQuestions: true,
    maxWarnings: 0,
    createdBy: CURRENT_STAFF.name,
    totalMarks: 6,
    questions: DBMS_QUESTIONS,
  },
  {
    id: "ex_shell_soon",
    itemId: "li_shell_lab",
    title: "Lab Practical — Shell Scripting",
    subject: "Operating Systems Lab",
    type: "practical",
    durationMinutes: 90,
    batch: "CS-3A",
    startAt: iso(2 * 1440),
    shuffleQuestions: false,
    maxWarnings: 1,
    createdBy: CURRENT_STAFF.name,
    totalMarks: 10,
    questions: [],
  },
  {
    id: "ex_ada_past",
    itemId: "li_ada_written",
    title: "Class Test — Greedy Algorithms",
    subject: "Design & Analysis of Algorithms",
    type: "written",
    durationMinutes: 45,
    batch: "CS-3A",
    startAt: iso(-7 * 1440),
    shuffleQuestions: false,
    maxWarnings: 1,
    createdBy: CURRENT_STAFF.name,
    totalMarks: 10,
    questions: [],
  },
  {
    id: "ex_math_2b",
    itemId: "li_math_quiz",
    title: "Unit Test — Sets & Relations",
    subject: "Discrete Mathematics",
    type: "quiz",
    durationMinutes: 15,
    batch: "CS-2B", // different batch — not visible to the demo student
    startAt: iso(3 * 1440),
    shuffleQuestions: true,
    maxWarnings: 0,
    createdBy: "Prof. R. Iyer",
    totalMarks: 2,
    questions: MATH_QUESTIONS,
  },
];

let attemptRows: Attempt[] = [
  {
    id: "at_seed_1",
    examId: "ex_dbms_now",
    studentId: "st-101",
    studentName: "Rahul Mehta",
    status: "active",
    violations: 0,
    startedAt: iso(-8),
    answers: {},
  },
  {
    id: "at_seed_2",
    examId: "ex_dbms_now",
    studentId: "st-102",
    studentName: "Priya Nair",
    status: "active",
    violations: 1,
    startedAt: iso(-6),
    answers: {},
  },
  {
    id: "at_seed_3",
    examId: "ex_dbms_now",
    studentId: "st-103",
    studentName: "Arjun Das",
    status: "terminated",
    violations: 1,
    startedAt: iso(-9),
    endedAt: iso(-5),
    terminateReason: "Tab switch detected",
    score: 1,
    totalMarks: 6,
    answers: { q_dbms_1: 0 },
  },
  {
    id: "at_seed_4",
    examId: "ex_dbms_now",
    studentId: "st-104",
    studentName: "Sneha Kulkarni",
    status: "submitted",
    violations: 0,
    startedAt: iso(-12),
    endedAt: iso(-2),
    score: 5,
    totalMarks: 6,
    answers: { q_dbms_1: 0, q_dbms_2: 1, q_dbms_3: 2, q_dbms_4: 3, q_dbms_5: 0 },
  },
  {
    id: "at_seed_5",
    examId: "ex_ada_past",
    studentId: CURRENT_STUDENT.id,
    studentName: CURRENT_STUDENT.name,
    status: "submitted",
    violations: 0,
    startedAt: iso(-7 * 1440),
    endedAt: iso(-7 * 1440 + 42),
    score: 7,
    totalMarks: 10,
    answers: {
      q1: "Huffman coding is optimal because each merge reduces…",
      q2: "A greedy strategy fails for the 0/1 knapsack because…",
    },
  },
  {
    id: "at_seed_6",
    examId: "ex_ada_past",
    studentId: "st-101",
    studentName: "Rahul Mehta",
    status: "terminated",
    violations: 1,
    startedAt: iso(-7 * 1440 + 5),
    endedAt: iso(-7 * 1440 + 18),
    terminateReason: "Fullscreen exited",
    score: 3,
    totalMarks: 10,
    answers: {},
  },
];

// ---------------------------------------------------------------------------
// Library
// ---------------------------------------------------------------------------

const wait = () => new Promise<void>((r) => setTimeout(r, 80));
const byNewest = (a: { createdAt: string }, b: { createdAt: string }) =>
  b.createdAt.localeCompare(a.createdAt);

export async function listMyLibrary(): Promise<LibraryItem[]> {
  await wait();
  return libraryRows.filter((i) => i.ownerId === CURRENT_STAFF.id).sort(byNewest);
}

export async function listSharedLibrary(): Promise<LibraryItem[]> {
  await wait();
  return libraryRows.filter((i) => i.shared).sort(byNewest);
}

export async function createLibraryItem(input: LibraryItemInput): Promise<LibraryItem> {
  await wait();
  const item: LibraryItem = {
    ...input,
    id: uid("li"),
    createdAt: new Date().toISOString(),
    ownerId: CURRENT_STAFF.id,
    ownerName: CURRENT_STAFF.name,
    shared: false,
  };
  libraryRows = [item, ...libraryRows];
  return item;
}

export async function updateLibraryItem(
  id: string,
  patch: Partial<LibraryItemInput>,
): Promise<void> {
  await wait();
  libraryRows = libraryRows.map((i) =>
    i.id === id ? { ...i, ...patch, shared: false, ownerId: CURRENT_STAFF.id, ownerName: CURRENT_STAFF.name } : i,
  );
}

export async function deleteLibraryItem(id: string): Promise<void> {
  await wait();
  libraryRows = libraryRows.filter((i) => i.id !== id);
}

export async function duplicateLibraryItem(id: string): Promise<LibraryItem | null> {
  await wait();
  const src = libraryRows.find((i) => i.id === id);
  if (!src) return null;
  const copy: LibraryItem = {
    ...src,
    questions: src.questions.map((q) => ({ ...q })),
    attachments: [...src.attachments],
    id: uid("li"),
    title: `${src.title} (Copy)`,
    createdAt: new Date().toISOString(),
  };
  libraryRows = [copy, ...libraryRows];
  return copy;
}

// ---------------------------------------------------------------------------
// Exams
// ---------------------------------------------------------------------------

export async function listExams(): Promise<Exam[]> {
  await wait();
  return [...examRows].sort((a, b) => b.startAt.localeCompare(a.startAt));
}

export async function createExam(input: ExamInput): Promise<Exam> {
  await wait();
  const item = libraryRows.find((i) => i.id === input.itemId);
  if (!item) throw new Error("Content not found in your library.");
  const exam: Exam = {
    id: uid("ex"),
    itemId: item.id,
    title: item.title,
    subject: item.subject,
    type: input.examType,
    durationMinutes: input.durationMinutes,
    batch: input.batch,
    startAt: input.startAt,
    shuffleQuestions: input.shuffleQuestions,
    maxWarnings: input.maxWarnings,
    createdBy: CURRENT_STAFF.name,
    totalMarks:
      item.type === "quiz" ? item.questions.reduce((s, q) => s + q.marks, 0) : item.marks,
    questions: item.questions.map((q) => ({ ...q })),
    description: item.description,
    instructions: item.instructions,
    wordLimit: item.wordLimit,
  };
  examRows = [exam, ...examRows];
  return exam;
}

/** Fills exam-level text for seeded exams whose snapshot came from a library item. */
const withItemSnapshot = (exam: Exam): Exam => {
  const item = libraryRows.find((i) => i.id === exam.itemId);
  if (!item) return exam;
  return {
    ...exam,
    description: exam.description || item.description,
    instructions: exam.instructions || item.instructions,
    wordLimit: exam.wordLimit ?? item.wordLimit,
  };
};

// ---------------------------------------------------------------------------
// Student attempts
// ---------------------------------------------------------------------------

const attemptFor = (examId: string, studentId: string): Attempt | null =>
  attemptRows.find((a) => a.examId === examId && a.studentId === studentId) ?? null;

export async function listStudentExams(): Promise<ExamWithAttempt[]> {
  await wait();
  return examRows
    .filter((e) => e.batch === CURRENT_STUDENT.batch)
    .sort((a, b) => b.startAt.localeCompare(a.startAt))
    .map((exam) => ({ exam: withItemSnapshot(exam), attempt: attemptFor(exam.id, CURRENT_STUDENT.id) }));
}

export async function getStudentExamContext(examId: string): Promise<ExamWithAttempt | null> {
  await wait();
  const exam = examRows.find((e) => e.id === examId);
  if (!exam) return null;
  return { exam, attempt: attemptFor(examId, CURRENT_STUDENT.id) };
}

/** Called when the student agrees to the rules and starts (or resumes) an exam. */
export async function startAttempt(examId: string): Promise<Attempt> {
  const existing = attemptFor(examId, CURRENT_STUDENT.id);
  if (existing) return existing;
  const attempt: Attempt = {
    id: uid("at"),
    examId,
    studentId: CURRENT_STUDENT.id,
    studentName: CURRENT_STUDENT.name,
    status: "active",
    violations: 0,
    startedAt: new Date().toISOString(),
    answers: {},
  };
  attemptRows = [attempt, ...attemptRows];
  return attempt;
}

const grade = (exam: Exam, answers: Record<string, AnswerValue>): number | undefined =>
  exam.type === "quiz"
    ? exam.questions.reduce((s, q) => s + (answers[q.id] === q.correctIndex ? q.marks : 0), 0)
    : undefined;

export async function submitAttempt(args: {
  examId: string;
  answers: Record<string, AnswerValue>;
}): Promise<Attempt> {
  const exam = examRows.find((e) => e.id === args.examId);
  if (!exam) throw new Error("Exam not found.");
  const attempt = attemptFor(args.examId, CURRENT_STUDENT.id);
  if (!attempt) throw new Error("Attempt not found.");
  const updated: Attempt = {
    ...attempt,
    status: "submitted",
    endedAt: new Date().toISOString(),
    answers: args.answers,
    score: grade(exam, args.answers),
    totalMarks: exam.totalMarks,
  };
  attemptRows = attemptRows.map((a) => (a.id === updated.id ? updated : a));
  return updated;
}

/** Anti-cheat termination: auto-submits whatever was answered so far. */
export async function terminateAttempt(args: {
  examId: string;
  answers: Record<string, AnswerValue>;
  reason: string;
}): Promise<Attempt> {
  const exam = examRows.find((e) => e.id === args.examId);
  if (!exam) throw new Error("Exam not found.");
  const attempt = attemptFor(args.examId, CURRENT_STUDENT.id);
  if (!attempt) throw new Error("Attempt not found.");
  const updated: Attempt = {
    ...attempt,
    status: "terminated",
    violations: attempt.violations + 1,
    endedAt: new Date().toISOString(),
    terminateReason: args.reason,
    answers: args.answers,
    score: grade(exam, args.answers),
    totalMarks: exam.totalMarks,
  };
  attemptRows = attemptRows.map((a) => (a.id === updated.id ? updated : a));
  return updated;
}

/** Any finished attempt for the result screen (null while still in progress). */
export async function getMyAttempt(examId: string): Promise<Attempt | null> {
  await wait();
  const attempt = attemptFor(examId, CURRENT_STUDENT.id);
  return attempt && attempt.status !== "active" ? attempt : null;
}

// ---------------------------------------------------------------------------
// Staff views
// ---------------------------------------------------------------------------

export async function listMonitoring(): Promise<AttemptWithExam[]> {
  await wait();
  return attemptRows
    .map((attempt) => {
      const exam = examRows.find((e) => e.id === attempt.examId);
      return exam ? { attempt, exam } : null;
    })
    .filter((x): x is AttemptWithExam => x !== null)
    .sort((a, b) => b.attempt.startedAt.localeCompare(a.attempt.startedAt));
}

export async function listResults(): Promise<AttemptWithExam[]> {
  await wait();
  const rows = await listMonitoring();
  return rows.filter((r) => r.attempt.status !== "active");
}
