# Secure Exam Hub

Build a secure online Quiz & Lab Examination web app UI with TWO roles only:
Staff (Faculty + Lab Instructor combined in one login) and Student.
Use React + Tailwind, clean modern blue/white design, fully responsive.
Use mock data (no backend yet), but structure the code so Supabase can be
added later.

1. LOGIN PAGE
   - Email + password, role selector: Staff / Student
   - Staff goes to the Staff Dashboard, Student goes to the Student Dashboard

2. STAFF DASHBOARD (one login for faculty and lab instructors)
   - Sidebar: Dashboard, Create / Upload Content, My Library, Schedule Exam,
     Live Monitoring, Results
   - "Create / Upload Content" page starts with a content type selector
     (big cards) where staff chooses what to upload:
       a) Quiz (MCQ)
       b) Lab Practical (problem statement, instructions, optional file
          attachments, marks)
       c) Written / Short Answer Test
       d) Other (custom title + description + file upload)
   - Each type shows its own form:
       Quiz: subject, topic, add questions manually (4 options, correct
       answer, marks) or bulk upload via CSV/Excel drag-and-drop
       Practical: title, aim, instructions, input/output, marks, file upload
       Written: question text, marks, word limit
       Other: free-form title, description, attachments
   - "My Library" table of everything the staff member uploaded, with filter
     by type (Quiz / Practical / Written / Other), plus edit, delete, and
     duplicate buttons. Also a "Shared Library" tab to reuse content uploaded
     by other staff
   - "Schedule Exam": pick content from the library, exam type, duration,
     batch/class, start time, shuffle toggle, allow warnings before
     termination (0 or 1)
   - "Live Monitoring": table of students currently attempting with status
     (Active / Terminated / Submitted) and violation count

3. STUDENT DASHBOARD
   - Upcoming exams, completed exams, and a Start Exam button that becomes
     active only at the scheduled time

4. STUDENT EXAM SCREEN (most important)
   - Fullscreen layout: question on the left, question palette on the right,
     countdown timer on top, Next / Previous / Submit buttons
   - Before starting, show an Exam Rules modal and request fullscreen
   - ANTI-CHEAT: if the student switches tab, minimizes the window, exits
     fullscreen, or the window loses focus (use visibilitychange, blur, and
     fullscreenchange events), IMMEDIATELY terminate the exam, auto-submit
     answers so far, and show a red "Exam Terminated: Tab switch detected"
     screen with the reason and timestamp
   - Disable right-click, copy, paste, and text selection during the exam
   - Small green "Secure Mode Active" badge on the exam screen

5. RESULT SCREEN for Submitted / Terminated exams

DESIGN: card-based layout, rounded corners, soft shadows, lucide icons,
colored status badges (green/yellow/red).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a1dafc38-401b-46d6-beb7-f9fe08796e84).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
