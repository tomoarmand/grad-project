import { useState } from 'react';
import { MoreVertical } from 'lucide-react';

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

  const API_URL = import.meta.env.VITE_API_URL;

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
        method: 'DELETE' });
      onFoldersUpdate(folders.filter((f) => f._id !== folderId));
      if (selectedFolder && selectedFolder._id === folderId) {
        onFolderSelect(null);
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  const showMenuFor = (folderId) => {
    return folderId === selectedFolder?._id && (activeTab === 'create' || activeTab === 'organise');
  };

  const sortedFolders = [...folders].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-slate-600 p-4 rounded-lg">
      <h2 className="text-white text-lg font-semibold mb-2">Create & Organise Folders</h2>

      <div className="flex mb-4 gap-2">
        <input
          type="text"
          placeholder="New folder name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          className="flex-1 p-2 rounded bg-slate-100 text-black"
        />
        <button
          onClick={handleAddFolder}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2 max-h-60 md:max-h-48 overflow-y-auto">
        {sortedFolders.map((folder) => (
          <li
            key={folder._id}
            className={`flex items-center justify-between p-2 md:p-1 rounded cursor-pointer transition-colors text-sm md:text-xs ${
              selectedFolder?._id === folder._id ? 'bg-orange-300 text-black' : 'bg-slate-500 text-white hover:bg-slate-400'
            }`}
            onClick={() => onFolderSelect(folder)}
          >
            <div className="flex-1">
              {renamingFolderId === folder._id ? (
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={() => handleRenameFolder(folder._id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameFolder(folder._id);
                  }}
                  className="w-full p-1 rounded text-black"
                  autoFocus
                />
              ) : (
                <span>{folder.name}</span>
              )}
            </div>

            {showMenuFor(folder._id) && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === folder._id ? null : folder._id);
                  }}
                  className="p-1 text-white hover:text-orange-300"
                >
                  <MoreVertical size={18} />
                </button>
                {menuOpenId === folder._id && (
                  <div className="absolute right-0 mt-1 w-28 bg-white text-black rounded shadow-lg z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingFolderId(folder._id);
                        setEditedName(folder.name);
                        setMenuOpenId(null);
                      }}
                      className="block w-full text-left px-3 py-2 hover:bg-gray-200"
                    >
                      Rename
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder._id);
                        setMenuOpenId(null);
                      }}
                      className="block w-full text-left px-3 py-2 hover:bg-gray-200"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FolderManager;
