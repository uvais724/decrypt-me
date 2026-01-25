import { useState, useEffect } from 'react'
import GameEngine from '../components/GameEngine';
import Navbar from '../components/Navbar';
import Loading from '../components/Loading';

export default function DemoGame() {
    const [loading, setLoading] = useState(false);
    const [childKey, setChildKey] = useState(0);

    // Static message for demo
    const DEMO_MESSAGE = "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG";
    
    // Create a mock session object for demo mode
    const mockSession = {
        session_id: 'demo-session',
        game_id: 'demo-game',
        lives: 3,
        guesses: {
            0: 'T',
            8: 'K',
            12: 'O',
            20: 'J',
            28: 'E',
            36: 'A'
        },
        revealed_indices: [0, 8, 12, 20, 28, 36],
        hints_used: 0,
        active_index: 1,
        cryptogram_map: {
            'T': '20',
            'H': '8',
            'E': '5',
            'Q': '17',
            'U': '21',
            'I': '9',
            'C': '3',
            'K': '11',
            'B': '2',
            'R': '18',
            'O': '15',
            'W': '23',
            'N': '14',
            'F': '6',
            'X': '24',
            'J': '10',
            'M': '13',
            'P': '16',
            'S': '19',
            'V': '22',
            'L': '12',
            'A': '1',
            'Z': '26',
            'Y': '25',
            'D': '4',
            'G': '7'
        },
        initial_revealed: []
    };

    useEffect(() => {
        setLoading(false);
    }, []);

    if (loading) return <Loading />;

    function handleTryAgain() {
        window.location.reload();
    }

    return (
        <>
            <Navbar />
            <GameEngine 
                key={childKey} 
                gameId="demo-game" 
                message={DEMO_MESSAGE} 
                onTryAgain={handleTryAgain}
                session={mockSession}
                isDemo={true}
            />
        </>
    )
}
