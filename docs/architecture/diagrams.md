# Architecture And UML Diagrams

## System Architecture

```mermaid
flowchart LR
  Browser[Browser]
  ReactApp[React SPA<br/>Vite + React Router]
  Providers[AuthProvider<br/>GameRefreshProvider]
  Pages[Route Pages]
  Components[Gameplay + UI Components]
  Hook[useCryptogramGame]
  Domain[Domain Classes<br/>CryptogramGame<br/>CryptogramSessionFactory]
  Algorithms[Algorithm Library<br/>cryptogramDsa.js]
  Services[Workflow Services<br/>GameServices.js]
  Repositories[Supabase Repositories]
  Supabase[(Supabase<br/>Auth + Postgres + RPC)]
  Analytics[Vercel Analytics]

  Browser --> ReactApp
  ReactApp --> Providers
  Providers --> Pages
  Pages --> Components
  Components --> Hook
  Hook --> Domain
  Domain --> Algorithms
  Pages --> Services
  Services --> Domain
  Services --> Repositories
  Pages --> Repositories
  Repositories --> Supabase
  ReactApp --> Analytics
```

## Gameplay Sequence

```mermaid
sequenceDiagram
  actor Player
  participant Page as Game Page
  participant Engine as GameEngine
  participant Hook as useCryptogramGame
  participant Domain as CryptogramGame
  participant Repo as GameSessionRepository
  participant Complete as GameCompletionService

  Page->>Repo: findByGameId(gameId)
  Repo-->>Page: persisted session
  Page->>Engine: render message + session
  Engine->>Hook: initialize gameplay state
  Hook->>Domain: buildBoard(guesses, revealedIndices)
  Domain-->>Hook: board cells
  Player->>Engine: choose a letter
  Engine->>Hook: guessLetter(index, letter)
  Hook->>Domain: moveToNextIndex(index, nextRevealed)
  Domain-->>Hook: next active index
  Hook-->>Engine: updated board/lives/completion
  Engine->>Repo: updateProgress(...) on unmount
  alt puzzle solved
    Engine->>Complete: markSolved(...)
    Complete-->>Engine: pair score data or null
  end
```

## UML Class Diagram

```mermaid
classDiagram
  class GameCreationService {
    +createFriendGame({senderId, receiverId, promptText}) Promise
  }

  class SinglePlayerGameService {
    +createOrFindGame(progress, userId) Promise
  }

  class DailyPuzzleService {
    +loadToday(user) Promise
    +recordLoss(userId, attemptsUsed) Promise
    +recordCompletion(userId, attemptsUsed, bestTimeSeconds) Promise
  }

  class GameCompletionService {
    +markSolved(options) Promise
    +closeFinishedGame(options) Promise
    +giveUp(gameId) Promise
  }

  class GameRepository {
    +findInProgressGame(gameId) Promise
    +countInProgressFromSenderToReceiver(senderId, receiverId) Promise
    +createSinglePlayerGame(promptId, difficulty) Promise
    +createNewGameViaRpc(payload) Promise
    +markSolved(gameId) Promise
    +markGaveUp(gameId) Promise
    +deleteGame(gameId) Promise
    +findPromptId(gameId) Promise
  }

  class GameSessionRepository {
    +findByGameId(gameId) Promise
    +findByMessageAndUser(message, userId) Promise
    +create(record) Promise
    +updateProgress(sessionId, userId, progress) Promise
    +reset(sessionId, resetSession) Promise
    +deleteBySessionId(sessionId) Promise
    +deleteByGameId(gameId) Promise
  }

  class CryptogramSessionFactory {
    +createFromPrompt(promptText, options) CryptogramSession
    +createDailySession(promptText, puzzleDate) CryptogramSession
    +createResetSession(existingSession, message) CryptogramSession
  }

  class CryptogramSession {
    +toDatabaseRecord(extraFields) Object
    +toHookState() Object
  }

  class CryptogramGame {
    +getLetterToIndices() Object
    +getCryptogramNumbers() Object
    +getTotalLetters() Number
    +buildBoard(guesses, revealedIndices) Array
    +getDisabledKeys(letterToIndices, revealedIndices) Set
    +getPartiallyRevealedKeys(letterToIndices, revealedIndices) Set
    +moveToNextIndex(currentIndex, revealedIndices) Number
    +chooseHintIndex(revealedIndices) Number
  }

  GameCreationService --> GameRepository
  GameCreationService --> CryptogramSessionFactory
  SinglePlayerGameService --> GameRepository
  SinglePlayerGameService --> GameSessionRepository
  SinglePlayerGameService --> CryptogramSessionFactory
  DailyPuzzleService --> CryptogramSessionFactory
  GameCompletionService --> GameRepository
  GameCompletionService --> GameSessionRepository
  CryptogramSessionFactory --> CryptogramSession
  CryptogramGame --> CryptogramSession
```
