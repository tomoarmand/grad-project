import { useState, useEffect } from 'react';

function FolderManager({ teacherId, onFolderSelect, selectedFolder }) {
  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await fetch(`${API_URL}/folders/${teacherId}`);
        const data = await response.json();
        setFolders(data);
      } catch (error) {
        console.error("Failed to fetch folders:", error);
      }
    };

    if (teacherId) fetchFolders();
  }, [teacherId]);

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
        setFolders((prev) => [...prev, createdFolder]);
        setNewFolderName('');
        onFolderSelect(createdFolder); // Select new folder immediately
      } else {
        console.error('Failed to create folder');
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="w-full mb-4">
      {/* Folder creation input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="New folder name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          className="flex-grow rounded-md px-3 py-2 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
          disabled={creating}
          onKeyDown={(e) => { if (e.key === 'Enter') createFolder(); }}
        />
        <button
          onClick={createFolder}
          disabled={creating || !newFolderName.trim()}
          className={`rounded-md px-4 py-2 bg-orange-400 text-black font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-500`}
          type="button"
        >
          {creating ? 'Adding...' : 'Add'}
        </button>
      </div>

      {/* Folder list */}
      <div className="flex flex-wrap gap-3 justify-center">
        {folders.length === 0 && (
          <p className="text-slate-300 text-center w-full">No folders found</p>
        )}
        {folders.map((folder) => {
          const isSelected = selectedFolder?._id === folder._id;
          return (
            <button
              key={folder._id}
              onClick={() => onFolderSelect(folder)}
              type="button"
              className={`rounded-md px-4 py-2 whitespace-nowrap transition focus:outline-none
                ${
                  isSelected
                    ? 'bg-orange-400 text-black shadow-lg'
                    : 'bg-slate-600 hover:bg-slate-700 text-white'
                }
              `}
            >
              {folder.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default FolderManager;