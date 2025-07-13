# PROJECT PROPOSAL: KenTone

## PROBLEM STATEMENT

Music teachers often spend excessive time repeatedly playing and explaining various listening exercises for individual students, where students must identify what they hear. This process is time-consuming and limits the teacher's ability to focus on other aspects of instruction. Additionally, there is no efficient way to remotely assign and manage personalized listening exercises, restricting both teaching flexibility and student practice opportunities. A streamlined solution is needed to empower teachers to create, organize, and assign custom listening exercises while enabling students to practice independently and receive immediate feedback.

---

## WOW FACTOR
- **Empowers personalised learning**: Students can practice interval identification exercises tailored to their needs, anytime, anywhere.
- **Streamlined teacher workflow**: Teachers can record, organise, and assign exercises effortlessly, saving time and improving efficiency.
- **Global accessibility**: The platform is designed for remote teaching, enabling teachers and students to connect from anywhere in the world.
- **Smart organization tools**: Features like folders and tagging allow teachers to organise exercises for better planning and scalability.
- **Gamified feedback**: Students receive instant feedback with engaging visuals (e.g., confetti for correct answers), making learning fun and interactive.

A sleek music teaching platform that combines personalised learning, efficient exercise management, and engaging feedback to revolutionize how music teachers and students interact.

---

## TEST USERS
- Beck  
- Victor 
- Kenji  

---

## USER STORIES

### **Teacher User Stories**

1. **As a teacher, I want to record and save audio exercises with correct answers.**
   - I can record audio directly in the app using my microphone.
   - I can play back the recording before saving it. (?)
   - I can assign a correct answer to each exercise.
   - I can save the exercise to a database for future use.
   - I receive a confirmation message when the exercise is successfully saved.

2. **As a teacher, I want to view and manage (edit/delete) my list of exercises.**
   - I can see a list of all my saved exercises.
   - I can rename an exercise.
   - I can delete an exercise from the list.
   - I receive a confirmation prompt before deleting an exercise. (incomplete)
   - The list updates in real-time after any changes.

3. **As a teacher, I want to organize exercises into folders or types.**
   - I can create folders to group exercises.
   - I can rename or delete folders.
   - I can filter exercises by folder or type.
   - The folder structure is saved and persists across sessions.

4. **As a teacher, I want to assign exercises to individual students.**
   - I can select one or more exercises to assign to a student.
   - I can view a list of students and select one to assign exercises to.
   - I can unassign exercises from a student.
   - I receive a confirmation message when an exercise is successfully assigned.
   - Students only see exercises assigned to them.

---

### **Student User Stories**

1. **As a student, I want to play a random exercise assigned to me.**
   - I can see a random exercise assigned by my teacher.
   - I can play the audio recording for the exercise.
   - I can replay the audio as many times as I need.
   - I can skip to another random exercise if allowed by the teacher. (incomplete)
   - I receive a message if there are no exercises assigned to me.

2. **As a student, I want to submit my answer and get immediate feedback.**
   - I can select or type my answer for an exercise.
   - I can submit my answer with a single click.
   - I receive immediate feedback indicating whether my answer is correct or incorrect.
   - I see a confetti animation or similar visual for correct answers.
   - I can view the correct answer if my submission is incorrect.

3. **As a student, I want a simple and intuitive interface for completing exercises.**
   - I can easily navigate to my assigned exercises.
   - I can see clear instructions for each exercise.
   - I can access playback and answer submission buttons without confusion.
   - I receive error messages if I try to submit an incomplete answer.
   - The interface is responsive and works on both desktop and mobile devices.

---

### **Acceptance Criteria Summary**

#### Teacher
1. Record and save exercises:
   - Record, playback, assign correct answer, save, confirmation message.

2. Manage exercises:
   - View, rename, delete, confirmation prompts, real-time updates.

3. Organize exercises:
   - Create, rename, delete folders, move exercises, filter by folder/type.

4. Assign exercises:
   - Select exercises, assign/unassign to students, confirmation messages.

5. Track progress (Optional):
   - View completed exercises, filter results, export data, notifications.

#### Student
1. Play random exercises:
   - View random exercise, play/replay audio, skip, no exercises message.

2. Submit answers:
   - Select/submit answer, immediate feedback, confetti for correct answers.

3. Intuitive interface:
   - Easy navigation, clear instructions, responsive design.


---













## Grad Project Overview

The project is essentially an Ear Training app, which helps students learn to identify intervals between chords or notes.  At this stage, I aim to spend roughly 3 weeks building the desired functionality, and 1 week on styling.

In the MVP, the teacher will be able to record and save audio files to a database, assigning a correct answer to each file.  The teacher will be able to view a list of the exercises and add or remove them.  The student receives a random audio file from the database, and will be able to play it back and submit an answer.


# Features

If the above MVP is achieved within 3 weeks with time to spare, I intend to add more features, such as:

- Mutiple student profiles, and the ability as a teacher to add or remove them.

- Ability as a teacher to assign different exercises from the database to multiple students.

- Multiple teacher profiles.


# Key Components

- Student screen component**
[Before database and teacher component exist, have a sample recording and hard coded correct answer to test functionality]

- Teacher home page component (minus edit students functionality)**
[Just one edit exercises button for MVP]

- Edit exercises parent component**
- Recording child component (handles recording, saving, discarding and playback of audio file)
- List of exercises child component
[Playback and delete features]

- Home screen


# Additional Components

To be added if multiple student profiles exist:

- Exercise assignment component (with student selector)

- Add/remove student component

- Student login screen

To be added if multiple teacher profiles exist:

- Create teacher profile screen

- Teacher login page with create new profile option


---

