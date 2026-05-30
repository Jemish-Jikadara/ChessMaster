const User = require("../models/User");

// ── Search users ──────────────────────────────
async function searchUsers(req, res) {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ success: true, users: [] });
    }

    const users = await User.find({
      username: { $regex: q.trim(), $options: "i" },
      _id: { $ne: req.session.user.id }
    })
      .select("username fullName country")
      .limit(10)
      .lean();

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ── Send friend request ───────────────────────
async function sendFriendRequest(req, res) {
  try {
    const { userId } = req.body;
    const myId = req.session.user.id;

    if (userId === myId) {
      return res.json({ success: false, message: "Cannot add yourself." });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.json({ success: false, message: "User not found." });
    }

    // Already friends?
    if (targetUser.friends.includes(myId)) {
      return res.json({ success: false, message: "Already friends." });
    }

    // Request already sent?
    if (targetUser.friendRequests.includes(myId)) {
      return res.json({ success: false, message: "Request already sent." });
    }

    targetUser.friendRequests.push(myId);
    await targetUser.save();

    res.json({ success: true, message: "Friend request sent!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ── Accept friend request ─────────────────────
async function acceptFriendRequest(req, res) {
  try {
    const { userId } = req.body;
    const myId = req.session.user.id;

    const me = await User.findById(myId);
    const them = await User.findById(userId);

    if (!me || !them) {
      return res.json({ success: false, message: "User not found." });
    }

    // Remove from requests
    me.friendRequests = me.friendRequests.filter(
      id => id.toString() !== userId
    );

    // Add to friends both sides
    if (!me.friends.includes(userId)) me.friends.push(userId);
    if (!them.friends.includes(myId)) them.friends.push(myId);

    await me.save();
    await them.save();

    res.json({ success: true, message: "Friend added!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ── Decline friend request ────────────────────
async function declineFriendRequest(req, res) {
  try {
    const { userId } = req.body;
    const myId = req.session.user.id;

    await User.findByIdAndUpdate(myId, {
      $pull: { friendRequests: userId }
    });

    res.json({ success: true, message: "Request declined." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ── Remove friend ─────────────────────────────
async function removeFriend(req, res) {
  try {
    const { userId } = req.body;
    const myId = req.session.user.id;

    await User.findByIdAndUpdate(myId, { $pull: { friends: userId } });
    await User.findByIdAndUpdate(userId, { $pull: { friends: myId } });

    res.json({ success: true, message: "Friend removed." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ── Get friend requests ───────────────────────
async function getFriendRequests(req, res) {
  try {
    const me = await User.findById(req.session.user.id)
      .populate("friendRequests", "username fullName country")
      .lean();

    res.json({ success: true, requests: me.friendRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFriendRequests
};