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
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;700;800&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

          :root {
            --bg:        #0d1a4a;
            --surface:   rgba(14, 28, 90, 0.82);
            --card:      rgba(18, 38, 110, 0.65);

            --border:    rgba(120, 180, 255, 0.20);
            --border-hi: rgba(160, 210, 255, 0.55);

            --text:      #f0f6ff;
            --muted:     rgba(160, 200, 255, 0.60);

            --accent:    #4d9eff;
            --accent2:   #e060f5;
            --accent3:   #80d4ff;
            --accent4:   #ffe066;

            --glow:      rgba(77, 158, 255, 0.35);
            --glow2:     rgba(224, 96, 245, 0.30);

            --body-bg1:  #0d1a4a;
            --body-bg2:  #050b1f;
          }

          body {
            margin: 0;
            padding: 40px 20px;

            background:
              radial-gradient(circle at 20% 20%, var(--glow2), transparent 25%),
              radial-gradient(circle at 80% 30%, var(--glow), transparent 30%),
              radial-gradient(circle at 50% 80%, var(--glow2), transparent 28%),
              linear-gradient(
                180deg,
                var(--body-bg1) 0%,
                var(--body-bg2) 40%,
                var(--body-bg1) 100%
              );

            color: var(--text);

            font-family: 'DM Mono', monospace;

            overflow: hidden;
            position: relative;
            min-height: 100vh;
          }

          body::after {
            content: '';

            position: fixed;
            inset: -20%;

            background-image:
              radial-gradient(ellipse 75% 55% at 88% 92%, var(--glow2), transparent 60%),
              radial-gradient(ellipse 85% 65% at 8% 8%, var(--glow), transparent 58%),
              radial-gradient(ellipse 60% 70% at 50% 38%, var(--glow), transparent 65%),
              radial-gradient(ellipse 50% 45% at 78% 45%, var(--glow2), transparent 55%);

            filter: blur(80px);

            animation: nebulaDrift 20s ease-in-out infinite alternate;

            z-index: -1;
            pointer-events: none;
          }

          body::before {
            content: '';

            position: fixed;
            inset: 0;

            background-image:
              radial-gradient(3px 4px at 20px 30px, rgba(255,255,255,0.9), transparent),
              radial-gradient(2px 2px at 120px 80px, rgba(255,255,255,0.7), transparent),
              radial-gradient(3px 2px at 200px 150px, rgba(255,255,255,0.8), transparent),
              radial-gradient(3px 3px at 300px 220px, rgba(255,255,255,0.8), transparent),
              radial-gradient(2px 3px at 500px 100px, rgba(255,255,255,0.9), transparent);

            background-repeat: repeat;
            background-size: 1000px 600px;

            opacity: 0.8;

            animation: starsMove 120s linear infinite;

            z-index: -2;
            pointer-events: none;
          }

          @keyframes nebulaDrift {
            0% {
              transform: scale(1) translateX(-2%);
            }

            100% {
              transform: scale(1.1) translateX(2%);
            }
          }

          @keyframes starsMove {
            from {
              transform: translateY(0);
            }

            to {
              transform: translateY(-600px);
            }
          }

          .main {
            max-width: 480px;

            margin: 0 auto;

            padding: 32px;

            border-radius: 14px;

            background: var(--surface);

            border: 1px solid var(--border);

            color: var(--text);

            backdrop-filter: blur(18px);

            box-shadow:
              0 0 40px var(--glow),
              inset 0 0 25px rgba(255,255,255,0.03);

            position: relative;

            overflow: hidden;
          }

          .main::before {
            content: '';

            position: absolute;
            inset: 0;

            background:
              linear-gradient(
                135deg,
                rgba(255,255,255,0.05),
                transparent 40%
              );

            pointer-events: none;
          }

          .brand {
            font-family: 'Syne', sans-serif;

            font-size: 12px;

            letter-spacing: 0.18em;

            color: var(--accent3);

            margin-bottom: 10px;

            font-weight: 700;
          }

          .title {
            font-family: 'Syne', sans-serif;

            font-size: 28px;

            font-weight: 800;

            margin-bottom: 16px;

            color: #ffffff;

            line-height: 1.2;
          }

          .desc {
            color: var(--muted);

            margin-bottom: 24px;

            line-height: 1.7;

            font-size: 15px;

            font-family: 'Syne', sans-serif;
          }

          .otp-box {
            font-family: 'Syne', sans-serif;

            font-size: 40px;

            font-weight: 800;

            letter-spacing: 0.35em;

            text-align: center;

            padding: 22px;

            background: var(--card);

            border: 1px solid var(--border-hi);

            border-radius: 10px;

            margin-bottom: 24px;

            color: var(--accent3);

            box-shadow:
              0 0 25px var(--glow),
              inset 0 0 12px rgba(255,255,255,0.03);
          }

          .footer {
            font-size: 11px;

            color: var(--muted);

            line-height: 1.7;

            margin: 0;

            font-family: 'Syne', sans-serif;
          }
          </style>

          <div class="main">

            <p class="brand">
              // SERENDIBITE INTELLIGENCE
            </p>

            <h2 class="title">
              Your sign-in code
            </h2>

            <p class="desc">
              Use the verification code below to securely sign in.
              This code expires in 
              <strong style="color:#ffffff;">10 minutes</strong>.
            </p>

            <div class="otp-box">
              ${otp}
            </div>

            <p class="footer">
              If you didn’t request this sign-in attempt, you can safely ignore this email.
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
