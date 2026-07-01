import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useUser, useClerk, SignIn } from "@clerk/clerk-react";

// ============ BACKEND ============
const API_URL = import.meta.env.VITE_BACKEND_URL || "https://dreams-come-true-backend.onrender.com";

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

// ============ DATA & CONSTANTS ============
const GENERIC_INTERPRETATION = "Tu sueño refleja tu búsqueda de significado y transformación. Cada imagen que ves es un reflejo de tu subconsciente tomando forma.";

const SUGGESTIONS = [
  "Volaba sobre el océano al amanecer",
  "Me perseguía una sombra en un bosque",
  "Flotaba entre nubes de colores",
  "Exploraba una ciudad sumergida",
];

const GENERATING_MESSAGES = [
  "Pintando los colores de tu sueño...",
  "Dando vida a tu imaginación...",
  "Tu sueño está tomando forma...",
  "Casi listo, tu sueño despierta...",
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

const computeIsNight = () => {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 6;
};

const useIsNight = () => {
  const [isDarkMode, setIsDarkMode] = useState(computeIsNight);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsDarkMode(computeIsNight());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return isDarkMode;
};

// ============ THEME ============
function getTheme(isDarkMode) {
  return isDarkMode ? {
    bg: "#000000",
    textPrimary: "#ffffff",
    textSecondary: "rgba(255,255,255,0.4)",
    label: "#00ccff",
    accentGradient: "linear-gradient(135deg, #0044cc, #00aaff)",
    accentSolid: "#00ccff",
    cardBg: "rgba(0,20,60,0.7)",
    cardBorder: "rgba(0,180,255,0.25)",
    cardShadow: "0 0 0 1px rgba(0,180,255,0.25), 0 4px 24px rgba(0,150,255,0.1)",
    cardHoverShadow: "0 0 0 1px rgba(0,180,255,0.5), 0 8px 32px rgba(0,150,255,0.2)",
    inputBg: "rgba(0,20,60,0.7)",
    inputBorder: "rgba(0,180,255,0.25)",
    inputFocusBorder: "rgba(0,180,255,0.6)",
    inputFocusShadow: "0 0 0 3px rgba(0,180,255,0.15)",
    placeholder: "rgba(180,220,255,0.3)",
    btnGradient: "linear-gradient(135deg, #0044cc, #00aaff)",
    btnShadow: "0 4px 20px rgba(0,150,255,0.5)",
    btnHoverShadow: "0 6px 24px rgba(0,150,255,0.6)",
    navbarBg: "rgba(0,0,0,0.85)",
    navbarBorder: "rgba(0,180,255,0.15)",
    pillBg: "rgba(0,150,255,0.12)",
    pillBorder: "rgba(0,200,255,0.4)",
    pillText: "#00ccff",
    mutedBg: "rgba(0,180,255,0.08)",
    mutedBorder: "rgba(0,180,255,0.15)",
    iconBg: "rgba(0,180,255,0.1)",
    iconBorder: "rgba(0,180,255,0.25)",
    toggleOffBg: "rgba(0,180,255,0.12)",
    errorBg: "rgba(255,80,80,0.1)",
    errorBorder: "rgba(255,80,80,0.35)",
    errorText: "#ff8080",
    successText: "#34d399",
    successBg: "rgba(52,211,153,0.1)",
    successBorder: "rgba(52,211,153,0.4)",
    inactiveTab: "rgba(255,255,255,0.35)",
    orbGradient: "radial-gradient(circle, rgba(0,150,255,0.35), rgba(0,180,255,0.18), transparent)",
    orbShadow: "0 0 80px rgba(0,150,255,0.25), 0 0 120px rgba(0,180,255,0.12)",
    ringColor1: "rgba(0,180,255,0.25)",
    ringColor2: "rgba(0,180,255,0.15)",
    starColor: "#00ccff",
    starGlow: "rgba(0,180,255,0.6)",
    progressTrackBg: "rgba(0,180,255,0.1)",
  } : {
    bg: "#f0f5ff",
    textPrimary: "#001a4d",
    textSecondary: "#334466",
    label: "#0066ff",
    accentGradient: "linear-gradient(135deg, #0066ff, #0099ff)",
    accentSolid: "#0066ff",
    cardBg: "rgba(255,255,255,0.9)",
    cardBorder: "rgba(0,100,255,0.4)",
    cardShadow: "0 0 0 1.5px rgba(0,100,255,0.4), 0 4px 24px rgba(0,100,255,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
    cardHoverShadow: "0 0 0 1.5px rgba(0,150,255,0.6), 0 8px 32px rgba(0,100,255,0.15), inset 0 1px 0 rgba(255,255,255,0.9)",
    inputBg: "rgba(255,255,255,0.95)",
    inputBorder: "rgba(0,100,255,0.25)",
    inputFocusBorder: "rgba(0,100,255,0.6)",
    inputFocusShadow: "0 0 0 3px rgba(0,100,255,0.1)",
    placeholder: "rgba(0,80,200,0.3)",
    btnGradient: "linear-gradient(135deg, #0066ff, #0099ff)",
    btnShadow: "0 4px 16px rgba(0,100,255,0.35)",
    btnHoverShadow: "0 6px 20px rgba(0,100,255,0.45)",
    navbarBg: "rgba(255,255,255,0.95)",
    navbarBorder: "rgba(0,100,255,0.2)",
    pillBg: "rgba(0,100,255,0.08)",
    pillBorder: "rgba(0,100,255,0.25)",
    pillText: "#0066ff",
    mutedBg: "rgba(0,68,170,0.06)",
    mutedBorder: "rgba(0,100,255,0.15)",
    iconBg: "rgba(0,100,255,0.1)",
    iconBorder: "rgba(0,100,255,0.25)",
    toggleOffBg: "rgba(0,68,170,0.12)",
    errorBg: "rgba(255,80,80,0.08)",
    errorBorder: "rgba(255,80,80,0.3)",
    errorText: "#cc3333",
    successText: "#008844",
    successBg: "rgba(0,200,120,0.08)",
    successBorder: "rgba(0,200,120,0.4)",
    inactiveTab: "#7799cc",
    orbGradient: "radial-gradient(circle, rgba(0,100,255,0.35), rgba(0,150,255,0.18), transparent)",
    orbShadow: "0 0 80px rgba(0,100,255,0.25), 0 0 120px rgba(0,150,255,0.12)",
    ringColor1: "rgba(0,100,255,0.25)",
    ringColor2: "rgba(0,100,255,0.15)",
    starColor: "#0066ff",
    starGlow: "rgba(0,100,255,0.6)",
    progressTrackBg: "rgba(0,100,255,0.1)",
  };
}

// ============ GLOBAL STYLES (white glass 3D / dream night) ============
function GlobalStyles({ isDarkMode }) {
  const t = getTheme(isDarkMode);
  return (
    <style>{`
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
      ::-webkit-scrollbar { display: none; }

      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      @keyframes orbPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
      @keyframes orbRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes starFloat { from { transform: translateY(0) scale(1); opacity: 0.4; } to { transform: translateY(-14px) scale(1.5); opacity: 1; } }

      @keyframes drift1 {
        0% { background-position: 0 0, 20px 20px; }
        100% { background-position: 40px 40px, 60px 60px; }
      }
      @keyframes drift2 {
        0% { background-position: 0 0; }
        100% { background-position: -60px 60px; }
      }
      @keyframes drift3 {
        0% { background-position: 0 0; }
        100% { background-position: 30px -30px; }
      }
      @keyframes twinkle {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      @keyframes twinkle2 {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

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
        color: white;
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
    `}</style>
  );
}

function NightStars() {
  return (
    <>
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, rgba(0,180,255,0.9) 1px, transparent 1px)",
        backgroundSize: "42px 42px",
        animation: "drift1 25s linear infinite"
      }} />
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, rgba(0,240,255,0.7) 1px, transparent 1px)",
        backgroundSize: "71px 71px",
        backgroundPosition: "15px 15px",
        animation: "drift2 35s linear infinite"
      }} />
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, rgba(100,220,255,0.95) 1.5px, transparent 1.5px)",
        backgroundSize: "110px 110px",
        backgroundPosition: "35px 35px",
        animation: "drift3 45s linear infinite"
      }} />
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, rgba(0,200,255,1) 1px, transparent 1px)",
        backgroundSize: "160px 160px",
        backgroundPosition: "80px 80px",
        animation: "twinkle 3s ease-in-out infinite"
      }} />
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, rgba(150,230,255,0.9) 1px, transparent 1px)",
        backgroundSize: "200px 200px",
        backgroundPosition: "100px 50px",
        animation: "twinkle2 4.5s ease-in-out infinite"
      }} />
    </>
  );
}

