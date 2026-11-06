import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import {
  IconMicrophone, IconLock, IconWorld, IconCamera,
  IconSparkles, IconPhoto, IconShieldLock
} from "@tabler/icons-react";

// ============ BACKEND ============
const API_URL = import.meta.env.VITE_BACKEND_URL || "https://astra-backend-bddp.onrender.com";

// Wake up Render backend on app load (free tier spins down)
fetch(`${API_URL}/health`).catch(() => {});

async function callAPI(endpoint, method = "GET", body = null) {
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    return { ...data, _status: response.status };
  } catch (error) {
    console.error("Error API:", error);
    return { error: error.message };
  }
}

// ============ LANGUAGE DETECTION ============
const detectLang = () => {
  const lang = navigator.language || navigator.languages?.[0] || "es";
  return lang.toLowerCase().startsWith("en") ? "en" : "es";
};
const LANG = detectLang();
const T = {
  es: {
    tabSonar: "Soñar", tabUniverso: "Universo", tabDiario: "Diario", tabYo: "Yo",
    describeTitle: "DESCRIBE TU SUEÑO",
    placeholder: "Volaba sobre una ciudad de cristal bajo el océano...",
    generateBtn: "Generar sueño",
    noCredits: "Sin suscripción activa",
    freeCredit: "🎁 Tienes 1 sueño gratis — ¡úsalo ahora!",
    loading: "Cargando...",
    faceTitle: "¿Quieres aparecer en tu sueño?",
    faceUpload: "Subir foto", faceChange: "Cambiar foto", faceUploading: "Subiendo...",
    faceInclude: "Aparecer en mi sueño",
    faceSubOnly: "🔒 Solo con suscripción activa",
    publicToggle: "Compartir en Universo",
    formatReel: "Reel 9:16", formatSquare: "Cuadrado 1:1",
    backBtn: "← Volver",
    downloadBtn: "⬇ Descargar", shareBtn: "💚 Compartir", copyBtn: "🔗 Copiar", copiedBtn: "✓ Copiado",
    interpretation: "INTERPRETACIÓN",
    commentsBtn: "comentarios",
    viewPlans: "Ver planes de suscripción",
    diaryTitle: "Tu Diario de Sueños", diaryEmpty: "Aún no has generado ningún sueño.",
    dreamsCount: "Sueños",
    profilePlan: "TU PLAN", profileNoPlan: "Sin plan activo",
    profileCredits: "sueños disponibles este mes",
    profileUpgrade: "Ver planes",
    profileEdit: "Editar perfil",
    profilePrivacy: "Política de Privacidad",
    profileTerms: "Términos de Servicio",
    profileSupport: "Soporte",
    profileSignOut: "Cerrar sesión",
    planChoose: "Elige tu plan", planCancel: "Cancela cuando quieras · Pago en pesos mexicanos",
    planActive: "✓ Plan activo", planStart: "Empezar con", planNow: "Ahora no",
    planSecurity: "🔒 Pago seguro · Stripe · Se renueva mensualmente",
    universoEmpty: "Aún no hay sueños públicos.",
    universoTitle: "Universo de Sueños",
    greetingMorning: "Buenos días", greetingAfternoon: "Buenas tardes", greetingEvening: "Buenas noches",
    landingTitle: "Convierte tus sueños en videos cinematográficos con IA",
    landingSubtitle: "Describe lo que soñaste y en segundos lo ves en video.",
    landingBadge: "✨ Regístrate y obtén un sueño gratis",
    landingCta: "Crear mi sueño gratis →",
    landingStart: "Comenzar gratis", landingSignIn: "Iniciar sesión",
    landingStep1Title: "Describe tu sueño", landingStep1Text: "Escribe lo que soñaste, en tus propias palabras",
    landingStep2Title: "La IA lo mejora", landingStep2Text: "Nuestra inteligencia artificial enriquece tu sueño con detalles cinematográficos",
    landingStep3Title: "Recíbelo en video", landingStep3Text: "La IA lo convierte en una escena cinematográfica en segundos",
    landingHowTitle: "Así de simple",
    landingDesktopCta: "Crear mi primer sueño gratis",
    noTrial: "Sin tarjeta · Sin compromisos",
  },
  en: {
    tabSonar: "Dream", tabUniverso: "Universe", tabDiario: "Journal", tabYo: "Me",
    describeTitle: "DESCRIBE YOUR DREAM",
    placeholder: "I was flying over a crystal city beneath the ocean...",
    generateBtn: "Generate dream",
    noCredits: "No active subscription",
    freeCredit: "🎁 You have 1 free dream — use it now!",
    loading: "Loading...",
    faceTitle: "Want to appear in your dream?",
    faceUpload: "Upload photo", faceChange: "Change photo", faceUploading: "Uploading...",
    faceInclude: "Appear in my dream",
    faceSubOnly: "🔒 Available with active subscription",
    publicToggle: "Share in Universe",
    formatReel: "Reel 9:16", formatSquare: "Square 1:1",
    backBtn: "← Back",
    downloadBtn: "⬇ Download", shareBtn: "💚 Share", copyBtn: "🔗 Copy", copiedBtn: "✓ Copied",
    interpretation: "INTERPRETATION",
    commentsBtn: "comments",
    viewPlans: "View subscription plans",
    diaryTitle: "Your Dream Journal", diaryEmpty: "You haven't generated any dreams yet.",
    dreamsCount: "Dreams",
    profilePlan: "YOUR PLAN", profileNoPlan: "No active plan",
    profileCredits: "dreams available this month",
    profileUpgrade: "View plans",
    profileEdit: "Edit profile",
    profilePrivacy: "Privacy Policy",
    profileTerms: "Terms of Service",
    profileSupport: "Support",
    profileSignOut: "Sign out",
    planChoose: "Choose your plan", planCancel: "Cancel anytime · Payment in Mexican pesos",
    planActive: "✓ Active plan", planStart: "Start with", planNow: "Not now",
    planSecurity: "🔒 Secure payment · Stripe · Renews monthly",
    universoEmpty: "No public dreams yet.",
    universoTitle: "Dream Universe",
    greetingMorning: "Good morning", greetingAfternoon: "Good afternoon", greetingEvening: "Good evening",
    landingTitle: "Turn your dreams into cinematic videos with AI",
    landingSubtitle: "Describe what you dreamed and see it in video within seconds.",
    landingBadge: "✨ Sign up and get a free dream",
    landingCta: "Create my free dream →",
    landingStart: "Start for free", landingSignIn: "Sign in",
    landingStep1Title: "Describe your dream", landingStep1Text: "Write what you dreamed in your own words",
    landingStep2Title: "AI enhances it", landingStep2Text: "Our AI enriches your dream with cinematic details",
    landingStep3Title: "Receive it as video", landingStep3Text: "The AI turns it into a cinematic scene in seconds",
    landingHowTitle: "That simple",
    landingDesktopCta: "Create my first free dream",
    noTrial: "No card · No commitments",
  },
};
const i18n = T[LANG];

// ============ DATA & CONSTANTS ============
const GENERIC_INTERPRETATION = "Tu sueño refleja tu búsqueda de significado y transformación. Cada imagen que ves es un reflejo de tu subconsciente tomando forma.";

const PLANES_UI = {
  basico:  { label: "Básico",   price: "$399",   priceNum: 399,  credits: 3, duration: 8,  icon: "🌙", desc: "3 sueños de 8 segundos al mes", features: ["3 videos HD al mes", "Duración: 8 segundos", "Todos los estilos", "Face swap"] },
  pro:     { label: "Pro",      price: "$1,199", priceNum: 1199, credits: 5, duration: 15, icon: "⭐", desc: "5 sueños de 15 segundos al mes", features: ["5 videos HD al mes", "Duración: 15 segundos", "Todos los estilos", "Face swap"] },
  premium: { label: "Premium",  price: "$2,299", priceNum: 2299, credits: 5, duration: 30, icon: "✨", desc: "5 sueños de 30 segundos al mes", features: ["5 videos HD al mes", "Duración: 30 segundos", "Todos los estilos", "Face swap"] },
};


const GENERATING_MESSAGES = [
  "Tu sueño está tomando forma...",
  "El subconsciente cobra vida...",
  "Casi listo, tu sueño despierta...",
  "Los últimos detalles mágicos...",
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
};

// ============ UTILS ============
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
};

// ============ THEME ============
function getTheme(isDarkMode) {
  return {
    bg: "#080B14",
    textPrimary: "#ffffff",
    textSecondary: "rgba(200,210,255,0.45)",
    label: "#5B8DEF",
    accentGradient: "linear-gradient(135deg, #1B4FD8, #2563EB)",
    accentSolid: "#1B4FD8",
    cardBg: "rgba(255,255,255,0.04)",
    cardBorder: "rgba(27,79,216,0.15)",
    cardShadow: "0 0 0 1px rgba(27,79,216,0.12), 0 4px 24px rgba(0,0,10,0.4)",
    cardHoverShadow: "0 0 0 1px rgba(27,79,216,0.4), 0 8px 32px rgba(27,79,216,0.18)",
    inputBg: "rgba(255,255,255,0.03)",
    inputBorder: "rgba(27,79,216,0.2)",
    inputFocusBorder: "#1B4FD8",
    inputFocusShadow: "0 0 0 3px rgba(27,79,216,0.2), 0 0 20px rgba(27,79,216,0.12)",
    placeholder: "rgba(150,170,255,0.35)",
    btnGradient: "linear-gradient(135deg, #1B4FD8, #2563EB)",
    btnShadow: "0 2px 16px rgba(27,79,216,0.4)",
    btnHoverShadow: "0 6px 24px rgba(27,79,216,0.6)",
    navbarBg: "rgba(8,11,20,0.92)",
    navbarBorder: "rgba(27,79,216,0.15)",
    pillBg: "rgba(27,79,216,0.12)",
    pillBorder: "rgba(27,79,216,0.4)",
    pillText: "#5B8DEF",
    mutedBg: "rgba(255,255,255,0.04)",
    mutedBorder: "rgba(255,255,255,0.08)",
    iconBg: "rgba(27,79,216,0.12)",
    iconBorder: "rgba(27,79,216,0.25)",
    toggleOffBg: "rgba(255,255,255,0.08)",
    errorBg: "rgba(255,80,80,0.1)",
    errorBorder: "rgba(255,80,80,0.35)",
    errorText: "#ff8080",
    successText: "#34d399",
    successBg: "rgba(52,211,153,0.1)",
    successBorder: "rgba(52,211,153,0.4)",
    inactiveTab: "rgba(200,210,255,0.35)",
    orbGradient: "radial-gradient(circle, rgba(27,79,216,0.5), rgba(37,99,235,0.2), transparent)",
    orbShadow: "0 0 80px rgba(27,79,216,0.4), 0 0 140px rgba(37,99,235,0.2)",
    ringColor1: "rgba(27,79,216,0.3)",
    ringColor2: "rgba(37,99,235,0.15)",
    starColor: "#5B8DEF",
    starGlow: "rgba(27,79,216,0.8)",
    progressTrackBg: "rgba(27,79,216,0.1)",
  };
}

