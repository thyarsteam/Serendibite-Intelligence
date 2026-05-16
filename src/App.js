import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

import {
  signInWithPopup,
  linkWithPopup,
  unlink,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  signInWithCustomToken,
  deleteUser,
} from "firebase/auth";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase";
import "./App.css";

// ─── Constants ───────────────────────────────────────────────────────────────
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const SUPPORTED_DOC_TYPES = [
  "application/pdf", "text/plain", "text/csv",
  "text/markdown", "application/json",
  "text/javascript", "text/html", "text/css",
];
const MAX_FILE_SIZE_MB = 5;

const AI_MODELS = [
  { id: "gpt-4.1",           label: "GPT-4.1",       provider: "OpenAI",   fn: "gpt",      icon: "", color: "#10a37f" },
  { id: "gpt-4o",            label: "GPT-4o",         provider: "OpenAI",   fn: "gpt",      icon: "", color: "#10a37f" },
  { id: "gpt-4o-mini",       label: "GPT-4o Mini",    provider: "OpenAI",   fn: "gpt",      icon: "", color: "#10a37f" },
  { id: "deepseek-chat",     label: "DeepSeek V3",    provider: "DeepSeek", fn: "deepseek", icon: "", color: "#4d9eff" },
  { id: "deepseek-reasoner", label: "DeepSeek R1",    provider: "DeepSeek", fn: "deepseek", icon: "", color: "#4d9eff" },
  { id: "llama-3.3-70b",     label: "Llama 3.3 70B",  provider: "Meta",     fn: "llama",    icon: "", color: "#e060f5" },
  { id: "llama-3.1-8b",      label: "Llama 3.1 8B",   provider: "Meta",     fn: "llama",    icon: "", color: "#e060f5" },
];

// ─── Gem Themes ───────────────────────────────────────────────────────────────
const GEM_THEMES = [
  {
    id: "sapphire",
    name: "Sapphire",
    icon: "",
    desc: "Electric blue depth",
    vars: {
      "--bg": "#0d1a4a",
      "--surface": "rgba(14,28,90,0.82)",
      "--card": "rgba(18,38,110,0.65)",
      "--border": "rgba(120,180,255,0.20)",
      "--border-hi": "rgba(160,210,255,0.55)",
      "--text": "#f0f6ff",
      "--muted": "rgba(160,200,255,0.60)",
      "--accent": "#4d9eff",
      "--accent2": "#e060f5",
      "--accent3": "#80d4ff",
      "--accent4": "#ffe066",
      "--glow": "rgba(77,158,255,0.35)",
      "--glow2": "rgba(224,96,245,0.30)",
      "--body-bg1": "#0d1a4a",
      "--body-bg2": "#050b1f",
    },
  },
  {
    id: "ruby",
    name: "Ruby",
    icon: "",
    desc: "Deep crimson fire",
    vars: {
      "--bg": "#3a0a0a",
      "--surface": "rgba(80,12,12,0.85)",
      "--card": "rgba(100,15,15,0.65)",
      "--border": "rgba(255,100,100,0.20)",
      "--border-hi": "rgba(255,150,150,0.55)",
      "--text": "#fff0f0",
      "--muted": "rgba(255,180,180,0.60)",
      "--accent": "#ff4d4d",
      "--accent2": "#ff9a3c",
      "--accent3": "#ff8080",
      "--accent4": "#ffdd66",
      "--glow": "rgba(255,77,77,0.35)",
      "--glow2": "rgba(255,154,60,0.30)",
      "--body-bg1": "#3a0a0a",
      "--body-bg2": "#1a0303",
    },
  },
  {
    id: "emerald",
    name: "Emerald",
    icon: "",
    desc: "Lush forest depth",
    vars: {
      "--bg": "#051a0f",
      "--surface": "rgba(8,42,22,0.85)",
      "--card": "rgba(10,55,28,0.65)",
      "--border": "rgba(80,200,120,0.20)",
      "--border-hi": "rgba(120,240,160,0.55)",
      "--text": "#efffef",
      "--muted": "rgba(140,220,160,0.60)",
      "--accent": "#30c060",
      "--accent2": "#80ffb0",
      "--accent3": "#50e090",
      "--accent4": "#ffe066",
      "--glow": "rgba(48,192,96,0.35)",
      "--glow2": "rgba(128,255,176,0.30)",
      "--body-bg1": "#051a0f",
      "--body-bg2": "#010d06",
    },
  },
  {
    id: "amethyst",
    name: "Amethyst",
    icon: "",
    desc: "Mystic violet haze",
    vars: {
      "--bg": "#1a0a3a",
      "--surface": "rgba(36,12,80,0.85)",
      "--card": "rgba(50,15,100,0.65)",
      "--border": "rgba(180,100,255,0.20)",
      "--border-hi": "rgba(210,150,255,0.55)",
      "--text": "#f5f0ff",
      "--muted": "rgba(200,160,255,0.60)",
      "--accent": "#a855f7",
      "--accent2": "#e040fb",
      "--accent3": "#c084fc",
      "--accent4": "#ffd166",
      "--glow": "rgba(168,85,247,0.35)",
      "--glow2": "rgba(224,64,251,0.30)",
      "--body-bg1": "#1a0a3a",
      "--body-bg2": "#0a0320",
    },
  },
  {
    id: "obsidian",
    name: "Obsidian",
    icon: "",
    desc: "Pure volcanic dark",
    vars: {
      "--bg": "#0a0a0a",
      "--surface": "rgba(20,20,20,0.92)",
      "--card": "rgba(28,28,28,0.75)",
      "--border": "rgba(255,255,255,0.10)",
      "--border-hi": "rgba(255,255,255,0.25)",
      "--text": "#f5f5f5",
      "--muted": "rgba(200,200,200,0.55)",
      "--accent": "#e0e0e0",
      "--accent2": "#a0a0a0",
      "--accent3": "#cccccc",
      "--accent4": "#ffd166",
      "--glow": "rgba(224,224,224,0.15)",
      "--glow2": "rgba(160,160,160,0.12)",
      "--body-bg1": "#0a0a0a",
      "--body-bg2": "#050505",
    },
  },
  {
    id: "aurora",
    name: "Aurora",
    icon: "",
    desc: "Northern lights glow",
    vars: {
      "--bg": "#08141a",
      "--surface": "rgba(10,28,36,0.82)",
      "--card": "rgba(16,42,54,0.68)",
      "--border": "rgba(90,255,220,0.18)",
      "--border-hi": "rgba(130,255,235,0.55)",
      "--text": "#efffff",
      "--muted": "rgba(170,255,240,0.62)",
      "--accent": "#38f9d7",
      "--accent2": "#7a5cff",
      "--accent3": "#5efcff",
      "--accent4": "#d6ff6b",
      "--glow": "rgba(56,249,215,0.35)",
      "--glow2": "rgba(122,92,255,0.30)",
      "--body-bg1": "#08141a",
      "--body-bg2": "#02070d",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    icon: "",
    desc: "Warm dusk gradients",
    vars: {
      "--bg": "#341515",
      "--surface": "rgba(60,22,22,0.82)",
      "--card": "rgba(82,28,28,0.65)",
      "--border": "rgba(255,170,120,0.18)",
      "--border-hi": "rgba(255,210,160,0.50)",
      "--text": "#fff5ee",
      "--muted": "rgba(255,210,180,0.60)",
      "--accent": "#ff7b54",
      "--accent2": "#ffb347",
      "--accent3": "#ff5e9c",
      "--accent4": "#ffe066",
      "--glow": "rgba(255,123,84,0.35)",
      "--glow2": "rgba(255,94,156,0.28)",
      "--body-bg1": "#341515",
      "--body-bg2": "#120707",
    },
  },
  {
    id: "frost",
    name: "Frost",
    icon: "",
    desc: "Cool icy minimalism",
    vars: {
      "--bg": "#0f1722",
      "--surface": "rgba(20,28,38,0.80)",
      "--card": "rgba(28,38,52,0.64)",
      "--border": "rgba(180,220,255,0.18)",
      "--border-hi": "rgba(220,240,255,0.52)",
      "--text": "#f4fbff",
      "--muted": "rgba(190,215,235,0.60)",
      "--accent": "#7dd3fc",
      "--accent2": "#a5b4fc",
      "--accent3": "#d8f3ff",
      "--accent4": "#fef9c3",
      "--glow": "rgba(125,211,252,0.34)",
      "--glow2": "rgba(165,180,252,0.25)",
      "--body-bg1": "#0f1722",
      "--body-bg2": "#05070c",
    },
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    icon: "",
    desc: "Neon city energy",
    vars: {
      "--bg": "#12081f",
      "--surface": "rgba(28,12,42,0.84)",
      "--card": "rgba(40,18,58,0.68)",
      "--border": "rgba(255,0,170,0.22)",
      "--border-hi": "rgba(0,255,255,0.52)",
      "--text": "#fff7ff",
      "--muted": "rgba(255,170,230,0.62)",
      "--accent": "#ff00aa",
      "--accent2": "#00f0ff",
      "--accent3": "#b388ff",
      "--accent4": "#ffe066",
      "--glow": "rgba(255,0,170,0.35)",
      "--glow2": "rgba(0,240,255,0.28)",
      "--body-bg1": "#12081f",
      "--body-bg2": "#04020a",
    },
  },
  {
    id: "forest",
    name: "Forest",
    icon: "",
    desc: "Deep woodland tones",
    vars: {
      "--bg": "#0d1b12",
      "--surface": "rgba(18,36,24,0.82)",
      "--card": "rgba(24,52,32,0.65)",
      "--border": "rgba(120,200,140,0.18)",
      "--border-hi": "rgba(170,255,190,0.50)",
      "--text": "#f3fff6",
      "--muted": "rgba(180,230,190,0.58)",
      "--accent": "#3ddc84",
      "--accent2": "#8fd14f",
      "--accent3": "#7cfcc8",
      "--accent4": "#ffe066",
      "--glow": "rgba(61,220,132,0.35)",
      "--glow2": "rgba(143,209,79,0.25)",
      "--body-bg1": "#0d1b12",
      "--body-bg2": "#040905",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    icon: "",
    desc: "Dark luxury aesthetic",
    vars: {
      "--bg": "#090909",
      "--surface": "rgba(18,18,18,0.84)",
      "--card": "rgba(28,28,28,0.68)",
      "--border": "rgba(180,180,180,0.14)",
      "--border-hi": "rgba(255,255,255,0.30)",
      "--text": "#f8f8f8",
      "--muted": "rgba(210,210,210,0.52)",
      "--accent": "#ffffff",
      "--accent2": "#9ca3af",
      "--accent3": "#d4d4d4",
      "--accent4": "#facc15",
      "--glow": "rgba(255,255,255,0.12)",
      "--glow2": "rgba(156,163,175,0.18)",
      "--body-bg1": "#090909",
      "--body-bg2": "#000000",
    },
  },
  {
    id: "topaz",
    name: "Topaz",
    icon: "",
    desc: "Golden amber warmth",
    vars: {
      "--bg": "#1a1200",
      "--surface": "rgba(50,35,0,0.88)",
      "--card": "rgba(65,46,0,0.70)",
      "--border": "rgba(255,200,60,0.20)",
      "--border-hi": "rgba(255,220,100,0.55)",
      "--text": "#fff9e6",
      "--muted": "rgba(255,220,140,0.60)",
      "--accent": "#f0b030",
      "--accent2": "#ff8c42",
      "--accent3": "#ffd166",
      "--accent4": "#80d4ff",
      "--glow": "rgba(240,176,48,0.35)",
      "--glow2": "rgba(255,140,66,0.30)",
      "--body-bg1": "#1a1200",
      "--body-bg2": "#0a0800",
    },
  },
];

// ─── Animation variants ───────────────────────────────────────────────────────
const pageVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.3 } },
};

