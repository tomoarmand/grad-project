# PROJECT PROPOSAL: KenTone


## PROBLEM STATEMENT
- Teacher: Spends too much time playing exercises to individual students repeatedly
- Teacher: Can't remotely provide learning interval identificaiton exercises*(describe) to individual students

Music teachers spend excessive time repeatedly playing interval identification exercises for individual students and lack an efficient way to remotely assign and manage personalized listening exercises, limiting both teaching flexibility and student practice opportunities.

## WOW FACTOR
- Doesn't exist yet
- Students learn at their own pace
- Can be used for online teaching anywhere in the world
- Kebab menus for cleaner UI, allow more advanced attributes for folders
- Ability to have multiple exercise folders, allowing the teacher increased scope for planning and organisation
- Multiple assignments to multiple students, increased efficiency

A sleek, global-ready music teaching platform that empowers students to learn at their own pace from anywhere in the world. With smart UI features like kebab menus, multi-folder organization, and bulk assignment tools, teachers can effortlessly manage, customize, and scale lessons—boosting both efficiency and planning power like never before.


## TEST USERS
- Beck
- Sylvia    
- Kenji

## USER STORIES
Teacher
As a teacher, I want to record and save audio exercises with correct answers.

As a teacher, I want to view and manage (edit/delete) my list of exercises.

As a teacher, I want to organize exercises into folders or types.

As a teacher, I want to assign exercises to individual students.

Student
As a student, I want to play a random exercise assigned to me.

As a student, I want to submit my answer and get immediate feedback.

As a student, I want to review exercises I’ve previously answered (optional MVP+).

### Acceptance Criteria
1. 
- I can create folders
- I can place exercises into folders
- I can name folders
- I can name exercises

2. 
- I can record exercises
- I can rename exercises
- I can assign exercises to students
- Students can access exercises

3.
- I can see exercises assigned to me
- I can listen to the exercises assigned to me
- My answer can be evaluated
- I receive a message that shows my answer is correct

4. 
- I see a confetti animation when my answer is correct
- 












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


