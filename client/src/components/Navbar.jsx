import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const {user, logout} = useAuth();
    const [open, setOpen] = useState(false);

    const handleLogout = () => {
        logout();
    }

    return (
        <>
            {/* Top bar: title on left, logout on right, toggle on very left */}
            <header className="w-full bg-base-100 shadow-sm flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-3">
                    <button
                        aria-label="Toggle sidebar"
                        aria-expanded={open}
                        onClick={() => setOpen(v => !v)}
                        className="btn btn-ghost btn-square"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <Link to="/" className="text-xl font-semibold">Decrypt-Me</Link>
                </div>

                <div>
                    {user && (
                        <button className="btn btn-primary" onClick={handleLogout}>Logout</button>
                    )}
                </div>
            </header>

            {/* Sidebar overlay for small screens */}
            <div
                className={`fixed inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setOpen(false)}
                aria-hidden={!open}
            />

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-full bg-white w-64 shadow-lg transform transition-transform z-40 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 flex items-center justify-between">
                    <Link to="/" className="text-lg font-bold">Decrypt-Me</Link>
                    <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Close sidebar">✕</button>
                </div>
                <nav className="flex flex-col gap-2 p-4">
                    <Link to="/" className="btn btn-ghost justify-start">Games</Link>
                    <Link to="/send-invite" className="btn btn-ghost justify-start">Send Invite</Link>
                    <Link to="/new-game" className="btn btn-ghost justify-start">New Game</Link>
                </nav>
            </aside>
        </>
    )
}
