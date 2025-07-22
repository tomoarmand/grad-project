import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Check, X } from 'lucide-react';

function FolderManager({
  teacherId,
  onFolderSelect,
  selectedFolder,
  folders,
  onFoldersUpdate,
  activeTab
}) {
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef(null);
  const containerRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenId(null);
      }
    };

    if (menuOpenId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpenId]);

  const handleMenuToggle = (folderId, buttonElement) => {
    if (menuOpenId === folderId) {
      setMenuOpenId(null);
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const buttonRect = buttonElement.getBoundingClientRect();
    
    // Calculate position relative to the container
    const relativeTop = buttonRect.top - containerRect.top;
    const relativeRight = containerRect.right - buttonRect.right;
    
    // Check if menu would be clipped at bottom
    const menuHeight = 80; // Approximate height of menu
    const availableSpaceBelow = containerRect.bottom - buttonRect.bottom;
    const availableSpaceAbove = buttonRect.top - containerRect.top;
    
    let finalTop = relativeTop + buttonRect.height + 4; // 4px offset
    
    // If not enough space below and more space above, show menu above
    if (availableSpaceBelow < menuHeight && availableSpaceAbove > menuHeight) {
      finalTop = relativeTop - menuHeight - 4;
    }
    
    setMenuPosition({
      top: finalTop,
      right: relativeRight
    });
    
    setMenuOpenId(folderId);
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const response = await fetch(`${API_URL}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim(), teacherId })
      });
      const newFolder = await response.json();
      onFoldersUpdate([...folders, newFolder]);
      setNewFolderName('');
    } catch (error) {
      console.error('Error adding folder:', error);
    }
  };

  const handleRenameFolder = async (folderId) => {
    if (!editedName.trim()) return;
    try {
      await fetch(`${API_URL}/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName.trim() })
      });
      onFoldersUpdate(
        folders.map((f) => (f._id === folderId ? { ...f, name: editedName.trim() } : f))
      );
      setRenamingFolderId(null);
      setEditedName('');
    } catch (error) {
      console.error('Error renaming folder:', error);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm('Are you sure you want to delete this folder?')) return;
    try {
      await fetch(`${API_URL}/folders/${folderId}`, {
        method: 'DELETE'
      });
      onFoldersUpdate(folders.filter((f) => f._id !== folderId));
      if (selectedFolder && selectedFolder._id === folderId) {
        onFolderSelect(null);
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  const sortedFolders = [...folders].sort((a, b) => a.name.localeCompare(b.name));

  const tabColor = activeTab === 'create' ? 'orange-400' : 'slate-500';
  const tabColorHover = activeTab === 'create' ? 'orange-500' : 'slate-600';

  return (
    <div className="bg-slate-600 p-4 rounded-lg">
      <h2 className="text-white text-lg font-semibold mb-2">
        {activeTab === 'create' ? 'Organize Your Folders' : 'Choose a Folder to Assign From'}
      </h2>

      {activeTab === 'create' && (
        <div className="flex mb-4 gap-2">
          <input
            type="text"
            placeholder="New folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="flex-1 p-2 rounded border border-slate-300 bg-slate-100 text-black focus:outline-none focus:shadow-[0_0_12px_rgb(255,120,0),0_0_6px_rgb(255,120,0)] focus:border-orange-500 transition"
          />
          <button
            onClick={handleAddFolder}
            className={`bg-${tabColor} hover:bg-${tabColorHover} text-white px-4 py-2 rounded`}
          >
            Add
          </button>
        </div>
      )}

      {folders.length === 0 ? (
        <p className="text-white text-sm">No folders available.</p>
      ) : (
        <div className="relative" ref={containerRef}>
          <ul className="max-h-48 overflow-y-auto space-y-1">
            {sortedFolders.map((folder) => (
              <li
                key={folder._id}
                className={`flex justify-between items-center p-2 rounded cursor-pointer transition-colors duration-150 ${
                  selectedFolder?._id === folder._id
                    ? 'bg-orange-400 text-black'
                    : 'text-white hover:bg-slate-700'
                }`}
                onClick={() => onFolderSelect(folder)}
              >
                {renamingFolderId === folder._id ? (
                  <div className="flex items-center gap-2 flex-grow">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameFolder(folder._id);
                        if (e.key === 'Escape') setRenamingFolderId(null);
                      }}
                      autoFocus
                      className="flex-grow p-1 rounded text-black border border-slate-300 focus:outline-none focus:shadow-[0_0_12px_rgb(255,120,0),0_0_6px_rgb(255,120,0)] focus:border-orange-500 transition"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameFolder(folder._id);
                      }}
                      className="p-1.5 bg-green-600 hover:bg-green-700 rounded text-white flex items-center justify-center"
                      title="Save changes"
                      aria-label="Save changes"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingFolderId(null);
                      }}
                      className="p-1.5 bg-gray-400 hover:bg-gray-500 rounded text-white flex items-center justify-center"
                      title="Cancel editing"
                      aria-label="Cancel editing"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <span className="truncate">{folder.name || 'Untitled Folder'}</span>
                )}

                {activeTab === 'create' && selectedFolder?._id === folder._id && (
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleMenuToggle(folder._id, e.target)}
                      className="p-1 rounded hover:bg-slate-700 text-white"
                      aria-label="Folder options"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Portal-style menu positioned relative to container */}
          {menuOpenId && (
            <div
              ref={menuRef}
              className="absolute w-28 bg-white text-black rounded shadow-lg z-50 border border-gray-200"
              style={{
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`,
              }}
            >
              <button
                onClick={() => {
                  setRenamingFolderId(menuOpenId);
                  setEditedName(folders.find(f => f._id === menuOpenId)?.name || '');
                  setMenuOpenId(null);
                }}
                className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded-t"
              >
                Rename
              </button>
              <button
                onClick={() => {
                  const folderId = menuOpenId;
                  setMenuOpenId(null);
                  handleDeleteFolder(folderId);
                }}
                className="block w-full text-left px-3 py-2 text-red-600 hover:bg-gray-100 rounded-b"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FolderManager;