// ============ GLOBAL STYLES (white glass 3D / dream night) ============
function GlobalStyles({ isDarkMode }) {
  const t = getTheme(isDarkMode);
  return (
    <style>{`
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
      ::-webkit-scrollbar { display: none; }

      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      @keyframes orbPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
      @keyframes orbRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes starFloat { from { transform: translateY(0) scale(1); opacity: 0.4; } to { transform: translateY(-14px) scale(1.5); opacity: 1; } }

      .glass-card {
        background: ${t.cardBg};
        border: 1.5px solid transparent;
        border-radius: 16px;
        background-clip: padding-box;
        box-shadow: ${t.cardShadow};
        transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.5s ease;
      }
      .glass-card:hover {
        transform: translateY(-2px);
        box-shadow: ${t.cardHoverShadow};
      }

      .glass-input {
        background: ${t.inputBg};
        border: 1.5px solid ${t.inputBorder};
        border-radius: 12px;
        color: ${t.textPrimary};
        transition: all 0.5s ease;
      }
      .glass-input::placeholder { color: ${t.placeholder}; }
      .glass-input:focus {
        outline: none;
        border-color: ${t.inputFocusBorder};
        box-shadow: ${t.inputFocusShadow};
      }

      .btn-primary {
        background: ${t.btnGradient};
        color: #ffffff;
        border: none;
        border-radius: 12px;
        box-shadow: ${t.btnShadow};
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.5s ease;
      }
      .btn-primary:hover { transform: translateY(-2px); box-shadow: ${t.btnHoverShadow}; }

      .navbar-glass {
        background: ${t.navbarBg};
        border-top: 1.5px solid ${t.navbarBorder};
        backdrop-filter: blur(10px);
        transition: all 0.5s ease;
      }

      .credits-pill {
        background: ${t.pillBg};
        border: 1.5px solid ${t.pillBorder};
        border-radius: 20px;
        color: ${t.pillText};
        transition: all 0.5s ease;
      }

      .dream-hero-video {
        width: 100%;
        height: 340px;
        border-radius: 24px;
        overflow: hidden;
        display: block;
      }
      .dream-hero-video video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      /* ============ DESKTOP RESPONSIVE (>=1024px) ============ */
      /* Mobile design above this line is untouched. Everything below only
         takes effect at the desktop breakpoint. */

      .astra-app-shell { max-width: 430px; }
      .astra-sidebar { display: none; }
      .astra-sonar-preview-col { display: none; }
      .astra-mobile-demo-carousel { display: block; }
      .universo-card-media { aspect-ratio: 16 / 9; }

      .astra-hide-mobile-busy { display: none; }
      .astra-mobile-fullscreen { display: block; }

      .astra-hero-content-desktop { display: none; }
      .astra-hero-live-badge { animation: pulse 1.6s ease-in-out infinite; }

      @media (min-width: 1024px) {
        .astra-app-shell { max-width: none; }

        .astra-sidebar {
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: 240px;
          padding: 24px 16px;
          background: ${t.bg};
          border-right: 1.5px solid ${t.navbarBorder};
          z-index: 50;
        }
        .astra-bottom-nav { display: none; }
        .astra-main-content {
          margin-left: 240px;
          max-width: 1200px;
          padding: 0 40px;
        }

        .astra-hide-mobile-busy { display: block; }
        .astra-mobile-fullscreen { display: none; }

        .astra-sonar-layout {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 32px;
          align-items: start;
        }
        .astra-sonar-preview-col {
          display: block;
          position: sticky;
          top: 24px;
        }
        .astra-mobile-demo-carousel { display: none; }

        .astra-universo-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .universo-card { margin: 0 !important; }
        .universo-card-media { aspect-ratio: 9 / 13; }

        .astra-hero-stage { position: relative; }
        .astra-hero-header {
          position: absolute;
          top: 0; left: 0; right: 0;
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
        }
        .astra-hero-video-wrap { max-width: none !important; margin: 0 !important; padding: 0 !important; }
        .dream-hero-video { height: 76vh; border-radius: 0; }
        .astra-hero-content-mobile { display: none; }
        .astra-hero-content-desktop {
          display: block;
          position: absolute;
          bottom: 56px;
          left: 56px;
          right: 56px;
          max-width: 640px;
          z-index: 3;
        }
        .astra-hero-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 55%, transparent 100%);
          pointer-events: none;
          z-index: 2;
        }
        .astra-hero-dots {
          position: absolute;
          bottom: 24px;
          right: 24px;
          margin-top: 0 !important;
          z-index: 3;
        }

        .astra-how-it-works-grid {
          flex-direction: row !important;
          justify-content: space-between;
          align-items: flex-start;
        }
      }
    `}</style>
  );
}

const DREAM_VIDEO_FILES = ["video 1.mp4", "video 2.mp4", "video 3.mp4", "video 4.mp4"];

function DreamHero({ fullscreen }) {
  const [index, setIndex] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    video.play().catch(() => {});
  }, [index]);

  const handleEnded = () => {
    setIndex(prev => (prev + 1) % DREAM_VIDEO_FILES.length);
  };

  if (fullscreen) {
    return (
      <video
        ref={videoRef}
        src={`/videos/${encodeURIComponent(DREAM_VIDEO_FILES[index])}`}
        autoPlay muted loop={false} playsInline
        onEnded={handleEnded}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }

  return (
    <div>
      <div className="dream-hero-video">
        <video
          ref={videoRef}
          src={`/videos/${encodeURIComponent(DREAM_VIDEO_FILES[index])}`}
          autoPlay
          muted
          loop={false}
          playsInline
          onEnded={handleEnded}
        />
      </div>
    </div>
  );
}

