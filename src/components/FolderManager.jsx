import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Check, X } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

function FolderManager({
  teacherId,
  onFolderSelect,
  selectedFolder,
  folders,
  onFoldersUpdate,
  activeTab
}) {
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderInstructions, setNewFolderInstructions] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedInstructions, setEditedInstructions] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [errors, setErrors] = useState({});
  const menuRef = useRef(null);
  const containerRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  };

  const validateFolderName = (name) => {
    const sanitized = sanitizeInput(name);
    if (!sanitized || sanitized.length < 1) {
      return { isValid: false, message: 'Folder name is required' };
    }
    if (sanitized.length > 50) {
      return { isValid: false, message: 'Folder name must be 50 characters or less' };
    }
    const validNameRegex = /^[a-zA-Z0-9\s\-_.,!()&]+$/;
    if (!validNameRegex.test(sanitized)) {
      return { isValid: false, message: 'Folder name contains invalid characters' };
    }
    const isDuplicate = folders.some(folder =>
      folder.name.toLowerCase() === sanitized.toLowerCase() &&
      folder._id !== renamingFolderId
    );
    if (isDuplicate) {
      return { isValid: false, message: 'A folder with this name already exists' };
    }
    return { isValid: true, sanitized };
  };

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

    const relativeTop = buttonRect.top - containerRect.top;
    const relativeRight = containerRect.right - buttonRect.right;

    const menuHeight = 80;
    const availableSpaceBelow = containerRect.bottom - buttonRect.bottom;
    const availableSpaceAbove = buttonRect.top - containerRect.top;

    let finalTop = relativeTop + buttonRect.height + 4;

    if (availableSpaceBelow < menuHeight && availableSpaceAbove > menuHeight) {
      finalTop = relativeTop - menuHeight - 4;
    }

    setMenuPosition({ top: finalTop, right: relativeRight });
    setMenuOpenId(folderId);
  };

  const handleNewFolderNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= 50) {
      setNewFolderName(value);
      if (errors.newFolder) setErrors(prev => ({ ...prev, newFolder: '' }));
    }
  };

  const handleNewFolderInstructionsChange = (e) => {
    const value = e.target.value;
    if (value.length <= 500) setNewFolderInstructions(value);
  };

  const handleEditedNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= 50) {
      setEditedName(value);
      if (errors.editFolder) setErrors(prev => ({ ...prev, editFolder: '' }));
    }
  };

  const handleEditedInstructionsChange = (e) => {
    const value = e.target.value;
    if (value.length <= 500) setEditedInstructions(value);
  };

  const handleAddFolder = async () => {
    const validation = validateFolderName(newFolderName);
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, newFolder: validation.message }));
      return;
    }
    try {
      const response = await fetch(`${API_URL}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: validation.sanitized,
          teacherId: sanitizeInput(teacherId?.toString() || ''),
          instructions: newFolderInstructions.trim()
        })
      });
      if (response.ok) {
        const newFolder = await response.json();
        onFoldersUpdate([...folders, newFolder]);
        setNewFolderName('');
        setNewFolderInstructions('');
        setErrors(prev => ({ ...prev, newFolder: '' }));
      } else {
        const error = await response.json();
        setErrors(prev => ({ ...prev, newFolder: error.error || 'Failed to create folder' }));
      }
    } catch (error) {
      console.error('Error adding folder:', error);
      setErrors(prev => ({ ...prev, newFolder: 'An error occurred while creating the folder' }));
    }
  };

  const handleRenameFolder = async (folderId) => {
    const validation = validateFolderName(editedName);
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, editFolder: validation.message }));
      return;
    }
    try {
      const response = await fetch(`${API_URL}/folders/${encodeURIComponent(folderId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: validation.sanitized,
          instructions: editedInstructions.trim()
        })
      });
      if (response.ok) {
        const updatedFolder = await response.json();
        onFoldersUpdate(folders.map((f) => (f._id === folderId ? updatedFolder : f)));
        setRenamingFolderId(null);
        setEditedName('');
        setEditedInstructions('');
        setErrors(prev => ({ ...prev, editFolder: '' }));
      } else {
        const error = await response.json();
        setErrors(prev => ({ ...prev, editFolder: error.error || 'Failed to rename folder' }));
      }
    } catch (error) {
      console.error('Error renaming folder:', error);
      setErrors(prev => ({ ...prev, editFolder: 'An error occurred while renaming the folder' }));
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      const response = await fetch(`${API_URL}/folders/${encodeURIComponent(folderId)}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        onFoldersUpdate(folders.filter((f) => f._id !== folderId));
        if (selectedFolder && selectedFolder._id === folderId) {
          onFolderSelect(null);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete folder');
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('An error occurred while deleting the folder');
    }
  };

  const confirmDeleteFolder = (folderId) => {
    setFolderToDelete(folderId);
    setShowDeleteDialog(true);
    setMenuOpenId(null);
  };

  const handleKeyDown = (e, action, ...args) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action(...args);
    } else if (e.key === 'Escape') {
      if (action === handleRenameFolder) {
        setRenamingFolderId(null);
        setEditedName('');
        setEditedInstructions('');
        setErrors(prev => ({ ...prev, editFolder: '' }));
      }
    }
  };

  const sortedFolders = [...folders].sort((a, b) => a.name.localeCompare(b.name));
  const folderName = folderToDelete
    ? folders.find(f => f._id === folderToDelete)?.name || 'this folder'
    : 'this folder';

  // Shared input classes
  const inputNormal = 'w-full p-2 rounded border bg-neutral-800 text-white placeholder-gray-500 border-white/10 focus:outline-none focus:border-red-600 focus:shadow-[0_0_12px_rgb(220,38,38)] transition';
  const inputErrorClass = 'w-full p-2 rounded border bg-neutral-800 text-white placeholder-gray-500 border-red-500 focus:border-red-500 focus:shadow-[0_0_12px_rgb(239,68,68)] transition focus:outline-none';

  return (
    <>
      <div className="bg-neutral-900 border border-white/10 p-4 rounded-lg">
        <h2 className="text-white text-lg font-heading uppercase tracking-wide mb-2">
          {activeTab === 'create' ? 'Organize Your Folders' : 'Choose a Folder to Assign From'}
        </h2>

        {activeTab === 'create' && (
          <div className="mb-4">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="New folder name"
                    value={newFolderName}
                    onChange={handleNewFolderNameChange}
                    onKeyDown={(e) => handleKeyDown(e, handleAddFolder)}
                    className={errors.newFolder ? inputErrorClass : inputNormal}
                    maxLength="50"
                  />
                  {errors.newFolder && (
                    <p className="text-red-500 text-sm font-body mt-1">{errors.newFolder}</p>
                  )}
                </div>
                <button
                  onClick={handleAddFolder}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-heading uppercase tracking-wide shadow-lg transition disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400"
                  disabled={!newFolderName.trim()}
                >
                  Add
                </button>
              </div>
              <textarea
                placeholder="Instructions for students (optional)"
                value={newFolderInstructions}
                onChange={handleNewFolderInstructionsChange}
                className="w-full p-2 rounded border border-white/10 bg-neutral-800 text-white placeholder-gray-500 text-sm font-body focus:outline-none focus:border-red-600 focus:shadow-[0_0_12px_rgb(220,38,38)] transition resize-none"
                rows="2"
                maxLength="500"
              />
              <p className="text-gray-500 text-xs font-body text-right">{newFolderInstructions.length}/500</p>
            </div>
          </div>
        )}

        {folders.length === 0 ? (
          <p className="text-gray-400 text-sm font-body">No folders available.</p>
        ) : (
          <div className="relative" ref={containerRef}>
            <ul className="max-h-48 overflow-y-auto space-y-1">
              {sortedFolders.map((folder) => (
                <li
                  key={folder._id}
                  className={`flex justify-between items-center p-2 rounded cursor-pointer transition-colors duration-150 ${
                    selectedFolder?._id === folder._id
                      ? 'bg-blue-50 border-l-4 border-red-600 text-gray-900'
                      : 'text-gray-200 hover:bg-neutral-800'
                  }`}
                  onClick={() => onFolderSelect(folder)}
                >
                  {renamingFolderId === folder._id ? (
                    <div className="flex flex-col gap-2 flex-grow pr-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editedName}
                          onChange={handleEditedNameChange}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => handleKeyDown(e, handleRenameFolder, folder._id)}
                          autoFocus
                          className={`flex-grow p-1 rounded text-white border font-body transition focus:outline-none ${
                            errors.editFolder
                              ? 'bg-neutral-800 border-red-500 focus:border-red-500 focus:shadow-[0_0_12px_rgb(239,68,68)]'
                              : 'bg-neutral-800 border-white/10 focus:border-red-600 focus:shadow-[0_0_12px_rgb(220,38,38)]'
                          }`}
                          maxLength="50"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameFolder(folder._id);
                          }}
                          className="p-1.5 bg-green-500 hover:bg-green-600 rounded text-white flex items-center justify-center shadow-lg transition"
                          title="Save changes"
                          aria-label="Save changes"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingFolderId(null);
                            setEditedName('');
                            setEditedInstructions('');
                            setErrors(prev => ({ ...prev, editFolder: '' }));
                          }}
                          className="p-1.5 border border-white/10 hover:bg-neutral-800 rounded text-white flex items-center justify-center transition"
                          title="Cancel editing"
                          aria-label="Cancel editing"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <textarea
                        value={editedInstructions}
                        onChange={handleEditedInstructionsChange}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Instructions (optional)"
                        className="w-full p-1 rounded text-white text-xs font-body border border-white/10 bg-neutral-800 focus:outline-none focus:border-red-600 focus:shadow-[0_0_12px_rgb(220,38,38)] transition resize-none"
                        rows="2"
                        maxLength="500"
                      />
                      <p className="text-gray-500 text-xs font-body text-right">{editedInstructions.length}/500</p>
                      {errors.editFolder && (
                        <p className="text-red-500 text-xs font-body">{errors.editFolder}</p>
                      )}
                    </div>
                  ) : (
                    <span className="truncate font-body">
                      {sanitizeInput(folder.name) || 'Untitled Folder'}
                    </span>
                  )}

                  {activeTab === 'create' && selectedFolder?._id === folder._id && renamingFolderId !== folder._id && (
                    <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleMenuToggle(folder._id, e.target)}
                        className="p-1 rounded hover:bg-neutral-700 text-gray-400 hover:text-white transition"
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
                className="absolute w-28 bg-white border border-gray-200 rounded shadow-lg z-50"
                style={{
                  top: `${menuPosition.top}px`,
                  right: `${menuPosition.right}px`,
                }}
              >
                <button
                  onClick={() => {
                    const folder = folders.find(f => f._id === menuOpenId);
                    setRenamingFolderId(menuOpenId);
                    setEditedName(folder?.name || '');
                    setEditedInstructions(folder?.instructions || '');
                    setMenuOpenId(null);
                    setErrors(prev => ({ ...prev, editFolder: '' }));
                  }}
                  className="block w-full text-left px-3 py-2 text-gray-900 font-body text-sm hover:bg-gray-100 rounded-t transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => confirmDeleteFolder(menuOpenId)}
                  className="block w-full text-left px-3 py-2 text-red-600 font-body text-sm hover:bg-gray-100 rounded-b transition"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setFolderToDelete(null);
        }}
        onConfirm={() => handleDeleteFolder(folderToDelete)}
        title="Delete Folder"
        message={`Are you sure you want to delete "${sanitizeInput(folderName)}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
}

export default FolderManager;