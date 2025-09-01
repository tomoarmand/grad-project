# 🎵 KenTone - Interactive Ear Training Platform

## 🎯 What is KenTone?

KenTone is an ear training and music education platform that bridges traditional music theory instruction with modern interactive learning. Teachers can remotely create, record, and assign personalized listening exercises while students develop aural skills through an engaging, gamified environment accessible from anywhere.

## 👥 Who Uses KenTone?

### For Music Teachers:
- Create custom listening exercises with audio recordings
- Assign exercises to individual students or entire classes
- Track student progress with real-time analytics
- Organize exercises with folders and manage recordings
- Monitor completion rates and identify struggling students

### For Music Students:
- Practice ear training in an interactive, mobile-friendly interface
- Receive immediate feedback with encouraging animations
- Track personal progress over time
- Access exercises offline through PWA functionality
- Experience gamified learning with attempt-based encouragement

## 🚀 Key Features

### Teacher Dashboard
- **Exercise Creation**: Record and upload custom audio exercises
- **Bulk Assignment**: Assign multiple exercises to multiple students simultaneously
- **Progress Monitoring**: Real-time student performance analytics
- **Content Organization**: Add, remove, and rename folders and recordings
- **Class Management**: Monitor student progress across assignments

### Student Learning Interface
- **Interactive Exercises**: Real-time answer validation
- **Progressive Difficulty**: Encouragement messages based on attempt count
- **Celebration System**: Multi-burst confetti animations for correct answers
- **Visual Feedback**: Shake animations and hints for incorrect attempts
- **PWA Support**: Install as native app on mobile and desktop

### Technical Features
- **Progressive Web App (PWA)**: Offline functionality and native app experience
- **Cross-Platform Compatibility**: Works on desktop, tablet, and mobile
- **Responsive Design**: Optimized for all screen sizes
- **Enterprise Security**: JWT authentication, advanced rate limiting, CORS protection, and multi-layer data sanitization

## 🛠 Technology Stack

### Frontend
- **React 19** with modern hooks and functional components
- **Vite** for fast development and optimized builds
- **TailwindCSS** for responsive, accessible styling
- **React Router** for navigation
- **Canvas Confetti** for celebration animations
- **Zustand** for lightweight state management

### Backend
- **Node.js + Express** API server
- **MongoDB + Mongoose** for data persistence
- **Enterprise Security**: JWT authentication, environment-aware rate limiting (100-3000 req/15min), data sanitization, and strict CORS policies
- **File Upload Support** for audio exercise recordings

### Infrastructure
- **Progressive Web App (PWA)** with service worker caching
- **Google Analytics** for usage tracking and insights

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git
- Modern web browser

### Local Development Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/tomoarmand/grad-project.git
cd kentone
```

#### 2. Frontend Setup
```bash
# Install frontend dependencies
npm install

# Create environment file for frontend
cp .env.example .env
```

#### 3. Backend Setup
```bash
# Navigate to backend directory
cd grad-api

# Install backend dependencies
npm install

# Create environment file for backend
cp .env.example .env
```

#### 4. Environment Variables

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3000
# For production: VITE_API_URL=https://grad-project-al5i.onrender.com
```

**Backend (grad-api/.env):**
```env
MONGODB_URI=mongodb://localhost:27017/kentone
JWT_SECRET=your_super_secure_jwt_secret_here
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
# For production: FRONTEND_URL=https://kentone.vercel.app
```

#### 5. Running the Application

**Start Backend Server:**
```bash
cd grad-api
npm start
# Server runs on http://localhost:3000
```

**Start Frontend Development Server:**
```bash
# From project root in new terminal
npm run dev
# Frontend runs on http://localhost:5173
```

#### 6. Access the Application

- Open http://localhost:5173 in your browser
- Create a teacher or student account
- Local testing: Limited to account creation and interface exploration
- Note: Exercise creation requires Cloudinary API access, and new accounts start empty - use live demo for full functionality with sample data

### Production Deployment

#### Build for Production
```bash
npm run build
# Production files in dist/ folder
```

#### Deploy Options
- **Vercel**: Frontend deployed at https://kentone.vercel.app
- **Render**: Backend API deployed at https://grad-project-al5i.onrender.com
- **Local Alternative**: Upload dist/ folder to Netlify or connect via Git

### Available Scripts
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Backend (in grad-api/)
npm start            # Start production server
npm run dev          # Start development with nodemon
```

## 📁 Project Structure

```
kentone/
├── src/                 # Frontend React application
│   ├── components/      # Reusable React components
│   ├── store/          # Zustand state management
│   ├── assets/         # Static assets
│   └── main.jsx        # Application entry point
├── grad-api/           # Backend Node.js/Express server
│   ├── routes/         # API route handlers
│   ├── models/         # MongoDB data models
│   ├── middleware/     # Custom middleware
│   └── index.js        # Server entry point
├── public/             # Static files and PWA assets
├── dist/               # Production build output
└── package.json        # Project dependencies and scripts
```

## 🔗 Links

- **Live Demo**: [KenTone App] https://kentone.vercel.app
- **GitHub Repository**: https://github.com/tomoarmand/grad-project

## 🎯 Impact

KenTone enhances music education by making ear training:
- **More Engaging**: Gamified learning with celebrations
- **More Accessible**: PWA works on any device, remote assignment capability
- **More Effective**: Real-time feedback and progress tracking
- **More Scalable**: Teachers can manage entire classes efficiently
- **More Inclusive**: Works for different learning paces and styles