// ============ SOÑAR SCREEN ============
function SonarScreen({ user, onDreamCreated, credits, subscriptionStatus, onSubscribe, subscriptionMessage, isDarkMode }) {
  const t = getTheme(isDarkMode);
  const userId = user.id;

  const [dreamText, setDreamText] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [videoFormat, setVideoFormat] = useState("reel");
  const [greeting, setGreeting] = useState(getGreeting);

  useEffect(() => {
    const interval = setInterval(() => setGreeting(getGreeting()), 60000);
    return () => clearInterval(interval);
  }, []);
  const [generating, setGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState("");
  const [previewProgress, setPreviewProgress] = useState(0);

  useEffect(() => {
    if (!generating) { setPreviewProgress(0); return; }
    const interval = setInterval(() => {
      setPreviewProgress(p => Math.min(p + 0.375, 90));
    }, 500);
    return () => clearInterval(interval);
  }, [generating]);

  const [pastDreams, setPastDreams] = useState([]);
  const [pastDreamsLoading, setPastDreamsLoading] = useState(false);
  const [activePastIdx, setActivePastIdx] = useState(0);


  useEffect(() => {
    if (!userId) return;
    setPastDreamsLoading(true);
    callAPI(`/api/dreams/user/${userId}`).then(res => {
      if (res?.dreams) setPastDreams(res.dreams);
      setPastDreamsLoading(false);
    });
  }, [userId]);

  const [faceImage, setFaceImage] = useState(null);
  const [faceElementId, setFaceElementId] = useState(null);
  const [includeFace, setIncludeFace] = useState(false);
  const [uploadingFace, setUploadingFace] = useState(false);
  const [faceError, setFaceError] = useState("");
  const faceInputRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const handleMicClick = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Tu navegador no soporta reconocimiento de voz. Usa Chrome.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setDreamText(prev => prev ? prev + " " + transcript : transcript);
      setError("");
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const handleFaceFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFaceError("");
    setUploadingFace(true);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const MAX = 600;
            let { width, height } = img;
            if (width > MAX || height > MAX) {
              if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
              else { width = Math.round(width * MAX / height); height = MAX; }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const result = canvas.toDataURL("image/jpeg", 0.7);
            // Sanity check: debe ser un base64 válido
            if (!result || result === "data:,") {
              reject(new Error("Canvas vacío, intenta con otra foto"));
              return;
            }
            resolve(result);
          };
          img.onerror = () => reject(new Error("No se pudo procesar la imagen"));
          img.src = ev.target.result;
        };
        reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
        reader.readAsDataURL(file);
      });

      setFaceError("Conectando con el servidor...");
      const resp = await callAPI("/api/user/upload-face", "POST", {
        userId,
        imageBase64: base64,
      });

      if (resp?.elementId) {
        setFaceElementId(resp.elementId);
        setFaceImage(base64);
        setIncludeFace(true);
        setFaceError("");
      } else {
        setFaceError(`Error: ${resp?.error || "Respuesta inesperada del servidor"}`);
      }
    } catch (err) {
      setFaceError(`Error: ${err?.message || "No se pudo conectar al servidor"}`);
    } finally {
      setUploadingFace(false);
      if (faceInputRef.current) faceInputRef.current.value = "";
    }
  }, [userId, setFaceElementId, setFaceImage, setIncludeFace]);

  const hasActiveSubscription = subscriptionStatus === "active";
  const hasCredits = credits !== null && credits > 0;
  const showSubscribeButton = !hasActiveSubscription || !hasCredits;

  const canGenerate = useMemo(() => {
    if (showSubscribeButton) return false;
    return true;
  }, [showSubscribeButton]);

  const handleGenerate = useCallback(async () => {
    if (!dreamText.trim()) {
      setError("Cuéntame tu sueño primero");
      return;
    }
    if (!canGenerate) {
      setError("Necesitas suscripción activa con créditos");
      return;
    }

    setError("");
    setGenerating(true);

    let startResp = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt > 0) {
        setError(`Despertando el servidor... (intento ${attempt}/4)`);
        await new Promise(r => setTimeout(r, 15000));
      }
      startResp = await callAPI("/api/dreams/generate", "POST", {
        text: dreamText,
        userId: user.id,
        isPublic,
        videoFormat,
        ...(includeFace && faceElementId ? { incluirCara: true, elementId: faceElementId } : {}),
      });
      if (startResp?._status === 402) {
        setGenerating(false);
        setError("Ya usaste tus 3 sueños de este mes");
        return;
      }
      if (startResp?._status === 400 && startResp?.error === "contenido_prohibido") {
        setGenerating(false);
        setError(startResp.message || "Tu sueño contiene contenido que no está permitido. Por favor descríbelo de otra forma.");
        return;
      }
      if (startResp?.operationName) { setError(""); break; }
    }

    if (!startResp?.operationName) {
      setGenerating(false);
      setError("El servidor tardó demasiado en responder. Intenta de nuevo en 1 minuto.");
      return;
    }

    const opName = startResp.operationName;

    let videoUri = null;
    let fatalError = null;
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 10000));
      const statusResp = await callAPI("/api/dreams/status", "POST", {
        operationName: opName,
      });
      if (statusResp?.done && statusResp?.videoUri) {
        videoUri = statusResp.videoUri;
        break;
      }
      if (statusResp?.error && statusResp.error !== "Failed to fetch") {
        fatalError = statusResp.error;
        if (/no encontrada|not found|404/i.test(statusResp.error)) break;
      }
    }

    if (!videoUri) {
      setGenerating(false);
      if (fatalError) {
        setError("Error generando: " + fatalError);
      } else {
        setError("Tardó demasiado o se cortó la conexión. Tu video quizá SÍ se generó; espera un momento e intenta de nuevo.");
      }
      return;
    }

    const newDream = {
      id: Date.now(),
      text: dreamText,
      duration: 8,
      isPublic,
      createdAt: new Date().toLocaleDateString('es-ES'),
      likes: 0,
      likedBy: [],
      comments: [],
      shares: 0,
      videoUrl: videoUri
    };

    const updatedUser = { ...user };
    if (user.plan === "free") {
      updatedUser.credits -= 1;
    }

    setResultData({ dream: newDream, user: updatedUser });
    setGenerating(false);
    setShowResult(true);
    setPastDreams(prev => [newDream, ...prev]);
    setActivePastIdx(0);
    onDreamCreated(newDream, updatedUser);
  }, [dreamText, isPublic, user, canGenerate, onDreamCreated, includeFace, faceElementId]);

  const isBusy = generating || (showResult && !!resultData);

  return (
    <div className="astra-sonar-layout">
    <div className="astra-sonar-form-col" style={{ padding: "0 0 20px" }}>
      {/* Header */}
      <div style={{ padding: "24px 24px 12px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.22em", color: t.label, textTransform: "uppercase", marginBottom: 4, fontWeight: 600, transition: "color 0.5s ease" }}>
          {new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
        </div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 300, color: t.textPrimary, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 8, transition: "color 0.5s ease" }}>
          {greeting},<br />
          <em style={{
            fontStyle: "italic",
            background: t.accentGradient,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
          }}>{user.name.split(" ")[0]}</em>.
        </div>
      </div>

      {subscriptionMessage && (
        <div className="glass-card" style={{
          margin: "0 16px 12px", padding: "12px 14px",
          background: t.successBg,
          boxShadow: `0 0 0 1.5px ${t.successBorder}, 0 4px 24px ${t.successBg}`,
          fontSize: 13, color: t.successText, textAlign: "center", fontWeight: 500
        }}>
          {subscriptionMessage}
        </div>
      )}

      {/* Mobile carousel / generating / result — mismo espacio */}
      <div className="astra-mobile-demo-carousel" style={{ margin: "0 16px 16px", borderRadius: 16, overflow: "hidden", position: "relative", minHeight: 220 }}>
        {generating ? (
          <GeneratingScreen isDarkMode={isDarkMode} done={false} inline />
        ) : showResult && resultData ? (
          <ResultScreen
            dream={resultData.dream}
            user={resultData.user}
            isDarkMode={isDarkMode}
            inline
            onBack={() => { setShowResult(false); setDreamText(""); setError(""); }}
          />
        ) : (
          <video
            key={DREAM_VIDEO_FILES[activePastIdx] || DREAM_VIDEO_FILES[0]}
            src={`/videos/${encodeURIComponent(DREAM_VIDEO_FILES[activePastIdx] || DREAM_VIDEO_FILES[0])}`}
            autoPlay muted playsInline
            onEnded={() => setActivePastIdx(prev => (prev + 1) % DREAM_VIDEO_FILES.length)}
            style={{ width: "100%", height: 220, objectFit: "cover", display: "block", background: "#000" }}
          />
        )}
      </div>

      {/* Status bar */}
      <div style={{ padding: "0 24px", marginBottom: 16 }}>
        {credits === null ? (
          <div style={{ padding: "10px 12px", borderRadius: 20, background: t.mutedBg, border: `1.5px solid ${t.mutedBorder}`, fontSize: 12, color: t.textSecondary }}>
            {i18n.loading}
          </div>
        ) : hasActiveSubscription && hasCredits ? (
          <div className="credits-pill" style={{ padding: "10px 12px", fontSize: 12, fontWeight: 500 }}>
            ✦ {LANG === "en" ? `You have ${credits} dream${credits !== 1 ? "s" : ""} available this month` : `Tienes ${credits} sueño${credits !== 1 ? "s" : ""} disponible${credits !== 1 ? "s" : ""} este mes`}
          </div>
        ) : !hasActiveSubscription && credits > 0 ? (
          <div style={{
            padding: "10px 12px", borderRadius: 20,
            background: "rgba(27,79,216,0.12)", border: "1.5px solid rgba(27,79,216,0.35)",
            fontSize: 12, color: "#93b4ff", fontWeight: 500, transition: "all 0.5s ease"
          }}>
            {i18n.freeCredit}
          </div>
        ) : (
          <div style={{
            padding: "10px 12px", borderRadius: 20,
            background: t.mutedBg, border: `1.5px solid ${t.mutedBorder}`,
            fontSize: 12, color: t.textSecondary, transition: "all 0.5s ease"
          }}>
            {i18n.noCredits}
          </div>
        )}
      </div>

      {/* Dream input */}
      <div className="glass-card" style={{ margin: "0 16px 8px", padding: "16px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", color: t.label, textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 6, fontWeight: 600, transition: "color 0.5s ease" }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: t.label, boxShadow: `0 0 8px ${t.label}`, animation: "pulse 2s infinite" }} />
          {i18n.describeTitle}
        </div>
        <textarea
          className="glass-input"
          value={dreamText}
          onChange={(e) => { setDreamText(e.target.value); setError(""); }}
          placeholder={i18n.placeholder}
          maxLength={5000}
          style={{
            width: "100%", minHeight: 80, padding: 10,
            fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 16, fontStyle: "italic",
            lineHeight: 1.5, resize: "none"
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }} onClick={handleMicClick}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: isListening ? "rgba(239,68,68,0.2)" : t.iconBg,
              border: `1.5px solid ${isListening ? "#ef4444" : t.iconBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: isListening ? "#ef4444" : t.label, fontSize: 16, cursor: "pointer", transition: "all 0.3s ease"
            }}><IconMicrophone size={16} stroke={1.5} /></div>
            <span style={{ fontSize: 11, color: isListening ? "#ef4444" : t.textSecondary, transition: "color 0.3s ease" }}>
              {isListening ? "Escuchando... (toca para parar)" : "o di tu sueño"}
            </span>
          </div>
          <span style={{ fontSize: 10, color: t.textSecondary, transition: "color 0.5s ease" }}>{dreamText.length}/5000</span>
        </div>

        {/* Formato del video — compacto dentro de la card */}
        <div style={{ borderTop: `1px solid ${t.mutedBorder}`, marginTop: 14, paddingTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: t.textSecondary, fontWeight: 600, whiteSpace: "nowrap" }}>Formato:</span>
          {[
            { key: "reel", label: "Reel 9:16" },
            { key: "square", label: "Cuadrado 1:1" },
          ].map(f => (
            <div
              key={f.key}
              onClick={() => setVideoFormat(f.key)}
              style={{
                padding: "4px 10px", borderRadius: 20, cursor: "pointer",
                fontSize: 11, fontWeight: 600,
                background: videoFormat === f.key ? "rgba(27,79,216,0.15)" : t.mutedBg,
                border: `1.5px solid ${videoFormat === f.key ? "#1B4FD8" : t.mutedBorder}`,
                color: videoFormat === f.key ? "#1B4FD8" : t.textSecondary,
                transition: "all 0.2s ease"
              }}
            >{f.label}</div>
          ))}
        </div>

        {/* Foto dentro de la card */}
        <div style={{ borderTop: `1px solid ${t.mutedBorder}`, marginTop: 10, paddingTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: t.iconBg, border: `1.5px solid ${t.iconBorder}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", transition: "all 0.5s ease" }}>
            {faceImage
              ? <img src={faceImage} alt="Tu rostro" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <IconCamera size={18} stroke={1.5} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: t.label, fontWeight: 600, marginBottom: 4 }}>{i18n.faceTitle}</div>
            {!hasActiveSubscription ? (
              <div style={{ fontSize: 11, color: t.textSecondary, fontStyle: "italic" }}>
                {i18n.faceSubOnly}
              </div>
            ) : (
              <>
                {faceImage && (
                  <div onClick={() => setIncludeFace(!includeFace)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: t.textSecondary }}>{i18n.faceInclude}</span>
                    <div style={{ width: 34, height: 20, borderRadius: 10, position: "relative", flexShrink: 0, background: includeFace ? t.accentGradient : t.toggleOffBg, border: `1.5px solid ${t.mutedBorder}`, transition: "background 0.3s ease" }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: "white", position: "absolute", top: 2, left: includeFace ? 17 : 2, transition: "left 0.2s ease" }} />
                    </div>
                  </div>
                )}
                <button className="btn-primary" onClick={() => faceInputRef.current?.click()} disabled={uploadingFace} style={{ padding: "6px 12px", fontSize: 11, fontWeight: 500, fontFamily: "inherit", opacity: uploadingFace ? 0.6 : 1 }}>
                  {uploadingFace ? i18n.faceUploading : faceImage ? i18n.faceChange : i18n.faceUpload}
                </button>
              </>
            )}
          </div>
          <input ref={faceInputRef} type="file" accept="image/*" onChange={handleFaceFileChange} style={{ display: "none" }} />
        </div>
        {faceError && <div style={{ marginTop: 8, fontSize: 11, color: t.errorText }}>{faceError}</div>}

      </div>

      {error && (
        <div style={{
          margin: "0 16px 12px", padding: "12px 14px", borderRadius: 12,
          background: t.errorBg, border: `1.5px solid ${t.errorBorder}`,
          fontSize: 12, color: t.errorText, transition: "all 0.5s ease"
        }}>
          {error}
        </div>
      )}


      <div
        className="glass-card"
        onClick={() => setIsPublic(!isPublic)}
        style={{
          margin: "0 16px 16px", padding: "14px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: isPublic ? t.iconBg : t.mutedBg,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, transition: "all 0.5s ease"
          }}>{isPublic ? "🪐" : "🔒"}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: t.textPrimary, transition: "color 0.5s ease" }}>
              {isPublic ? i18n.publicToggle : (LANG === "en" ? "Private" : "Solo para ti")}
            </div>
            <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 2, transition: "color 0.5s ease" }}>
              {isPublic ? "Otros verán tu sueño" : "Solo tú verás esto"}
            </div>
          </div>
        </div>
        <div style={{
          width: 38, height: 22, borderRadius: 11, position: "relative",
          background: isPublic ? t.accentGradient : t.toggleOffBg,
          border: `1.5px solid ${t.mutedBorder}`, transition: "background 0.3s ease"
        }}>
          <div style={{
            width: 16, height: 16, borderRadius: "50%", background: "white",
            position: "absolute", top: 2, left: isPublic ? 19 : 2, transition: "left 0.2s ease", boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
          }} />
        </div>
      </div>

      {showSubscribeButton ? (
        <div className="btn-primary" onClick={onSubscribe} style={{
          margin: "0 16px 18px", padding: 16,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10
        }}>
          <IconSparkles size={18} stroke={1.5} />
          <span style={{ fontSize: 15, fontWeight: 500 }}>{i18n.viewPlans}</span>
        </div>
      ) : (
        <div
          onClick={handleGenerate}
          className={dreamText.trim() && canGenerate ? "btn-primary" : ""}
          style={{
            margin: "0 16px 18px", padding: 16, borderRadius: 12, cursor: "pointer",
            background: dreamText.trim() && canGenerate ? undefined : t.mutedBg,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            opacity: dreamText.trim() && canGenerate ? 1 : 0.5,
            transition: "all 0.5s ease"
          }}
        >
          <IconSparkles size={18} stroke={1.5} color={dreamText.trim() && canGenerate ? "#ffffff" : t.label} />
          <span style={{ fontSize: 15, fontWeight: 500, color: dreamText.trim() && canGenerate ? "#ffffff" : t.label }}>{i18n.generateBtn}</span>
        </div>
      )}
    </div>

    {/* Desktop-only preview panel (hidden on mobile) */}
    <div className="astra-sonar-preview-col">
      {!isBusy && (
        (() => {
          const displayDreams = DREAM_VIDEO_FILES.map((f, i) => ({ video_url: `/videos/${encodeURIComponent(f)}`, text: null, _demo: true, id: `demo-${i}` }));
          const activeItem = displayDreams[activePastIdx] || displayDreams[0];
          return (
            <div className="glass-card" style={{ overflow: "hidden" }}>
              <video
                key={activeItem.video_url}
                src={activeItem.video_url}
                autoPlay
                muted
                loop
                playsInline
                style={{ width: "100%", height: "340px", display: "block", background: "#000", objectFit: "cover" }}
              />
              <div style={{ padding: "12px 16px" }}>
                {activeItem.text && (
                  <div style={{ fontSize: 12, color: t.textSecondary, fontStyle: "italic", marginBottom: 10, lineHeight: 1.4 }}>
                    {activeItem.text}
                  </div>
                )}
                {pastDreamsLoading && (
                  <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 8 }}>Cargando tus sueños...</div>
                )}
              </div>
            </div>
          );
        })()
      )}
      {generating && (
        <div className="glass-card" style={{
          padding: 24, minHeight: 420, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", textAlign: "center"
        }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 15, color: t.label, marginBottom: 14 }}>
            Generando tu sueño...
          </div>
          <div style={{ width: "100%", maxWidth: 220, height: 3, borderRadius: 2, background: t.progressTrackBg, overflow: "hidden", marginBottom: 8 }}>
            <div style={{
              height: "100%", borderRadius: 2, transition: "width 0.5s ease",
              width: `${previewProgress}%`, background: t.accentGradient
            }} />
          </div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>{Math.round(previewProgress)}%</div>
        </div>
      )}
      {showResult && resultData && (
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <video
            src={resultData.dream.videoUrl}
            controls
            playsInline
            style={{ width: "100%", display: "block", aspectRatio: "9/16", background: "#000", objectFit: "contain" }}
          />
          <div style={{ padding: 16 }}>
            <button
              className="btn-primary"
              onClick={() => { setShowResult(false); setDreamText(""); setError(""); }}
              style={{ width: "100%", padding: 12, fontSize: 13, fontWeight: 600, fontFamily: "inherit", border: "none" }}
            >
              Crear otro sueño
            </button>
          </div>
        </div>
      )}
    </div>

    </div>
  );
}

