import React, { useState, useEffect } from 'react';
import Chessboard from 'chessboardjsx';
import { io } from 'socket.io-client';
import { Chess } from 'chess.js';
import './design.css';


const socket = io('http://localhost:8000');

const App = () => {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [gameId, setGameId] = useState(null);
  const [color, setColor] = useState('w');
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [joinGameClicked, setJoinGameClicked] = useState(false);
  const [inputGameId, setInputGameId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    socket.on('gameCreated', ({ gameId, color }) => {
      setGameId(gameId);
      setColor(color);
      setErrorMessage('');
    });

    socket.on('gameJoined', ({ gameId, color, fen }) => {
      setGameId(gameId);
      setColor(color);
      const newGame = new Chess();
      newGame.load(fen);
      setGame(newGame);
      setFen(fen);
      setIsGameStarted(true);
      setErrorMessage('');
    });

    socket.on('startGame', ({ fen }) => {
      const newGame = new Chess();
      newGame.load(fen);
      setGame(newGame);
      setFen(fen);
      setIsGameStarted(true);
      setErrorMessage('');
    });

    socket.on('moveMade', ({ fen }) => {
      const newGame = new Chess();
      newGame.load(fen);
      setGame(newGame);
      setFen(fen);
    });

    socket.on('invalidMove', (fen) => {
      setFen(fen);
    });

    socket.on('error', (message) => {
      setErrorMessage(message);
    });

    return () => {
      socket.off('gameCreated');
      socket.off('gameJoined');
      socket.off('startGame');
      socket.off('moveMade');
      socket.off('invalidMove');
      socket.off('error');
    };
  }, []);

  const handleCreateGame = () => {
    socket.emit('createGame');
    setJoinGameClicked(false); // Hide the join game option after creating a game
  };

  const handleJoinGame = () => {
    setJoinGameClicked(true); // Show the join game input field
  };

  const handleJoinGameSubmit = () => {
    if (inputGameId) {
      socket.emit('joinGame', inputGameId);
    } else {
      setErrorMessage('Please enter a valid game ID.');
    }
  };

  const handleMove = ({ sourceSquare, targetSquare }) => {
    if (game.turn() !== color[0]) return;

    const gameCopy = new Chess(game.fen());
    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    if (move) {
      setGame(gameCopy);
      setFen(gameCopy.fen());
      socket.emit('makeMove', { gameId, move });
    } else {
      setFen(game.fen());
    }
  };

  return (
    <div className="container">
      <h1>Chess Game</h1>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {!isGameStarted && (
        <div>
          <div className="button-container">
            <button onClick={handleCreateGame}>Create Game</button>
            <button onClick={handleJoinGame}>Join Game</button>
          </div>
          {gameId && (
            <div className="game-id">
              <p>Game ID: {gameId}</p>
              <p>Waiting for player to join...</p>
            </div>
          )}
          {joinGameClicked && (
            <div className="join-game-input">
              <input
                type="text"
                placeholder="Enter Game ID"
                value={inputGameId}
                onChange={(e) => setInputGameId(e.target.value)}
              />
              <button onClick={handleJoinGameSubmit}>Join</button>
            </div>
          )}
        </div>
      )}
      {isGameStarted && (
        <div className="chessboard-container">
          <Chessboard
            position={fen}
            onDrop={({ sourceSquare, targetSquare }) =>
              handleMove({ sourceSquare, targetSquare })
            }
            orientation={color === 'w' ? 'white' : 'black'}
          />
        </div>
      )}
      <footer className="footer">Developed by Abhishek Duseja</footer>
    </div>
  );
};

export default App;
