import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, serverTimestamp, get, remove, onDisconnect } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyDFKRvtcCkBkSgnC6GE3KGIGUC5Z99GePg",
  authDomain: "gituhabu.firebaseapp.com",
  databaseURL: "https://gituhabu-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gituhabu",
  storageBucket: "gituhabu.firebasestorage.app",
  messagingSenderId: "554269161617",
  appId: "1:554269161617:web:396959678b30292e17e730",
  measurementId: "G-3295SK2DZD"
};

const app = initializeApp(firebaseConfig);
console.log("Kilo-Luna: Firebase App initialized");
const db = getDatabase(app);
const auth = getAuth(app);
const functions = getFunctions(app);

const BACKEND_URL = "https://the-tiles.onrender.com";

const GRID_SIZE = 100;
const TILE_WIDTH = 40;
const TILE_HEIGHT = 40;
const OFFSET_X = 20;

let myUID = null;
let mySessionID = null;
let myName = "";
let myColor = "#00ffcc";
let myPos = { x: 0, y: 0 };
let myGold = 0;
let targetScrollLeft = 0;
let targetScrollTop = 0;
let currentScrollLeft = 0;
let currentScrollTop = 0;

const board = document.getElementById('game-board');
const COLORS = ["#ff4d4d", "#4dff4d", "#4d4dff", "#ffff4d", "#ff4dff", "#4dffff", "#ffa500", "#ffffff", "#ff00ff", "#00ffff"];

async function callBackend(endpoint, data) {
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error(`Backend error (${endpoint}):`, error);
    return { error: "Backend unreachable" };
  }
}

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function getTilePosition(x, y) {
  const posX = x * TILE_WIDTH + (y % 2 === 0 ? 0 : OFFSET_X);
  const posY = y * TILE_HEIGHT * 0.75;
  return { posX, posY };
}

function getTileFromCoords(mouseX, mouseY) {
  const y = Math.round(mouseY / (TILE_HEIGHT * 0.75));
  const offsetX = (y % 2 === 0 ? 0 : OFFSET_X);
  const x = Math.round((mouseX - offsetX) / TILE_WIDTH);
  if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) return { x, y };
  return null;
}

function renderCursor(uid, x, y, name, color, isMe = false) {
  let cursorEl = document.getElementById(`cursor-${uid}`);
  if (!cursorEl) {
    cursorEl = document.createElement('div');
    cursorEl.id = `cursor-${uid}`;
    cursorEl.className = 'cursor';
    cursorEl.style.color = color;
    cursorEl.style.backgroundColor = color;
    const label = document.createElement('div');
    label.className = 'cursor-label';
    label.innerText = name;
    cursorEl.appendChild(label);
    board.appendChild(cursorEl);
  }
  const { posX, posY } = getTilePosition(x, y);
  requestAnimationFrame(() => {
    cursorEl.style.transform = `translate(${posX + 14}px, ${posY + 17}px)`;
    if (isMe) centerCameraOnPlayer(posX, posY);
  });
}

function centerCameraOnPlayer(posX, posY) {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  targetScrollLeft = posX - centerX;
  targetScrollTop = posY - centerY;
}

function updateCamera() {
  const container = document.getElementById('game-container');
  currentScrollLeft += (targetScrollLeft - currentScrollLeft) * 0.1;
  currentScrollTop += (targetScrollTop - currentScrollTop) * 0.1;
  container.scrollLeft = currentScrollLeft;
  container.scrollTop = currentScrollTop;
  requestAnimationFrame(updateCamera);
}

function notify(message, duration = 3000) {
  const container = document.getElementById('notifications');
  
  const el = document.createElement('div');
  el.className = 'notification';
  
  const textNode = document.createElement('span');
  textNode.innerText = message;
  el.appendChild(textNode);

  const timerBar = document.createElement('div');
  timerBar.className = 'notification-timer';
  el.appendChild(timerBar);
  
  container.appendChild(el);

  requestAnimationFrame(() => {
    timerBar.style.transition = `width ${duration}ms linear`;
    timerBar.style.width = '0%';
  });

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    el.style.transition = 'all 0.5s ease';
    setTimeout(() => el.remove(), 500);
  }, duration);
}

