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
                <div>
                    <Link to="/" className="btn btn-ghost text-xl">Decrypt-Me</Link>
                    <Link to="/" className="btn btn-ghost text-xl">Games</Link>
                    <Link to="/send-invite" className="btn btn-ghost text-xl">Send Invite</Link>
                    <Link to="/new-game" className="btn btn-ghost text-xl">New Game</Link>
                </div>
                {user && <button className="btn btn-primary" onClick={handleLogout}>Logout</button>}
        </div>
    )
}
