import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FolderManager from './FolderManager.jsx';
import CreateTab from './CreateTab.jsx';
import AssignTab from './AssignTab.jsx';
import UnassignTab from './UnassignTab.jsx';
import SettingsMenu from './SettingsMenu.jsx';
import useUserStore from '../store/userStore';
import { PuffLoader } from 'react-spinners';
import NavLinks from './NavLinks';

function TeacherPage() {
  const [activeTab, setActiveTab] = useState('create');
  const { user, logout } = useUserStore();
  const navigate = useNavigate();

  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folders, setFolders] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (user) {
      fetchFolders();
    }
  }, [user]);

  const fetchFolders = async () => {
    try {
      const response = await fetch(`${API_URL}/folders/${user._id}`);
      const folderData = await response.json();
      handleFoldersUpdate(folderData);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const handleFoldersUpdate = (updatedFolders) => {
    const sorted = [...updatedFolders].sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
    setFolders(sorted);
  };

  const handleFolderSelect = (folder) => {
    setSelectedFolder(folder);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Reset folder selection when switching to unassign tab
    if (tab === 'unassign') {
      setSelectedFolder(null);
    }
  };

  // Get exercise count for the selected folder (for display purposes)
  const [exerciseCount, setExerciseCount] = useState(0);

  const updateExerciseCount = async (folderId) => {
    if (!folderId) {
      setExerciseCount(0);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/exercises/folder/${folderId}`);
      const data = await response.json();
      setExerciseCount(data.length);
    } catch (error) {
      console.error('Failed to fetch exercise count:', error);
      setExerciseCount(0);
    }
  };

  useEffect(() => {
    if (selectedFolder) {
      updateExerciseCount(selectedFolder._id);
    } else {
      setExerciseCount(0);
    }
  }, [selectedFolder]);

  if (!user) {
    return (
      <div className="min-h-screen w-screen flex justify-center items-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 text-white px-4">
        <PuffLoader color="#ffffff" size={50} speedMultiplier={1.2} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex flex-col items-center bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 px-2 py-6 sm:px-4 sm:py-8 overflow-auto">
      {/* Top Bar with Breadcrumbs and Settings Menu - Mobile optimized spacing */}
      <div className="w-full max-w-md sm:max-w-4xl mb-4 flex items-start sm:items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <NavLinks
            links={[
              { label: 'Home', to: '/' },
              { label: 'Teacher Dashboard', to: '/TeacherPage' },
              selectedFolder ? { label: selectedFolder.name, to: '#' } : null,
            ].filter(Boolean)}
            isBreadcrumb
          />
        </div>
        
        {/* Settings Menu - positioned top-right with mobile considerations */}
        <div className="flex-shrink-0 self-start">
          <SettingsMenu user={user} onLogout={handleLogout} />
        </div>
      </div>

      <div className="w-full max-w-md sm:max-w-4xl bg-[#334155] rounded-xl shadow-xl p-4 sm:p-6 flex flex-col gap-6">
        <h1 className="text-2xl sm:text-3xl text-white font-bold text-center">
          Welcome, {user?.fullName?.split(' ')[0] || 'Teacher'}!
        </h1>

        {/* Tabs - Mobile-First Design with better touch targets */}
        <div className="flex flex-col sm:flex-row bg-slate-600 rounded-lg overflow-hidden">
          {/* Mobile: Stacked buttons with larger touch areas */}
          <div className="flex flex-col sm:hidden">
            {['create', 'assign', 'unassign'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`w-full px-4 py-4 font-medium transition focus:outline-none border-b border-slate-500 last:border-b-0 touch-manipulation ${
                  activeTab === tab ? 'bg-orange-400 text-black' : 'text-white hover:bg-slate-500 active:bg-slate-400'
                }`}
              >
                {tab === 'create' && '📝 Create & Organise'}
                {tab === 'assign' && '📤 Assign Exercises'}
                {tab === 'unassign' && '📋 Manage Assignments'}
              </button>
            ))}
          </div>

          {/* Desktop: Horizontal tabs */}
          <div className="hidden sm:flex w-full">
            {['create', 'assign', 'unassign'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex-1 text-sm px-3 py-3 font-medium transition focus:outline-none ${
                  activeTab === tab ? 'bg-orange-400 text-black' : 'text-white hover:bg-slate-500'
                }`}
              >
                {tab === 'create' && 'Create & Organise'}
                {tab === 'assign' && 'Assign Exercises'}
                {tab === 'unassign' && 'Manage Assignments'}
              </button>
            ))}
          </div>
        </div>

        {/* Show folder manager for create and assign tabs */}
        {(activeTab === 'create' || activeTab === 'assign') && (
          <FolderManager
            teacherId={user._id}
            onFolderSelect={handleFolderSelect}
            selectedFolder={selectedFolder}
            folders={folders}
            onFoldersUpdate={handleFoldersUpdate}
            activeTab={activeTab}
          />
        )}

        {/* Show selected folder info for create and assign tabs */}
        {(activeTab === 'create' || activeTab === 'assign') && selectedFolder && (
          <div className="text-center text-white text-sm">
            Selected Folder:{' '}
            <span className="text-orange-400 font-medium">{selectedFolder.name}</span>
            <span className="ml-2 opacity-75">
              ({exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''})
            </span>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'create' && (
          <CreateTab 
            user={user} 
            selectedFolder={selectedFolder}
          />
        )}
        
        {activeTab === 'assign' && (
          <AssignTab 
            user={user} 
            selectedFolder={selectedFolder}
          />
        )}
        
        {activeTab === 'unassign' && (
          <UnassignTab user={user} />
        )}
      </div>

      <div className="w-full max-w-md sm:max-w-4xl mt-4">
        <NavLinks links={[{ label: '← Back to Home', to: '/' }]} isSubtle />
      </div>
    </div>
  );
}

export default TeacherPage;