// ============ SOÑAR SCREEN ============
function SonarScreen({ user, onDreamCreated, credits, subscriptionStatus, onSubscribe, subscriptionMessage, isDarkMode }) {
  const t = getTheme(isDarkMode);
  const { user: clerkUser } = useUser();
  const userId = clerkUser?.id || user.id;

  const [dreamText, setDreamText] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [greeting, setGreeting] = useState(getGreeting);

  useEffect(() => {
    const interval = setInterval(() => setGreeting(getGreeting()), 60000);
    return () => clearInterval(interval);
  }, []);
  const [generating, setGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState("");

  const [faceImage, setFaceImage] = useLocalStorage(`faceImage_${userId}`, null);
  const [faceElementId, setFaceElementId] = useLocalStorage(`faceElementId_${userId}`, null);
  const [includeFace, setIncludeFace] = useLocalStorage(`includeFace_${userId}`, false);
  const [uploadingFace, setUploadingFace] = useState(false);
  const [faceError, setFaceError] = useState("");
  const faceInputRef = useRef(null);

  const handleFaceFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFaceError("");
    setUploadingFace(true);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
        reader.readAsDataURL(file);
      });

      const resp = await callAPI("/api/user/upload-face", "POST", {
        userId,
        image: base64,
      });

      if (resp?.elementId) {
        setFaceElementId(resp.elementId);
        setFaceImage(base64);
        setIncludeFace(true);
      } else {
        setFaceError("No se pudo subir la foto. Intenta de nuevo.");
      }
    } catch {
      setFaceError("No se pudo subir la foto. Intenta de nuevo.");
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
    for (let attempt = 0; attempt < 4; attempt++) {
      startResp = await callAPI("/api/dreams/generate", "POST", {
        text: dreamText,
        userId: user.id,
        ...(includeFace && faceElementId ? { incluirCara: true, elementId: faceElementId } : {}),
      });
      if (startResp?._status === 402) {
        setGenerating(false);
        setError("Ya usaste tus 3 sueños de este mes");
        return;
      }
      if (startResp?.operationName) break;
      await new Promise(r => setTimeout(r, 8000));
    }

    if (!startResp?.operationName) {
      setGenerating(false);
      setError("El servidor no respondió al iniciar (puede estar despertando). Espera unos segundos e intenta otra vez.");
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
    onDreamCreated(newDream, updatedUser);
  }, [dreamText, isPublic, user, canGenerate, onDreamCreated, includeFace, faceElementId]);

  if (generating) return <GeneratingScreen isDarkMode={isDarkMode} />;
  if (showResult && resultData) {
    return (
      <ResultScreen
        dream={resultData.dream}
        user={resultData.user}
        isDarkMode={isDarkMode}
        onBack={() => { setShowResult(false); setDreamText(""); setError(""); }}
      />
    );
  }

  return (
    <div style={{ padding: "0 0 20px" }}>
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

      {/* Status bar */}
      <div style={{ padding: "0 24px", marginBottom: 16 }}>
        {hasActiveSubscription && hasCredits ? (
          <div className="credits-pill" style={{ padding: "10px 12px", fontSize: 12, fontWeight: 500 }}>
            ✦ Tienes {credits} sueño{credits !== 1 ? "s" : ""} disponible{credits !== 1 ? "s" : ""} este mes
          </div>
        ) : (
          <div style={{
            padding: "10px 12px", borderRadius: 20,
            background: t.mutedBg, border: `1.5px solid ${t.mutedBorder}`,
            fontSize: 12, color: t.textSecondary, transition: "all 0.5s ease"
          }}>
            {credits === null ? "Cargando..." : "Sin suscripción activa"}
          </div>
        )}
      </div>

      {/* Dream input */}
      <div className="glass-card" style={{ margin: "0 16px 8px", padding: "16px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", color: t.label, textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 6, fontWeight: 600, transition: "color 0.5s ease" }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: t.label, boxShadow: `0 0 8px ${t.label}`, animation: "pulse 2s infinite" }} />
          DESCRIBE TU SUEÑO
        </div>
        <textarea
          className="glass-input"
          value={dreamText}
          onChange={(e) => { setDreamText(e.target.value); setError(""); }}
          placeholder="Volaba sobre una ciudad de cristal bajo el océano..."
          maxLength={500}
          style={{
            width: "100%", minHeight: 80, padding: 10,
            fontFamily: "'Georgia', serif", fontSize: 16, fontStyle: "italic",
            lineHeight: 1.5, resize: "none"
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: t.iconBg, border: `1.5px solid ${t.iconBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: t.label, fontSize: 16, cursor: "pointer", transition: "all 0.5s ease"
            }}>🎤</div>
            <span style={{ fontSize: 11, color: t.textSecondary, transition: "color 0.5s ease" }}>o di tu sueño</span>
          </div>
          <span style={{ fontSize: 10, color: t.textSecondary, transition: "color 0.5s ease" }}>{dreamText.length}/500</span>
        </div>
      </div>

      {/* Prompt suggestions */}
      <div style={{ padding: "0 16px", marginBottom: 16, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {SUGGESTIONS.map(s => (
          <div
            key={s}
            onClick={() => { setDreamText(s); setError(""); }}
            style={{
              padding: "6px 12px", borderRadius: 20, cursor: "pointer",
              background: t.mutedBg, border: `1.5px solid ${t.mutedBorder}`,
              fontSize: 11, color: t.label, transition: "all 0.5s ease",
              whiteSpace: "nowrap"
            }}
          >
            {s}
          </div>
        ))}
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

      {/* Privacy toggle */}
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
          }}>{isPublic ? "🌍" : "🔒"}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: t.textPrimary, transition: "color 0.5s ease" }}>
              {isPublic ? "Compartir en Universo" : "Solo para ti"}
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

      {/* Foto del usuario */}
      <div className="glass-card" style={{ margin: "0 16px 16px", padding: "16px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", color: t.label, textTransform: "uppercase", marginBottom: 12, fontWeight: 600, transition: "color 0.5s ease" }}>
          ¿Quieres aparecer en tu sueño?
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {faceImage ? (
            <img
              src={faceImage}
              alt="Tu rostro"
              style={{
                width: 56, height: 56, borderRadius: "50%", objectFit: "cover",
                border: `1.5px solid ${t.cardBorder}`, flexShrink: 0
              }}
            />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
              background: t.iconBg, border: `1.5px solid ${t.iconBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, transition: "all 0.5s ease"
            }}>📷</div>
          )}

          <div style={{ flex: 1 }}>
            {faceImage && (
              <div
                onClick={() => setIncludeFace(!includeFace)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: 10 }}
              >
                <span style={{ fontSize: 12, fontWeight: 500, color: t.textPrimary, transition: "color 0.5s ease" }}>Aparecer en mi sueño</span>
                <div style={{
                  width: 38, height: 22, borderRadius: 11, position: "relative", flexShrink: 0,
                  background: includeFace ? t.accentGradient : t.toggleOffBg,
                  border: `1.5px solid ${t.mutedBorder}`, transition: "background 0.3s ease"
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", background: "white",
                    position: "absolute", top: 2, left: includeFace ? 19 : 2, transition: "left 0.2s ease", boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                  }} />
                </div>
              </div>
            )}
            <button
              className="btn-primary"
              onClick={() => faceInputRef.current?.click()}
              disabled={uploadingFace}
              style={{
                padding: "8px 14px", fontSize: 12, fontWeight: 500,
                fontFamily: "inherit", opacity: uploadingFace ? 0.6 : 1,
                cursor: uploadingFace ? "default" : "pointer"
              }}
            >
              {uploadingFace ? "Subiendo..." : faceImage ? "Cambiar foto" : "Subir foto"}
            </button>
          </div>
        </div>

        <input
          ref={faceInputRef}
          type="file"
          accept="image/*"
          onChange={handleFaceFileChange}
          style={{ display: "none" }}
        />

        {faceError && (
          <div style={{ marginTop: 10, fontSize: 11, color: t.errorText, transition: "color 0.5s ease" }}>{faceError}</div>
        )}
      </div>

      {showSubscribeButton ? (
        <div className="btn-primary" onClick={onSubscribe} style={{
          margin: "0 16px 18px", padding: 16,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10
        }}>
          <span style={{ fontSize: 16 }}>✦</span>
          <span style={{ fontSize: 15, fontWeight: 500 }}>Suscribirse — $12.99/mes</span>
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
          <span style={{ fontSize: 16, color: dreamText.trim() && canGenerate ? "white" : t.label }}>✦</span>
          <span style={{ fontSize: 15, fontWeight: 500, color: dreamText.trim() && canGenerate ? "white" : t.label }}>Materializar sueño</span>
        </div>
      )}
    </div>
  );
}

