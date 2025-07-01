import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import useUserStore from '../store/userStore';
import { useEffect } from 'react';

function FolderManager({ teacherId, onFolderSelect }) {
    const [folders, setFolders] = useState([]);
    const [newName, setNewName] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;

    const fetchFolders = async () => {
        const res = await fetch(`${API_URL}/folders/${teacherId}`);
        const data = await res.json();
        setFolders(data);
    };

    const createFolder = async () => {
        const res = await fetch(`${API_URL}/folders`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName, teacherId })
        });
        await fetchFolders();
        setNewName("");
    };

    useEffect(() => { fetchFolders(); }, []);

    return (
        <div>
            <h2>Folders</h2>
            <ul>{folders.map(f => (
                <li key={f._id} onClick={() => onFolderSelect(f)}>{f.name}</li>
            ))}</ul>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New folder name" />
            <button onClick={createFolder}>Add</button>
        </div>
    )
}

export default FolderManager