const dropdownVariants = {
  hidden:  { opacity: 0, y: 8,  scale: 0.96 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: 6,  scale: 0.97, transition: { duration: 0.16 } },
};

const toastVariants = {
  hidden:  { opacity: 0, y: 16, scale: 0.94 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: 8,  scale: 0.96, transition: { duration: 0.2 } },
};

// ─── Helper: compute age ──────────────────────────────────────────────────────
function computeAge(dobString) {
  if (!dobString) return null;
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

// ─── Extract code blocks from messages ───────────────────────────────────────
function extractCodeBlocks(messages) {
  const blocks = [];
  messages.forEach((msg) => {
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(msg.content)) !== null) {
      blocks.push({
        id: `${msg.id}-${match.index}`,
        lang: match[1] || "text",
        code: match[2].trim(),
        role: msg.role,
      });
    }
  });
  return blocks;
}

// ─── Normalize LLM math delimiters → remark-math compatible ──────────────────
function normalizeMath(text) {
  if (!text) return text;
  // \[ ... \]  → $$...$$  (display)
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => `$$${m}$$`);
  // \( ... \)  → $...$    (inline)
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => `$${m}$`);
  // ( \cmd... ) where content looks like LaTeX → $...$
  // catches patterns like "( \frac{\pi}{2} )" or "( \tan(\theta) = ... )"
  text = text.replace(/\(\s*(\\[a-zA-Z{][\s\S]*?)\s*\)/g, (match, inner) => {
    // only convert if it contains LaTeX commands
    if (/\\[a-zA-Z]/.test(inner)) return `$${inner}$`;
    return match;
  });
  return text;
}


function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });
}

