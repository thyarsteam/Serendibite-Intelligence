const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getFirestore }                  = require("firebase-admin/firestore");
const { getAuth }                       = require("firebase-admin/auth");

function getAdminApp() {
  if (!getApps().length) {
    return initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getApps()[0];
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let email, otp;
  try {
    ({ email, otp } = JSON.parse(event.body));

    email = email.toLowerCase().trim();
    otp = String(otp).trim();
    
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  if (!email || !isValidEmail(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: "A valid email address is required" }) };
  }

  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return { statusCode: 400, body: JSON.stringify({ error: "OTP must be a 6-digit number" }) };
  }

  try {
    const app = getAdminApp();
    const db  = getFirestore(app);

    const docRef  = db.collection("otps").doc(email);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { statusCode: 400, body: JSON.stringify({ error: "No OTP found for this email. Please request a new one." }) };
    }

    const { otp: storedOtp, expires } = docSnap.data();

    if (Date.now() > expires) {
      await docRef.delete();
      return { statusCode: 400, body: JSON.stringify({ error: "This code has expired. Please request a new one." }) };
    }

    if (String(otp).trim() !== String(storedOtp).trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: "Incorrect code. Please check and try again." }) };
    }

    await docRef.delete();

    const adminAuth = getAuth(app);
    let uid;
    try {
      const existing = await adminAuth.getUserByEmail(email);
      uid = existing.uid;
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        const created = await adminAuth.createUser({ email });
        uid = created.uid;
      } else {
        throw err;
      }
    }

    const customToken = await adminAuth.createCustomToken(uid);

    return {
      statusCode: 200,
      body: JSON.stringify({ customToken }),
    };

  } catch (err) {
    console.error("recieveOTP error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};