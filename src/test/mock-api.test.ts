import { describe, expect, it } from "vitest";

import {
  CURRENT_STUDENT,
  getStudentExamContext,
  listStudentExams,
  startAttempt,
  submitAttempt,
  terminateAttempt,
} from "@/lib/mock-api";

describe("Exam attempt rules (mock data layer)", () => {
  it("listStudentExams only returns exams for the student's batch", async () => {
    const rows = await listStudentExams();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.exam.batch).toBe(CURRENT_STUDENT.batch);
  });

  it("startAttempt creates an active attempt for the signed-in student", async () => {
    const attempt = await startAttempt("ex_dbms_now");
    expect(attempt.status).toBe("active");
    expect(attempt.studentId).toBe(CURRENT_STUDENT.id);
    expect(attempt.violations).toBe(0);
  });

  it("terminateAttempt auto-submits answers so far with the reason and bumps violations", async () => {
    await startAttempt("ex_dbms_now");
    const answers = { q_dbms_1: 0, q_dbms_3: 0 };
    const attempt = await terminateAttempt({ examId: "ex_dbms_now", answers, reason: "Tab switch detected" });

    expect(attempt.status).toBe("terminated");
    expect(attempt.terminateReason).toBe("Tab switch detected");
    expect(attempt.violations).toBe(1);
    expect(attempt.answers).toEqual(answers);
    expect(attempt.endedAt).toBeTruthy();
    // partial auto-grading: q_dbms_1 correct (1 mark), q_dbms_3 wrong
    expect(attempt.score).toBe(1);
    expect(attempt.totalMarks).toBe(6);
  });

  it("submitAttempt grades a full quiz submission", async () => {
    await startAttempt("ex_dbms_now");
    const answers = { q_dbms_1: 0, q_dbms_2: 1, q_dbms_3: 2, q_dbms_4: 2, q_dbms_5: 1 };
    const attempt = await submitAttempt({ examId: "ex_dbms_now", answers });

    expect(attempt.status).toBe("submitted");
    // 4 of 5 correct (q_dbms_5 correct index is 0): 1+1+1+2+0
    expect(attempt.score).toBe(5);
    expect(attempt.totalMarks).toBe(6);
  });

  it("getStudentExamContext exposes the exam snapshot text for written exams", async () => {
    const ctx = await getStudentExamContext("ex_ada_past");
    expect(ctx?.attempt?.status).toBe("submitted");
    expect(ctx?.exam.description).toContain("Huffman");
  });
});
