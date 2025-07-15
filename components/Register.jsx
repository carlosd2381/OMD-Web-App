import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('');
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { error } = await signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName, role }
                }
            });
            if (error) throw error;
            navigate('/login');
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" required />
            <select value={role} onChange={(e) => setRole(e.target.value)} required>
                <option value="">Select Role</option>
                <option value="Administrator">Administrator</option>
                <option value="Sales Manager">Sales Manager</option>
                <option value="Event Coordinator">Event Coordinator</option>
                <option value="Kitchen Staff">Kitchen Staff</option>
                <option value="Event Staff">Event Staff</option>
            </select>
            <button type="submit">Register</button>
        </form>
    );
}