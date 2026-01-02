import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const {user, logout} = useAuth();

    const handleLogout = () => {
        logout();
    }

    return (
        <div className="navbar bg-base-100 shadow-sm w-full flex justify-between px-6">
                <Link to="/" className="btn btn-ghost text-xl">Decrypt-Me</Link>
                {user && <button className="btn btn-primary" onClick={handleLogout}>Logout</button>}
        </div>
    )
}
