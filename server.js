require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");

const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const gameRoutes = require("./src/routes/gameRoutes");
const pageRoutes = require("./src/routes/pageRoutes");
const settingsRoutes = require("./src/routes/settingsRoutes");
const friendRoutes = require("./src/routes/friendRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3000;

connectDB();
app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "chessmastersecret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  }
}));

app.use(flash());
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use("/", authRoutes);
app.use("/", gameRoutes);
app.use("/", pageRoutes);
app.use("/", settingsRoutes);
app.use("/", friendRoutes);
app.use((req, res) => { res.status(404).render("error"); });

let waitingPlayer = null;

// roomId => { sockets: Set, moved: bool, firstMoveTimer: timeout }
const rooms = {};
const socketToRoom = {};
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // ── MATCHMAKING ──
  socket.on("findMatch", ({ player, timeControl }) => {
    if (waitingPlayer &&
        waitingPlayer.socketId !== socket.id &&
        waitingPlayer.timeControl.mode === timeControl.mode &&
        waitingPlayer.timeControl.minutes === timeControl.minutes &&
        waitingPlayer.timeControl.increment === timeControl.increment) {

      const roomId = `room-${waitingPlayer.socketId}-${socket.id}`;
      const tc = waitingPlayer.timeControl || timeControl;

      socket.join(roomId);
      io.sockets.sockets.get(waitingPlayer.socketId)?.join(roomId);

      // Room create karo
      rooms[roomId] = {
        sockets: new Set([waitingPlayer.socketId, socket.id]),
        moved: false,
        firstMoveTimer: null
      };

      // 1 min first move timer shuru karo
      rooms[roomId].firstMoveTimer = setTimeout(() => {
        if (rooms[roomId] && !rooms[roomId].moved) {
          io.to(roomId).emit("firstMoveTimeout");
          clearRoom(roomId);
        }
      }, 60000);

      io.to(waitingPlayer.socketId).emit("matchFound", {
        roomId, color: "w", opponent: player, timeControl: tc
      });

      socket.emit("matchFound", {
        roomId, color: "b", opponent: waitingPlayer.player, timeControl: tc
      });

      waitingPlayer = null;

    } else {
      waitingPlayer = { socketId: socket.id, player, timeControl };
      socket.emit("waitingForOpponent");
    }
  });

socket.on("joinOnlineRoom", ({ roomId }) => {
    socket.join(roomId);
    socketToRoom[socket.id] = roomId;

    if (rooms[roomId]) {
      rooms[roomId].sockets.add(socket.id);
    }
  });

  // ── MOVE ──
  socket.on("onlineMove", ({ roomId, move }) => {
    if (rooms[roomId] && !rooms[roomId].moved) {
      rooms[roomId].moved = true;
      clearTimeout(rooms[roomId].firstMoveTimer);
      rooms[roomId].firstMoveTimer = null;
    }
    socket.to(roomId).emit("opponentMove", move);
  });

  // ── RESIGN ──
  socket.on("resign", ({ roomId }) => {
    socket.to(roomId).emit("opponentResigned");
    clearRoom(roomId);
  });

  // ── DRAW ──
  socket.on("offerDraw", ({ roomId }) => {
    socket.to(roomId).emit("drawOffered");
  });

  socket.on("acceptDraw", ({ roomId }) => {
    socket.to(roomId).emit("drawAccepted");
    clearRoom(roomId);
  });

  socket.on("declineDraw", ({ roomId }) => {
    socket.to(roomId).emit("drawDeclined");
  });

  // ── ABORT ──
  socket.on("abortGame", ({ roomId }) => {
    socket.to(roomId).emit("gameAborted");
    clearRoom(roomId);
  });

  // ── DISCONNECT ──
  socket.on("disconnect", () => {
    if (waitingPlayer && waitingPlayer.socketId === socket.id) {
      waitingPlayer = null;
    }
    const roomId = socketToRoom[socket.id];
    if (roomId && rooms[roomId]) {
      socket.to(roomId).emit("opponentDisconnected");
      rooms[roomId].sockets.delete(socket.id);
    }

    delete socketToRoom[socket.id];
    console.log("Socket disconnected:", socket.id);
  });
});

function clearRoom(roomId) {
  if (rooms[roomId]) {
    clearTimeout(rooms[roomId].firstMoveTimer);
    delete rooms[roomId];
  }
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});