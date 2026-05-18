const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getFirestore }                  = require("firebase-admin/firestore");
const nodemailer = require("nodemailer");

function getAdminDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let email;
  try {
    ({ email } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  if (!email || !isValidEmail(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: "A valid email address is required" }) };
  }

  const otp     = generateOTP();
  const expires = Date.now() + 10 * 60 * 1000;

  try {
    const db = getAdminDb();
    await db.collection("otps").doc(email).set({ otp, expires, createdAt: Date.now() });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    await transporter.sendMail({
      from:    process.env.EMAIL_USER,
      to:      email,
      subject: "Your Serendibite sign-in code",
      html: `
        <div style="font-family:monospace;max-width:480px;margin:0 auto;padding:32px;background:#0d1a4a;color:#f0f6ff;border-radius:8px;">
          <p style="font-size:12px;letter-spacing:0.15em;color:#80d4ff;margin-bottom:8px;">// SERENDIBITE INTELLIGENCE</p>
          <h2 style="font-size:22px;font-weight:700;margin-bottom:16px;">Your sign-in code</h2>
          <p style="color:rgba(160,200,255,0.7);margin-bottom:24px;line-height:1.6;">
            Use the code below to sign in. It expires in <strong style="color:#f0f6ff;">10 minutes</strong>.
          </p>
          <div style="font-size:36px;font-weight:800;letter-spacing:0.25em;text-align:center;
                      padding:20px;background:rgba(77,158,255,0.12);border:1px solid rgba(120,180,255,0.3);
                      border-radius:6px;margin-bottom:24px;color:#80d4ff;">
            ${otp}
          </div>
          <p style="font-size:11px;color:rgba(160,200,255,0.45);line-height:1.6;">
            If you didn't request this, you can safely ignore this email.
            Never share this code with anyone.
          </p>
        </div>
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "OTP sent" }),
    };

  } catch (err) {
    console.error("sendOTP error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