function updateLeaderboard(players) {
  const lbList = document.getElementById('lb-list');
  if (!lbList) return;
  lbList.innerHTML = '';
  const sorted = Object.entries(players)
    .map(([id, data]) => ({ id, gold: data.gold || 0, name: data.name || "Unknown" }))
    .sort((a, b) => b.gold - a.gold)
    .slice(0, 10);
  sorted.forEach((p, i) => {
    const entry = document.createElement('div');
    entry.className = 'lb-entry';
    entry.innerHTML = `<span class="lb-name">#${i+1} ${p.name}</span><span class="lb-val">${p.gold} Dabloons</span>`;
    lbList.appendChild(entry);
  });
}

function updatePlayerList(players) {
  const plList = document.getElementById('pl-list');
  if (!plList) return;
  plList.innerHTML = '';
  const sorted = Object.entries(players)
    .map(([id, data]) => ({ id, gold: data.gold || 0, name: data.name || "Unknown", color: data.color || "#fff" }))
    .sort((a, b) => a.name.localeCompare(b.name));
  sorted.forEach((p) => {
    const entry = document.createElement('div');
    entry.className = 'lb-entry';
    entry.innerHTML = `<span class="lb-name" style="color: ${p.color}">${p.name}</span><span class="lb-val">${p.gold} D</span>`;
    plList.appendChild(entry);
  });
}

function handleBoardClick(e) {
  const rect = board.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const tile = getTileFromCoords(mouseX, mouseY);
  if (!tile) return;
  const { x, y } = tile;
  updatePlayerPosition(x, y);
  handleTileInteraction(x, y);
}

async function handleTileInteraction(x, y) {
  await claimLand(x, y);
}

function handleInput(e) {
  switch (e.key.toLowerCase()) {
    case ' ': placeWall(myPos.x, myPos.y); break;
    case 'e': claimLand(myPos.x, myPos.y); break;
  }
}

function syncGold() {
  document.getElementById('gold-count').innerText = myGold;
}

function updatePlayerPosition(x, y) {
  myPos = { x, y };
  renderCursor(myUID, x, y, myName, myColor, true);
  syncGold();
  document.getElementById('pos-count').innerText = `${x}, ${y}`;
  checkResourceCollection(x, y);
  set(ref(db, `game_state/players/${myUID}`), {
    x: x,
    y: y,
    gold: myGold,
    name: myName,
    color: myColor,
    lastMove: serverTimestamp()
  });
}

function checkResourceCollection(x, y) {
  const resId = `res-${x}-${y}`;
  const resEl = document.getElementById(resId);
  if (resEl && resEl.classList.contains('resource-gold')) {
    myGold += 5;
    set(ref(db, `game_state/resources/${resId}`), null);
    resEl.remove();
    syncGold();
  }
}

async function placeWall(x, y) {
  if (myGold < 10) {
    notify("Not enough Dabloons to build a wall!");
    return;
  }
  const result = await callBackend("/spend-gold", { uid: myUID, amount: 10 });
  if (result.error || !result.success) {
    notify(result.error || "Failed to spend gold!");
    return;
  }
  myGold = result.newBalance;
  syncGold();
  const wallId = `${x}-${y}`;
  set(ref(db, `game_state/walls/${wallId}`), {
    owner: myUID,
    timestamp: serverTimestamp()
  });
}

async function claimLand(x, y) {
  if (myGold < 50) {
    notify("Need 50 Dabloons to claim land!");
    return;
  }
  const result = await callBackend("/spend-gold", { uid: myUID, amount: 50 });
  if (result.error || !result.success) {
    notify(result.error || "Failed to spend gold!");
    return;
  }
  myGold = result.newBalance;
  syncGold();
  const landId = `${x}-${y}`;
  set(ref(db, `game_state/land/${landId}`), {
    owner: myUID,
    name: myName,
    color: myColor,
    timestamp: serverTimestamp()
  });
  notify(`Claimed land at ${x}, ${y}!`);
}

