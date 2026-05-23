const chessBoard = document.getElementById("chessBoard");
const turnIndicator = document.getElementById("turnIndicator");
const gameStatus = document.getElementById("gameStatus");
const moveHistory = document.getElementById("moveHistory");
const moveCount = document.getElementById("moveCount");
const restartBtn = document.getElementById("restartBtn");
const saveGameBtn = document.getElementById("saveGameBtn");
const whitePlayerInput = document.getElementById("whitePlayer");
const blackPlayerInput = document.getElementById("blackPlayer");
const timeControlScreen = document.getElementById("timeControlScreen");
const playerSetupScreen = document.getElementById("playerSetupScreen");
const gameArea = document.getElementById("gameArea");
const whiteClock = document.getElementById("whiteClock");
const blackClock = document.getElementById("blackClock");
const changeTimeBtn = document.getElementById("changeTimeBtn");
const startGameBtn = document.getElementById("startGameBtn");
const confirmPlayersBtn = document.getElementById("confirmPlayersBtn");
const prevMoveBtn = document.getElementById("prevMoveBtn");
const nextMoveBtn = document.getElementById("nextMoveBtn");
const reviewStatus = document.getElementById("reviewStatus");
const gameOverModal = document.getElementById("gameOverModal");
const gameOverTitle = document.getElementById("gameOverTitle");
const gameOverMessage = document.getElementById("gameOverMessage");
const newGameBtn = document.getElementById("newGameBtn");
const gameOverSaveBtn = document.getElementById("gameOverSaveBtn");

const game = new Chess();

let selectedSquare = null;
let legalMoves = [];
let lastMove = null;
let draggedSquare = null;

let selectedMode = null;
let selectedMinutes = 0;
let incrementSeconds = 0;
let whiteTime = 0;
let blackTime = 0;
let timerInterval = null;
let gameStarted = false;
let gameId = null;
let gameOver = false;

let positionHistory = [game.fen()];
let reviewIndex = 0;
let isReviewing = false;

const pieceImages = {
  wp: "white-pawn",
  wr: "white-rook",
  wn: "white-knight",
  wb: "white-bishop",
  wq: "white-queen",
  wk: "white-king",
  bp: "black-pawn",
  br: "black-rook",
  bn: "black-knight",
  bb: "black-bishop",
  bq: "black-queen",
  bk: "black-king"
};

function createBoard() {
  if (!chessBoard) return;

  chessBoard.innerHTML = "";
  let displayGame = game;

  if (isReviewing) {
    displayGame = new Chess();
    // BUG 3 FIX: chess.js v0.10.3 load() returns undefined, not true/false.
    // Simply call load() without checking the return value.
    displayGame.load(positionHistory[reviewIndex]);
  }

  const board = displayGame.board();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const squareName = getSquareName(row, col);
      const square = document.createElement("div");
      const isLightSquare = (row + col) % 2 === 0;
      const isSelected = selectedSquare === squareName;
      const legalMove = legalMoves.find((move) => move.to === squareName);
      const piece = board[row][col];

      const isLastMoveSquare =
        !isReviewing &&
        lastMove &&
        (lastMove.from === squareName || lastMove.to === squareName);

      const isCheckedKing = !isReviewing && isKingInCheck(piece);

      square.className = `
        aspect-square relative flex items-center justify-center
        ${isLightSquare ? "bg-stone-200" : "bg-red-700"}
        ${isSelected ? "ring-4 ring-yellow-400 ring-inset" : ""}
        hover:brightness-110 transition
      `;

      if (isCheckedKing) {
        square.style.backgroundColor = "#dc2626";
        square.style.boxShadow = "inset 0 0 0 4px rgba(254, 202, 202, 0.9)";
      } else if (isLastMoveSquare) {
        square.style.backgroundColor = isLightSquare ? "#fef08a" : "#ca8a04";
      }

      if (!isReviewing && legalMove) {
        const moveMark = document.createElement("div");
        moveMark.style.position = "absolute";
        moveMark.style.pointerEvents = "none";
        moveMark.style.zIndex = "20";

        if (legalMove.captured) {
          moveMark.style.width = "78%";
          moveMark.style.height = "78%";
          moveMark.style.borderRadius = "50%";
          moveMark.style.border = "5px solid rgba(250, 204, 21, 0.85)";
        } else {
          moveMark.style.width = "16px";
          moveMark.style.height = "16px";
          moveMark.style.borderRadius = "50%";
          moveMark.style.backgroundColor = "rgba(250, 204, 21, 0.9)";
        }

        square.appendChild(moveMark);
      }

      if (piece) {
        const img = document.createElement("img");
        const imageName = pieceImages[piece.color + piece.type];

        img.src = `/images/pieces/${imageName}.png`;
        img.alt = imageName;
        img.className = "relative z-30 w-[78%] h-[78%] object-contain cursor-pointer select-none";
        img.draggable = !isReviewing && !gameOver;
        img.style.touchAction = "none";

        img.addEventListener("dragstart", (event) => {
          handleDragStart(event, squareName, piece);
        });

        img.addEventListener("dragend", () => {
          if (draggedSquare) {
            draggedSquare = null;
            selectedSquare = null;
            legalMoves = [];
            createBoard();
          }
        });

        square.appendChild(img);
      }

      square.addEventListener("click", () => {
        handleSquareClick(squareName);
      });

      square.addEventListener("dragover", (event) => {
        event.preventDefault();
      });

      square.addEventListener("drop", (event) => {
        handleDrop(event, squareName);
      });

      chessBoard.appendChild(square);
    }
  }
}

