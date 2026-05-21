const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
// We use an environment variable for the service account to keep it secure
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
  : require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://gituhabu-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = admin.database();

// 1. Heartbeat Endpoint (to keep Render awake)
app.get("/ping", (req, res) => {
  console.log("Ping received! Staying awake...");
  res.status(200).send("Pong!");
});

// 2. Secure Spend Gold Endpoint
app.post("/spend-gold", async (req, res) => {
  const { uid, amount } = req.body;

  if (!uid || amount === undefined) {
    return res.status(400).json({ error: "Missing uid or amount" });
  }

  try {
    const userRef = db.ref(`users/${uid}`);
    const snapshot = await userRef.once("value");
    const currentGold = snapshot.val()?.gold || 0;

    if (currentGold < amount) {
      return res.status(400).json({ error: "Not enough Dabloons!" });
    }

    const newGold = currentGold - amount;
    
    // Atomic updates
    await userRef.update({ gold: newGold });
    await db.ref(`game_state/players/${uid}`).update({ gold: newGold });

    res.json({ success: true, newBalance: newGold });
  } catch (error) {
    console.error("Error spending gold:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 3. Public Leaderboard Endpoint
app.get("/leaderboard", async (req, res) => {
  try {
    const snapshot = await db.ref("users").once("value");
    const users = snapshot.val();

    if (!users) {
      return res.json({});
    }

    const sorted = Object.entries(users)
      .map(([uid, data]) => ({
        uid,
        name: data.name || "Unknown",
        gold: data.gold || 0,
      }))
      .sort((a, b) => b.gold - a.gold)
      .slice(0, 10);

    // Return as an object for consistency with existing updateLeaderboard function
    const result = {};
    sorted.forEach((p, i) => {
      result[p.uid] = { name: p.name, gold: p.gold };
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});
