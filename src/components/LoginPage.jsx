import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../store/userStore';

function LoginPage() {
    const [email, setEmail] = useState('');
    const { setUser } = useUserStore();
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();

    const handleLogin = async (event) => {
        event.preventDefault();

        
    }
}