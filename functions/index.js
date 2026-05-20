const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.spendGold = functions.https.onCall(async (data, context) => {
  // 1. Auth Check: Is this user even logged in?
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be logged in! BLUEH :P",
    );
  }

  const uid = context.auth.uid;
  const amount = data.amount;

  const userRef = admin.database().ref(`users/${uid}`);
  const snapshot = await userRef.once("value");
  const currentGold = snapshot.val().gold || 0;

  // 2. Validation: Do they actually have the money?
  if (currentGold < amount) {
    throw new functions.https.HttpsError(
        "failed-precondition",
        "Uh oh.. Not enough Dabloons!?",
    );
  }

  // 3. Atomic Update: Subtract gold safely
  const newGold = currentGold - amount;
  await userRef.update({gold: newGold});

  // Also update the game_state for the leaderboard
  await admin.database().ref(`game_state/players/${uid}`).update({
    gold: newGold,
  });

  return {success: true, newBalance: newGold};
});
