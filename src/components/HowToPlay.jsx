import React from 'react'

export default function HowToPlay({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl max-h-screen overflow-y-auto">
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          ✕
        </button>

        <h2 className="font-bold text-3xl mb-6 text-primary">How to Play Decrypt Me</h2>

        {/* Overview Section */}
        <div className="mb-6">
          <h3 className="font-bold text-xl mb-3 text-base-content">Game Overview</h3>
          <p className="text-base-content/80 leading-relaxed">
            Decrypt Me is a fun cryptogram puzzle game where you decode secret messages by figuring out 
            letter substitutions. Challenge your friends or solve curated puzzles!
          </p>
        </div>

        {/* Getting Started */}
        <div className="mb-6">
          <h3 className="font-bold text-xl mb-3 text-base-content">Getting Started</h3>
          <ul className="list-disc list-inside space-y-2 text-base-content/80">
            <li>Create an account or log in to get started</li>
            <li>Add friends through the invite system</li>
            <li>Choose to play a custom game or select from curated packs</li>
          </ul>
        </div>

        {/* Game Rules */}
        <div className="mb-6">
          <h3 className="font-bold text-xl mb-3 text-base-content">Game Rules</h3>
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-base-content">1. Encoded Message</p>
              <p className="text-base-content/80 ml-4">You'll see a message where each letter is replaced with another letter.</p>
            </div>
            <div>
              <p className="font-semibold text-base-content">2. Reveal Letters</p>
              <p className="text-base-content/80 ml-4">Some letters are revealed to give you hints and help you start solving.</p>
            </div>
            <div>
              <p className="font-semibold text-base-content">3. Make Guesses</p>
              <p className="text-base-content/80 ml-4">Click on letters and use the keyboard to guess what each letter represents.</p>
            </div>
            <div>
              <p className="font-semibold text-base-content">4. Decode the Message</p>
              <p className="text-base-content/80 ml-4">Figure out the complete substitution pattern to reveal the secret message.</p>
            </div>
            <div>
              <p className="font-semibold text-base-content">5. Win the Game</p>
              <p className="text-base-content/80 ml-4">Successfully decode the entire message to win!</p>
            </div>
          </div>
        </div>

        {/* Difficulty Levels */}
        <div className="mb-6">
          <h3 className="font-bold text-xl mb-3 text-base-content">Difficulty Levels</h3>
          <div className="space-y-3">
            <div className="badge badge-success">Easy</div>
            <p className="text-base-content/80 ml-2">More letters are revealed initially. Perfect for beginners!</p>
            
            <div className="badge badge-warning">Medium</div>
            <p className="text-base-content/80 ml-2">Moderate number of revealed letters. A good challenge!</p>
            
            <div className="badge badge-error">Hard</div>
            <p className="text-base-content/80 ml-2">Fewer revealed letters. Only for experienced players!</p>
          </div>
        </div>

        {/* Tips and Tricks */}
        <div className="mb-6">
          <h3 className="font-bold text-xl mb-3 text-base-content">Tips & Tricks</h3>
          <ul className="list-disc list-inside space-y-2 text-base-content/80">
            <li>Start with common letters like E, A, R, and S</li>
            <li>Look for common words like "THE", "AND", "OF"</li>
            <li>Pay attention to single-letter words (usually "A" or "I")</li>
            <li>Use the revealed letters as anchors for your guesses</li>
            <li>Think about word patterns and letter frequency</li>
            <li>Double-check your substitutions before confirming</li>
          </ul>
        </div>

        {/* Multiplayer */}
        <div className="mb-6">
          <h3 className="font-bold text-xl mb-3 text-base-content">Playing with Friends</h3>
          <p className="text-base-content/80 leading-relaxed">
            Create a custom game with your own message and challenge your friends! You can also view your friends' progress 
            on the leaderboard. Compete to see who can solve puzzles the fastest and most accurately.
          </p>
        </div>

        {/* Curated Packs */}
        <div className="mb-6">
          <h3 className="font-bold text-xl mb-3 text-base-content">Curated Packs</h3>
          <p className="text-base-content/80 leading-relaxed">
            Browse our collection of themed cryptogram packs. Each pack contains puzzles organized by category, 
            from famous quotes to movie lines and more. Pick a puzzle from any pack to start playing!
          </p>
        </div>

        {/* Footer */}
        <div className="modal-action mt-8">
          <button className="btn btn-primary" onClick={onClose}>
            Got It!
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