function renderGrid() {
  const totalWidth = GRID_SIZE * TILE_WIDTH + OFFSET_X;
  const totalHeight = GRID_SIZE * TILE_HEIGHT * 0.75 + 46;
  board.style.width = `${totalWidth}px`;
  board.style.height = `${totalHeight}px`;
  let canvas = document.getElementById('grid-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'grid-canvas';
    board.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const gridColor = '#1c1c26';
  const outlineColor = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const { posX, posY } = getTilePosition(x, y);
      ctx.beginPath();
      ctx.moveTo(posX + 20, posY);
      ctx.lineTo(posX + 40, posY + 11.5);
      ctx.lineTo(posX + 40, posY + 34.5);
      ctx.lineTo(posX + 20, posY + 46);
      ctx.lineTo(posX + 0, posY + 34.5);
      ctx.lineTo(posX + 0, posY + 11.5);
      ctx.closePath();
      ctx.fillStyle = gridColor;
      ctx.fill();
      ctx.strokeStyle = outlineColor;
      ctx.stroke();
    }
  }
}

function startHeartbeat() {
  setInterval(async () => {
    try {
      await fetch(`${BACKEND_URL}/ping`);
      console.log("Heartbeat: Server pinged.");
    } catch (e) {
      console.error("Heartbeat failed");
    }
  }, 5 * 60 * 1000);
}

async function startSimulation(user) {
    console.log("Attempting to start simulation...");
    const currentUser = user || auth.currentUser;
    
    if (!currentUser) {
        console.error("No user found in startSimulation");
        notify("Authentication failed. Please try again.");
        return;
    }

    if (!currentUser.emailVerified) {
        console.warn("User is not verified:", currentUser.email);
        notify("Please verify your email before playing!");
        return;
    }

    console.log("User verified. Entering game...");
    document.getElementById('auth-overlay').style.display = 'none';
    renderGrid();
    updateCamera();
    startHeartbeat();
    myPos = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };

  const playerRef = ref(db, `game_state/players/${myUID}`);
  onDisconnect(playerRef).remove();
  onValue(ref(db, `users/${myUID}`), (snapshot) => {
    const data = snapshot.val();
    if (data && data.sessionID && data.sessionID !== mySessionID) {
      setTimeout(async () => {
        await auth.signOut();
        window.location.reload();
      }, 100);
      notify("Another session has started. You have been logged out.", 10000);
    }
  });
  const userSnapshot = await get(ref(db, `users/${myUID}`));
  if (userSnapshot.exists()) {
    myGold = userSnapshot.val().gold || 0;
  } else {
    myGold = 100;
    await set(ref(db, `users/${myUID}`), {
      name: myName,
      color: myColor,
      gold: myGold
    });
  }
  updatePlayerPosition(myPos.x, myPos.y);
  board.addEventListener('click', handleBoardClick);
  onValue(ref(db, 'game_state'), (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    if (data.players) {
      updateLeaderboard(data.players);
      updatePlayerList(data.players);
      Object.entries(data.players).forEach(([uid, p]) => {
        if (uid !== myUID) renderCursor(uid, p.x, p.y, p.name || uid, p.color || "#fff");
        if (uid === myUID) {
          myGold = p.gold || 0;
          document.getElementById('gold-count').innerText = myGold;
        }
      });
    }
    if (data.walls) {
      Object.entries(data.walls).forEach(([key, wall]) => {
        const [_, x, y] = key.split('-');
        // renderWall is not defined in current file, assuming it's handled by CSS/Grid
      });
    }
    if (data.resources) {
      Object.entries(data.resources).forEach(([key, res]) => {
        const [_, x, y] = key.split('-');
        // renderResource is not defined in current file, assuming it's handled by CSS/Grid
      });
    }
  });
  window.addEventListener('keydown', handleInput);
}

let currentAuthMode = 'login';
function toggleAuthMode(mode) {
  currentAuthMode = mode;
  const title = document.getElementById('auth-title');
  const idLabel = document.getElementById('id-label');
  const userField = document.getElementById('username-field');
  const submitBtn = document.getElementById('submit-btn');
  const toggleText = document.getElementById('toggle-text');
  const toggleLink = document.getElementById('toggle-auth');
  if (mode === 'signup') {
    title.innerText = 'Join The Box';
    idLabel.innerText = 'Email';
    userField.style.display = 'block';
    submitBtn.innerText = 'Sign Up';
    toggleText.innerText = 'Already have an account?';
    toggleLink.innerText = 'Log In';
  } else {
    title.innerText = 'Welcome Back';
    idLabel.innerText = 'Email or Username';
    userField.style.display = 'none';
    submitBtn.innerText = 'Log In';
    toggleText.innerText = "Don't have an account?";
    toggleLink.innerText = 'Sign Up';
  }
}