// ============ GENERATING SCREEN ============
function GeneratingScreen({ isDarkMode }) {
  const t = getTheme(isDarkMode);
  const [progress, setProgress] = useState(0);
  const [messageIdx, setMessageIdx] = useState(0);

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
    // reaches 90% in ~120 seconds: 0.375% per 500ms tick
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 0.375, 90));
    }, 500);

    const messageInterval = setInterval(() => {
      setMessageIdx(i => (i + 1) % GENERATING_MESSAGES.length);
    }, 20000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "60px 32px",
      textAlign: "center", position: "relative", overflow: "hidden"
    }}>
      {starPositions.map(star => (
        <div key={star.id} style={{
          position: "absolute",
          top: star.top,
          left: star.left,
          width: star.size,
          height: star.size,
          borderRadius: "50%",
          background: t.starColor,
          boxShadow: `0 0 ${star.size * 3}px ${t.starGlow}`,
          animation: `starFloat ${star.duration}s ease-in-out ${star.delay}s infinite alternate`,
          pointerEvents: "none"
        }} />
      ))}

      <div style={{
        width: 160, height: 160, borderRadius: "50%", marginBottom: 40, position: "relative",
        background: t.orbGradient,
        boxShadow: t.orbShadow,
        animation: "orbPulse 3s ease-in-out infinite",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <div style={{
          position: "absolute", inset: 12, borderRadius: "50%",
          border: `1.5px solid ${t.ringColor1}`,
          animation: "orbRotate 8s linear infinite"
        }} />
        <div style={{
          position: "absolute", inset: 30, borderRadius: "50%",
          border: `1.5px solid ${t.ringColor2}`,
          animation: "orbRotate 12s linear infinite reverse"
        }} />
        <span style={{ fontSize: 40, position: "relative", zIndex: 2 }}>✦</span>
      </div>

      <div style={{
        fontFamily: "Georgia, serif", fontSize: 18, color: t.label,
        marginBottom: 14, letterSpacing: "0.06em", transition: "color 0.5s ease"
      }}>
        Generando tu sueño...
      </div>

      <div style={{
        fontFamily: "Georgia, serif", fontSize: 17, fontStyle: "italic",
        color: t.textPrimary, marginBottom: 36, lineHeight: 1.5,
        minHeight: 52, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 16px", transition: "color 0.5s ease"
      }}>
        {GENERATING_MESSAGES[messageIdx]}
      </div>

      <div style={{ width: "100%", maxWidth: 280, height: 3, borderRadius: 2, background: t.progressTrackBg, overflow: "hidden", marginBottom: 10 }}>
        <div style={{
          height: "100%", borderRadius: 2, transition: "width 0.5s ease",
          width: `${progress}%`,
          background: t.accentGradient
        }} />
      </div>
      <div style={{ fontSize: 12, color: t.textSecondary, transition: "color 0.5s ease" }}>{Math.round(progress)}%</div>
    </div>
  );
}

