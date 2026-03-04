import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FolderManager from './FolderManager.jsx';
import CreateTab from './CreateTab.jsx';
import AssignTab from './AssignTab.jsx';
import UnassignTab from './UnassignTab.jsx';
import ConfirmDialog from './ConfirmDialog';
import useUserStore from '../store/userStore';
import { PuffLoader } from 'react-spinners';
import NavLinks from './NavLinks';

function trackAnalyticsEvent(category, action, label = '') {
  if (process.env.NODE_ENV === 'production' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
    });
  }
}

function TeacherPage() {
  const [activeTab, setActiveTab] = useState('create');
  const { user, logout } = useUserStore();
  const navigate = useNavigate();
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folders, setFolders] = useState([]);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [exerciseCount, setExerciseCount] = useState(0);
  const API_URL = import.meta.env.VITE_API_URL;

  const handleLogout = () => {
    trackAnalyticsEvent('Teacher', 'Sign_Out', user?.fullName);
    logout();
    navigate('/');
  };

  const confirmSignOut = () => setShowSignOutDialog(true);

  useEffect(() => {
    if (user) fetchFolders();
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

    if (selectedFolder) {
      const updatedSelectedFolder = sorted.find(folder => folder._id === selectedFolder._id);
      if (updatedSelectedFolder) {
        setSelectedFolder(updatedSelectedFolder);
      } else {
        setSelectedFolder(null);
      }
    }
  };

  const handleFolderSelect = (folder) => {
    trackAnalyticsEvent('Teacher', 'Folder_Selected', folder?.name);
    setSelectedFolder(folder);
  };

  const handleTabChange = (tab) => {
    trackAnalyticsEvent('Teacher', 'Tab_Changed', tab);
    setActiveTab(tab);
    if (tab === 'unassign') setSelectedFolder(null);
  };

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
      <div className="min-h-screen w-screen flex justify-center items-center bg-gradient-to-br from-neutral-900 via-black to-neutral-900 text-white px-4">
        <PuffLoader color="#ffffff" size={50} speedMultiplier={1.2} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex flex-col items-center bg-gradient-to-br from-neutral-900 via-black to-neutral-900 px-2 py-6 sm:px-4 sm:py-8 overflow-auto">

      {/* Breadcrumb */}
      <div className="w-full max-w-md sm:max-w-4xl mb-4">
        <NavLinks
          links={[
            { label: 'Home', to: '/' },
            { label: 'Teacher Dashboard', to: '/TeacherPage' },
            selectedFolder ? { label: selectedFolder.name, to: '#' } : null,
          ].filter(Boolean)}
          isBreadcrumb
        />
      </div>

      <div className="w-full max-w-md sm:max-w-4xl bg-neutral-900 border-2 border-red-600 rounded-lg shadow-lg p-4 sm:p-6 flex flex-col gap-6">
        <h1 className="text-2xl sm:text-3xl font-heading uppercase tracking-wide text-white text-center">
          Welcome, {user?.fullName?.split(' ')[0] || 'Teacher'}!
        </h1>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row bg-neutral-800 border border-white/10 rounded-lg overflow-hidden">

          {/* Mobile: stacked */}
          <div className="flex flex-col sm:hidden">
            {['create', 'assign', 'unassign'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`w-full px-4 py-4 font-heading uppercase tracking-wide transition focus:outline-none border-b border-white/10 last:border-b-0 touch-manipulation ${
                  activeTab === tab
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-neutral-700 active:bg-neutral-600'
                }`}
              >
                {tab === 'create' && 'Create & Organise'}
                {tab === 'assign' && 'Assign Folders'}
                {tab === 'unassign' && 'Manage Students'}
              </button>
            ))}
          </div>

          {/* Desktop: horizontal */}
          <div className="hidden sm:flex w-full">
            {['create', 'assign', 'unassign'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex-1 text-sm px-3 py-3 font-heading uppercase tracking-wide transition focus:outline-none ${
                  activeTab === tab
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-neutral-700'
                }`}
              >
                {tab === 'create' && 'Create & Organise'}
                {tab === 'assign' && 'Assign Folders'}
                {tab === 'unassign' && 'Manage Students'}
              </button>
            ))}
          </div>
        </div>

        {/* Folder Manager - create tab only */}
        {activeTab === 'create' && (
          <FolderManager
            teacherId={user._id}
            onFolderSelect={handleFolderSelect}
            selectedFolder={selectedFolder}
            folders={folders}
            onFoldersUpdate={handleFoldersUpdate}
            activeTab={activeTab}
          />
        )}

        {/* Selected folder info - create tab only */}
        {activeTab === 'create' && selectedFolder && (
          <div className="text-center text-sm font-body text-gray-300">
            Selected Folder:{' '}
            <span className="text-white font-medium">{selectedFolder.name}</span>
            <span className="ml-2 text-gray-500">
              ({exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''})
            </span>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'create' && (
          <CreateTab
            user={user}
            selectedFolder={selectedFolder}
            onExerciseCreate={() => trackAnalyticsEvent('Teacher', 'Create_Exercise', selectedFolder?.name)}
          />
        )}

        {activeTab === 'assign' && (
          <AssignTab
            user={user}
            onAssignExercises={(count) => trackAnalyticsEvent('Teacher', 'Assign_Folders', `Assigned ${count} folders`)}
          />
        )}

        {activeTab === 'unassign' && (
          <UnassignTab
            user={user}
            onUnassignExercises={(count) => trackAnalyticsEvent('Teacher', 'Unassign_Folders', `Unassigned ${count} folders`)}
          />
        )}
      </div>

      {/* Sign Out */}
      <div className="text-center mt-4">
        <button
          onClick={confirmSignOut}
          className="text-sm font-body text-white/70 hover:text-white underline transition-colors"
        >
          Sign Out
        </button>
      </div>

      <ConfirmDialog
        isOpen={showSignOutDialog}
        onClose={() => setShowSignOutDialog(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to sign out? You will need to log in again."
        confirmText="Sign Out"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}

export default TeacherPage;