// ============ GENERATING SCREEN ============
function GeneratingScreen({ isDarkMode, done, inline }) {
  const t = getTheme(isDarkMode);
  const [progress, setProgress] = useState(0);
  const [messageIdx, setMessageIdx] = useState(0);
  const [showDone, setShowDone] = useState(false);

  const starPositions = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      top: `${5 + (i * 37 + 13) % 85}%`,
      left: `${5 + (i * 53 + 7) % 88}%`,
      size: 1.5 + (i % 3) * 0.9,
      delay: (i * 0.35) % 3,
      duration: 2 + (i % 4) * 0.65,
    })), []
  );

  useEffect(() => {
    if (done) {
      setProgress(100);
      setTimeout(() => setShowDone(true), 600);
      return;
    }
    // llega a 88% en ~120 segundos
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 0.37, 88));
    }, 500);
    const messageInterval = setInterval(() => {
      setMessageIdx(i => (i + 1) % GENERATING_MESSAGES.length);
    }, 8000);
    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [done]);

  return (
    <div style={{
      minHeight: inline ? 220 : "100vh", height: inline ? 220 : undefined,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: inline ? "16px" : "60px 32px",
      textAlign: "center", position: "relative", overflow: "hidden",
      background: "#080B14",
    }}>
      {/* Galaxy background video */}
      <video
        src="/videos/video%201.mp4"
        autoPlay muted loop playsInline
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", opacity: 0.35, pointerEvents: "none"
        }}
      />
      {starPositions.map(star => (
        <div key={star.id} style={{
          position: "absolute", top: star.top, left: star.left,
          width: star.size, height: star.size, borderRadius: "50%",
          background: t.starColor, boxShadow: `0 0 ${star.size * 3}px ${t.starGlow}`,
          animation: `starFloat ${star.duration}s ease-in-out ${star.delay}s infinite alternate`,
          pointerEvents: "none"
        }} />
      ))}

      <div style={{
        width: inline ? 80 : 160, height: inline ? 80 : 160, borderRadius: "50%", marginBottom: inline ? 12 : 40, position: "relative",
        background: showDone ? "linear-gradient(135deg, #34d399, #059669)" : t.orbGradient,
        boxShadow: showDone ? "0 0 80px rgba(52,211,153,0.5)" : t.orbShadow,
        animation: "orbPulse 3s ease-in-out infinite",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.8s ease, box-shadow 0.8s ease"
      }}>
        <div style={{
          position: "absolute", inset: 12, borderRadius: "50%",
          border: `1.5px solid ${showDone ? "rgba(52,211,153,0.4)" : t.ringColor1}`,
          animation: "orbRotate 8s linear infinite", transition: "border-color 0.8s ease"
        }} />
        <div style={{
          position: "absolute", inset: 30, borderRadius: "50%",
          border: `1.5px solid ${showDone ? "rgba(52,211,153,0.25)" : t.ringColor2}`,
          animation: "orbRotate 12s linear infinite reverse", transition: "border-color 0.8s ease"
        }} />
        <span style={{ fontSize: 40, position: "relative", zIndex: 2 }}>
          {showDone ? "✓" : "✦"}
        </span>
      </div>

      <div style={{
        fontFamily: "Georgia, serif", fontSize: 18,
        color: showDone ? t.successText : t.label,
        marginBottom: 14, letterSpacing: "0.06em", transition: "color 0.6s ease"
      }}>
        {showDone ? "¡Tu sueño está listo!" : "Generando tu sueño..."}
      </div>

      {!showDone && (
        <div style={{
          fontFamily: "Georgia, serif", fontSize: 17, fontStyle: "italic",
          color: t.textPrimary, marginBottom: 36, lineHeight: 1.5,
          minHeight: 52, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 16px", transition: "opacity 0.5s ease"
        }}>
          {GENERATING_MESSAGES[messageIdx]}
        </div>
      )}

      {showDone && (
        <div style={{
          fontSize: 13, color: t.textSecondary, marginBottom: 36, lineHeight: 1.6
        }}>
          Desliza hacia abajo para ver tu video
        </div>
      )}

      <div style={{ width: "100%", maxWidth: 280, height: 3, borderRadius: 2, background: t.progressTrackBg, overflow: "hidden", marginBottom: 10 }}>
        <div style={{
          height: "100%", borderRadius: 2, transition: "width 0.5s ease",
          width: `${progress}%`,
          background: showDone ? "linear-gradient(135deg, #34d399, #059669)" : t.accentGradient
        }} />
      </div>
      <div style={{ fontSize: 12, color: showDone ? t.successText : t.textSecondary, transition: "color 0.6s ease" }}>
        {showDone ? "100% — Completado" : `${Math.round(progress)}%`}
      </div>
    </div>
  );
}

