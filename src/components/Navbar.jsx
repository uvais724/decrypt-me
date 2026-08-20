import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth';
import { supabase } from '../lib/supabaseClient';

export default function Navbar() {
    const {user, logout} = useAuth();
    const [open, setOpen] = useState(false);
    const [profile, setProfile] = useState({ username: '', avatar_url: '' });
    const [menuOpen, setMenuOpen] = useState(false);
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [usernameDraft, setUsernameDraft] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [savingUsername, setSavingUsername] = useState(false);
    const profileMenuRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        const loadProfile = async () => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('username, avatar_url')
                    .eq('user_id', user.id)
                    .single();

                if (error) throw error;

                const nextProfile = {
                    username: data?.username || user.email || 'Player',
                    avatar_url: data?.avatar_url || ''
                };
                setProfile(nextProfile);
                setUsernameDraft(nextProfile.username);
            } catch (error) {
                console.error('Failed to load user profile:', error);
                const fallback = user.email || 'Player';
                setProfile({ username: fallback, avatar_url: '' });
                setUsernameDraft(fallback);
            }
        };

        loadProfile();
    }, [user]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!profileMenuRef.current) return;
            if (!profileMenuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('touchstart', handleOutsideClick);
        };
    }, []);

    const handleLogout = async () => {
        await logout();
    }

    const saveUsername = async () => {
        if (!user) return;

        setUsernameError('');
        const nextUsername = usernameDraft.trim();

        if (!nextUsername) {
            setUsernameError('Username cannot be empty.');
            return;
        }

        if (nextUsername === profile.username) {
            setIsEditingUsername(false);
            return;
        }

        try {
            setSavingUsername(true);

            const { data: existingUsers, error: existingError } = await supabase
                .from('users')
                .select('user_id')
                .eq('username', nextUsername)
                .neq('user_id', user.id)
                .limit(1);

            if (existingError) throw existingError;

            if (existingUsers && existingUsers.length > 0) {
                setUsernameError('That username is already taken.');
                return;
            }

            const { data: updatedUser, error: updateError } = await supabase
                .from('users')
                .update({ username: nextUsername })
                .eq('user_id', user.id)
                .select('username')
                .single();

            if (updateError) throw updateError;

            setProfile(prev => ({ ...prev, username: updatedUser?.username || nextUsername }));
            setIsEditingUsername(false);
        } catch (error) {
            console.error('Failed to update username:', error);
            setUsernameError('Failed to update username. Please try again.');
        } finally {
            setSavingUsername(false);
        }
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

                <div className="relative">
                    {user && (
                        <div className="relative" onClick={(e) => e.stopPropagation()} ref={profileMenuRef}>
                            <button
                                className="btn btn-ghost btn-circle avatar"
                                onClick={() => setMenuOpen(v => !v)}
                                aria-expanded={menuOpen}
                                aria-label="Open profile menu"
                            >
                                <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden bg-base-200 flex items-center justify-center">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Profile" />
                                    ) : (
                                        <span className="font-semibold text-sm">{(profile.username || 'U').charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                            </button>

                            {menuOpen && (
                                <div 
                                    className="absolute right-0 mt-3 z-50 p-3 shadow bg-base-100 rounded-box min-w-52 border border-base-300"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <div className="mb-2">
                                        <p className="text-xs text-base-content/70">Welcome</p>
                                        {!isEditingUsername ? (
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-semibold truncate">{profile.username}</p>
                                                <button
                                                    type="button"
                                                    className="btn btn-ghost btn-xs btn-square"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setUsernameError('');
                                                        setIsEditingUsername(true);
                                                        setUsernameDraft(profile.username);
                                                    }}
                                                    aria-label="Edit username"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.33H5v-.92l8.06-8.06.92.92L5.92 19.58zM20.71 5.63a1 1 0 0 0 0-1.41l-.93-.93a1 1 0 0 0-1.41 0l-1.46 1.46 2.34 2.34 1.46-1.46z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="mt-1">
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-sm w-full"
                                                    value={usernameDraft}
                                                    onChange={(e) => setUsernameDraft(e.target.value)}
                                                    maxLength={30}
                                                    placeholder="Enter username"
                                                />
                                                <div className="mt-2 flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary btn-xs"
                                                        onClick={saveUsername}
                                                        disabled={savingUsername}
                                                    >
                                                        {savingUsername ? 'Saving...' : 'Save'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-xs"
                                                        onClick={() => {
                                                            setIsEditingUsername(false);
                                                            setUsernameDraft(profile.username);
                                                            setUsernameError('');
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {usernameError && (
                                            <p className="text-error text-xs mt-2">{usernameError}</p>
                                        )}
                                    </div>
                                    <button className="btn btn-primary btn-sm w-full" onClick={handleLogout}>
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
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
                    <Link to="/archive" className="btn btn-ghost justify-start">Archive</Link>
                    <Link to="/invite" className="btn btn-ghost justify-start">Invites</Link>
                    <Link to="/send-invite" className="btn btn-ghost justify-start">Send Invite</Link>
                    <Link to="/new-game" className="btn btn-ghost justify-start">New Game</Link>
                    <Link to="/curated-packs" className="btn btn-ghost justify-start">Curated Packs</Link>
                </nav>
            </aside>
        </>
    )
}
