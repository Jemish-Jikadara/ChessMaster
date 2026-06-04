const socket = io();

const onlineChessBoard = document.getElementById("onlineChessBoard");
const onlineGameOverModal = document.getElementById("onlineGameOverModal");
const onlineGameOverTitle = document.getElementById("onlineGameOverTitle");
const onlineGameOverMessage = document.getElementById("onlineGameOverMessage");
const onlineCloseGameOverBtn = document.getElementById("onlineCloseGameOverBtn");
const onlineSaveGameBtn = document.getElementById("onlineSaveGameBtn");
const playerColorLabel = document.getElementById("playerColorLabel");
const onlineTurnLabel = document.getElementById("onlineTurnLabel");
const onlineStatusLabel = document.getElementById("onlineStatusLabel");
const onlineMoveHistory = document.getElementById("onlineMoveHistory");
const opponentName = document.getElementById("opponentName");
const onlineGameInfo = document.getElementById("onlineGameInfo");

const roomId = sessionStorage.getItem("onlineRoomId");
const playerColor = sessionStorage.getItem("onlineColor");
const opponent = JSON.parse(sessionStorage.getItem("onlineOpponent") || "{}");

const game = new Chess();

let selectedSquare = null;
let legalMoves = [];
let lastMove = null;
let gameOver = false;

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

if (!roomId || !playerColor) {
  window.location.href = "/online";
}

socket.emit("joinOnlineRoom", { roomId });

playerColorLabel.textContent = playerColor === "w" ? "White" : "Black";
opponentName.textContent = opponent.username || "Opponent";
onlineGameInfo.textContent = `Room: ${roomId}`;

function createOnlineBoard() {
  onlineChessBoard.innerHTML = "";
  onlineChessBoard.classList.toggle("cm-board-flipped", playerColor === "b");

  const board = game.board();
  const rows = [0,1,2,3,4,5,6,7];
const cols = [0,1,2,3,4,5,6,7];
  rows.forEach((row) => {
    cols.forEach((col) => {
      const squareName = getSquareName(row, col);
      const square = document.createElement("div");
      const displayRow = rows.indexOf(row);
const displayCol = cols.indexOf(col);
const isLightSquare = (row + col) % 2 === 0;
      const isSelected = selectedSquare === squareName;
      const legalMove = legalMoves.find((move) => move.to === squareName);
      const piece = board[row][col];

      const isLastMoveSquare =
        lastMove &&
        (lastMove.from === squareName || lastMove.to === squareName);

      square.className = `
        aspect-square relative flex items-center justify-center
        ${isLightSquare ? "bg-stone-200" : "bg-red-700"}
        ${isSelected ? "ring-4 ring-yellow-400 ring-inset" : ""}
        hover:brightness-110 transition
      `;

      if (isLastMoveSquare) {
        square.style.backgroundColor = isLightSquare ? "#fef08a" : "#ca8a04";
      }

      if (legalMove) {
        const moveMark = document.createElement("div");
        moveMark.style.position = "absolute";
        moveMark.style.pointerEvents = "none";
        moveMark.style.zIndex = "20";
        moveMark.style.width = legalMove.captured ? "78%" : "16px";
        moveMark.style.height = legalMove.captured ? "78%" : "16px";
        moveMark.style.borderRadius = "50%";

        if (legalMove.captured) {
          moveMark.style.border = "5px solid rgba(250, 204, 21, 0.85)";
        } else {
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

        square.appendChild(img);
      }

      square.addEventListener("click", () => {
        handleOnlineSquareClick(squareName);
      });

      onlineChessBoard.appendChild(square);
    });
  });
}

function handleOnlineSquareClick(squareName) {
  if (gameOver || game.game_over()) return;
  if (game.turn() !== playerColor) return;

  const piece = game.get(squareName);

  if (!selectedSquare) {
    if (!piece) return;
    if (piece.color !== playerColor) return;

    selectedSquare = squareName;
    legalMoves = game.moves({
      square: squareName,
      verbose: true
    });

    createOnlineBoard();
    return;
  }

  const move = game.move({
    from: selectedSquare,
    to: squareName,
    promotion: "q"
  });

  if (move) {
    afterOnlineMove(move);

    socket.emit("onlineMove", {
      roomId,
      move: {
        from: move.from,
        to: move.to,
        promotion: "q"
      }
    });

    return;
  }

  if (piece && piece.color === playerColor) {
    selectedSquare = squareName;
    legalMoves = game.moves({
      square: squareName,
      verbose: true
    });
    createOnlineBoard();
    return;
  }

  selectedSquare = null;
  legalMoves = [];
  createOnlineBoard();
}

socket.on("opponentMove", (moveData) => {
  const move = game.move(moveData);

  if (!move) return;

  afterOnlineMove(move);
});

socket.on("opponentDisconnected", () => {
  onlineStatusLabel.textContent = "Opponent left";
  onlineStatusLabel.style.color = "#ef4444";
});

function afterOnlineMove(move) {
  lastMove = {
    from: move.from,
    to: move.to
  };

  selectedSquare = null;
  legalMoves = [];

  updateOnlineInfo();
checkOnlineGameOver();
  createOnlineBoard();
}
function checkOnlineGameOver() {
  if (game.in_checkmate()) {
    const winnerColor = game.turn() === "w" ? "Black" : "White";
    finishOnlineGame("Checkmate", `${winnerColor} wins by checkmate.`);
    return;
  }

  if (game.in_draw()) {
    finishOnlineGame("Draw", "The game ended in a draw.");
  }
}

function finishOnlineGame(title, message) {
  gameOver = true;

  selectedSquare = null;
  legalMoves = [];

  if (onlineGameOverModal) {
    onlineGameOverModal.style.display = "grid";
  }

  if (onlineGameOverTitle) {
    onlineGameOverTitle.textContent = title;
  }

  if (onlineGameOverMessage) {
    onlineGameOverMessage.textContent = message;
  }
}
function updateOnlineInfo() {
  onlineTurnLabel.textContent = game.turn() === "w" ? "White" : "Black";

  if (game.in_checkmate()) {
    onlineStatusLabel.textContent = "Checkmate";
    onlineStatusLabel.style.color = "#ef4444";
  } else if (game.in_check()) {
    onlineStatusLabel.textContent = "Check";
    onlineStatusLabel.style.color = "#facc15";
  } else if (game.in_draw()) {
    onlineStatusLabel.textContent = "Draw";
    onlineStatusLabel.style.color = "#60a5fa";
  } else {
    onlineStatusLabel.textContent = "Active";
    onlineStatusLabel.style.color = "#facc15";
  }

  const history = game.history({ verbose: true });

  if (history.length === 0) {
    onlineMoveHistory.innerHTML = `<p>No moves yet.</p>`;
    return;
  }

  onlineMoveHistory.innerHTML = history
    .map((move, index) => {
      return `
        <div class="cm-online-move-item">
          <strong>${index + 1}.</strong>
          ${move.san}
          <span style="color:#94a3b8">(${move.from} → ${move.to})</span>
        </div>
      `;
    })
    .join("");
}

function getSquareName(row, col) {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const rank = 8 - row;

  return `${files[col]}${rank}`;
}
if (onlineCloseGameOverBtn) {
  onlineCloseGameOverBtn.addEventListener("click", () => {
    onlineGameOverModal.style.display = "none";
  });
}
createOnlineBoard();
updateOnlineInfo();