// ============ RESULT SCREEN ============
function ResultScreen({ dream, user, onBack, isDarkMode, inline }) {
  const t = getTheme(isDarkMode);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [dreamComments, setDreamComments] = useState(dream.comments || []);
  const [copied, setCopied] = useState(false);

  const handleAddComment = () => {
    if (comment.trim()) {
      setDreamComments([...dreamComments, { id: Date.now(), text: comment, author: "Tú" }]);
      setComment("");
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(dream.videoUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `onira-sueno-${dream.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(dream.videoUrl, "_blank");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Mi sueño con Onira",
          text: `"${dream.text}" — generado con IA en oniradreams.app`,
          url: dream.videoUrl,
        });
      } catch { /* user cancelled */ }
    } else {
      const text = encodeURIComponent(`¡Mira el sueño que generé con IA! ${dream.videoUrl}`);
      window.open(`https://wa.me/?text=${text}`, "_blank");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(dream.videoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  if (inline) {
    return (
      <div style={{ position: "relative", width: "100%", height: 220, background: "#000" }}>
        <video
          src={dream.videoUrl}
          autoPlay
          controls
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div onClick={onBack} style={{
          position: "absolute", top: 10, left: 10, zIndex: 10,
          background: "rgba(0,0,0,0.5)", borderRadius: 20, padding: "4px 12px",
          fontSize: 12, color: "#fff", cursor: "pointer"
        }}>{i18n.backBtn}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 0 20px" }}>
      <div onClick={onBack} style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <span style={{ fontSize: 18, color: t.label, transition: "color 0.5s ease" }}>←</span>
        <span style={{ fontSize: 13, color: t.label, transition: "color 0.5s ease" }}>Volver</span>
      </div>

      <div className="glass-card" style={{ margin: "0 16px 20px", overflow: "hidden", position: "relative", aspectRatio: "9/16", background: "#000" }}>
        <video
          src={dream.videoUrl}
          controls
          playsInline
          preload="auto"
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", background: "#000" }}
        />
        <div style={{
          position: "absolute", top: 12, left: 12, zIndex: 3,
          padding: "4px 10px", borderRadius: 10,
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(10px)",
          fontSize: 11, color: "rgba(255,255,255,0.85)", pointerEvents: "none"
        }}>8s</div>
      </div>

      <div style={{ padding: "0 24px", marginBottom: 20 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontStyle: "italic", color: t.textPrimary, lineHeight: 1.4, marginBottom: 10, transition: "color 0.5s ease" }}>
          "{dream.text}"
        </div>
        <div style={{ fontSize: 11, color: t.textSecondary, transition: "color 0.5s ease" }}>{dream.createdAt} · 8s</div>
      </div>

      {/* Download / WhatsApp / Copy */}
      <div style={{ display: "flex", gap: 8, padding: "0 16px", marginBottom: 12 }}>
        <button className="glass-card" onClick={handleDownload} style={{
          flex: 1, padding: "12px 4px",
          color: t.textPrimary, fontSize: 12, cursor: "pointer", fontFamily: "inherit", border: "none"
        }}>{i18n.downloadBtn}</button>
        <button className="glass-card" onClick={handleShare} style={{
          flex: 1, padding: "12px 4px",
          color: "#118844", fontSize: 12, cursor: "pointer", fontFamily: "inherit", border: "none"
        }}>{i18n.shareBtn}</button>
        <button className="glass-card" onClick={handleCopyLink} style={{
          flex: 1, padding: "12px 4px",
          color: copied ? "#118844" : t.label, fontSize: 12, cursor: "pointer", fontFamily: "inherit", border: "none"
        }}>{copied ? i18n.copiedBtn : i18n.copyBtn}</button>
      </div>

      {/* Interpretation */}
      <div className="glass-card" style={{ margin: "0 16px 16px", padding: 18 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", color: t.label, marginBottom: 10, textTransform: "uppercase", fontWeight: 600, transition: "color 0.5s ease" }}>{i18n.interpretation}</div>
        <div style={{ fontSize: 14, color: t.textSecondary, lineHeight: 1.6, fontWeight: 300, transition: "color 0.5s ease" }}>
          {GENERIC_INTERPRETATION}
        </div>
      </div>

      {/* Comments */}
      <div style={{ display: "flex", padding: "0 16px", marginBottom: 16 }}>
        <button className="glass-card" onClick={() => setShowComments(!showComments)} style={{
          flex: 1, padding: 12, color: t.textPrimary,
          fontSize: 13, cursor: "pointer", fontFamily: "inherit", border: "none"
        }}>💬 {dreamComments.length} {i18n.commentsBtn}</button>
      </div>

      {showComments && (
        <div style={{ padding: "0 16px", marginBottom: 16 }}>
          <div style={{ marginBottom: 16 }}>
            {dreamComments.length === 0 ? (
              <div style={{ fontSize: 12, color: t.textSecondary, textAlign: "center", padding: "20px 0" }}>
                Sé el primero en comentar
              </div>
            ) : (
              dreamComments.map(c => (
                <div key={c.id} className="glass-card" style={{ marginBottom: 12, padding: "12px" }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: t.textPrimary }}>{c.author}</div>
                  <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 4 }}>{c.text}</div>
                </div>
              ))
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="glass-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
              placeholder="Comenta..."
              style={{
                flex: 1, padding: "10px 12px",
                fontSize: 12, fontFamily: "inherit"
              }}
            />
            <button className="btn-primary" onClick={handleAddComment} style={{
              padding: "10px 14px",
              cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "inherit"
            }}>Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ DIARIO SCREEN ============
function DiarioScreen({ userId, isDarkMode }) {
  const t = getTheme(isDarkMode);
  const [dreams, setDreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDream, setSelectedDream] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    callAPI(`/api/dreams/user/${userId}?limit=50`).then(res => {
      if (res?.dreams) setDreams(res.dreams);
      setLoading(false);
    });
  }, [userId]);

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ padding: "0 24px 20px" }}>
        <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 32, fontWeight: 300, color: t.textPrimary, letterSpacing: "-0.02em", marginBottom: 8, transition: "color 0.5s ease" }}>
          Tu <em style={{ fontStyle: "italic", background: t.accentGradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>diario</em>.
        </div>
        <div style={{ fontSize: 13, color: t.textSecondary, transition: "color 0.5s ease" }}>
          {loading ? "Cargando..." : `${dreams.length} sueño${dreams.length !== 1 ? "s" : ""} materializado${dreams.length !== 1 ? "s" : ""}`}
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: "0 16px", marginBottom: 20 }}>
        <div className="glass-card" style={{ padding: "14px 0", textAlign: "center" }}>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, fontWeight: 300, background: t.accentGradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{dreams.length}</div>
          <div style={{ fontSize: 10, color: t.textSecondary, marginTop: 4 }}>Sueños</div>
        </div>
      </div>

      {/* Dream expanded player */}
      {selectedDream && (
        <div style={{ margin: "0 16px 16px", borderRadius: 16, overflow: "hidden", position: "relative" }}>
          <video
            src={selectedDream.video_url}
            autoPlay loop controls
            style={{ width: "100%", display: "block", borderRadius: 16, maxHeight: 300, objectFit: "cover", background: "#000" }}
          />
          <div style={{ padding: "10px 12px 0" }}>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 13, fontStyle: "italic", color: t.textPrimary, lineHeight: 1.4 }}>"{selectedDream.text}"</div>
            <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 4 }}>{formatDate(selectedDream.created_at)}</div>
          </div>
          <button onClick={() => setSelectedDream(null)} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
      )}

      {/* Dream list */}
      <div style={{ padding: "0 16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: t.textSecondary, fontSize: 14 }}>Cargando tus sueños...</div>
        ) : dreams.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: t.textSecondary, fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌙</div>
            Aún no has materializado ningún sueño
          </div>
        ) : (
          dreams.map(d => (
            <div key={d.id} onClick={() => setSelectedDream(selectedDream?.id === d.id ? null : d)} style={{
              display: "flex", gap: 12, padding: "12px 0",
              borderBottom: `1px solid ${t.mutedBorder}`,
              cursor: "pointer"
            }}>
              {/* Video thumbnail */}
              <div style={{ width: 72, height: 72, flexShrink: 0, borderRadius: 10, overflow: "hidden", background: "#111", border: `1.5px solid ${selectedDream?.id === d.id ? "#4F7FFF" : t.mutedBorder}`, transition: "border-color 0.2s" }}>
                <video
                  src={d.video_url}
                  muted playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 13, fontStyle: "italic", color: t.textPrimary, lineHeight: 1.3, marginBottom: 5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  "{d.text}"
                </div>
                <div style={{ fontSize: 11, color: t.textSecondary }}>
                  {formatDate(d.created_at)} · 4s
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============ UNIVERSO SCREEN ============
function UniversoScreen({ isDarkMode }) {
  const t = getTheme(isDarkMode);
  const LIMIT = 20;
  const [communityDreams, setCommunityDreams] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    callAPI(`/api/dreams/community?limit=${LIMIT}&offset=0`).then(data => {
      if (cancelled) return;
      if (data?.error) {
        setError("No se pudo cargar el Universo");
      } else {
        setCommunityDreams(data.dreams || []);
        setTotal(data.total || 0);
        setOffset((data.dreams || []).length);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const data = await callAPI(`/api/dreams/community?limit=${LIMIT}&offset=${offset}`);
    if (!data?.error) {
      setCommunityDreams(prev => [...prev, ...(data.dreams || [])]);
      setOffset(prev => prev + (data.dreams || []).length);
    }
    setLoadingMore(false);
  };

  const hasMore = communityDreams.length < total;

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ padding: "0 24px 20px" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 300, color: t.textPrimary, letterSpacing: "-0.02em", marginBottom: 8, transition: "color 0.5s ease" }}>
          <em style={{ fontStyle: "italic", background: t.accentGradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Universo</em>.
        </div>
        <div style={{ fontSize: 13, color: t.textSecondary, transition: "color 0.5s ease" }}>
          {total} sueño{total !== 1 ? "s" : ""} compartido{total !== 1 ? "s" : ""}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: t.textSecondary, fontSize: 14 }}>
          Cargando...
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: t.errorText, fontSize: 14 }}>
          {error}
        </div>
      ) : communityDreams.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: t.textSecondary, fontSize: 14 }}>
          Aún no hay sueños públicos. ¡Sé el primero!
        </div>
      ) : (
        <div className="astra-universo-grid">
          {communityDreams.map(d => (
            <div key={d.id} className="glass-card universo-card" style={{ margin: "0 16px 14px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: t.accentGradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, color: "#000000", fontWeight: 600
                }}>✦</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: t.textPrimary, fontWeight: 500, transition: "color 0.5s ease" }}>Soñador</div>
                  <div style={{ fontSize: 10, color: t.textSecondary, transition: "color 0.5s ease" }}>
                    {d.created_at ? new Date(d.created_at).toLocaleDateString('es-ES') : ""}
                  </div>
                </div>
                {d.style && (
                  <div style={{
                    fontSize: 10, padding: "4px 10px", borderRadius: 20, textTransform: "capitalize",
                    background: t.pillBg, border: `1.5px solid ${t.pillBorder}`, color: t.pillText
                  }}>{d.style}</div>
                )}
              </div>

              <div className="universo-card-media" style={{ borderRadius: 12, overflow: "hidden", marginBottom: 12, background: "#000" }}>
                <video
                  src={d.video_url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>

              <div style={{
                fontFamily: "Georgia, serif", fontSize: 15, fontStyle: "italic",
                color: t.textPrimary, lineHeight: 1.4, transition: "color 0.5s ease"
              }}>
                "{d.text}"
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && hasMore && (
        <div style={{ textAlign: "center", padding: "10px 20px 20px" }}>
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{
              background: t.mutedBg, border: `1.5px solid ${t.mutedBorder}`, color: t.label,
              borderRadius: 20, padding: "10px 20px", fontSize: 13, fontFamily: "inherit",
              cursor: loadingMore ? "default" : "pointer", opacity: loadingMore ? 0.6 : 1
            }}
          >
            {loadingMore ? "Cargando..." : "Cargar más"}
          </button>
        </div>
      )}
    </div>
  );
}

