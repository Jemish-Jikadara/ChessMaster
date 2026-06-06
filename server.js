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

app.use(
  session({
    secret: process.env.SESSION_SECRET || "chessmastersecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI
    }),
    cookie: {
  maxAge: 1000 * 60 * 60 * 24 * 7,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax"
}
  })
);

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
app.use((req, res) => {
  res.status(404).render("error");
});
let waitingPlayer = null;

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
socket.on("findMatch", ({ player, timeControl }) => {
    if (waitingPlayer && 
        waitingPlayer.socketId !== socket.id &&
        waitingPlayer.timeControl.mode === timeControl.mode &&
        waitingPlayer.timeControl.minutes === timeControl.minutes &&
        waitingPlayer.timeControl.increment === timeControl.increment) {
        const roomId = `room-${waitingPlayer.socketId}-${socket.id}`;

        socket.join(roomId);
        io.sockets.sockets.get(waitingPlayer.socketId)?.join(roomId);

        const tc = waitingPlayer.timeControl || timeControl;

        io.to(waitingPlayer.socketId).emit("matchFound", {
            roomId,
            color: "w",
            opponent: player,
            timeControl: tc
        });

        socket.emit("matchFound", {
            roomId,
            color: "b",
            opponent: waitingPlayer.player,
            timeControl: tc
        });

        waitingPlayer = null;
    } else {
        waitingPlayer = {
            socketId: socket.id,
            player,
            timeControl
        };

        socket.emit("waitingForOpponent");
    }
});

  socket.on("joinOnlineRoom", ({ roomId }) => {
    socket.join(roomId);
  });

  socket.on("onlineMove", ({ roomId, move }) => {
    socket.to(roomId).emit("opponentMove", move);
  });

  socket.on("disconnect", () => {
    if (waitingPlayer && waitingPlayer.socketId === socket.id) {
      waitingPlayer = null;
    }

    console.log("Socket disconnected:", socket.id);
  });
});
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});