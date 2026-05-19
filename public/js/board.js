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
const gameArea = document.getElementById("gameArea");
const whiteClock = document.getElementById("whiteClock");
const blackClock = document.getElementById("blackClock");
const changeTimeBtn = document.getElementById("changeTimeBtn");

const game = new Chess();

let selectedSquare = null;
let selectedMinutes = 0;
let legalMoves = [];
let lastMove = null;
let selectedMode = null;
let incrementSeconds = 0;
let whiteTime = 0;
let blackTime = 0;
let timerInterval = null;
let gameStarted = false;

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
  chessBoard.innerHTML = "";

  const board = game.board();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const squareName = getSquareName(row, col);
      const square = document.createElement("div");
      const isLightSquare = (row + col) % 2 === 0;
      const isSelected = selectedSquare === squareName;
      const legalMove = legalMoves.find((move) => move.to === squareName);
      const isLastMoveSquare =
  lastMove &&
  (lastMove.from === squareName || lastMove.to === squareName);
      const piece = board[row][col];
      const isCheckedKing = isKingInCheck(piece);

      square.className = `
  aspect-square relative flex items-center justify-center
  ${isLightSquare ? "bg-stone-200" : "bg-red-700"}
  ${isSelected ? "ring-4 ring-yellow-400 ring-inset" : ""}
  hover:brightness-110 transition
`;

if (isCheckedKing) {
  square.style.backgroundColor = "#dc2626";
  square.style.boxShadow = "inset 0 0 0 4px rgba(254, 202, 202, 0.9)";
}

if (isLastMoveSquare && !isCheckedKing) {
  square.style.backgroundColor = isLightSquare ? "#fef08a" : "#ca8a04";
}
      if (legalMove) {
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
        img.draggable = false;

        square.appendChild(img);
      }

      square.addEventListener("click", () => {
        handleSquareClick(squareName);
      });

      chessBoard.appendChild(square);
    }
  }
}

function handleSquareClick(squareName) {
  if (!gameStarted) return;
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
  lastMove = {
    from: move.from,
    to: move.to
  };

  applyIncrement(move.color);

  selectedSquare = null;
  legalMoves = [];
  updateInfo();
  updateClocks();
  createBoard();
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
function updateClocks() {
  whiteClock.textContent = formatTime(whiteTime);
  blackClock.textContent = formatTime(blackTime);

  const whiteClockBox = whiteClock.closest(".cm-clock");
  const blackClockBox = blackClock.closest(".cm-clock");

  whiteClockBox.classList.toggle("cm-active", game.turn() === "w" && gameStarted);
  blackClockBox.classList.toggle("cm-active", game.turn() === "b" && gameStarted);

  whiteClockBox.classList.toggle("cm-low-time", whiteTime <= 10);
  blackClockBox.classList.toggle("cm-low-time", blackTime <= 10);
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}
function startTimer() {
  gameStarted = true;

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (game.in_checkmate() || game.in_draw()) {
      clearInterval(timerInterval);
      gameStarted = false;
      updateClocks();
      return;
    }

    if (game.turn() === "w") {
      whiteTime -= 1;
    } else {
      blackTime -= 1;
    }

    if (whiteTime <= 0 || blackTime <= 0) {
      clearInterval(timerInterval);
      gameStarted = false;

      if (whiteTime <= 0) {
        gameStatus.textContent = "Black wins on time";
        gameStatus.className = "font-bold text-red-400";
      }

      if (blackTime <= 0) {
        gameStatus.textContent = "White wins on time";
        gameStatus.className = "font-bold text-red-400";
      }
    }

    updateClocks();
  }, 1000);
}
function applyIncrement(moveColor) {
  if (incrementSeconds <= 0) return;

  if (moveColor === "w") {
    whiteTime += incrementSeconds;
  } else {
    blackTime += incrementSeconds;
  }
}
saveGameBtn.addEventListener("click", async () => {
  const whitePlayer = whitePlayerInput.value.trim() || "White Player";
  const blackPlayer = blackPlayerInput.value.trim() || "Black Player";

  const history = game.history();

  if (history.length === 0) {
    alert("Please play at least one move before saving.");
    return;
  }

  const winner = getWinner();

  try {
    const response = await fetch("/api/games", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
  whitePlayer,
  blackPlayer,
  winner,
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

function getWinner() {
  if (game.in_draw()) {
    return "draw";
  }

  if (game.in_checkmate()) {
    return game.turn() === "w" ? "black" : "white";
  }

  return "draw";
}
restartBtn.addEventListener("click", () => {
  game.reset();

  selectedSquare = null;
  legalMoves = [];
  lastMove = null;

  clearInterval(timerInterval);
  gameStarted = false;

  if (selectedMode) {
    const selectedButton = document.querySelector(
      `[data-mode="${selectedMode}"][data-increment="${incrementSeconds}"]`
    );

    if (selectedButton) {
      const minutes = Number(selectedButton.dataset.minutes);
      whiteTime = minutes * 60;
      blackTime = minutes * 60;
    }
  }

  updateInfo();
  updateClocks();
  createBoard();
});
document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedMode = button.dataset.mode;
    incrementSeconds = Number(button.dataset.increment);

    const minutes = Number(button.dataset.minutes);
    selectedMinutes = minutes;
    whiteTime = minutes * 60;
    blackTime = minutes * 60;

    timeControlScreen.style.display = "none";
    gameArea.style.display = "grid";

    updateClocks();
    startTimer();
  });
});
changeTimeBtn.addEventListener("click", () => {
  clearInterval(timerInterval);

  game.reset();
  selectedSquare = null;
  legalMoves = [];
  lastMove = null;
  selectedMode = null;
  incrementSeconds = 0;
  whiteTime = 0;
  blackTime = 0;
  gameStarted = false;

  updateInfo();
  updateClocks();
  createBoard();

  gameArea.style.display = "none";
  timeControlScreen.style.display = "block";
});
createBoard();
updateInfo();