// ============ PLANES MODAL ============
function PlanesModal({ isDarkMode, onClose, onSelectPlan, currentPlan }) {
  const [loading, setLoading] = useState(null);

  const handleSelect = async (planKey) => {
    setLoading(planKey);
    await onSelectPlan(planKey);
    setLoading(null);
  };

  const PLAN_CONFIG = {
    basico:  { gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", glowColor: "rgba(99,102,241,0.3)", borderColor: "rgba(99,102,241,0.4)", accentColor: "#818cf8", badge: null },
    pro:     { gradient: "linear-gradient(135deg, #0f0c29 0%, #1B4FD8 50%, #302b63 100%)", glowColor: "rgba(27,79,216,0.5)", borderColor: "#1B4FD8", accentColor: "#fff", badge: "MÁS POPULAR" },
    premium: { gradient: "linear-gradient(135deg, #1a0a2e 0%, #6b21a8 50%, #1a0a2e 100%)", glowColor: "rgba(168,85,247,0.4)", borderColor: "rgba(168,85,247,0.7)", accentColor: "#d8b4fe", badge: "PREMIUM" },
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 480,
        background: "linear-gradient(180deg, #0a0a0f 0%, #080B14 100%)",
        borderRadius: "28px 28px 0 0",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "0 0 40px",
        maxHeight: "94vh", overflowY: "auto"
      }}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)", margin: "16px auto 0" }} />

        {/* Header */}
        <div style={{ textAlign: "center", padding: "24px 24px 20px" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#1B4FD8", fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
            ONIRA
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: "#fff", fontWeight: 400, marginBottom: 8, lineHeight: 1.2 }}>
            Convierte tus sueños<br />en realidad visual
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
            Cancela cuando quieras · Sin compromisos
          </div>
        </div>

        {/* Plans */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 16px" }}>
          {Object.entries(PLANES_UI).map(([key, plan]) => {
            const cfg = PLAN_CONFIG[key];
            const isActive = currentPlan === key;
            const isFeatured = key === "pro";

            return (
              <div key={key} style={{ position: "relative" }}>
                {/* Badge */}
                {cfg.badge && (
                  <div style={{
                    position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                    background: isFeatured ? "#1B4FD8" : "linear-gradient(90deg, #7c3aed, #a855f7)",
                    color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: "0.15em",
                    padding: "3px 14px", borderRadius: 20, zIndex: 2, whiteSpace: "nowrap"
                  }}>{cfg.badge}</div>
                )}

                <div
                  onClick={() => !isActive && handleSelect(key)}
                  style={{
                    borderRadius: 20, overflow: "hidden", cursor: isActive ? "default" : "pointer",
                    border: `1.5px solid ${isActive ? "#34d399" : cfg.borderColor}`,
                    boxShadow: isFeatured ? `0 0 32px ${cfg.glowColor}` : "none",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    transform: isFeatured ? "scale(1.01)" : "scale(1)",
                  }}
                >
                  {/* Card background */}
                  <div style={{ background: cfg.gradient, padding: "20px 20px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 3 }}>
                          {plan.label}
                        </div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                          {plan.credits} sueños · {plan.duration}s c/u
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: cfg.accentColor, lineHeight: 1 }}>
                          {plan.price}
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>MXN / mes</div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "14px 0" }} />

                    {/* Features */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {plan.features.map((f, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                            background: isFeatured ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
                            display: "flex", alignItems: "center", justifyContent: "center"
                          }}>
                            <span style={{ fontSize: 9, color: cfg.accentColor }}>✓</span>
                          </div>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{f}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div style={{ marginTop: 16 }}>
                      {isActive ? (
                        <div style={{
                          textAlign: "center", padding: "10px",
                          background: "rgba(52,211,153,0.15)", borderRadius: 12,
                          border: "1px solid rgba(52,211,153,0.3)",
                          fontSize: 13, color: "#34d399", fontWeight: 600
                        }}>✓ Plan activo</div>
                      ) : (
                        <button style={{
                          width: "100%", padding: "12px", borderRadius: 12, border: "none",
                          background: isFeatured
                            ? "linear-gradient(90deg, #1B4FD8, #3b82f6)"
                            : key === "premium"
                            ? "linear-gradient(90deg, #7c3aed, #a855f7)"
                            : "rgba(255,255,255,0.12)",
                          color: "#fff", fontSize: 14, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit",
                          opacity: loading ? 0.6 : 1,
                          boxShadow: isFeatured ? "0 4px 20px rgba(27,79,216,0.5)" : "none"
                        }} disabled={!!loading}>
                          {loading === key ? "Procesando..." : `Empezar con ${plan.label}`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "20px 24px 0" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 14 }}>
            🔒 Pago seguro · Stripe · Se renueva mensualmente
          </div>
          <button onClick={onClose} style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.4)", fontSize: 13, padding: "10px 32px",
            borderRadius: 20, cursor: "pointer", fontFamily: "inherit"
          }}>
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ PROFILE SCREEN ============
function ProfileScreen({ user, userPlan, credits, onUpgrade, isDarkMode }) {
  const t = getTheme(isDarkMode);
  const { signOut } = useAuth();

  return (
    <div style={{ padding: "20px 0" }}>
      {/* Avatar section */}
      <div style={{ textAlign: "center", padding: "20px 24px 32px" }}>
        {user.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={user.name}
            style={{
              width: 88, height: 88, borderRadius: "50%", margin: "0 auto 16px", display: "block",
              objectFit: "cover", border: `2px solid ${t.cardBorder}`,
              boxShadow: `0 12px 36px ${t.cardBorder}`
            }}
          />
        ) : (
          <div style={{
            width: 88, height: 88, borderRadius: "50%", margin: "0 auto 16px",
            background: t.accentGradient,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, color: "#000000", fontWeight: 300, fontFamily: "Georgia, serif",
            boxShadow: `0 12px 36px ${t.cardBorder}`
          }}>{user.name.charAt(0).toUpperCase()}</div>
        )}
        <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 300, color: t.textPrimary, marginBottom: 4, transition: "color 0.5s ease" }}>
          {user.name}
        </div>
        <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 12, transition: "color 0.5s ease" }}>
          {user.email}
        </div>
        <div
          style={{
            display: "inline-block", padding: "6px 16px", borderRadius: 20,
            fontSize: 12, fontWeight: 600, color: "#1B4FD8",
            background: "rgba(27,79,216,0.1)", border: "1.5px solid rgba(27,79,216,0.3)",
          }}
        >{user.email}</div>
      </div>

      {/* Plan card */}
      <div className="glass-card" style={{ margin: "0 16px 16px", padding: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", color: t.label, marginBottom: 8, textTransform: "uppercase", fontWeight: 600, transition: "color 0.5s ease" }}>TU PLAN</div>
        {userPlan ? (
          <>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 24, color: t.textPrimary, marginBottom: 6, textTransform: "capitalize", transition: "color 0.5s ease" }}>
              {PLANES_UI[userPlan]?.icon} {PLANES_UI[userPlan]?.label || userPlan}
            </div>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4, lineHeight: 1.5, transition: "color 0.5s ease" }}>
              {PLANES_UI[userPlan]?.desc}
            </div>
            <div style={{ fontSize: 12, color: t.successText, marginBottom: 16, fontWeight: 500 }}>
              ✦ {credits !== null ? credits : "..."} sueño{credits !== 1 ? "s" : ""} disponible{credits !== 1 ? "s" : ""} este mes
            </div>
            <button className="btn-primary" onClick={onUpgrade} style={{
              width: "100%", padding: 14, fontSize: 14, fontWeight: 500, fontFamily: "inherit"
            }}>
              Ver planes
            </button>
          </>
        ) : (
          <>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 24, color: t.textPrimary, marginBottom: 6, transition: "color 0.5s ease" }}>
              Sin suscripción
            </div>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 16, lineHeight: 1.5, transition: "color 0.5s ease" }}>
              Elige un plan para materializar tus sueños
            </div>
            <button className="btn-primary" onClick={onUpgrade} style={{
              width: "100%", padding: 14, fontSize: 14, fontWeight: 500, fontFamily: "inherit"
            }}>
              ✦ Ver planes de suscripción
            </button>
          </>
        )}
      </div>


      <div style={{ padding: "8px 16px", display: "flex", gap: 16, justifyContent: "center" }}>
        <a href="/privacy.html" target="_blank" style={{ fontSize: 12, color: t.textSecondary, textDecoration: "none" }}>Privacidad</a>
        <span style={{ color: t.mutedBorder }}>·</span>
        <a href="/terms.html" target="_blank" style={{ fontSize: 12, color: t.textSecondary, textDecoration: "none" }}>Términos</a>
        <span style={{ color: t.mutedBorder }}>·</span>
        <a href="mailto:oniradreamsinfo@gmail.com" style={{ fontSize: 12, color: t.textSecondary, textDecoration: "none" }}>Soporte</a>
      </div>

      <div style={{ padding: "8px 16px 0" }}>
        <button
          onClick={() => signOut()}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, cursor: "pointer",
            background: "rgba(255,60,60,0.06)", border: "1.5px solid rgba(255,60,60,0.2)",
            color: "#cc3333", fontSize: 14, fontWeight: 500,
            fontFamily: "inherit", transition: "all 0.2s ease"
          }}
        >
          Cerrar sesión
        </button>
      </div>

      <div style={{ textAlign: "center", padding: "32px 24px 16px", fontSize: 11, color: t.inactiveTab, transition: "color 0.5s ease" }}>
        Onira · v1.3.0<br />Hecho con magia ✨ en México
      </div>
    </div>
  );
}

