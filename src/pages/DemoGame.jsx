import { useState, useEffect } from 'react'
import GameEngine from '../components/GameEngine';
import Loading from '../components/Loading';

export default function DemoGame() {
    const [loading, setLoading] = useState(false);
    const [childKey, setChildKey] = useState(0);

    // Static message for demo
    const DEMO_MESSAGE = "YOU HAVE DISCOVERED A HIDDEN WORLD";

    // Create a mock session object for demo mode
    const mockSession = {
        session_id: 'demo-session',
        game_id: 'demo-game',
        lives: 3,
        guesses: {
            0: 'Y',
            1: 'O',
            4: 'H',
            7: 'E',
            9: 'D',
            20: 'A'
        },
        revealed_indices: [0, 1, 4, 7, 9, 20],
        hints_used: 0,
        active_index: 2,
        cryptogram_map: {
            'Y': '25',
            'O': '15',
            'U': '21',
            'H': '8',
            'A': '1',
            'V': '22',
            'E': '5',
            'D': '4',
            'I': '9',
            'S': '19',
            'C': '3',
            'R': '18',
            'T': '20',
            'N': '14',
            'W': '23',
            'G': '7',
            'L': '12',
            'B': '2',
            'K': '11',
            'P': '16',
            'M': '13',
            'F': '6',
            'X': '24',
            'Z': '26',
            'J': '10',
            'Q': '17'
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
        <GameEngine
            key={childKey}
            gameId="demo-game"
            message={DEMO_MESSAGE}
            onTryAgain={handleTryAgain}
            session={mockSession}
            isDemo={true}
        />
    )
}