function handleSquareClick(squareName) {
  if (!gameStarted || isReviewing || gameOver) return;

  const piece = game.get(squareName);

  if (!selectedSquare) {
    if (!piece) return;
    if (piece.color !== game.turn()) return;

    selectSquare(squareName);
    return;
  }

  const move = game.move({
    from: selectedSquare,
    to: squareName,
    promotion: "q"
  });

  if (move) {
    afterSuccessfulMove(move);
    return;
  }

  if (piece && piece.color === game.turn()) {
    selectSquare(squareName);
    return;
  }

  selectedSquare = null;
  legalMoves = [];
  createBoard();
}

function handleDragStart(event, squareName, piece) {
  if (!gameStarted || isReviewing || gameOver) {
    event.preventDefault();
    return;
  }

  if (!piece || piece.color !== game.turn()) {
    event.preventDefault();
    return;
  }

  draggedSquare = squareName;
  selectedSquare = squareName;

  legalMoves = game.moves({
    square: squareName,
    verbose: true
  });

  event.dataTransfer.setData("text/plain", squareName);
  event.dataTransfer.effectAllowed = "move";

  setTimeout(() => {
    createBoard();
  }, 0);
}

function handleDrop(event, targetSquare) {
  event.preventDefault();

  if (!gameStarted || isReviewing || gameOver || !draggedSquare) return;

  const move = game.move({
    from: draggedSquare,
    to: targetSquare,
    promotion: "q"
  });

  if (move) {
    draggedSquare = null;
    afterSuccessfulMove(move);
    return;
  }

  draggedSquare = null;
  selectedSquare = null;
  legalMoves = [];
  createBoard();
}

function afterSuccessfulMove(move) {
  lastMove = {
    from: move.from,
    to: move.to
  };

  applyIncrement(move.color);

  positionHistory.push(game.fen());
  reviewIndex = positionHistory.length - 1;
  isReviewing = false;

  selectedSquare = null;
  legalMoves = [];

  updateInfo();
  checkGameOver();
  updateClocks();
  updateReviewControls();
  createBoard();
}

function checkGameOver() {
  if (game.in_checkmate()) {
    const winner = game.turn() === "w" ? "Black" : "White";
    finishGame("Checkmate", `${winner} wins by checkmate.`);
    return;
  }

  if (game.in_draw()) {
    finishGame("Draw", "The game ended in a draw.");
  }
}

function finishGame(title, message) {
  clearInterval(timerInterval);
  gameStarted = false;
  gameOver = true;
  isReviewing = false;
  reviewIndex = positionHistory.length - 1;

  if (gameOverModal) gameOverModal.style.display = "grid";
  if (gameOverTitle) gameOverTitle.textContent = title;
  if (gameOverMessage) gameOverMessage.textContent = message;

  updateReviewControls();
  updateClocks();
  autoSaveGame();
}
async function autoSaveGame() {
  const history = game.history();

  // Koi move nahi kheli toh save mat karo
  if (history.length === 0) return;

  try {
    await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId,
        whitePlayer: whitePlayerInput.value.trim() || "White Player",
        blackPlayer: blackPlayerInput.value.trim() || "Black Player",
        winner: getWinner(),
        timeMode: selectedMode,
        timeControl: `${selectedMinutes}+${incrementSeconds}`,
        increment: incrementSeconds,
        totalMoves: history.length,
        moves: history
      })
    });
  } catch (error) {
    console.error("Auto save failed:", error);
  }
}
function selectSquare(squareName) {
  selectedSquare = squareName;

  legalMoves = game.moves({
    square: squareName,
    verbose: true
  });

  createBoard();
}