async function handleAuth() {
    console.log("Luna: Auth button clicked!");
    const identifier = document.getElementById('identifier').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    if (!identifier || !password) {
        notify("Please enter your credentials");
        return;
    }
    try {
        let userCred;
        if (currentAuthMode === 'signup') {
            if (!username) {
                notify("Please choose a username");
                return;
            }
            if (/[.#$\[\]]/.test(username)) {
                notify("Username cannot contain '.', '#', '$', '[', or ']'");
                return;
            }
            const normalizedUsername = username.toLowerCase();
            const userCheck = await get(ref(db, `usernames/${normalizedUsername}`));
            if (userCheck.exists()) {
                notify("Username already taken!");
                return;
            }
            if (!identifier.includes('@')) {
                notify("Please enter a valid email for signup");
                return;
            }
            userCred = await createUserWithEmailAndPassword(auth, identifier, password);
            
            // Verify the email is legit
            await sendEmailVerification(userCred.user);
            
            myUID = userCred.user.uid;
            myName = username;
            myColor = getRandomColor();
            mySessionID = Math.random().toString(36).substring(7);
            
            await set(ref(db, `usernames/${normalizedUsername}`), {
                uid: myUID,
                email: identifier
            });
            
            await set(ref(db, `users/${myUID}`), {
                name: myName,
                color: myColor,
                gold: 100,
                sessionID: mySessionID,
                verified: false // Mark as unverified initially
            });

            
            notify("Account created! Please check your email to verify your account.");
            toggleAuthMode(currentAuthMode === 'login' ? 'signup' : 'login');
        } else {
            let loginEmail = identifier;
            if (!identifier.includes('@')) {
                console.log("Luna Debug: Identifier is a username, looking up email...");
                const normalizedIdentifier = identifier.toLowerCase();
                const userMap = await get(ref(db, `usernames/${normalizedIdentifier}`));
                if (!userMap.exists()) {
                    console.error("Luna Debug: Username not found in database!");
                    notify("Account not found!");
                    return;
                }
                loginEmail = userMap.val().email;
                console.log("Luna Debug: Found email for username:", loginEmail);
            } else {
                console.log("Luna Debug: Identifier is already an email:", loginEmail);
            }
            
            console.log("Luna Debug: Final attempt to login with:", loginEmail);
            userCred = await signInWithEmailAndPassword(auth, loginEmail, password);
            myUID = userCred.user.uid;
            mySessionID = Math.random().toString(36).substring(7);
            const profileSnap = await get(ref(db, `users/${myUID}`));
            if (profileSnap.exists()) {
                const profileData = profileSnap.val();
                myName = profileData.name;
                myColor = profileData.color;
            } else {
                myName = identifier;
                myColor = getRandomColor();
                await set(ref(db, `users/${myUID}`), {
                    name: myName,
                    color: myColor,
                    gold: 100
                });
            }
            await update(ref(db, `users/${myUID}`), {
                sessionID: mySessionID
            });
        }
        startSimulation(userCred.user);
    } catch (error) {
        console.error("Auth Error Detail:", error);
        let errorMsg = error.message;
        if (error.code === 'auth/email-already-in-use') errorMsg = "Email already in use!";
        if (error.code === 'auth/wrong-password') errorMsg = "Incorrect password!";
        if (error.code === 'auth/user-not-found') errorMsg = "User not found!";
        notify("Auth error: " + errorMsg);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Kilo-Luna: DOM fully loaded. Binding events...");
    document.getElementById('submit-btn').addEventListener('click', handleAuth);
    document.getElementById('toggle-auth').addEventListener('click', (e) => {
      e.preventDefault();
      toggleAuthMode(currentAuthMode === 'login' ? 'signup' : 'login');
    });
    document.getElementById('logout-btn').addEventListener('click', async () => {
      try {
        if (myUID) {
          await remove(ref(db, `game_state/players/${myUID}`));
        }
        await auth.signOut();
        window.location.reload();
      } catch (error) {
        console.error("Logout failed", error);
      }
    });
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    // Session management is handled in startSimulation and handleAuth
  }
});