// ============ RESULT SCREEN ============
function ResultScreen({ dream, user, onBack, isDarkMode }) {
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

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = dream.videoUrl;
    a.download = `dream-${dream.id}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`¡Mira el sueño que generé con IA! ${dream.videoUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
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
        }}>⬇ Descargar</button>
        <button className="glass-card" onClick={handleWhatsApp} style={{
          flex: 1, padding: "12px 4px",
          color: "#118844", fontSize: 12, cursor: "pointer", fontFamily: "inherit", border: "none"
        }}>💚 WhatsApp</button>
        <button className="glass-card" onClick={handleCopyLink} style={{
          flex: 1, padding: "12px 4px",
          color: copied ? "#118844" : t.label, fontSize: 12, cursor: "pointer", fontFamily: "inherit", border: "none"
        }}>{copied ? "✓ Copiado" : "🔗 Copiar"}</button>
      </div>

      {/* Interpretation */}
      <div className="glass-card" style={{ margin: "0 16px 16px", padding: 18 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", color: t.label, marginBottom: 10, textTransform: "uppercase", fontWeight: 600, transition: "color 0.5s ease" }}>INTERPRETACIÓN</div>
        <div style={{ fontSize: 14, color: t.textSecondary, lineHeight: 1.6, fontWeight: 300, transition: "color 0.5s ease" }}>
          {GENERIC_INTERPRETATION}
        </div>
      </div>

      {/* Comments */}
      <div style={{ display: "flex", padding: "0 16px", marginBottom: 16 }}>
        <button className="glass-card" onClick={() => setShowComments(!showComments)} style={{
          flex: 1, padding: 12, color: t.textPrimary,
          fontSize: 13, cursor: "pointer", fontFamily: "inherit", border: "none"
        }}>💬 {dreamComments.length} comentarios</button>
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
function DiarioScreen({ dreams, isDarkMode }) {
  const t = getTheme(isDarkMode);
  const [filter, setFilter] = useState("all");

  const filteredDreams = useMemo(() => {
    if (filter === "all") return dreams;
    if (filter === "public") return dreams.filter(d => d.isPublic);
    return dreams.filter(d => !d.isPublic);
  }, [dreams, filter]);

  const stats = useMemo(() => ({
    total: dreams.length,
    public: dreams.filter(d => d.isPublic).length,
    hours: (dreams.reduce((sum, d) => sum + (d.duration || 8), 0) / 60).toFixed(1)
  }), [dreams]);

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ padding: "0 24px 20px" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 300, color: t.textPrimary, letterSpacing: "-0.02em", marginBottom: 8, transition: "color 0.5s ease" }}>
          Tu <em style={{ fontStyle: "italic", background: t.accentGradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>diario</em>.
        </div>
        <div style={{ fontSize: 13, color: t.textSecondary, transition: "color 0.5s ease" }}>
          {stats.total} sueño{stats.total !== 1 ? "s" : ""} materializados
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "0 16px", marginBottom: 20 }}>
        {[
          { num: stats.total, label: "Sueños" },
          { num: stats.public, label: "Públicos" },
          { num: `${stats.hours}h`, label: "Video" },
        ].map((item, i) => (
          <div key={i} className="glass-card" style={{ padding: "14px 0", textAlign: "center" }}>
            <div style={{
              fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 300,
              background: t.accentGradient,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
            }}>{item.num}</div>
            <div style={{ fontSize: 10, color: t.textSecondary, marginTop: 4, transition: "color 0.5s ease" }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, padding: "0 16px", marginBottom: 16 }}>
        {["all", "public", "private"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            flex: 1, padding: "10px", borderRadius: 10, border: `1.5px solid ${t.mutedBorder}`,
            background: filter === f ? t.mutedBg : t.cardBg,
            color: filter === f ? t.label : t.textSecondary,
            fontSize: 12, cursor: "pointer", transition: "all 0.5s ease", fontWeight: 500, fontFamily: "inherit"
          }}>
            {f === "all" ? "Todos" : f === "public" ? "Públicos" : "Privados"}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 16px" }}>
        {filteredDreams.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: t.textSecondary, fontSize: 14 }}>
            No hay sueños aquí
          </div>
        ) : (
          filteredDreams.map(d => (
            <div key={d.id} style={{
              display: "flex", gap: 12, padding: "14px 0",
              borderBottom: `1.5px solid ${t.mutedBorder}`,
            }}>
              <div className="glass-card" style={{ width: 56, height: 56, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                🌙
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 14, fontStyle: "italic", color: t.textPrimary, lineHeight: 1.3, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 0.5s ease" }}>
                  "{d.text}"
                </div>
                <div style={{ fontSize: 11, color: t.textSecondary, display: "flex", gap: 8, alignItems: "center", transition: "color 0.5s ease" }}>
                  <span>{d.createdAt}</span>
                  <span>·</span>
                  <span>8s</span>
                  <span style={{ marginLeft: "auto" }}>{d.isPublic ? "🌍" : "🔒"}</span>
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
function UniversoScreen({ dreams, currentUserId, isDarkMode }) {
  const t = getTheme(isDarkMode);
  const publicDreams = useMemo(() => dreams.filter(d => d.isPublic), [dreams]);
  const [likedDreams, setLikedDreams] = useLocalStorage("likedDreams", {});

  const toggleLike = (id) => {
    setLikedDreams(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ padding: "0 24px 20px" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 300, color: t.textPrimary, letterSpacing: "-0.02em", marginBottom: 8, transition: "color 0.5s ease" }}>
          <em style={{ fontStyle: "italic", background: t.accentGradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Universo</em>.
        </div>
        <div style={{ fontSize: 13, color: t.textSecondary, transition: "color 0.5s ease" }}>
          {publicDreams.length} sueño{publicDreams.length !== 1 ? "s" : ""} compartido{publicDreams.length !== 1 ? "s" : ""}
        </div>
      </div>

      {publicDreams.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: t.textSecondary, fontSize: 14 }}>
          Aún no hay sueños públicos. ¡Sé el primero!
        </div>
      ) : (
        publicDreams.map(d => {
          const liked = likedDreams[d.id];
          return (
            <div key={d.id} className="glass-card" style={{ margin: "0 16px 14px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: t.accentGradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, color: "white", fontWeight: 600
                }}>U</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: t.textPrimary, fontWeight: 500, transition: "color 0.5s ease" }}>Usuario Dream</div>
                  <div style={{ fontSize: 10, color: t.textSecondary, transition: "color 0.5s ease" }}>@user_dreams</div>
                </div>
                <button style={{
                  fontSize: 11, padding: "4px 8px", borderRadius: 6,
                  background: t.mutedBg, border: `1.5px solid ${t.mutedBorder}`,
                  color: t.label, cursor: "pointer", fontFamily: "inherit", transition: "all 0.5s ease"
                }}>+ Seguir</button>
              </div>

              <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 12, background: "#000", aspectRatio: "16/9" }}>
                <video
                  src={d.videoUrl}
                  controls
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", background: "#000" }}
                />
              </div>

              <div style={{
                fontFamily: "Georgia, serif", fontSize: 15, fontStyle: "italic",
                color: t.textPrimary, lineHeight: 1.4, marginBottom: 12, transition: "color 0.5s ease"
              }}>
                "{d.text}"
              </div>

              <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 13 }}>
                <div onClick={() => toggleLike(d.id)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: liked ? "#ff4477" : t.textSecondary, transition: "color 0.5s ease" }}>
                  <span>{liked ? "♥" : "♡"}</span>
                  <span>{liked ? (d.likes + 1) : d.likes}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: t.textSecondary, transition: "color 0.5s ease" }}>
                  <span>💬</span>
                  <span>{d.comments?.length || 0}</span>
                </div>
                <div style={{ marginLeft: "auto", color: t.textSecondary, cursor: "pointer", transition: "color 0.5s ease" }}>⋯</div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ============ PROFILE SCREEN ============
function ProfileScreen({ user, onUpgrade, isDarkMode }) {
  const t = getTheme(isDarkMode);
  const { signOut } = useClerk();
  const [infoMessage, setInfoMessage] = useState("");

  const menuItems = [
    { icon: "📷", label: "Foto para face swap", desc: "Próximamente", badge: true },
    { icon: "🔒", label: "Privacidad", desc: "Control total" },
    { icon: "📞", label: "Soporte", desc: "Contáctanos" },
  ];

  const handleItemClick = (label) => {
    if (label === "Foto para face swap") {
      setInfoMessage("Esta función estará disponible pronto");
    } else if (label === "Privacidad") {
      setInfoMessage("Tus datos están protegidos. No compartimos tu información con terceros.");
    } else if (label === "Soporte") {
      window.location.href = "mailto:soporte@dreamscometrue.app";
    }
  };

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
            fontSize: 36, color: "white", fontWeight: 300, fontFamily: "Georgia, serif",
            boxShadow: `0 12px 36px ${t.cardBorder}`
          }}>{user.name.charAt(0).toUpperCase()}</div>
        )}
        <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 300, color: t.textPrimary, marginBottom: 4, transition: "color 0.5s ease" }}>
          {user.name}
        </div>
        <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4, transition: "color 0.5s ease" }}>
          {user.email}
        </div>
      </div>

      {/* Plan card */}
      <div className="glass-card" style={{ margin: "0 16px 16px", padding: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", color: t.label, marginBottom: 8, textTransform: "uppercase", fontWeight: 600, transition: "color 0.5s ease" }}>TU PLAN</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 24, color: t.textPrimary, marginBottom: 6, textTransform: "capitalize", transition: "color 0.5s ease" }}>
          {user.plan === "free" ? "Explorador" : user.plan === "soñador" ? "Soñador" : "Visionario"}
        </div>
        <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 16, lineHeight: 1.5, transition: "color 0.5s ease" }}>
          {user.plan === "free"
            ? "1 video de prueba de 8s · Sin face swap"
            : user.plan === "soñador"
            ? "3 videos de 8s al mes · Todos los estilos"
            : "12 videos de 8s · Face swap · 4K"
          }
        </div>
        {user.plan === "free" && (
          <button className="btn-primary" onClick={onUpgrade} style={{
            width: "100%", padding: 14, fontSize: 14, fontWeight: 500,
            fontFamily: "inherit"
          }}>
            ✦ Suscribirse — $12.99/mes
          </button>
        )}
      </div>

      {/* Info message */}
      {infoMessage && (
        <div
          onClick={() => setInfoMessage("")}
          className="glass-card"
          style={{
            margin: "0 16px 16px", padding: "14px 16px", cursor: "pointer",
            fontSize: 13, color: t.textPrimary, lineHeight: 1.5
          }}
        >
          {infoMessage}
        </div>
      )}

      {/* Settings menu */}
      <div style={{ padding: "0 16px" }}>
        {menuItems.map((item, i) => (
          <div
            key={i}
            onClick={() => handleItemClick(item.label)}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 8px",
              borderBottom: `1.5px solid ${t.mutedBorder}`, cursor: "pointer", transition: "all 0.5s ease"
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: t.mutedBg, border: `1.5px solid ${t.mutedBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, transition: "all 0.5s ease"
            }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, color: t.textPrimary, fontWeight: 500, transition: "color 0.5s ease" }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: 9, padding: "2px 6px", borderRadius: 6,
                    background: t.pillBg, border: `1.5px solid ${t.pillBorder}`,
                    color: t.label, fontWeight: 600, letterSpacing: "0.05em",
                    textTransform: "uppercase", transition: "all 0.5s ease"
                  }}>Próximamente</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: t.textSecondary, transition: "color 0.5s ease" }}>{item.desc}</div>
            </div>
            <span style={{ fontSize: 18, color: t.label, transition: "color 0.5s ease" }}>›</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "16px 16px 0" }}>
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
        Astra · v1.3.0<br />Hecho con magia ✨ en México
      </div>
    </div>
  );
}

// ============ LOGIN SCREEN ============
function LoginScreen({ isDarkMode }) {
  const t = getTheme(isDarkMode);
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "40px 24px",
      background: t.bg, position: "relative", overflow: "hidden", transition: "background 0.5s ease"
    }}>
      <GlobalStyles isDarkMode={isDarkMode} />
      {isDarkMode && <NightStars />}
      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
          <div style={{
            fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 300,
            background: t.accentGradient,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            marginBottom: 8
          }}>Astra</div>
          <div style={{ fontSize: 14, color: t.label, fontStyle: "italic", transition: "color 0.5s ease" }}>
            Materializa tus sueños con IA
          </div>
        </div>
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <SignIn
            appearance={{
              variables: {
                colorPrimary: t.accentSolid,
                colorBackground: isDarkMode ? "#0d0d1a" : "#ffffff",
                colorText: t.textPrimary,
                colorTextSecondary: t.textSecondary,
                colorInputBackground: t.inputBg,
                colorInputText: t.textPrimary,
                borderRadius: "12px",
                fontFamily: "Inter, sans-serif",
              },
              elements: {
                card: { background: "transparent", boxShadow: "none" },
                headerTitle: { color: t.textPrimary },
                headerSubtitle: { color: t.textSecondary },
                socialButtonsBlockButton: {
                  background: t.mutedBg,
                  border: `1.5px solid ${t.mutedBorder}`,
                  color: t.textPrimary,
                },
                dividerLine: { background: t.mutedBorder },
                dividerText: { color: t.inactiveTab },
                formButtonPrimary: { background: t.accentGradient, border: "none" },
                footerActionLink: { color: t.label },
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ============ MAIN APP ============
export default function Astra() {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const [tab, setTab] = useState("sonar");
  const isDarkMode = useIsNight();
  const t = getTheme(isDarkMode);

  const [credits, setCredits] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionMessage, setSubscriptionMessage] = useState("");

  const user = useMemo(() => ({
    id: clerkUser?.id || "",
    name: clerkUser?.fullName || clerkUser?.firstName || clerkUser?.emailAddresses?.[0]?.emailAddress || "Soñador",
    email: clerkUser?.emailAddresses?.[0]?.emailAddress || "",
    imageUrl: clerkUser?.imageUrl || null,
    plan: "free",
    credits: 1,
  }), [clerkUser]);

  const [userExtras, setUserExtras] = useLocalStorage(`dreamUser_${user.id}`, { plan: "free", credits: 1 });
  const fullUser = useMemo(() => ({ ...user, ...userExtras }), [user, userExtras]);
  const [dreams, setDreams] = useLocalStorage(`dreams_${user.id}`, []);

  useEffect(() => {
    if (!isSignedIn || !clerkUser?.id) return;
    callAPI(`/credits/${clerkUser.id}`).then(data => {
      if (!data.error) {
        setCredits(data.credits);
        setSubscriptionStatus(data.subscriptionStatus);
      }
    });
  }, [isSignedIn, clerkUser?.id]);

  useEffect(() => {
    if (!clerkUser?.id) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") === "true") {
      window.history.replaceState({}, "", window.location.pathname);
      callAPI(`/credits/${clerkUser.id}`).then(data => {
        if (!data.error) {
          setCredits(data.credits);
          setSubscriptionStatus(data.subscriptionStatus);
          setSubscriptionMessage("¡Suscripción activada! Tienes 3 sueños");
        }
      });
    }
  }, [clerkUser?.id]);

  const handleDreamCreated = useCallback((dream, updatedUser) => {
    setDreams(prev => [dream, ...prev]);
    setUserExtras({ plan: updatedUser.plan, credits: updatedUser.credits });
  }, [setDreams, setUserExtras]);

  const handleSubscribe = useCallback(async () => {
    const data = await callAPI("/create-subscription", "POST", {
      userId: clerkUser?.id,
      userEmail: clerkUser?.primaryEmailAddress?.emailAddress,
    });
    if (data.url) {
      window.location.href = data.url;
    } else if (data._status === 404 || data.error) {
      alert("El servidor está despertando (puede tardar ~30 segundos). Inténtalo de nuevo.");
    }
  }, [clerkUser]);

  const handleUpgrade = useCallback(() => {
    handleSubscribe();
  }, [handleSubscribe]);

  if (!isLoaded) {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.5s ease" }}>
        <GlobalStyles isDarkMode={isDarkMode} />
        <div style={{ color: t.label, fontStyle: "italic", transition: "color 0.5s ease" }}>Cargando...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <LoginScreen isDarkMode={isDarkMode} />;
  }

  const tabs = [
    { id: "sonar", icon: "🌙", label: "Soñar" },
    { id: "diario", icon: "📖", label: "Diario" },
    { id: "universo", icon: "🪐", label: "Universo" },
    { id: "yo", icon: "👤", label: "Yo" },
  ];

  return (
    <div style={{
      width: "100%", maxWidth: 430, margin: "0 auto",
      minHeight: "100vh", background: t.bg,
      position: "relative", overflow: "hidden", fontFamily: "'Inter', sans-serif",
      transition: "all 0.5s ease"
    }}>
      <GlobalStyles isDarkMode={isDarkMode} />
      {isDarkMode && <NightStars />}

      <div style={{ position: "relative", zIndex: 2, paddingBottom: 100, minHeight: "100vh" }}>
        {tab === "sonar" && (
          <SonarScreen
            user={fullUser}
            onDreamCreated={handleDreamCreated}
            credits={credits}
            subscriptionStatus={subscriptionStatus}
            onSubscribe={handleSubscribe}
            subscriptionMessage={subscriptionMessage}
            isDarkMode={isDarkMode}
          />
        )}
        {tab === "diario" && <DiarioScreen dreams={dreams} isDarkMode={isDarkMode} />}
        {tab === "universo" && <UniversoScreen dreams={dreams} currentUserId={fullUser.id} isDarkMode={isDarkMode} />}
        {tab === "yo" && <ProfileScreen user={fullUser} onUpgrade={handleUpgrade} isDarkMode={isDarkMode} />}
      </div>

      <div className="navbar-glass" style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        display: "flex", justifyContent: "space-around",
        padding: "12px 0 28px",
        zIndex: 100
      }}>
        {tabs.map(tb => (
          <div
            key={tb.id}
            onClick={() => setTab(tb.id)}
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