function updateInfo() {
  const turn = game.turn() === "w" ? "White" : "Black";
  turnIndicator.textContent = `${turn} to move`;

  if (game.in_checkmate()) {
    gameStatus.textContent = "Checkmate";
    gameStatus.className = "font-bold text-red-400";
  } else if (game.in_check()) {
    gameStatus.textContent = "Check";
    gameStatus.className = "font-bold text-yellow-400";
  } else if (game.in_draw()) {
    gameStatus.textContent = "Draw";
    gameStatus.className = "font-bold text-blue-400";
  } else {
    gameStatus.textContent = "Active";
    gameStatus.className = "font-bold text-green-400";
  }

  const history = game.history({ verbose: true });
  moveCount.textContent = history.length;

  if (history.length === 0) {
    moveHistory.innerHTML = `<p class="text-gray-500">No moves yet.</p>`;
    return;
  }

  moveHistory.innerHTML = history
    .map((move, index) => {
      return `
        <div class="bg-gray-950/70 border border-white/10 rounded-xl px-4 py-3">
          <p class="text-sm">
            <span class="text-yellow-400 font-bold">${index + 1}.</span>
            ${move.san}
            <span class="text-gray-500">(${move.from} → ${move.to})</span>
          </p>
        </div>
      `;
    })
    .join("");
}

function updateClocks() {
  whiteClock.textContent = formatTime(whiteTime);
  blackClock.textContent = formatTime(blackTime);

  const whiteClockBox = whiteClock.closest(".cm-clock");
  const blackClockBox = blackClock.closest(".cm-clock");

  whiteClockBox.classList.toggle("cm-active", game.turn() === "w" && gameStarted);
  blackClockBox.classList.toggle("cm-active", game.turn() === "b" && gameStarted);

  whiteClockBox.classList.toggle("cm-low-time", whiteTime <= 10 && selectedMode);
  blackClockBox.classList.toggle("cm-low-time", blackTime <= 10 && selectedMode);
}

function startTimer() {
  gameStarted = true;
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (gameOver || game.in_checkmate() || game.in_draw()) {
      clearInterval(timerInterval);
      checkGameOver();
      updateClocks();
      return;
    }

    if (game.turn() === "w") {
      whiteTime -= 1;
    } else {
      blackTime -= 1;
    }

    if (whiteTime <= 0 || blackTime <= 0) {
      if (whiteTime <= 0) whiteTime = 0;
      if (blackTime <= 0) blackTime = 0;

      finishGame(
        "Time Out",
        whiteTime <= 0 ? "Black wins on time." : "White wins on time."
      );
    }

    updateClocks();
  }, 1000);
}

function resetGamePosition() {
  game.reset();

  selectedSquare = null;
  legalMoves = [];
  lastMove = null;
  draggedSquare = null;
  gameOver = false;

  positionHistory = [game.fen()];
  reviewIndex = 0;
  isReviewing = false;

  if (gameOverModal) gameOverModal.style.display = "none";

  updateInfo();
  updateReviewControls();
  createBoard();
}

function resetToTimeSelection() {
  clearInterval(timerInterval);

  selectedMode = null;
  selectedMinutes = 0;
  incrementSeconds = 0;
  whiteTime = 0;
  blackTime = 0;
  gameStarted = false;

  resetGamePosition();

  if (startGameBtn) {
    startGameBtn.disabled = false;
    startGameBtn.textContent = "Start Game";
  }

  updateClocks();

  timeControlScreen.style.display = "block";
  playerSetupScreen.style.display = "none";
  gameArea.style.display = "none";
}

function resetToReadyGame() {
  clearInterval(timerInterval);

  gameStarted = false;
  gameOver = false;

  whiteTime = selectedMinutes * 60;
  blackTime = selectedMinutes * 60;

  resetGamePosition();

  if (startGameBtn) {
    startGameBtn.disabled = false;
    startGameBtn.textContent = "Start Game";
  }

  updateClocks();
}

function updateReviewControls() {
  if (!prevMoveBtn || !nextMoveBtn || !reviewStatus) return;

  prevMoveBtn.disabled = reviewIndex <= 0;
  nextMoveBtn.disabled = reviewIndex >= positionHistory.length - 1;

  if (positionHistory.length === 1) {
    reviewStatus.textContent = "Live";
    return;
  }

  reviewStatus.textContent = isReviewing
    ? `Move ${reviewIndex}/${positionHistory.length - 1}`
    : "Live";
}

function isKingInCheck(piece) {
  if (!piece) return false;
  if (piece.type !== "k") return false;
  if (!game.in_check()) return false;

  return piece.color === game.turn();
}