// ─── ChatBubble ───────────────────────────────────────────────────────────────
function ChatBubble({ msg, showToast, isStreaming, userProfile }) {
  const ref = useRef(null);
  const [displayedContent, setDisplayedContent] = useState(isStreaming ? "" : msg.content);
  const [streamDone, setStreamDone] = useState(!isStreaming);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 16, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "power3.out", clearProps: "all" }
    );
  }, []);

  // Typewriter effect for assistant messages
  useEffect(() => {
    if (!isStreaming || msg.role !== "assistant") return;
    const fullText = msg.content;
    let i = 0;
    setDisplayedContent("");
    setStreamDone(false);

    // Clear any previous interval
    if (streamRef.current) clearInterval(streamRef.current);

    // Speed: ~3-4 chars per frame at 16ms = ~200-250 chars/sec
    streamRef.current = setInterval(() => {
      i += Math.floor(Math.random() * 3) + 2; // 2-4 chars at a time for natural feel
      if (i >= fullText.length) {
        setDisplayedContent(fullText);
        setStreamDone(true);
        clearInterval(streamRef.current);
      } else {
        setDisplayedContent(fullText.slice(0, i));
      }
    }, 16);

    return () => clearInterval(streamRef.current);
  }, [isStreaming, msg.content, msg.role]);

  // If not streaming, always show full content
  useEffect(() => {
    if (!isStreaming) setDisplayedContent(msg.content);
  }, [isStreaming, msg.content]);

  const content = isStreaming ? displayedContent : msg.content;

  const MarkdownContent = ({ text }) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          if (match) {
            return (
              <div className="code-block-wrapper">
                <div className="code-header">
                  <span>{match[1]}</span>
                  <button
                    className="copy-code-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(String(children));
                      showToast("Code copied");
                    }}
                  >Copy</button>
                </div>
                <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            );
          }
          return <code className="inline-code" {...props}>{children}</code>;
        },
      }}
    >
      {text}
    </ReactMarkdown>
  );

  return (
    <div ref={ref} className={`message ${msg.role}`}>
      {msg.role === "user" ? (
        <div className="bubble user-bubble">
          <div className="bubble-avatar user-avatar">
            <Avatar
              photoURL={userProfile?.photoURL}
              name={userProfile?.name || "?"}
              className="bubble-pfp-wrap"
              imgClassName="bubble-pfp-img"
            />
          </div>
          <div className="bubble-body">
            {msg.attachmentPreviews && msg.attachmentPreviews.map((p, i) => (
              <img key={i} src={p} alt="" className="bubble-image-preview" loading="lazy" decoding="async" />
            ))}
            {msg.attachmentPreview && !msg.attachmentPreviews && (
              <img src={msg.attachmentPreview} alt="" className="bubble-image-preview" loading="lazy" decoding="async" />
            )}
            <MarkdownContent text={content} />
          </div>
        </div>
      ) : (
        <div className="bubble ai-bubble">
          <div className="bubble-avatar ai-avatar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
          </div>
          <div className="bubble-body">
            {msg.attachmentPreviews && msg.attachmentPreviews.map((p, i) => (
              <img key={i} src={p} alt="" className="bubble-image-preview" loading="lazy" decoding="async" />
            ))}
            <MarkdownContent text={content} />
            {isStreaming && !streamDone && (
              <span className="stream-cursor" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TypingDots ───────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="message assistant">
      <div className="bubble typing-bubble">
        <span className="dot" /><span className="dot" /><span className="dot" />
      </div>
    </div>
  );
}

// ─── OnboardingScreen ─────────────────────────────────────────────────────────
function OnboardingScreen({ user, onComplete }) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!dob) { setError("Please enter your date of birth."); return; }
    const dobDate = new Date(dob);
    if (dobDate >= new Date()) { setError("Date of birth must be in the past."); return; }
    setSaving(true);
    try {
      const googlePhotoURL = user.photoURL || null;
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid, email: user.email, name: name.trim(), dob,
        createdAt: Date.now(), memories: [], photoURL: googlePhotoURL,
      });
      onComplete({ name: name.trim(), dob, email: user.email, uid: user.uid, memories: [], photoURL: googlePhotoURL });
    } catch { setError("Failed to save profile. Please try again."); }
    setSaving(false);
  }

  return (
    <motion.div className="onboarding-screen" initial="hidden" animate="visible" exit="exit" variants={pageVariants}>
      <div className="onboarding-card">
        <div className="onboarding-eyebrow">{'// Welcome to Serendibite Intelligence'}</div>
        <h2 className="onboarding-title">Let's get to know you</h2>
        <p className="onboarding-sub">This helps Serendibite personalise your experience and remember you across all chats.</p>
        <div className="onboarding-form">
          <div className="onboarding-field">
            <label>Your Name</label>
            <input type="text" placeholder="e.g. Alex" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} autoFocus />
          </div>
          <div className="onboarding-field">
            <label>Date of Birth</label>
            <input type="date" value={dob} onChange={(e) => { setDob(e.target.value); setError(""); }} max={new Date().toISOString().split("T")[0]} />
          </div>
          <AnimatePresence>
            {error && <motion.p className="auth-error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{error}</motion.p>}
          </AnimatePresence>
          <motion.button className="auth-btn primary-btn" onClick={handleSubmit} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            {saving ? "Saving…" : "Enter Serendibite →"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── UserDashboard ────────────────────────────────────────────────────────────
function UserDashboard({ userProfile, conversations, memories, onClose, onDeleteMemory, onClearMemories, onUpdatePhoto, onDeleteAccount, user, onShowToast }) {
  const age = computeAge(userProfile.dob);
  const joinDate = userProfile.createdAt
    ? new Date(userProfile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";
  const pfpInputRef = useRef(null);
  const [uploadingPfp, setUploadingPfp] = useState(false);
  const [pfpError, setPfpError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  // ── Linked accounts ──────────────────────────────────────────────────────
  const [linkingProvider, setLinkingProvider] = useState(null);
  const [linkError, setLinkError] = useState("");

  const LINK_PROVIDERS = [
    {
      id: "google.com",
      label: "Google",
      provider: () => new GoogleAuthProvider(),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
        </svg>
      ),
    },
    {
      id: "github.com",
      label: "GitHub",
      provider: () => new GithubAuthProvider(),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
      ),
    },
    {
      id: "microsoft.com",
      label: "Microsoft",
      provider: () => new OAuthProvider("microsoft.com"),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022"/>
          <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00"/>
          <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF"/>
          <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900"/>
        </svg>
      ),
    },
  ];

  function getLinkedProviders() {
    return (user?.providerData || []).map(p => p.providerId);
  }

  async function handleLink(providerDef) {
    setLinkError("");
    setLinkingProvider(providerDef.id);
    try {
      await linkWithPopup(auth.currentUser, providerDef.provider());
      onShowToast?.(`${providerDef.label} linked successfully`);
    } catch (err) {
      if (err.code === "auth/credential-already-in-use") {
        setLinkError(`This ${providerDef.label} account is already linked to a different user.`);
      } else if (err.code === "auth/provider-already-linked") {
        setLinkError(`${providerDef.label} is already linked to this account.`);
      } else if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setLinkError(err.message || `Failed to link ${providerDef.label}.`);
      }
    }
    setLinkingProvider(null);
  }

  async function handleUnlink(providerId, label) {
    setLinkError("");
    const linked = getLinkedProviders();
    if (linked.length <= 1) {
      setLinkError("You must keep at least one sign-in method linked.");
      return;
    }
    setLinkingProvider(providerId);
    try {
      await unlink(auth.currentUser, providerId);
      onShowToast?.(`${label} unlinked`);
    } catch (err) {
      setLinkError(err.message || `Failed to unlink ${label}.`);
    }
    setLinkingProvider(null);
  }

  async function handlePfpChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) { setPfpError("Only JPG, PNG, WebP or GIF allowed."); return; }
    if (file.size > 2 * 1024 * 1024) { setPfpError("Image must be under 2 MB."); return; }
    setUploadingPfp(true); setPfpError("");
    try {
      const dataUrl = await resizeImage(file, 200);
      await onUpdatePhoto(dataUrl);
    } catch { setPfpError("Failed to update photo. Please try again."); }
    setUploadingPfp(false);
  }

  function resizeImage(file, maxPx) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("load")); };
      img.src = url;
    });
  }

  async function handleDeleteAccount() {
    if (deleteInput !== userProfile.name) { setDeleteError(`Type your name exactly: "${userProfile.name}"`); return; }
    setDeletingAccount(true); setDeleteError("");
    try { await onDeleteAccount(); }
    catch (err) { setDeleteError(err.message || "Failed to delete account. You may need to re-login first."); setDeletingAccount(false); }
  }

  return (
    <motion.div className="dashboard-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="dashboard-panel" initial={{ opacity: 0, x: 60, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 60 }} transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }} onClick={(e) => e.stopPropagation()}>
        <div className="dashboard-header">
          <div><div className="dashboard-eyebrow">{'// User Profile'}</div><h2 className="dashboard-name">{userProfile.name}</h2></div>
          <button className="dashboard-close" onClick={onClose}>✕</button>
        </div>
        <div className="dashboard-profile-card">
          <div className="dashboard-avatar-wrap">
            <input ref={pfpInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: "none" }} onChange={handlePfpChange} />
            <div className="dashboard-avatar clickable-avatar" onClick={() => pfpInputRef.current?.click()} title="Change profile picture">
              <DashboardAvatar photoURL={userProfile.photoURL} name={userProfile.name} />
              <div className="avatar-upload-overlay">
                {uploadingPfp ? <span className="avatar-upload-dots"><span className="dot" /><span className="dot" /><span className="dot" /></span> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
              </div>
            </div>
            {pfpError && <p className="pfp-error">{pfpError}</p>}
          </div>
          <div className="dashboard-profile-info">
            <div className="dashboard-stat-row"><span className="dashboard-stat-label">Email</span><span className="dashboard-stat-val">{userProfile.email}</span></div>
            <div className="dashboard-stat-row"><span className="dashboard-stat-label">Age</span><span className="dashboard-stat-val">{age !== null ? `${age} years old` : "—"}</span></div>
            <div className="dashboard-stat-row"><span className="dashboard-stat-label">Joined</span><span className="dashboard-stat-val">{joinDate}</span></div>
          </div>
        </div>
        <div className="dashboard-stats-strip">
          <div className="dashboard-stat-tile"><span className="dst-number">{conversations.length}</span><span className="dst-label">Chats</span></div>
          <div className="dashboard-stat-tile"><span className="dst-number">{memories.length}</span><span className="dst-label">Memories</span></div>
        </div>
        <div className="dashboard-memories">
          <div className="dashboard-section-head">
            <span>Memories</span>
            {memories.length > 0 && <button className="mem-clear-btn" onClick={onClearMemories}>Clear All</button>}
          </div>
          {memories.length === 0
            ? <div className="dashboard-empty-mem">No memories yet. Start chatting!</div>
            : <div className="mem-list">{memories.map((m, i) => <div key={i} className="mem-item"><span>{m}</span><button className="mem-del" onClick={() => onDeleteMemory(i)}>✕</button></div>)}</div>
          }
        </div>
        {/* ── Linked Accounts ── */}
        <div className="dashboard-linked-accounts">
          <div className="dashboard-section-head">
            <span>Linked Accounts</span>
          </div>
          {linkError && (
            <motion.p className="link-error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
              {linkError}
            </motion.p>
          )}
          <div className="linked-providers-list">
            {LINK_PROVIDERS.map((providerDef) => {
              const linked = getLinkedProviders().includes(providerDef.id);
              const busy = linkingProvider === providerDef.id;
              return (
                <div key={providerDef.id} className={`linked-provider-row ${linked ? "linked" : ""}`}>
                  <div className="linked-provider-info">
                    <span className="linked-provider-icon">{providerDef.icon}</span>
                    <span className="linked-provider-label">{providerDef.label}</span>
                    {linked && (
                      <span className="linked-badge">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Linked
                      </span>
                    )}
                  </div>
                  <button
                    className={`linked-provider-btn ${linked ? "unlink-btn" : "link-btn"}`}
                    onClick={() => linked ? handleUnlink(providerDef.id, providerDef.label) : handleLink(providerDef)}
                    disabled={busy}
                    title={linked ? `Unlink ${providerDef.label}` : `Link ${providerDef.label}`}
                  >
                    {busy ? (
                      <span className="avatar-upload-dots"><span className="dot"/><span className="dot"/><span className="dot"/></span>
                    ) : linked ? "Unlink" : "Link"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dashboard-danger">
          {!showDeleteConfirm
            ? <button className="danger-btn" onClick={() => setShowDeleteConfirm(true)}>Delete Account</button>
            : <motion.div className="delete-confirm-box" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <p className="delete-confirm-text">Type <strong>{userProfile.name}</strong> to confirm permanent deletion.</p>
                <input className="delete-confirm-input" value={deleteInput} onChange={(e) => { setDeleteInput(e.target.value); setDeleteError(""); }} placeholder={userProfile.name} />
                {deleteError && <p className="auth-error" style={{ fontSize: "0.68rem", marginTop: "0.4rem" }}>{deleteError}</p>}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                  <button className="danger-cancel-btn" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); setDeleteError(""); }}>Cancel</button>
                  <button className="danger-confirm-btn" onClick={handleDeleteAccount} disabled={deletingAccount || deleteInput !== userProfile.name}>{deletingAccount ? "Deleting…" : "Delete Forever"}</button>
                </div>
              </motion.div>
          }
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Sidebar Icons ────────────────────────────────────────────────────────────
const SidebarIcons = {
  chats: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  codes: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  models: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
    </svg>
  ),
  customize: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41M22 12h-2M4 12H2M19.07 19.07l-1.41-1.41M6.34 6.34L4.93 4.93"/>
      <path d="M12 2v2M12 20v2"/>
    </svg>
  ),
};

// ─── Avatar — with img error fallback to initials ────────────────────────────
function Avatar({ photoURL, name, className, imgClassName }) {
  const [failed, setFailed] = useState(false);
  const initial = (name || "?").charAt(0).toUpperCase();

  function normaliseUrl(url) {
    if (!url) return null;
    if (url.includes("googleusercontent.com")) {
      return url.replace(/=s\d+-c/, "=s200-c").replace(/\/photo\.jpg$/, "/photo.jpg?sz=200");
    }
    return url;
  }

  if (!photoURL || failed) {
    return <span className={className}>{initial}</span>;
  }

  return (
    <span className={className}>
      <img
        src={normaliseUrl(photoURL)}
        alt={name || ""}
        className={imgClassName}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

function DashboardAvatar({ photoURL, name }) {
  const [failed, setFailed] = useState(false);
  const initial = (name || "?").charAt(0).toUpperCase();

  function normaliseUrl(url) {
    if (!url) return null;
    if (url.includes("googleusercontent.com")) {
      return url.replace(/=s\d+-c/, "=s200-c").replace(/\/photo\.jpg$/, "/photo.jpg?sz=200");
    }
    return url;
  }

  if (!photoURL || failed) return <>{initial}</>;

  return (
    <img
      src={normaliseUrl(photoURL)}
      alt={name || "pfp"}
      className="dashboard-avatar-img"
      loading="eager"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

// ─── ArcadeInput — Semantris-style blinking cursor input ─────────────────────
function ArcadeInput({ value, onChange, onSubmit, placeholder }) {
  const hiddenRef = useRef(null);
  const [focused, setFocused] = useState(false);

  function handleWrapperClick() {
    hiddenRef.current?.focus();
  }

  return (
    <div
      className={`arcade-input-wrap${focused ? " focused" : ""}`}
      onClick={handleWrapperClick}
    >
      {/* real input, invisible but receives keyboard events */}
      <input
        ref={hiddenRef}
        className="arcade-input-hidden"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />
      {/* visual display */}
      <div className="arcade-input-display">
        {value.length === 0 && !focused && (
          <span className="arcade-placeholder">{placeholder}</span>
        )}
        <span className="arcade-text">{value}</span>
        {focused && <span className="arcade-cursor" />}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [cookieConsent, setCookieConsent] = useState(() => {
    try { return localStorage.getItem("si_cookie_consent") || null; } catch { return null; }
  });

  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);

  // Sidebar state — persistent (stays open)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState("chats"); // "chats" | "codes" | "models" | "customize"

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  const [openMenu, setOpenMenu] = useState(null);
  const [editingChat, setEditingChat] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [toast, setToast] = useState("");

  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const sendBtnRef = useRef(null);
  const topbarRef = useRef(null);

  // Multi-file attachment
  const [attachedFiles, setAttachedFiles] = useState([]); // array of file objects
  const [fileError, setFileError] = useState("");

  // Theme
  const [currentTheme, setCurrentTheme] = useState(() => {
    try { return localStorage.getItem("si_theme") || "sapphire"; } catch { return "sapphire"; }
  });

  // Auth
  const [authStep, setAuthStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [authError, setAuthError] = useState("");
  const [authInfo, setAuthInfo] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const plusMenuRef = useRef(null);
  const [isTempChat, setIsTempChat] = useState(false);
  const [streamingMsgId, setStreamingMsgId] = useState(null);

  // ── Apply theme on mount and change ──────────────────────────────────────
  useEffect(() => {
    const theme = GEM_THEMES.find(t => t.id === currentTheme) || GEM_THEMES[0];
    applyTheme(theme);
  }, [currentTheme]);

  function switchTheme(id) {
    setCurrentTheme(id);
    try { localStorage.setItem("si_theme", id); } catch {}
    showToast(`✨ ${GEM_THEMES.find(t => t.id === id)?.name} theme applied`);
  }

  // ── GSAP anims ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!topbarRef.current) return;
    gsap.fromTo(topbarRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", delay: 0.1 });
  }, [user]);

  useEffect(() => {
    if (!sendBtnRef.current || loading) return;
    gsap.fromTo(sendBtnRef.current, { scale: 0.94 }, { scale: 1, duration: 0.4, ease: "elastic.out(1.2, 0.5)" });
  }, [loading]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) { setUserProfile(null); return; }
    setProfileLoading(true);
    getDoc(doc(db, "users", user.uid))
      .then(async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (user.photoURL && !data.photoURL) {
            await updateDoc(doc(db, "users", user.uid), { photoURL: user.photoURL });
            data.photoURL = user.photoURL;
          }
          setUserProfile(data);
        } else setUserProfile(null);
      })
      .catch(() => setUserProfile(null))
      .finally(() => setProfileLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user || !userProfile) return;
    loadConversations();
    // eslint-disable-next-line
  }, [user, userProfile]);

  async function loadConversations() {
    try {
      const q = query(collection(db, "conversations"), where("uid", "==", user.uid), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const loaded = [];
      snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() }));
      setConversations(loaded);
      if (loaded.length > 0) {
        setCurrentConversation(loaded[0].id);
        loadMessages(loaded[0].id);
      } else {
        const convo = await addDoc(collection(db, "conversations"), { uid: user.uid, title: "New Chat", createdAt: Date.now() });
        setConversations([{ id: convo.id, title: "New Chat" }]);
        setCurrentConversation(convo.id);
      }
    } catch (err) { console.error("Conversation Error:", err); }
  }

  useEffect(() => {
    const close = () => setOpenMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    function handleOutside(e) {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) setPlusMenuOpen(false);
    }
    window.addEventListener("mousedown", handleOutside);
    return () => window.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  async function loadMessages(conversationId) {
    try {
      const q = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId),
        where("uid", "==", user.uid),
        orderBy("createdAt", "asc")
      );
      const snapshot = await getDocs(q);
      const loaded = [];
      snapshot.forEach((d) => {
        const msg = { id: d.id, ...d.data() };
        if (msg.role === "assistant") msg.content = normalizeMath(msg.content);
        loaded.push(msg);
      });
      setMessages(loaded);
    } catch (err) { console.error("Message Error:", err); }
  }

  async function extractAndSaveMemories(userText, aiText) {
    try {
      const systemPrompt = `You are a memory extractor. Given a user message and an AI reply, extract short, factual, first-person memory notes about the USER only (not AI opinions). Return a JSON array of strings, max 3 items, or [] if nothing memorable. Respond ONLY with valid JSON array, no markdown.`;
      const response = await fetch(`/.netlify/functions/gpt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: `User said: "${userText}"\nAI replied: "${aiText.slice(0, 400)}"\n\nExtract memory notes about the user.` }], system: systemPrompt }),
      });
      const data = await response.json();
      const raw = data.response?.trim() || "[]";
      const newMems = JSON.parse(raw.replace(/```json|```/g, ""));
      if (!Array.isArray(newMems) || newMems.length === 0) return;
      const existing = userProfile?.memories || [];
      const combined = [...existing];
      for (const m of newMems) { if (!combined.some((e) => e.toLowerCase() === m.toLowerCase())) combined.push(m); }
      const trimmed = combined.slice(-50);
      await updateDoc(doc(db, "users", user.uid), { memories: trimmed });
      setUserProfile((prev) => ({ ...prev, memories: trimmed }));
    } catch (err) { console.warn("Memory extraction skipped:", err.message); }
  }

  async function deleteMemory(index) {
    const updated = (userProfile.memories || []).filter((_, i) => i !== index);
    await updateDoc(doc(db, "users", user.uid), { memories: updated });
    setUserProfile((prev) => ({ ...prev, memories: updated }));
    showToast("Memory removed");
  }

  async function clearMemories() {
    await updateDoc(doc(db, "users", user.uid), { memories: [] });
    setUserProfile((prev) => ({ ...prev, memories: [] }));
    showToast("All memories cleared");
  }

  async function updatePhoto(dataUrl) {
    await updateDoc(doc(db, "users", user.uid), { photoURL: dataUrl });
    setUserProfile((prev) => ({ ...prev, photoURL: dataUrl }));
    showToast("Profile photo updated");
  }

  async function deleteAccount() {
    const uid = user.uid;
    const msgsSnap = await getDocs(query(collection(db, "messages"), where("uid", "==", uid)));
    await Promise.all(msgsSnap.docs.map((d) => deleteDoc(d.ref)));
    const convosSnap = await getDocs(query(collection(db, "conversations"), where("uid", "==", uid)));
    await Promise.all(convosSnap.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(db, "users", uid));
    await deleteUser(auth.currentUser);
    setUser(null); setUserProfile(null); setMessages([]); setConversations([]);
    setShowDashboard(false);
    showToast("Account deleted.");
  }

  function friendlyError(code) {
    const map = {
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/email-already-in-use": "An account with this email already exists.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
      "auth/invalid-credential": "Invalid email or password.",
      "auth/account-exists-with-different-credential": "An account already exists with the same email.",
      "auth/popup-closed-by-user": "Sign-in popup was closed. Please try again.",
      "auth/cancelled-popup-request": "Only one popup can be open at a time.",
    };
    return map[code] || "Something went wrong. Please try again.";
  }

  function showToast(message) { setToast(message); setTimeout(() => setToast(""), 2600); }
  function scrollToBottom(smooth = true) { messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" }); }

  async function loginWithGoogle() {
    setAuthError(""); setAuthLoading(true);
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (err) { setAuthError(friendlyError(err.code)); }
    setAuthLoading(false);
  }

  async function loginWithGitHub() {
    setAuthError(""); setAuthLoading(true);
    try { await signInWithPopup(auth, new GithubAuthProvider()); }
    catch (err) { setAuthError(friendlyError(err.code)); }
    setAuthLoading(false);
  }

  async function loginWithMicrosoft() {
    setAuthError(""); setAuthLoading(true);
    try { await signInWithPopup(auth, new OAuthProvider("microsoft.com")); }
    catch (err) { setAuthError(friendlyError(err.code)); }
    setAuthLoading(false);
  }

  async function handleEmailOtpRequest(e) {
    e?.preventDefault();
    setAuthError(""); setAuthInfo(""); setAuthLoading(true);
    try {
      const res = await fetch("/.netlify/functions/sendOTP", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP.");
      setAuthInfo(`A 6-digit code has been sent to ${email}`);
      setAuthStep("otp");
    } catch (err) { setAuthError(err.message || "Could not send OTP. Please try again."); }
    setAuthLoading(false);
  }

  async function handleOtpVerify(e) {
    e?.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setAuthError("Please enter the full 6-digit code."); return; }
    setAuthError(""); setAuthLoading(true);
    try {
      const res = await fetch("/.netlify/functions/verifyOTP", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp: code }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid or expired code.");
      if (data.customToken) { await signInWithCustomToken(auth, data.customToken); }
      else throw new Error("No token returned from server.");
    } catch (err) { setAuthError(err.message || "Verification failed. Please try again."); }
    setAuthLoading(false);
  }

  async function logout() {
    await signOut(auth);
    setUser(null); setUserProfile(null); setMessages([]); setConversations([]);
    setShowDashboard(false);
  }

  function acceptCookies() { try { localStorage.setItem("si_cookie_consent", "accepted"); } catch {} setCookieConsent("accepted"); }
  function declineCookies() { try { localStorage.setItem("si_cookie_consent", "declined"); } catch {} setCookieConsent("declined"); }

  // ── Conversation CRUD ─────────────────────────────────────────────────────
  async function createConversation() {
    try {
      const convo = await addDoc(collection(db, "conversations"), { uid: user.uid, title: "New Chat", createdAt: Date.now() });
      setConversations((prev) => [{ id: convo.id, title: "New Chat" }, ...prev]);
      setCurrentConversation(convo.id);
      setMessages([]);
    } catch (err) { console.error("Create Error:", err); }
  }

  async function deleteConversation(conversationId) {
    try {
      await deleteDoc(doc(db, "conversations", conversationId));
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (currentConversation === conversationId) {
        setMessages([]);
        const remaining = conversations.filter((c) => c.id !== conversationId);
        if (remaining.length > 0) { setCurrentConversation(remaining[0].id); loadMessages(remaining[0].id); }
        else setCurrentConversation(null);
      }
    } catch (err) { console.error("Delete Error:", err); }
  }

  async function renameConversation(conversationId) {
    if (!editingTitle.trim()) return;
    try {
      await updateDoc(doc(db, "conversations", conversationId), { title: editingTitle });
      setConversations((prev) => prev.map((c) => c.id === conversationId ? { ...c, title: editingTitle } : c));
      setEditingChat(null); setEditingTitle("");
    } catch (err) { console.error("Rename Error:", err); }
  }

  async function shareConversation(conversationId) {
    try {
      const q = query(collection(db, "messages"), where("conversationId", "==", conversationId), where("uid", "==", user.uid), orderBy("createdAt", "asc"));
      const snapshot = await getDocs(q);
      let text = "";
      snapshot.forEach((d) => { const msg = d.data(); text += `${msg.role.toUpperCase()}:\n${msg.content}\n\n`; });
      await navigator.clipboard.writeText(text);
      showToast("Conversation copied to clipboard");
    } catch (err) { console.error("Share Error:", err); }
  }

  async function generateTitle(userPrompt, fileName) {
    try {
      const input = userPrompt?.trim() ? userPrompt : fileName ? `User attached a file: ${fileName}` : "General conversation";
      const res = await fetch("/.netlify/functions/gpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: `Generate a short, specific chat title (max 5 words, no quotes, no punctuation) for a conversation that starts with this message: "${input.slice(0, 200)}"` }] }),
      });
      const data = await res.json();
      const title = data.response?.trim().replace(/['"]/g, "").slice(0, 40);
      return title || input.slice(0, 40);
    } catch { return (userPrompt || fileName || "New Chat").slice(0, 40); }
  }

  // ── Multi-File handling ───────────────────────────────────────────────────
  function handleFileButtonClick() { setFileError(""); fileInputRef.current?.click(); }

  async function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    const newFiles = [];
    for (const file of files) {
      const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type);
      const isDoc   = SUPPORTED_DOC_TYPES.includes(file.type);
      if (!isImage && !isDoc) { setFileError(`Unsupported file: ${file.name}`); continue; }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) { setFileError(`${file.name} exceeds ${MAX_FILE_SIZE_MB} MB limit.`); continue; }
      const base64 = await fileToBase64(file);
      const previewUrl = isImage ? URL.createObjectURL(file) : null;
      newFiles.push({ name: file.name, type: file.type, base64, previewUrl, isImage });
    }
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    if (newFiles.length) setFileError("");
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function removeAttachment(index) {
    setAttachedFiles((prev) => {
      const updated = [...prev];
      if (updated[index]?.previewUrl) URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  }

  // ── Send message ──────────────────────────────────────────────────────────
  async function sendMessage() {
    if ((!prompt.trim() && !attachedFiles.length) || !currentConversation) return;

    if (sendBtnRef.current) {
      gsap.fromTo(sendBtnRef.current, { scale: 0.88 }, { scale: 1, duration: 0.5, ease: "elastic.out(1.3, 0.5)" });
    }

    const currentPrompt = prompt;
    const currentAttachments = [...attachedFiles];
    const activeConversation = conversations.find((c) => c.id === currentConversation);

    let displayContent = currentPrompt.trim();
    if (currentAttachments.length) {
      displayContent += (displayContent ? "\n\n" : "") + currentAttachments.map(f => `📎 *${f.name}*`).join("\n");
    }

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: displayContent,
      attachmentPreviews: currentAttachments.filter(f => f.isImage).map(f => f.previewUrl),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setPrompt(""); setAttachedFiles([]); setLoading(true);

    try {
      if (activeConversation?.title === "New Chat") {
        generateTitle(currentPrompt, currentAttachments[0]?.name).then(async (title) => {
          await updateDoc(doc(db, "conversations", currentConversation), { title });
          setConversations((prev) => prev.map((c) => c.id === currentConversation ? { ...c, title } : c));
        });
      }

      if (!isTempChat) {
        await addDoc(collection(db, "messages"), { conversationId: currentConversation, uid: user.uid, role: "user", content: displayContent, createdAt: Date.now() });
      }

      const memories = userProfile?.memories || [];
      const memoryPrefix = memories.length > 0 ? `[MEMORY CONTEXT — things you know about this user: ${memories.join("; ")}]\n\n` : "";
      const userName = userProfile?.name || null;
      const age = computeAge(userProfile?.dob);
      let profileCtx = "";
      if (userName) profileCtx += `The user's name is ${userName}. `;
      if (age !== null) profileCtx += `They are ${age} years old. `;
      const systemContext = profileCtx ? `${profileCtx}Use this to personalise your responses naturally.\n\n${memoryPrefix}` : memoryPrefix;

      const apiMessages = updatedMessages.map((m) => {
        if (m.id === userMessage.id && currentAttachments.length) {
          const contentParts = [];
          if (currentPrompt.trim()) contentParts.push({ type: "text", text: currentPrompt });
          else contentParts.push({ type: "text", text: currentAttachments.length > 1 ? "Please analyse these files." : "Please analyse this file." });

          for (const att of currentAttachments) {
            if (att.isImage) {
              contentParts.push({ type: "image", source: { type: "base64", media_type: att.type, data: att.base64 } });
            } else {
              const isRealPdf = att.type === "application/pdf";
              contentParts.push(
                isRealPdf
                  ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: att.base64 } }
                  : { type: "text", text: `\n\n--- File: ${att.name} ---\n${atob(att.base64)}` }
              );
            }
          }
          return { role: "user", content: contentParts };
        }
        return { role: m.role, content: m.content };
      });

      if (systemContext && apiMessages.length > 0) {
        const firstUser = apiMessages.find((m) => m.role === "user");
        if (firstUser && typeof firstUser.content === "string") firstUser.content = systemContext + firstUser.content;
      }

      const response = await fetch(`/.netlify/functions/${selectedModel.fn}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, model: selectedModel.id }),
      });

      const data = await response.json();
      const aiContent = normalizeMath(data.response);
      const aiMessage = { id: Date.now() + 1, role: "assistant", content: aiContent };
      setStreamingMsgId(aiMessage.id);
      setMessages((prev) => [...prev, aiMessage]);

      if (!isTempChat) {
        await addDoc(collection(db, "messages"), { conversationId: currentConversation, uid: user.uid, role: "assistant", content: aiContent, createdAt: Date.now() + 1 });
      }

      if (currentPrompt.trim()) extractAndSaveMemories(currentPrompt, aiContent);

    } catch (err) { console.error("Send Error:", err); }
    setLoading(false);
  }

  // ── Filtered conversations (search) ───────────────────────────────────────
  const filteredConversations = conversations.filter((c) =>
    !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Code blocks from all messages ────────────────────────────────────────
  const codeBlocks = extractCodeBlocks(messages);

  // ── NOT LOGGED IN ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <motion.div className="login-screen" initial="hidden" animate="visible" exit="exit" variants={pageVariants}>
        <div className="login-welcome">
          <motion.div className="eyebrow" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            {'// Serendibite Intelligence'}
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            Your AI,<br />always <span>ready</span>.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            A fast, intelligent assistant that remembers your conversations and helps you think, write, and build beautifully.
          </motion.p>
          <motion.div className="login-features" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
            {["Persistent conversation history", "Powered by OpenRouter and ClaudeAI", "Secure sign-in, zero fuss", "Created by Anirudh Rajesh"].map((feat, i) => (
              <motion.div key={feat} className="login-feature" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 + i * 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
                <div className="login-feature-dot" />{feat}
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div className="login-panel" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <div className="login-card">
            <div className="card-eyebrow">Get started</div>
            <h2>{authStep === "otp" ? "Check your email" : "Welcome"}</h2>
            <p className="card-sub">{authStep === "otp" ? `We sent a 6-digit code to ${email}` : "Sign in or create an account instantly."}</p>

            {authStep === "email" ? (
              <form className="auth-form" onSubmit={handleEmailOtpRequest}>
                <input type="email" placeholder="Your email address" value={email} onChange={(e) => { setEmail(e.target.value); setAuthError(""); }} required autoComplete="email" autoFocus />
                <AnimatePresence>
                  {authError && <motion.p className="auth-error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{authError}</motion.p>}
                </AnimatePresence>
                <button type="submit" className="auth-btn primary-btn" disabled={authLoading || !email}>{authLoading ? "Sending code…" : "Continue with Email →"}</button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleOtpVerify}>
                <div className="otp-row">
                  {otp.map((digit, i) => (
                    <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit} className="otp-input" autoFocus={i === 0}
                      onChange={(e) => { const val = e.target.value.replace(/\D/, ""); const next = [...otp]; next[i] = val; setOtp(next); if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus(); }}
                      onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus(); }}
                    />
                  ))}
                </div>
                <AnimatePresence>
                  {authError && <motion.p className="auth-error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{authError}</motion.p>}
                  {authInfo  && <motion.p className="auth-info"  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{authInfo}</motion.p>}
                </AnimatePresence>
                <button type="submit" className="auth-btn primary-btn" disabled={authLoading || otp.join("").length < 6}>{authLoading ? "Verifying…" : "Verify Code →"}</button>
                <button type="button" className="auth-back-btn" onClick={() => { setAuthStep("email"); setOtp(["","","","","",""]); setAuthError(""); setAuthInfo(""); }}>← Use a different email</button>
              </form>
            )}

            <div id="recaptcha-container" />
            <div className="auth-divider"><span>or continue with</span></div>
            <div className="social-providers-grid">
              <button className="auth-btn social-provider-btn google-btn" onClick={loginWithGoogle} disabled={authLoading}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span>Google</span>
              </button>
              <button className="auth-btn social-provider-btn github-btn" onClick={loginWithGitHub} disabled={authLoading}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>
                <span>GitHub</span>
              </button>
              <button className="auth-btn social-provider-btn microsoft-btn" onClick={loginWithMicrosoft} disabled={authLoading}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="1" y="1" width="10.5" height="10.5" fill="#F25022"/><rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00"/><rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF"/><rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900"/></svg>
                <span>Microsoft</span>
              </button>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {!cookieConsent && (
            <motion.div className="cookie-banner" role="dialog" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <div className="cookie-text"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>We use cookies to keep you signed in and improve your experience. See our <a href="/privacy" className="cookie-link">Privacy Policy</a>.</span></div>
              <div className="cookie-actions"><button className="cookie-btn cookie-decline" onClick={declineCookies}>Decline</button><button className="cookie-btn cookie-accept" onClick={acceptCookies}>Accept</button></div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (profileLoading) {
    return (
      <div className="profile-loading">
        <div className="profile-loading-dots"><span className="dot" /><span className="dot" /><span className="dot" /></div>
        <p>Loading your profile…</p>
      </div>
    );
  }

  if (user && !userProfile) {
    return <AnimatePresence><OnboardingScreen user={user} onComplete={(profile) => setUserProfile(profile)} /></AnimatePresence>;
  }

  // ── MAIN APP ──────────────────────────────────────────────────────────────
  return (
    <div className={`app sidebar-persistent ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      {/* Dashboard */}
      <AnimatePresence>
        {showDashboard && (
          <UserDashboard
            userProfile={userProfile} conversations={conversations} memories={userProfile?.memories || []}
            onClose={() => setShowDashboard(false)} onDeleteMemory={deleteMemory} onClearMemories={clearMemories}
            onUpdatePhoto={updatePhoto} onDeleteAccount={deleteAccount}
            user={user} onShowToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR (persistent) ── */}
      <div className={`sidebar-persistent-panel ${sidebarOpen ? "open" : "collapsed"}`}>
        {/* Sidebar icon rail */}
        <div className="sidebar-icon-rail">
          <button
            className="sidebar-rail-logo"
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </button>

          {[
            { id: "chats",     icon: SidebarIcons.chats,     label: "Chats" },
            { id: "codes",     icon: SidebarIcons.codes,     label: "Codes" },
            { id: "models",    icon: SidebarIcons.models,    label: "Models" },
            { id: "customize", icon: SidebarIcons.customize, label: "Themes" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`sidebar-rail-btn ${sidebarTab === tab.id ? "active" : ""}`}
              onClick={() => { setSidebarTab(tab.id); if (!sidebarOpen) setSidebarOpen(true); }}
              title={tab.label}
            >
              {tab.icon}
              <span className="rail-label">{tab.label}</span>
            </button>
          ))}

          {/* Profile at bottom */}
          <div className="sidebar-rail-spacer" />
          <button
            className="sidebar-rail-profile"
            onClick={() => setShowDashboard(true)}
            title="View profile"
          >
            <Avatar
              photoURL={userProfile.photoURL}
              name={userProfile.name}
              className="rail-avatar"
              imgClassName="rail-avatar-img"
            />
          </button>
        </div>

        {/* Sidebar panel content */}
        {sidebarOpen && (
          <div className="sidebar-panel-content">
            {/* ── CHATS TAB ── */}
            {sidebarTab === "chats" && (
              <div className="sidebar-tab-pane">
                <div className="sidebar-tab-header">
                  <div className="sidebar-tab-title">Chats</div>
                  <motion.button className="new-chat-btn-compact" onClick={createConversation} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} title="New chat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </motion.button>
                </div>

                {/* Search */}
                <div className="sidebar-search-wrap">
                  <svg className="sidebar-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    className="sidebar-search-input"
                    placeholder="Search chats…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && <button className="sidebar-search-clear" onClick={() => setSearchQuery("")}>✕</button>}
                </div>

                {/* Temp chat toggle */}
                <div className="temp-chat-toggle" onClick={() => { setIsTempChat((v) => !v); showToast(isTempChat ? "Persistent chat on" : "Temporary chat on — messages won't be saved"); }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>Temp Chat</span>
                  <div className={`toggle-pill ${isTempChat ? "on" : ""}`}><div className="toggle-knob" /></div>
                </div>

                <div className="conversation-list">
                  <AnimatePresence initial={false}>
                    {filteredConversations.map((convo, i) => (
                      <motion.div
                        key={convo.id}
                        className={`conversation ${currentConversation === convo.id ? "active" : ""}`}
                        initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}
                        transition={{ delay: i * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        onClick={async () => { setCurrentConversation(convo.id); await loadMessages(convo.id); }}
                      >
                        <div className="conversation-content">
                          {editingChat === convo.id ? (
                            <input
                              className="rename-input" value={editingTitle} autoFocus
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => { if (e.key === "Enter") renameConversation(convo.id); if (e.key === "Escape") { setEditingChat(null); setEditingTitle(""); } }}
                              onBlur={() => { setEditingChat(null); setEditingTitle(""); }}
                            />
                          ) : (
                            <span>{convo.title}</span>
                          )}
                          <div className="menu-wrapper">
                            <button className="menu-btn" onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === convo.id ? null : convo.id); }}>⋮</button>
                            <AnimatePresence>
                              {openMenu === convo.id && (
                                <motion.div className="conversation-menu" variants={dropdownVariants} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => { shareConversation(convo.id); setOpenMenu(null); }}>Share</button>
                                  <button onClick={() => { setEditingChat(convo.id); setEditingTitle(convo.title); setOpenMenu(null); }}>Rename</button>
                                  <button className="delete-option" onClick={() => { deleteConversation(convo.id); setOpenMenu(null); }}>Delete</button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {filteredConversations.length === 0 && searchQuery && (
                    <div className="sidebar-empty-msg">No chats match "{searchQuery}"</div>
                  )}
                </div>
              </div>
            )}

            {/* ── CODES TAB ── */}
            {sidebarTab === "codes" && (
              <div className="sidebar-tab-pane">
                <div className="sidebar-tab-header">
                  <div className="sidebar-tab-title">Code Blocks</div>
                  <span className="sidebar-tab-count">{codeBlocks.length}</span>
                </div>
                {codeBlocks.length === 0 ? (
                  <div className="sidebar-empty-msg" style={{ padding: "2rem 1rem" }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{'</>'}</div>
                    No code blocks yet. Ask me to write some code!
                  </div>
                ) : (
                  <div className="codes-list">
                    {codeBlocks.map((block) => (
                      <div key={block.id} className="code-sidebar-item">
                        <div className="code-sidebar-header">
                          <span className="code-sidebar-lang">{block.lang}</span>
                          <button
                            className="code-sidebar-copy"
                            onClick={() => { navigator.clipboard.writeText(block.code); showToast("Code copied!"); }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          </button>
                        </div>
                        <pre className="code-sidebar-preview">{block.code.slice(0, 200)}{block.code.length > 200 ? "…" : ""}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── MODELS TAB ── */}
            {sidebarTab === "models" && (
              <div className="sidebar-tab-pane">
                <div className="sidebar-tab-header">
                  <div className="sidebar-tab-title">Models</div>
                </div>
                <div className="models-list">
                  {["OpenAI", "DeepSeek", "Meta"].map((provider) => (
                    <div key={provider} className="model-provider-group">
                      <div className="model-provider-label">{provider}</div>
                      {AI_MODELS.filter(m => m.provider === provider).map((m) => (
                        <button
                          key={m.id}
                          className={`model-card ${selectedModel.id === m.id ? "active" : ""}`}
                          onClick={() => { setSelectedModel(m); showToast(`Switched to ${m.label}`); }}
                          style={{ "--model-color": m.color }}
                        >
                          <span className="model-card-icon">{m.icon}</span>
                          <div className="model-card-info">
                            <span className="model-card-label">{m.label}</span>
                            <span className="model-card-provider">{m.provider}</span>
                          </div>
                          {selectedModel.id === m.id && (
                            <svg className="model-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── CUSTOMIZE TAB ── */}
            {sidebarTab === "customize" && (
              <div className="sidebar-tab-pane">
                <div className="sidebar-tab-header">
                  <div className="sidebar-tab-title">Themes</div>
                </div>
                <div className="customize-subtitle">Choose your gem</div>
                <div className="themes-grid">
                  {GEM_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      className={`theme-card ${currentTheme === theme.id ? "active" : ""}`}
                      onClick={() => switchTheme(theme.id)}
                      style={{
                        "--th-accent": theme.vars["--accent"],
                        "--th-bg": theme.vars["--bg"],
                      }}
                    >
                      <div className="theme-gem-preview">
                        <div className="theme-preview-swatch" style={{ background: theme.vars["--accent"] }} />
                        <div className="theme-preview-swatch" style={{ background: theme.vars["--accent2"] }} />
                        <div className="theme-preview-swatch" style={{ background: theme.vars["--accent3"] }} />
                      </div>
                      <span className="theme-icon">{theme.icon}</span>
                      <span className="theme-name">{theme.name}</span>
                      <span className="theme-desc">{theme.desc}</span>
                      {currentTheme === theme.id && (
                        <div className="theme-active-badge">Active</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MAIN CHAT PANEL ── */}
      <div className="main">
        <div className="topbar" ref={topbarRef}>
          <h1>Serendibite Intelligence</h1>

          {isTempChat && (
            <span className="temp-badge" title="Messages won't be saved">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Temp
            </span>
          )}

          {/* Active model chip */}
          <button className="active-model-chip" onClick={() => { setSidebarTab("models"); setSidebarOpen(true); }} title={`Model: ${selectedModel.label}`}>
            <span>{selectedModel.icon}</span>
            <span className="active-model-dot" />
            <span className="active-model-label">{selectedModel.label}</span>
          </button>

          <motion.button
            className="topbar-dashboard-btn"
            onClick={() => setShowDashboard(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            title="Open dashboard"
          >
            <Avatar
              photoURL={userProfile.photoURL}
              name={userProfile.name}
              className="topbar-avatar"
              imgClassName="topbar-avatar-img"
            />
            {userProfile.name.split(" ")[0]}
          </motion.button>

          <motion.button onClick={logout} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}>Logout</motion.button>
        </div>

        {/* Chat area */}
        <div className="chat-container" ref={chatContainerRef}>
          {messages.length === 0 && !loading && (
            <div className="empty-state">
              <div className="empty-orb" />
              <div className="empty-label">{'// Serendibite Intelligence'}</div>
              <h1 className="empty-title">Good to see you, {userProfile.name.split(" ")[0]}.</h1>
              <p className="empty-subtitle">What's new today? Build ideas, analyse files, explore intelligence, and create something extraordinary.</p>
              <div className="empty-suggestions">
                <button onClick={() => setPrompt("Help me build an AI workflow system")}>AI Workflow Ideas</button>
                <button onClick={() => setPrompt("Analyse this dataset for patterns")}>Data Analysis</button>
                <button onClick={() => setPrompt("Help me design a futuristic UI")}>UI Inspiration</button>
                <button onClick={() => setPrompt("Teach me machine learning step by step")}>Learn ML</button>
              </div>
            </div>
          )}
          {messages.map((msg, idx) => (
            <ChatBubble
              key={msg.id}
              msg={msg}
              showToast={showToast}
              isStreaming={msg.role === "assistant" && idx === messages.length - 1 && streamingMsgId === msg.id}
              userProfile={userProfile}
            />
          ))}
          {loading && <TypingDots />}
          <div ref={messagesEndRef} />
        </div>

        {/* Multi-file attachment bar */}
        <AnimatePresence>
          {(attachedFiles.length > 0 || fileError) && (
            <motion.div className="attachment-bar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
              {fileError && <span className="attachment-error">{fileError}</span>}
              <div className="attachment-chips">
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="attachment-chip">
                    {file.isImage ? (
                      <img src={file.previewUrl} alt={file.name} className="attachment-thumb" />
                    ) : (
                      <svg className="attachment-doc-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                    )}
                    <span className="attachment-name">{file.name}</span>
                    <button className="attachment-remove" onClick={() => removeAttachment(idx)} aria-label="Remove attachment">✕</button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="input-container">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,text/csv,text/markdown,application/json,text/javascript,text/html,text/css"
            style={{ display: "none" }}
            onChange={handleFileChange}
            multiple
          />

          {/* Plus menu */}
          <div className="plus-menu-wrap" ref={plusMenuRef}>
            <motion.button className="attach-btn" onClick={() => setPlusMenuOpen((o) => !o)} aria-label="More options" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <i className="fas fa-plus"></i>
            </motion.button>
            <AnimatePresence>
              {plusMenuOpen && (
                <motion.div className="plus-dropdown" variants={dropdownVariants} initial="hidden" animate="visible" exit="exit">
                  <button className="plus-option" onClick={() => { handleFileButtonClick(); setPlusMenuOpen(false); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    <span>Attach Files</span>
                  </button>
                  <button className="plus-option" onClick={() => { setPrompt((p) => p + "[web search] "); setPlusMenuOpen(false); showToast("Web search mode activated"); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <span>Web Search</span>
                  </button>
                  <button className="plus-option" onClick={() => { fileInputRef.current?.click(); setPlusMenuOpen(false); showToast("Select images to analyse"); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span>Image Analysis</span>
                  </button>
                  <button className="plus-option" onClick={() => { setPrompt((p) => p + "[math] "); setPlusMenuOpen(false); showToast("Mathematical mode activated"); }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
                    <span>Math Solver</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ArcadeInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={sendMessage}
            placeholder={attachedFiles.length ? `Ask about ${attachedFiles.length} file${attachedFiles.length > 1 ? "s" : ""}…` : "Message AI..."}
          />

          <motion.button ref={sendBtnRef} onClick={sendMessage} disabled={loading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}>
            {loading ? "…" : "Send"}
          </motion.button>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className="toast" key="toast" variants={toastVariants} initial="hidden" animate="visible" exit="exit">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Disclaimer */}
      <div className="ai-disclaimer" role="note">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        AI can make mistakes. Verify important information.
      </div>

      {/* Cookie Banner */}
      <AnimatePresence>
        {!cookieConsent && (
          <motion.div className="cookie-banner" role="dialog" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <div className="cookie-text"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>We use cookies to keep you signed in and improve your experience. See our <a href="/privacy" className="cookie-link">Privacy Policy</a>.</span></div>
            <div className="cookie-actions"><button className="cookie-btn cookie-decline" onClick={declineCookies}>Decline</button><button className="cookie-btn cookie-accept" onClick={acceptCookies}>Accept</button></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;