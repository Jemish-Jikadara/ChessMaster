const socket = io();

const findMatchBtn = document.getElementById("findMatchBtn");
const matchStatus = document.getElementById("matchStatus");

findMatchBtn.addEventListener("click", () => {
  const player = {
    username: window.currentUsername || "Player"
  };

  findMatchBtn.disabled = true;
  findMatchBtn.textContent = "Searching...";
  matchStatus.textContent = "Looking for opponent...";

  socket.emit("findMatch", player);
});

socket.on("waitingForOpponent", () => {
  matchStatus.textContent = "Waiting for another player...";
});

socket.on("matchFound", ({ roomId, color, opponent }) => {
  matchStatus.textContent = "Match found. Starting game...";

  sessionStorage.setItem("onlineRoomId", roomId);
  sessionStorage.setItem("onlineColor", color);
  sessionStorage.setItem("onlineOpponent", JSON.stringify(opponent));

  window.location.href = "/online/play";
});