function getSquareName(row, col) {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const rank = 8 - row;
  return `${files[col]}${rank}`;
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function applyIncrement(moveColor) {
  if (incrementSeconds <= 0) return;

  if (moveColor === "w") {
    whiteTime += incrementSeconds;
  } else {
    blackTime += incrementSeconds;
  }
}

function getWinner() {
  if (game.in_draw()) return "draw";

  if (game.in_checkmate()) {
    return game.turn() === "w" ? "black" : "white";
  }

  if (whiteTime <= 0 && selectedMode) return "black";
  if (blackTime <= 0 && selectedMode) return "white";

  return "draw";
}

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    clearInterval(timerInterval);

    selectedMode = button.dataset.mode;
    incrementSeconds = Number(button.dataset.increment);
    selectedMinutes = Number(button.dataset.minutes);

    whiteTime = selectedMinutes * 60;
    blackTime = selectedMinutes * 60;
    gameStarted = false;
    gameOver = false;
    gameId = crypto.randomUUID();

    resetGamePosition();
    updateClocks();

    timeControlScreen.style.display = "none";
    playerSetupScreen.style.display = "block";
    gameArea.style.display = "none";
  });
});

confirmPlayersBtn.addEventListener("click", () => {
  const whiteName = whitePlayerInput.value.trim();
  const blackName = blackPlayerInput.value.trim();

  if (!whiteName || !blackName) {
    alert("Please enter both player names.");
    return;
  }

  playerSetupScreen.style.display = "none";
  gameArea.style.display = "grid";

  if (startGameBtn) {
    startGameBtn.disabled = false;
    startGameBtn.textContent = "Start Game";
  }

  updateInfo();
  updateClocks();
  updateReviewControls();
  createBoard();
});

startGameBtn.addEventListener("click", () => {
  if (!selectedMode) {
    alert("Please select a time control first.");
    return;
  }

  gameStarted = true;
  gameOver = false;
  startGameBtn.disabled = true;
  startGameBtn.textContent = "Game Started";

  updateClocks();
  startTimer();
});

// BUG 2 FIX: restartBtn doesn't exist in the HTML, so guard with a null check.
if (restartBtn) {
  restartBtn.addEventListener("click", () => {
    if (!selectedMode) {
      resetToTimeSelection();
      return;
    }
    resetToReadyGame();
  });
}

changeTimeBtn.addEventListener("click", () => {
  clearInterval(timerInterval);

  gameStarted = false;
  gameOver = false;

  timeControlScreen.style.display = "block";
  playerSetupScreen.style.display = "none";
  gameArea.style.display = "none";
});

newGameBtn.addEventListener("click", () => {
  clearInterval(timerInterval);

  whiteTime = selectedMinutes * 60;
  blackTime = selectedMinutes * 60;

  game.reset();

  selectedSquare = null;
  legalMoves = [];
  lastMove = null;
  draggedSquare = null;

  gameStarted = false;
  gameOver = false;

  positionHistory = [game.fen()];
  reviewIndex = 0;
  isReviewing = false;

  if (gameOverModal) {
    gameOverModal.style.display = "none";
  }

  updateInfo();
  updateClocks();
  updateReviewControls();
  createBoard();

  startGameBtn.disabled = false;
  startGameBtn.textContent = "Start Game";
});

// BUG 1 FIX: Removed nested addEventListener. The original code added a NEW
// listener inside every click, so it never fired on first click and saved
// multiple times on subsequent clicks. Now it's a single, flat listener.
gameOverSaveBtn.addEventListener("click", () => {
  saveGameBtn.dispatchEvent(new Event("click"));
});

prevMoveBtn.onclick = () => {
  if (reviewIndex <= 0) return;

  reviewIndex = Math.max(0, reviewIndex - 1);
  isReviewing = reviewIndex !== positionHistory.length - 1;

  selectedSquare = null;
  legalMoves = [];

  updateReviewControls();
  createBoard();
};

nextMoveBtn.onclick = () => {
  if (reviewIndex >= positionHistory.length - 1) return;

  reviewIndex = Math.min(positionHistory.length - 1, reviewIndex + 1);
  isReviewing = reviewIndex !== positionHistory.length - 1;

  selectedSquare = null;
  legalMoves = [];

  updateReviewControls();
  createBoard();
};

saveGameBtn.addEventListener("click", async () => {
  const whitePlayer = whitePlayerInput.value.trim() || "White Player";
  const blackPlayer = blackPlayerInput.value.trim() || "Black Player";
  const history = game.history();

  if (history.length === 0) {
    alert("Please play at least one move before saving.");
    return;
  }

  try {
    const response = await fetch("/api/games", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        gameId,
        whitePlayer,
        blackPlayer,
        winner: getWinner(),
        timeMode: selectedMode,
        timeControl: `${selectedMinutes}+${incrementSeconds}`,
        increment: incrementSeconds,
        totalMoves: history.length,
        moves: history
      })
    });

    const data = await response.json();

    if (!data.success) {
      alert("Game could not be saved.");
      return;
    }

    alert("Game result saved successfully.");
  } catch (error) {
    alert("Server error. Please try again.");
  }
});

createBoard();
updateInfo();
updateClocks();
updateReviewControls();