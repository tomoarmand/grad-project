import { useState, useEffect, useRef } from 'react';

function FolderManager({ teacherId, onFolderSelect, selectedFolder, folders, onFoldersUpdate }) {
  const [localFolders, setLocalFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deleting, setDeleting] = useState(null);
  const menuRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (folders) {
      setLocalFolders(folders);
    } else {
      fetchFolders();
    }
  }, [folders, teacherId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await fetch(`${API_URL}/folders/${teacherId}`);
      const data = await response.json();
      setLocalFolders(data);
      if (onFoldersUpdate) onFoldersUpdate(data);
    } catch (error) {
      console.error("Failed to fetch folders:", error);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim(), teacherId }),
      });
      if (res.ok) {
        const createdFolder = await res.json();
        const updatedFolders = [...localFolders, createdFolder];
        setLocalFolders(updatedFolders);
        setNewFolderName('');
        onFolderSelect(createdFolder);
        if (onFoldersUpdate) onFoldersUpdate(updatedFolders);
      } else {
        console.error('Failed to create folder');
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    } finally {
      setCreating(false);
    }
  };

  const deleteFolder = async (folderId) => {
    setDeleting(folderId);
    try {
      const res = await fetch(`${API_URL}/folders/${folderId}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedFolders = localFolders.filter(folder => folder._id !== folderId);
        setLocalFolders(updatedFolders);
        if (selectedFolder?._id === folderId) onFolderSelect(null);
        if (onFoldersUpdate) onFoldersUpdate(updatedFolders);
      } else {
        console.error('Failed to delete folder');
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
    } finally {
      setDeleting(null);
      setOpenMenuId(null);
    }
  };

  const startRename = (folder) => {
    setEditingId(folder._id);
    setEditingName(folder.name);
    setOpenMenuId(null);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveRename = async (folderId) => {
    if (!editingName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      if (res.ok) {
        const updatedFolder = await res.json();
        const updatedFolders = localFolders.map(folder =>
          folder._id === folderId ? updatedFolder : folder
        );
        setLocalFolders(updatedFolders);
        if (selectedFolder?._id === folderId) onFolderSelect(updatedFolder);
        if (onFoldersUpdate) onFoldersUpdate(updatedFolders);
        setEditingId(null);
        setEditingName('');
      } else {
        console.error('Failed to rename folder');
      }
    } catch (error) {
      console.error('Failed to rename folder:', error);
    }
  };

  const toggleMenu = (folderId) => {
    setOpenMenuId(openMenuId === folderId ? null : folderId);
  };

  return (
    <div className="w-full mb-4">
      {/* Folder creation input */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          placeholder="New folder name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          className="w-full rounded-md px-3 py-2 bg-white text-black placeholder-slate-500 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
          disabled={creating}
          onKeyDown={(e) => { if (e.key === 'Enter') createFolder(); }}
        />
        <button
          onClick={createFolder}
          disabled={creating || !newFolderName.trim()}
          className="rounded-md px-4 py-2 bg-orange-400 text-black font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-500"
          type="button"
        >
          {creating ? 'Adding...' : 'Add'}
        </button>
      </div>

      {/* Folder list */}
      <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
        {localFolders.length === 0 && (
          <p className="text-slate-300 text-center w-full">No folders found</p>
        )}
        {localFolders.map((folder) => {
          const isSelected = selectedFolder?._id === folder._id;
          const isEditing = editingId === folder._id;
          const isDeleting = deleting === folder._id;

          return (
            <div key={folder._id} className="relative">
              {isEditing ? (
                <div className="flex items-center gap-2 bg-slate-600 rounded-md px-3 py-2 w-full max-w-xs">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="bg-white text-black border border-slate-300 px-2 py-1 rounded text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename(folder._id);
                      if (e.key === 'Escape') cancelRename();
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => saveRename(folder._id)}
                    className="text-green-400 hover:text-green-300 p-1"
                    title="Save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={cancelRename}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Cancel"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onFolderSelect(folder)}
                    disabled={isDeleting}
                    type="button"
                    className={`rounded-md px-4 py-2 whitespace-nowrap transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
                      ${
                        isSelected
                          ? 'bg-orange-400 text-black shadow-md'
                          : 'bg-slate-600 hover:bg-slate-700 text-white'
                      }
                    `}
                  >
                    {isDeleting ? 'Deleting...' : folder.name}
                  </button>

                  <div className="relative" ref={openMenuId === folder._id ? menuRef : null}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(folder._id);
                      }}
                      disabled={isDeleting}
                      className={`p-2 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed
                        ${
                          isSelected
                            ? 'text-black hover:bg-orange-500'
                            : 'text-white hover:bg-slate-700'
                        }
                      `}
                      title="Folder options"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>

                    {openMenuId === folder._id && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-md shadow-lg border border-slate-200 z-50">
                        <button
                          onClick={() => startRename(folder)}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-t-md"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => deleteFolder(folder._id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-md"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FolderManager;