// ============ LOGIN SCREEN ============
const LIME = "#1B4FD8";

function AuthModal({ onClose }) {
  const t = getTheme(true);
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    await signInWithGoogle();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    if (mode === "signup") {
      const error = await signUpWithEmail(email, password, name);
      if (error) { setErrorMsg(error.message); setLoading(false); }
      else {
        const loginError = await signInWithEmail(email, password);
        if (loginError) setEmailSent(true);
      }
    } else {
      const error = await signInWithEmail(email, password);
      if (error) { setErrorMsg(LANG === "en" ? "Invalid email or password." : "Email o contraseña incorrectos."); setLoading(false); }
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.12)",
    color: "#ffffff", fontSize: 14, fontFamily: "Inter, sans-serif",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 50, padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 380, borderRadius: 20,
        background: "#0d0d1a", border: "1.5px solid rgba(255,255,255,0.1)",
        padding: "32px 28px", position: "relative",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 12, right: 12,
          background: "transparent", border: "none", color: "rgba(255,255,255,0.4)",
          fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4,
        }}>×</button>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src="/onira-logo-v2.webp" alt="Onira" style={{ height: 48, marginBottom: 12 }} />
          <div style={{ color: "#ffffff", fontSize: 18, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
            {mode === "login"
              ? (LANG === "en" ? "Welcome back" : "Bienvenido de vuelta")
              : (LANG === "en" ? "Create your account" : "Crea tu cuenta")}
          </div>
          {mode === "signup" && (
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 4 }}>
              {LANG === "en" ? "🎁 First dream free, no card required" : "🎁 Primer sueño gratis, sin tarjeta"}
            </div>
          )}
        </div>

        {emailSent ? (
          <div style={{ textAlign: "center", color: "#93b4ff", padding: "12px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
              {LANG === "en" ? "Check your email" : "Revisa tu correo"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              {LANG === "en" ? `We sent a confirmation link to ${email}` : `Enviamos un enlace de confirmación a ${email}`}
            </div>
          </div>
        ) : (
          <>
            {/* Google button */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              style={{
                width: "100%", padding: "13px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.15)",
                color: "#ffffff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                fontFamily: "Inter, sans-serif", marginBottom: 20,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              {LANG === "en" ? "Continue with Google" : "Continuar con Google"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{LANG === "en" ? "or" : "o"}</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {mode === "signup" && (
                <input
                  type="text"
                  placeholder={LANG === "en" ? "Full name" : "Nombre completo"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  required
                />
              )}
              <input
                type="email"
                placeholder={LANG === "en" ? "Email" : "Correo electrónico"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                required
              />
              <input
                type="password"
                placeholder={LANG === "en" ? "Password" : "Contraseña"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                required
                minLength={6}
              />
              {errorMsg && (
                <div style={{ color: "#ff6b6b", fontSize: 12, padding: "4px 0" }}>{errorMsg}</div>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "13px 16px", borderRadius: 12,
                  background: LIME, border: "none", color: "#ffffff",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  fontFamily: "Inter, sans-serif", marginTop: 4,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (LANG === "en" ? "Loading..." : "Cargando...") : mode === "login"
                  ? (LANG === "en" ? "Sign in" : "Iniciar sesión")
                  : (LANG === "en" ? "Create account" : "Crear cuenta")}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {mode === "login"
                ? (LANG === "en" ? "Don't have an account? " : "¿No tienes cuenta? ")
                : (LANG === "en" ? "Already have an account? " : "¿Ya tienes cuenta? ")}
              <span
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErrorMsg(""); }}
                style={{ color: "#93b4ff", cursor: "pointer", fontWeight: 600 }}
              >
                {mode === "login"
                  ? (LANG === "en" ? "Sign up" : "Regístrate")
                  : (LANG === "en" ? "Sign in" : "Iniciar sesión")}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LoginScreen({ isDarkMode }) {
  const t = getTheme(isDarkMode);
  const [showSignIn, setShowSignIn] = useState(false);
  const openSignIn = () => setShowSignIn(true);

  const pillBtnBase = {
    border: "none", borderRadius: 999, padding: "9px 20px",
    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000000" }}>
      <GlobalStyles isDarkMode={isDarkMode} />

      <div className="astra-hero-stage">
        {/* Header */}
        <div className="astra-hero-header" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", position: "relative", zIndex: 4,
        }}>
          <img src="/onira-logo-v2.webp" alt="Onira" style={{ height: 80 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 160 }}>
            <button onClick={openSignIn} style={{ ...pillBtnBase, background: LIME, color: "#ffffff", width: "100%" }}>
              {i18n.landingStart}
            </button>
            <button onClick={openSignIn} style={{ ...pillBtnBase, background: "transparent", color: "#ffffff", border: "1px solid rgba(255,255,255,0.4)", width: "100%" }}>
              {i18n.landingSignIn}
            </button>
          </div>
        </div>

        {/* Hero video */}
        <div className="astra-hero-video-wrap" style={{ maxWidth: 480, margin: "0 auto", padding: "12px 24px 0" }}>
          <DreamHero />
        </div>

        {/* Desktop-only scrim + overlay content */}
        <div className="astra-hero-scrim" />
        <div className="astra-hero-content-desktop">
          <h1 style={{ color: "#ffffff", fontSize: 48, fontWeight: 800, lineHeight: 1.1, margin: "0 0 16px", fontFamily: "Inter, sans-serif" }}>
            Tus sueños, en video
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, lineHeight: 1.5, marginBottom: 24, maxWidth: 480 }}>
            Convierte lo que soñaste anoche en un video cinematográfico con inteligencia artificial.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={openSignIn} style={{ ...pillBtnBase, padding: "14px 28px", fontSize: 15, background: LIME, color: "#ffffff" }}>
              {i18n.landingDesktopCta}
            </button>
          </div>
        </div>

        {/* Mobile-only content below the video */}
        <div className="astra-hero-content-mobile" style={{ maxWidth: 480, margin: "0 auto", padding: "28px 24px 0", textAlign: "center" }}>
          <h1 style={{
            color: "#ffffff", fontSize: 30, fontWeight: 800,
            lineHeight: 1.15, letterSpacing: "-0.01em", margin: "0 0 10px", fontFamily: "Inter, sans-serif",
          }}>
            {i18n.landingTitle}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
            {i18n.landingSubtitle}
          </p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24,
            background: "rgba(27,79,216,0.15)", border: "1px solid rgba(27,79,216,0.35)",
            borderRadius: 20, padding: "8px 16px",
          }}>
            <span style={{ fontSize: 14 }}>✨</span>
            <span style={{ fontSize: 12, color: "#93b4ff", fontWeight: 500 }}>{i18n.landingBadge}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={openSignIn} style={{ ...pillBtnBase, padding: "14px 24px", fontSize: 15, fontWeight: 700, background: LIME, color: "#ffffff" }}>
              {i18n.landingCta}
            </button>
          </div>
        </div>
      </div>

      {/* Cómo funciona */}
      <div style={{ padding: "56px 24px 40px", maxWidth: 960, margin: "0 auto" }}>
        <h2 style={{ color: "#ffffff", fontSize: 26, fontWeight: 800, textAlign: "center", margin: "0 0 40px", fontFamily: "Inter, sans-serif" }}>
          {i18n.landingHowTitle}
        </h2>
        <div className="astra-how-it-works-grid" style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          {[
            { n: "1", title: i18n.landingStep1Title, text: i18n.landingStep1Text },
            { n: "2", title: i18n.landingStep2Title, text: i18n.landingStep2Text },
            { n: "3", title: i18n.landingStep3Title, text: i18n.landingStep3Text },
          ].map((step) => (
            <div key={step.n} style={{ textAlign: "center", padding: "0 12px" }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: LIME, fontFamily: "Inter, sans-serif", marginBottom: 12, lineHeight: 1 }}>
                {step.n}
              </div>
              <div style={{ color: "#ffffff", fontSize: 17, fontWeight: 700, marginBottom: 8, fontFamily: "Inter, sans-serif" }}>
                {step.title}
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.5 }}>
                {step.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showSignIn && <AuthModal onClose={() => setShowSignIn(false)} />}
    </div>
  );
}

// ============ MAIN APP ============
export default function Onira() {
  const { isLoaded, isSignedIn, user: authUser } = useAuth();
  const [tab, setTab] = useState("sonar");
  const isDarkMode = true;
  const t = getTheme(isDarkMode);

  const [credits, setCredits] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionMessage, setSubscriptionMessage] = useState("");
  const [userPlan, setUserPlan] = useState(null);
  const [showPlanes, setShowPlanes] = useState(false);

  const user = useMemo(() => ({
    id: authUser?.id || "",
    name: authUser?.name || "Soñador",
    email: authUser?.email || "",
    imageUrl: authUser?.imageUrl || null,
    plan: "free",
    credits: 1,
  }), [authUser]);

  const [userExtras, setUserExtras] = useLocalStorage(`dreamUser_${user.id}`, { plan: "free", credits: 1 });
  const fullUser = useMemo(() => ({ ...user, ...userExtras }), [user, userExtras]);
  const [dreams, setDreams] = useLocalStorage(`dreams_${user.id}`, []);

  useEffect(() => {
    if (!isSignedIn || !authUser?.id) return;
    callAPI(`/credits/${authUser.id}`).then(data => {
      if (!data.error) {
        setCredits(data.credits);
        setSubscriptionStatus(data.subscriptionStatus);
        if (data.plan) setUserPlan(data.plan);
      }
    });
  }, [isSignedIn, authUser?.id]);

  useEffect(() => {
    if (!authUser?.id) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") === "true") {
      const planFromUrl = params.get("plan") || "basico";
      window.history.replaceState({}, "", window.location.pathname);
      callAPI(`/credits/${authUser.id}`).then(data => {
        if (!data.error) {
          setCredits(data.credits);
          setSubscriptionStatus(data.subscriptionStatus);
          if (data.plan) setUserPlan(data.plan);
          const p = PLANES_UI[planFromUrl] || PLANES_UI.basico;
          setSubscriptionMessage(`¡Plan ${p.label} activado! Tienes ${p.credits} sueños`);
        }
      });
    }
  }, [authUser?.id]);

  const handleDreamCreated = useCallback((dream, updatedUser) => {
    setDreams(prev => [dream, ...prev]);
    setUserExtras({ plan: updatedUser.plan, credits: updatedUser.credits });
  }, [setDreams, setUserExtras]);

  const handleSubscribe = useCallback(async (planKey) => {
    const data = await callAPI("/create-subscription", "POST", {
      userId: authUser?.id,
      userEmail: authUser?.email,
      planKey: planKey || "basico",
    });
    if (data.url) {
      window.location.href = data.url;
    } else if (data.error) {
      alert("El servidor está despertando (puede tardar ~30 segundos). Inténtalo de nuevo.");
    }
  }, [authUser]);

  const handleUpgrade = useCallback(() => {
    setShowPlanes(true);
  }, []);

  if (!isLoaded) {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.5s ease" }}>
        <GlobalStyles isDarkMode={isDarkMode} />
        <div style={{ color: t.label, fontStyle: "italic", transition: "color 0.5s ease" }}>Cargando...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <LoginScreen isDarkMode={true} />;
  }

  const tabs = [
    { id: "sonar", icon: "🌙", label: i18n.tabSonar },
    { id: "diario", icon: "📖", label: i18n.tabDiario },
    { id: "universo", icon: "🪐", label: i18n.tabUniverso },
    { id: "yo", icon: "👤", label: i18n.tabYo },
  ];

  return (
    <div className="astra-app-shell" style={{
      width: "100%", margin: "0 auto",
      minHeight: "100vh", background: t.bg,
      position: "relative", overflow: "hidden", fontFamily: "'Inter', sans-serif",
      transition: "all 0.5s ease"
    }}>
      <GlobalStyles isDarkMode={isDarkMode} />

      {/* Desktop-only sidebar (hidden on mobile) */}
      <div className="astra-sidebar">
        <div style={{ marginBottom: 32, padding: "0 8px" }}>
          <img src="/onira-logo-v2.webp" alt="Onira" style={{ height: 72 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {tabs.map(tb => (
            <div
              key={tb.id}
              onClick={() => { setTab(tb.id); setShowPlanes(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                background: tab === tb.id ? t.mutedBg : "transparent",
                transition: "background 0.2s ease"
              }}
            >
              <span style={{ fontSize: 18, opacity: tab === tb.id ? 1 : 0.5 }}>{tb.icon}</span>
              <span style={{
                fontSize: 13, fontWeight: 600,
                color: tab === tb.id ? t.label : t.inactiveTab,
              }}>{tb.label}</span>
            </div>
          ))}
        </div>
        <div className="credits-pill" style={{ padding: "10px 12px", fontSize: 12, fontWeight: 500, textAlign: "center" }}>
          ✦ {credits === null ? "..." : credits} sueño{credits === 1 ? "" : "s"} disponible{credits === 1 ? "" : "s"}
        </div>
      </div>

      <div className="astra-main-content" style={{ position: "relative", zIndex: 2, paddingBottom: 100, minHeight: "100vh" }}>
        {tab === "sonar" && (
          <SonarScreen
            user={fullUser}
            onDreamCreated={handleDreamCreated}
            credits={credits}
            subscriptionStatus={subscriptionStatus}
            onSubscribe={() => setShowPlanes(true)}
            subscriptionMessage={subscriptionMessage}
            isDarkMode={isDarkMode}
          />
        )}
        {tab === "diario" && <DiarioScreen userId={user.id} isDarkMode={isDarkMode} />}
        {tab === "universo" && <UniversoScreen isDarkMode={isDarkMode} />}
        {tab === "yo" && <ProfileScreen user={fullUser} userPlan={userPlan} credits={credits} onUpgrade={handleUpgrade} isDarkMode={isDarkMode} />}
        {showPlanes && (
          <PlanesModal
            isDarkMode={isDarkMode}
            onClose={() => setShowPlanes(false)}
            onSelectPlan={(planKey) => { setShowPlanes(false); handleSubscribe(planKey); }}
            currentPlan={userPlan}
          />
        )}
      </div>

      <div className="navbar-glass astra-bottom-nav" style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        display: "flex", justifyContent: "space-around",
        padding: "12px 0 28px",
        zIndex: 100
      }}>
        {tabs.map(tb => (
          <div
            key={tb.id}
            onClick={() => { setTab(tb.id); setShowPlanes(false); }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, padding: "6px 16px", cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <span style={{
              fontSize: 24,
              opacity: tab === tb.id ? 1 : 0.4,
              filter: tab === tb.id ? "none" : "grayscale(0.6)",
              transition: "all 0.2s ease"
            }}>{tb.icon}</span>
            <span style={{
              fontSize: 9, fontWeight: 600,
              letterSpacing: "0.06em",
              color: tab === tb.id ? t.label : t.inactiveTab,
              transition: "color 0.5s ease",
              textTransform: "uppercase"
            }}>{tb.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
