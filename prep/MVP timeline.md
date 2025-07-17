WEEK 1: Jul 21 – Jul 25

Goal: Backend & Auth Foundations
Initialize Git repo and project structure (client/server folders).
Set up Express server with environment config.
Connect MongoDB (local or Atlas).
Create User model with a single teacher and student login.
Implement registration & login routes (bcrypt + JWT/session).
Set up basic error handling and middleware.
Create frontend login and signup forms (React).

WEEK 2: Jul 28 – Aug 1

Goal: Auth Integration & Basic Dashboards
Test login and signup from frontend to backend.
Implement role-based redirection (teacher → teacher dashboard, student → student dashboard).
Build basic teacher and student dashboard views.
Add navigation bar with logout and dashboard links.
Test flow: login → redirect to appropriate dashboard.

WEEK 3: Aug 4 – Aug 8

Goal: Audio Recording + Upload Functionality (Teacher)
Add audio recording UI (browser microphone API).
Capture audio and convert to blob.
Set up file upload to server (e.g., Multer or Cloudinary).
Save audio file and correctAnswer in MongoDB under an Exercise model.
Build minimal form to enter correctAnswer (e.g., dropdown or input).
Test uploading and saving one exercise.

WEEK 4: Aug 11 – Aug 15

Goal: Exercise Management (CRUD)
Build GET /exercises route to fetch all exercises.
Create Teacher Dashboard to display exercises.
Add delete functionality (frontend + backend).
Optionally add edit functionality for the correct answer.
Test full create–read–delete flow.

WEEK 5: Aug 18 – Aug 22

Goal: Assign Exercises to Students
Update Exercise model to include a flag for "assigned" or "available."
Build backend route: POST /assign-exercise to mark exercises as assigned.
Create a simple toggle in the Teacher Dashboard to assign/unassign exercises.
Test assigning/unassigning exercises.

WEEK 6: Aug 25 – Aug 29

Goal: Student Experience — Playback + Submission
Build Student Dashboard: show 1 random assigned exercise.
Add audio playback button.
Create form for the student to submit an answer.
Backend route to verify if the submitted answer matches correctAnswer.
Show result: “Correct” or “Incorrect.”

WEEK 7: Sep 1 – Sep 5

Goal: Wire It All Together + Feedback Logic
Connect teacher → exercise → student → submission flow.
Ensure teachers can only see their own exercises.
Ensure students only see assigned exercises.
Finalize answer checking logic (case/format tolerance).
Add loading spinners or basic validation.

WEEK 8: Sep 8 – Sep 12

Goal: MVP Polish + Light Styling
Clean up unused code, console.logs.
Add responsive styling across all major views.
Improve UI layout and font consistency.
Write basic README.md with setup instructions.
Deploy to Render (backend) and Vercel/Netlify (frontend).
Test full user flow (teacher → student → answer).
Prepare short demo and practice explaining the MVP.
