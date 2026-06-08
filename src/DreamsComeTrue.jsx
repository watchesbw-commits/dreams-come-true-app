import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useUser, useClerk, SignIn } from "@clerk/clerk-react";

// ============ BACKEND ============
const API_URL = import.meta.env.VITE_BACKEND_URL || "https://dreams-come-true-backend.onrender.com";

// Función para llamar al backend (incluye _status HTTP en la respuesta)
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
const STYLES = [
  { id: "real", name: "Realista", icon: "📷", colors: ["#cccccc", "#ffaa66"] },
  { id: "anime", name: "Anime", icon: "⛩", colors: ["#ff5577", "#6633cc"] },
  { id: "cyber", name: "Cyberpunk", icon: "⚡", colors: ["#ff3399", "#3366ff"] },
  { id: "fantasy", name: "Fantasy", icon: "🌲", colors: ["#9966ff", "#66ccff"] },
  { id: "ghibli", name: "Ghibli", icon: "🌿", colors: ["#66cc99", "#ffcc66"] },
  { id: "acuarela", name: "Acuarela", icon: "🎨", colors: ["#ffaadd", "#aaddff"] },
  { id: "pixel", name: "Pixel Art", icon: "🕹", colors: ["#00ddaa", "#ffdd00"] },
  { id: "terror", name: "Terror", icon: "🌑", colors: ["#663366", "#1a0033"] },
];

const DURATIONS = [
  { sec: 8, price: 4.99, credits: 1 },
  { sec: 16, price: 8.99, credits: 2 },
  { sec: 24, price: 12.99, credits: 3 },
  { sec: 32, price: 17.99, credits: 4 },
];

const INTERPRETATIONS = {
  cyber: "Tu mente busca libertad y rebeldía. El neón representa tus ambiciones brillantes en un mundo complejo.",
  anime: "Eres un guerrero espiritual. Refleja tu determinación para superar obstáculos.",
  ghibli: "Hay paz y magia en tu interior. Buscas conexión con la naturaleza.",
  fantasy: "Tu imaginación es tu mayor fortaleza. Potencial ilimitado esperando ser despertado.",
  terror: "Enfrentas miedos internos que necesitan ser reconocidos.",
  real: "Buscas claridad y verdad sin filtros.",
  acuarela: "Eres un artista. Tu creatividad fluye naturalmente.",
  pixel: "Hay nostalgia y autenticidad en tu corazón.",
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

function getStyleById(id) {
  return STYLES.find(s => s.id === id) || STYLES[0];
}

// ============ COMPONENTS ============
const Nebula = () => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
    background: `
      radial-gradient(circle at 20% 15%, rgba(107,31,184,0.35) 0%, transparent 45%),
      radial-gradient(circle at 80% 70%, rgba(200,48,126,0.25) 0%, transparent 50%),
      radial-gradient(circle at 50% 90%, rgba(45,90,204,0.3) 0%, transparent 55%)
    `
  }} />
);

const Stars = () => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
    backgroundImage: `
      radial-gradient(1px 1px at 15% 25%, rgba(255,255,255,0.6), transparent),
      radial-gradient(1px 1px at 38% 45%, rgba(200,150,255,0.5), transparent),
      radial-gradient(1px 1px at 65% 18%, rgba(255,255,255,0.7), transparent),
      radial-gradient(1px 1px at 82% 55%, rgba(150,200,255,0.5), transparent),
      radial-gradient(1px 1px at 25% 72%, rgba(255,255,255,0.4), transparent),
      radial-gradient(1.5px 1.5px at 90% 30%, rgba(255,255,255,0.7), transparent),
      radial-gradient(1px 1px at 55% 88%, rgba(255,180,220,0.5), transparent),
      radial-gradient(1px 1px at 10% 90%, rgba(180,140,255,0.5), transparent)
    `
  }} />
);

function DreamCard({ colors, children, style: extraStyle = {} }) {
  return (
    <div style={{
      borderRadius: 16, overflow: "hidden", position: "relative",
      border: "0.5px solid rgba(255,255,255,0.08)",
      ...extraStyle
    }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.8, mixBlendMode: "screen",
        background: `radial-gradient(circle at 30% 20%, ${colors[0]}, transparent 60%), radial-gradient(circle at 70% 80%, ${colors[1]}, transparent 60%)`
      }} />
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    </div>
  );
}

// Botón reutilizable
function Button({ children, onClick, variant = "primary", style: extraStyle = {} }) {
  const baseStyle = {
    padding: "14px 24px", borderRadius: 14, border: "none", cursor: "pointer",
    fontSize: 14, fontWeight: 500, transition: "all 0.3s",
    fontFamily: "inherit"
  };

  const variants = {
    primary: {
      ...baseStyle,
      background: "linear-gradient(135deg, #ff5599, #9966ff, #4477ff)",
      color: "white",
      boxShadow: "0 8px 24px rgba(153,102,255,0.3)"
    },
    secondary: {
      ...baseStyle,
      background: "rgba(255,255,255,0.03)",
      border: "0.5px solid rgba(255,255,255,0.08)",
      color: "rgba(245,240,255,0.8)"
    },
    ghost: {
      ...baseStyle,
      background: "transparent",
      color: "rgba(184,168,216,0.7)",
      padding: "8px 12px"
    }
  };

  return (
    <button onClick={onClick} style={{ ...variants[variant], ...extraStyle }}>
      {children}
    </button>
  );
}

// ============ SOÑAR SCREEN ============
function SonarScreen({ user, onDreamCreated, credits, subscriptionStatus, onSubscribe, subscriptionMessage }) {
  const [dreamText, setDreamText] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("cyber");
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [isPublic, setIsPublic] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState("");

  const hasActiveSubscription = subscriptionStatus === "active";
  const hasCredits = credits !== null && credits > 0;
  const showSubscribeButton = !hasActiveSubscription || !hasCredits;

  const canGenerate = useMemo(() => {
    if (showSubscribeButton) return false;
    if (user.plan === "free") {
      const duration = DURATIONS.find(d => d.sec === selectedDuration);
      return user.credits >= (duration?.credits || 0);
    }
    return true;
  }, [user, selectedDuration, showSubscribeButton]);

  const handleGenerate = useCallback(async () => {
    if (!dreamText.trim()) {
      setError("Cuéntame tu sueño primero");
      return;
    }

    if (!canGenerate) {
      const duration = DURATIONS.find(d => d.sec === selectedDuration);
      setError(`Necesitas ${duration?.credits} créditos`);
      return;
    }

    setError("");
    setGenerating(true);

    // 1. Pedir a Veo que empiece. Reintentamos por si el servidor estaba dormido.
    let startResp = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      startResp = await callAPI("/api/dreams/generate", "POST", {
        text: dreamText,
        style: selectedStyle,
        userId: user.id,
      });
      if (startResp?._status === 402) {
        setGenerating(false);
        setError("Ya usaste tus 3 sueños de este mes");
        return;
      }
      if (startResp?.operationName) break; // arrancó bien
      await new Promise(r => setTimeout(r, 8000)); // esperar y reintentar
    }

    if (!startResp?.operationName) {
      setGenerating(false);
      setError("El servidor no respondió al iniciar (puede estar despertando). Espera unos segundos e intenta otra vez.");
      return;
    }

    const opName = startResp.operationName;

    // 2. Preguntar si ya terminó. PACIENTES: un fallo de red suelto NO nos rinde.
    let videoUri = null;
    let fatalError = null;
    for (let i = 0; i < 60; i++) { // hasta ~10 minutos
      await new Promise(r => setTimeout(r, 10000));
      const statusResp = await callAPI("/api/dreams/status", "POST", {
        operationName: opName,
      });

      // ¿Ya está listo el video?
      if (statusResp?.done && statusResp?.videoUri) {
        videoUri = statusResp.videoUri;
        break;
      }

      // Un "Failed to fetch" es un tropiezo de red pasajero: lo ignoramos y reintentamos.
      // Un error REAL del backend (ej: operación no encontrada) sí lo tomamos en serio.
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

    // 3. Crear el sueño con el video real
    const newDream = {
      id: Date.now(),
      text: dreamText,
      style: selectedStyle,
      duration: selectedDuration,
      isPublic: isPublic,
      createdAt: new Date().toLocaleDateString('es-ES'),
      likes: 0,
      likedBy: [],
      comments: [],
      shares: 0,
      videoUrl: videoUri
    };

    const updatedUser = { ...user };
    if (user.plan === "free") {
      const duration = DURATIONS.find(d => d.sec === selectedDuration);
      updatedUser.credits -= duration?.credits || 0;
    }

    setResultData({ dream: newDream, user: updatedUser });
    setGenerating(false);
    setShowResult(true);
    onDreamCreated(newDream, updatedUser);
  }, [dreamText, selectedDuration, isPublic, selectedStyle, user, canGenerate, onDreamCreated]);

  if (generating) return <GeneratingScreen style={selectedStyle} />;
  if (showResult && resultData) {
    return (
      <ResultScreen
        dream={resultData.dream}
        user={resultData.user}
        onBack={() => {
          setShowResult(false);
          setDreamText("");
          setError("");
        }}
      />
    );
  }

  return (
    <div style={{ padding: "0 0 20px" }}>
      {/* Header */}
      <div style={{ padding: "24px 24px 12px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(184,168,216,0.55)", textTransform: "uppercase", marginBottom: 4 }}>
          {new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
        </div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 300, color: "#f5f0ff", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 8 }}>
          Buenos días,<br />
          <em style={{
            fontStyle: "italic",
            background: "linear-gradient(135deg, #ff7eb6, #b388ff, #80b0ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>{user.name.split(" ")[0]}</em>.
        </div>
      </div>

      {/* Subscription activated message */}
      {subscriptionMessage && (
        <div style={{
          margin: "0 16px 12px", padding: "12px 14px", borderRadius: 12,
          background: "rgba(64,200,120,0.12)", border: "0.5px solid rgba(64,200,120,0.3)",
          fontSize: 13, color: "rgba(100,220,150,0.9)", textAlign: "center", fontWeight: 500
        }}>
          {subscriptionMessage}
        </div>
      )}

      {/* Status bar */}
      <div style={{ padding: "0 24px", marginBottom: 16 }}>
        {hasActiveSubscription && hasCredits ? (
          <div style={{
            padding: "10px 12px", borderRadius: 12,
            background: "linear-gradient(135deg, rgba(179,136,255,0.1), rgba(64,128,255,0.1))",
            border: "0.5px solid rgba(179,136,255,0.2)",
            fontSize: 12, color: "rgba(179,136,255,0.9)"
          }}>
            ✦ Tienes {credits} sueño{credits !== 1 ? "s" : ""} disponible{credits !== 1 ? "s" : ""} este mes
          </div>
        ) : (
          <div style={{
            padding: "10px 12px", borderRadius: 12,
            background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)",
            fontSize: 12, color: "rgba(184,168,216,0.7)"
          }}>
            {credits === null ? "Cargando..." : "Sin suscripción activa"}
          </div>
        )}
      </div>

      {/* Dream input */}
      <div style={{
        margin: "0 16px 16px", padding: "16px",
        background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)",
        borderRadius: 20, border: "0.5px solid rgba(255,255,255,0.08)",
        transition: "all 0.3s"
      }}>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "rgba(184,168,216,0.5)", textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#80b0ff", boxShadow: "0 0 8px #80b0ff", animation: "pulse 2s infinite" }} />
          DESCRIBE TU SUEÑO
        </div>
        <textarea
          value={dreamText}
          onChange={(e) => { setDreamText(e.target.value); setError(""); }}
          placeholder="Volaba sobre una ciudad de cristal bajo el océano..."
          maxLength={500}
          style={{
            width: "100%", minHeight: 80, background: "transparent", border: "none",
            fontFamily: "'Georgia', serif", fontSize: 16, fontStyle: "italic",
            color: "rgba(245,240,255,0.85)", lineHeight: 1.5, resize: "none", outline: "none"
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(179,136,255,0.15)", border: "0.5px solid rgba(179,136,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#b388ff", fontSize: 16, cursor: "pointer", transition: "all 0.3s"
            }}>🎤</div>
            <span style={{ fontSize: 11, color: "rgba(184,168,216,0.55)" }}>o di tu sueño</span>
          </div>
          <span style={{ fontSize: 10, color: "rgba(184,168,216,0.4)" }}>{dreamText.length}/500</span>
        </div>
      </div>

      {error && (
        <div style={{
          margin: "0 16px 12px", padding: "12px 14px", borderRadius: 12,
          background: "rgba(255, 99, 71, 0.15)", border: "0.5px solid rgba(255, 99, 71, 0.3)",
          fontSize: 12, color: "#ff6347"
        }}>
          {error}
        </div>
      )}

      {/* Universes */}
      <div style={{ margin: "16px 0 16px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(184,168,216,0.55)", textTransform: "uppercase", padding: "0 24px", marginBottom: 12 }}>
          ELIGE TU UNIVERSO
        </div>
        <div style={{ display: "flex", gap: 8, padding: "0 16px", overflowX: "auto", scrollbarWidth: "none" }}>
          {STYLES.map(s => (
            <div
              key={s.id}
              onClick={() => setSelectedStyle(s.id)}
              style={{
                flexShrink: 0, width: 76, aspectRatio: "3/4", borderRadius: 14,
                position: "relative", overflow: "hidden", cursor: "pointer",
                border: selectedStyle === s.id ? "1.5px solid rgba(245,240,255,0.8)" : "0.5px solid rgba(255,255,255,0.08)",
                boxShadow: selectedStyle === s.id ? "0 0 12px rgba(179,136,255,0.4)" : "none",
                transition: "all 0.3s"
              }}
            >
              <div style={{
                position: "absolute", inset: 0, opacity: 0.85, mixBlendMode: "screen",
                background: `radial-gradient(circle at 30% 30%, ${s.colors[0]}, transparent 60%), radial-gradient(circle at 70% 70%, ${s.colors[1]}, transparent 60%)`
              }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <div style={{ fontSize: 22 }}>{s.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 500, color: "white", textShadow: "0 2px 6px rgba(0,0,0,0.6)", textAlign: "center" }}>
                  {s.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div style={{ padding: "0 24px", margin: "16px 0 16px" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {DURATIONS.map(d => (
            <div
              key={d.sec}
              onClick={() => setSelectedDuration(d.sec)}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 12, textAlign: "center", cursor: "pointer",
                background: selectedDuration === d.sec ? "rgba(245,240,255,0.1)" : "rgba(255,255,255,0.02)",
                border: selectedDuration === d.sec ? "0.5px solid rgba(245,240,255,0.3)" : "0.5px solid rgba(255,255,255,0.06)",
                transition: "all 0.3s"
              }}
            >
              <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: selectedDuration === d.sec ? "#f5f0ff" : "rgba(245,240,255,0.8)" }}>
                {d.sec}s
              </div>
              <div style={{ fontSize: 10, color: selectedDuration === d.sec ? "rgba(179,136,255,0.9)" : "rgba(184,168,216,0.5)", marginTop: 2 }}>
                ${d.price}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy toggle */}
      <div
        onClick={() => setIsPublic(!isPublic)}
        style={{
          margin: "0 16px 16px", padding: "14px", borderRadius: 14, cursor: "pointer",
          background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          transition: "all 0.3s"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: isPublic ? "rgba(179,136,255,0.15)" : "rgba(128,176,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16
          }}>{isPublic ? "🌍" : "🔒"}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#f5f0ff" }}>
              {isPublic ? "Compartir en Universo" : "Solo para ti"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(184,168,216,0.5)", marginTop: 2 }}>
              {isPublic ? "Otros verán tu sueño" : "Solo tú verás esto"}
            </div>
          </div>
        </div>
        <div style={{
          width: 38, height: 22, borderRadius: 11, position: "relative",
          background: isPublic ? "rgba(179,136,255,0.4)" : "rgba(245,240,255,0.15)",
          border: "0.5px solid rgba(245,240,255,0.3)", transition: "background 0.3s"
        }}>
          <div style={{
            width: 16, height: 16, borderRadius: "50%", background: "rgba(245,240,255,0.95)",
            position: "absolute", top: 3, left: isPublic ? 19 : 3, transition: "left 0.3s", boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
          }} />
        </div>
      </div>

      {/* Subscribe button or Generate button */}
      {showSubscribeButton ? (
        <div onClick={onSubscribe} style={{
          margin: "0 16px 18px", padding: 16, borderRadius: 18, cursor: "pointer",
          background: "linear-gradient(135deg, #ff5599, #9966ff, #4477ff)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: "0 12px 36px rgba(153,102,255,0.4)",
          transition: "all 0.4s"
        }}>
          <span style={{ fontSize: 16 }}>✦</span>
          <span style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Suscribirse — $12.99/mes</span>
        </div>
      ) : (
        <div onClick={handleGenerate} style={{
          margin: "0 16px 18px", padding: 16, borderRadius: 18, cursor: "pointer",
          background: dreamText.trim() && canGenerate ? "linear-gradient(135deg, #ff5599, #9966ff, #4477ff)" : "rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: dreamText.trim() && canGenerate ? "0 12px 36px rgba(153,102,255,0.4)" : "none",
          opacity: dreamText.trim() && canGenerate ? 1 : 0.5,
          transition: "all 0.4s"
        }}>
          <span style={{ fontSize: 16 }}>✦</span>
          <span style={{ color: "white", fontSize: 15, fontWeight: 500 }}>Materializar sueño</span>
        </div>
      )}
    </div>
  );
}

// ============ GENERATING SCREEN ============
function GeneratingScreen({ style }) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Leyendo tu sueño...");
  const s = getStyleById(style);

  useEffect(() => {
    const messages = ["Leyendo tu sueño...", "Eligiendo el universo...", "Generando la película...", "Casi listo..."];
    const interval = setInterval(() => {
      setProgress(p => {
        const next = Math.min(p + 2.5, 100);
        const idx = Math.floor((next / 100) * messages.length);
        setMessage(messages[Math.min(idx, messages.length - 1)]);
        return next;
      });
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "60px 32px", textAlign: "center"
    }}>
      <div style={{
        width: 160, height: 160, borderRadius: "50%", marginBottom: 48, position: "relative",
        background: `radial-gradient(circle, ${s.colors[0]}88, ${s.colors[1]}44, transparent)`,
        boxShadow: `0 0 80px ${s.colors[0]}44, 0 0 120px ${s.colors[1]}22`,
        animation: "orbPulse 3s ease-in-out infinite"
      }}>
        <div style={{
          position: "absolute", inset: 12, borderRadius: "50%",
          border: "0.5px solid rgba(255,255,255,0.15)",
          animation: "orbRotate 8s linear infinite"
        }} />
        <div style={{
          position: "absolute", inset: 30, borderRadius: "50%",
          border: "0.5px solid rgba(255,255,255,0.08)",
          animation: "orbRotate 12s linear infinite reverse"
        }} />
      </div>

      <div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontStyle: "italic", color: "#f5f0ff", marginBottom: 12, lineHeight: 1.3 }}>
        {message}
      </div>

      <div style={{ width: "100%", maxWidth: 240, height: 2.5, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 16 }}>
        <div style={{
          height: "100%", borderRadius: 2, transition: "width 0.3s",
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${s.colors[0]}, ${s.colors[1]})`
        }} />
      </div>
      <div style={{ fontSize: 12, color: "rgba(184,168,216,0.4)" }}>{Math.round(progress)}%</div>

      <style>{`
        @keyframes orbPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        @keyframes orbRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ============ RESULT SCREEN ============
function ResultScreen({ dream, user, onBack }) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [dreamComments, setDreamComments] = useState(dream.comments || []);
  const s = getStyleById(dream.style);

  const handleAddComment = () => {
    if (comment.trim()) {
      setDreamComments([...dreamComments, { id: Date.now(), text: comment, author: "Tú" }]);
      setComment("");
    }
  };

  const shareToSocial = (platform) => {
    alert(`Compartido a ${platform}! (Funcionalidad simulada)`);
  };

  return (
    <div style={{ padding: "0 0 20px" }}>
      <div onClick={onBack} style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <span style={{ fontSize: 18, color: "rgba(184,168,216,0.7)" }}>←</span>
        <span style={{ fontSize: 13, color: "rgba(184,168,216,0.7)" }}>Volver</span>
      </div>

      {/* Video con controles normales del navegador (play, volumen, barra de tiempo) */}
      <div style={{ margin: "0 16px 20px", borderRadius: 24, overflow: "hidden", position: "relative", aspectRatio: "9/16", background: "#000" }}>
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
        }}>{dream.duration}s · {s.name}</div>
      </div>

      {/* Dream text */}
      <div style={{ padding: "0 24px", marginBottom: 20 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontStyle: "italic", color: "#f5f0ff", lineHeight: 1.4, marginBottom: 10 }}>
          "{dream.text}"
        </div>
        <div style={{ fontSize: 11, color: "rgba(184,168,216,0.5)" }}>{dream.createdAt} · {s.name} · {dream.duration}s</div>
      </div>

      {/* Interpretation */}
      <div style={{
        margin: "0 16px 16px", padding: 18, borderRadius: 18,
        background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)"
      }}>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "rgba(184,168,216,0.5)", marginBottom: 10, textTransform: "uppercase" }}>INTERPRETACIÓN</div>
        <div style={{ fontSize: 14, color: "rgba(245,240,255,0.8)", lineHeight: 1.6, fontWeight: 300 }}>
          {INTERPRETATIONS[dream.style] || "Tu sueño refleja tu búsqueda de significado y transformación."}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, padding: "0 16px", marginBottom: 16 }}>
        <button onClick={() => setShowComments(!showComments)} style={{
          flex: 1, padding: 12, borderRadius: 12, border: "0.5px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)", color: "rgba(245,240,255,0.8)",
          fontSize: 13, cursor: "pointer", transition: "all 0.3s"
        }}>💬 {dreamComments.length}</button>
        <button onClick={() => shareToSocial("Instagram")} style={{
          flex: 1, padding: 12, borderRadius: 12, border: "0.5px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)", color: "rgba(245,240,255,0.8)",
          fontSize: 13, cursor: "pointer", transition: "all 0.3s"
        }}>📤 Compartir</button>
        <button onClick={() => alert("Guardado!")} style={{
          flex: 1, padding: 12, borderRadius: 12, border: "0.5px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)", color: "rgba(245,240,255,0.8)",
          fontSize: 13, cursor: "pointer", transition: "all 0.3s"
        }}>💾 Guardar</button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div style={{ padding: "0 16px", marginBottom: 16 }}>
          <div style={{ marginBottom: 16 }}>
            {dreamComments.length === 0 ? (
              <div style={{ fontSize: 12, color: "rgba(184,168,216,0.5)", textAlign: "center", padding: "20px 0" }}>
                Sé el primero en comentar
              </div>
            ) : (
              dreamComments.map(c => (
                <div key={c.id} style={{ marginBottom: 12, padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.02)" }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#f5f0ff" }}>{c.author}</div>
                  <div style={{ fontSize: 12, color: "rgba(245,240,255,0.7)", marginTop: 4 }}>{c.text}</div>
                </div>
              ))
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
              placeholder="Comenta..."
              style={{
                flex: 1, padding: "10px 12px", borderRadius: 10, border: "0.5px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)", color: "rgba(245,240,255,0.8)",
                fontSize: 12, outline: "none"
              }}
            />
            <button onClick={handleAddComment} style={{
              padding: "10px 14px", borderRadius: 10, background: "rgba(179,136,255,0.2)",
              border: "0.5px solid rgba(179,136,255,0.3)", color: "rgba(179,136,255,0.9)",
              cursor: "pointer", fontSize: 12, fontWeight: 500
            }}>Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ DIARIO SCREEN ============
function DiarioScreen({ dreams }) {
  const [filter, setFilter] = useState("all");

  const filteredDreams = useMemo(() => {
    if (filter === "all") return dreams;
    if (filter === "public") return dreams.filter(d => d.isPublic);
    return dreams.filter(d => !d.isPublic);
  }, [dreams, filter]);

  const stats = useMemo(() => ({
    total: dreams.length,
    public: dreams.filter(d => d.isPublic).length,
    hours: (dreams.reduce((sum, d) => sum + d.duration, 0) / 60).toFixed(1)
  }), [dreams]);

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ padding: "0 24px 20px" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 300, color: "#f5f0ff", letterSpacing: "-0.02em", marginBottom: 8 }}>
          Tu <em style={{ fontStyle: "italic", background: "linear-gradient(135deg, #ff7eb6, #b388ff, #80b0ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>diario</em>.
        </div>
        <div style={{ fontSize: 13, color: "rgba(184,168,216,0.7)" }}>
          {stats.total} sueño{stats.total !== 1 ? "s" : ""} materializados
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "0 16px", marginBottom: 20 }}>
        {[
          { num: stats.total, label: "Sueños" },
          { num: stats.public, label: "Públicos" },
          { num: `${stats.hours}h`, label: "Video" },
        ].map((s, i) => (
          <div key={i} style={{
            padding: "14px 0", borderRadius: 14, textAlign: "center",
            background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)"
          }}>
            <div style={{
              fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 300,
              background: "linear-gradient(135deg, #ff7eb6, #b388ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>{s.num}</div>
            <div style={{ fontSize: 10, color: "rgba(184,168,216,0.5)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, padding: "0 16px", marginBottom: 16 }}>
        {["all", "public", "private"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            flex: 1, padding: "10px", borderRadius: 10, border: "0.5px solid rgba(255,255,255,0.08)",
            background: filter === f ? "rgba(245,240,255,0.1)" : "rgba(255,255,255,0.03)",
            color: filter === f ? "#f5f0ff" : "rgba(245,240,255,0.7)",
            fontSize: 12, cursor: "pointer", transition: "all 0.3s", fontWeight: 500
          }}>
            {f === "all" ? "Todos" : f === "public" ? "Públicos" : "Privados"}
          </button>
        ))}
      </div>

      {/* Dreams list */}
      <div style={{ padding: "0 16px" }}>
        {filteredDreams.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(184,168,216,0.5)", fontSize: 14 }}>
            No hay sueños aquí
          </div>
        ) : (
          filteredDreams.map(d => {
            const s = getStyleById(d.style);
            return (
              <div key={d.id} style={{
                display: "flex", gap: 12, padding: "14px 0",
                borderBottom: "0.5px solid rgba(255,255,255,0.04)",
              }}>
                <DreamCard colors={s.colors} style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 12 }}>
                  <div style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                    {s.icon}
                  </div>
                </DreamCard>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 14, fontStyle: "italic", color: "#f5f0ff", lineHeight: 1.3, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    "{d.text}"
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(184,168,216,0.5)", display: "flex", gap: 8, alignItems: "center" }}>
                    <span>{d.createdAt}</span>
                    <span>·</span>
                    <span>{s.name}</span>
                    <span>·</span>
                    <span>{d.duration}s</span>
                    <span style={{ marginLeft: "auto" }}>{d.isPublic ? "🌍" : "🔒"}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============ UNIVERSO SCREEN ============
function UniversoScreen({ dreams, currentUserId }) {
  const publicDreams = useMemo(() => dreams.filter(d => d.isPublic), [dreams]);
  const [likedDreams, setLikedDreams] = useLocalStorage("likedDreams", {});

  const toggleLike = (id) => {
    setLikedDreams(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ padding: "0 24px 20px" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 300, color: "#f5f0ff", letterSpacing: "-0.02em", marginBottom: 8 }}>
          <em style={{ fontStyle: "italic", background: "linear-gradient(135deg, #ff7eb6, #b388ff, #80b0ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Universo</em>.
        </div>
        <div style={{ fontSize: 13, color: "rgba(184,168,216,0.7)" }}>
          {publicDreams.length} sueño{publicDreams.length !== 1 ? "s" : ""} compartido{publicDreams.length !== 1 ? "s" : ""}
        </div>
      </div>

      {publicDreams.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(184,168,216,0.5)", fontSize: 14 }}>
          Aún no hay sueños públicos. ¡Sé el primero!
        </div>
      ) : (
        publicDreams.map(d => {
          const s = getStyleById(d.style);
          const liked = likedDreams[d.id];
          return (
            <div key={d.id} style={{
              margin: "0 16px 14px", padding: "16px",
              background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)",
              borderRadius: 20, border: "0.5px solid rgba(255,255,255,0.06)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${s.colors[0]}, ${s.colors[1]})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, color: "white", fontWeight: 600
                }}>U</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#f5f0ff", fontWeight: 500 }}>Usuario Dream</div>
                  <div style={{ fontSize: 10, color: "rgba(184,168,216,0.4)" }}>@user_dreams</div>
                </div>
                <button style={{
                  fontSize: 11, padding: "4px 8px", borderRadius: 6,
                  background: "rgba(179,136,255,0.1)", border: "0.5px solid rgba(179,136,255,0.2)",
                  color: "rgba(179,136,255,0.8)", cursor: "pointer"
                }}>+ Seguir</button>
              </div>

              <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 12, background: "#000", aspectRatio: "16/9" }}>
                <video
                  src={d.videoUrl}
                  controls
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", background: "#000" }}
                />
              </div>

              <div style={{
                fontFamily: "Georgia, serif", fontSize: 15, fontStyle: "italic",
                color: "rgba(245,240,255,0.8)", lineHeight: 1.4, marginBottom: 12
              }}>
                "{d.text}"
              </div>

              <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 13 }}>
                <div onClick={() => toggleLike(d.id)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: liked ? "#ff7eb6" : "rgba(184,168,216,0.45)" }}>
                  <span>{liked ? "♥" : "♡"}</span>
                  <span>{liked ? (d.likes + 1) : d.likes}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(184,168,216,0.45)" }}>
                  <span>💬</span>
                  <span>{d.comments?.length || 0}</span>
                </div>
                <div style={{ marginLeft: "auto", color: "rgba(184,168,216,0.35)", cursor: "pointer" }}>⋯</div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ============ PROFILE SCREEN ============
function ProfileScreen({ user, onUpgrade }) {
  const [showSettings, setShowSettings] = useState(false);
  const { signOut } = useClerk();

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
              objectFit: "cover", border: "2px solid rgba(179,136,255,0.4)",
              boxShadow: "0 12px 36px rgba(153,102,255,0.3)"
            }}
          />
        ) : (
          <div style={{
            width: 88, height: 88, borderRadius: "50%", margin: "0 auto 16px",
            background: "linear-gradient(135deg, #ff5599, #9966ff, #4477ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, color: "white", fontWeight: 300, fontFamily: "Georgia, serif",
            boxShadow: "0 12px 36px rgba(153,102,255,0.3)"
          }}>{user.name.charAt(0).toUpperCase()}</div>
        )}
        <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 300, color: "#f5f0ff", marginBottom: 4 }}>
          {user.name}
        </div>
        <div style={{ fontSize: 12, color: "rgba(184,168,216,0.5)", marginBottom: 4 }}>
          {user.email}
        </div>
      </div>

      {/* Plan card */}
      <div style={{
        margin: "0 16px 20px", padding: 24, borderRadius: 20,
        background: "linear-gradient(135deg, rgba(107,31,184,0.12), rgba(200,48,126,0.08), rgba(64,128,255,0.12))",
        border: "0.5px solid rgba(255,255,255,0.1)"
      }}>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "rgba(184,168,216,0.6)", marginBottom: 8, textTransform: "uppercase" }}>TU PLAN</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#f5f0ff", marginBottom: 6, textTransform: "capitalize" }}>
          {user.plan === "free" ? "Explorador" : user.plan === "soñador" ? "Soñador" : "Visionario"}
        </div>
        <div style={{ fontSize: 12, color: "rgba(184,168,216,0.7)", marginBottom: 16, lineHeight: 1.5 }}>
          {user.plan === "free"
            ? "1 video de prueba de 8s · Sin face swap"
            : user.plan === "soñador"
            ? "3 videos de hasta 24s al mes · Todos los estilos"
            : "12 videos de hasta 16s · Face swap · 4K"
          }
        </div>
        {user.plan === "free" && (
          <button onClick={onUpgrade} style={{
            width: "100%", padding: 14, borderRadius: 14, cursor: "pointer",
            background: "linear-gradient(135deg, #ff5599, #9966ff, #4477ff)",
            color: "white", fontSize: 14, fontWeight: 500, border: "none",
            boxShadow: "0 8px 24px rgba(153,102,255,0.3)", transition: "all 0.3s"
          }}>
            ✦ Suscribirse — $12.99/mes
          </button>
        )}
      </div>

      {/* Settings menu */}
      <div style={{ padding: "0 16px" }}>
        {[
          { icon: "📷", label: "Foto para face swap", desc: "Cámara" },
          { icon: "🌐", label: "Idioma", desc: "Español" },
          { icon: "🔔", label: "Notificaciones", desc: "Habilitadas" },
          { icon: "🔒", label: "Privacidad", desc: "Control total" },
          { icon: "❓", label: "Ayuda", desc: "FAQ" },
          { icon: "📞", label: "Soporte", desc: "Contáctanos" },
        ].map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 8px",
            borderBottom: "0.5px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "all 0.3s"
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
            }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: "#f5f0ff", fontWeight: 500 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: "rgba(184,168,216,0.5)" }}>{item.desc}</div>
            </div>
            <span style={{ fontSize: 18, color: "rgba(184,168,216,0.3)" }}>›</span>
          </div>
        ))}
      </div>

      {/* Cerrar sesión */}
      <div style={{ padding: "16px 16px 0" }}>
        <button
          onClick={() => signOut()}
          style={{
            width: "100%", padding: "14px", borderRadius: 14, cursor: "pointer",
            background: "rgba(255,80,80,0.08)", border: "0.5px solid rgba(255,80,80,0.2)",
            color: "rgba(255,120,120,0.85)", fontSize: 14, fontWeight: 500,
            fontFamily: "inherit", transition: "all 0.3s"
          }}
        >
          Cerrar sesión
        </button>
      </div>

      <div style={{ textAlign: "center", padding: "32px 24px 16px", fontSize: 11, color: "rgba(184,168,216,0.25)" }}>
        Dreams Come True · v1.2.0<br />Hecho con magia ✨ en México
      </div>
    </div>
  );
}

// ============ LOGIN SCREEN ============
function LoginScreen() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "40px 24px",
      background: "#000", position: "relative", overflow: "hidden"
    }}>
      <Nebula />
      <Stars />
      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 380, textAlign: "center" }}>
        {/* Logo / título */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
          <div style={{
            fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 300,
            background: "linear-gradient(135deg, #ff7eb6, #b388ff, #80b0ff)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            marginBottom: 8
          }}>Dreams Come True</div>
          <div style={{ fontSize: 14, color: "rgba(184,168,216,0.6)", fontStyle: "italic" }}>
            Materializa tus sueños con IA
          </div>
        </div>

        {/* Componente de login de Clerk */}
        <div style={{ borderRadius: 20, overflow: "hidden" }}>
          <SignIn
            appearance={{
              variables: {
                colorPrimary: "#9966ff",
                colorBackground: "#0d0d1a",
                colorText: "#f5f0ff",
                colorTextSecondary: "rgba(184,168,216,0.7)",
                colorInputBackground: "rgba(255,255,255,0.05)",
                colorInputText: "#f5f0ff",
                borderRadius: "14px",
                fontFamily: "Inter, sans-serif",
              },
              elements: {
                card: { background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)", boxShadow: "none" },
                headerTitle: { color: "#f5f0ff" },
                headerSubtitle: { color: "rgba(184,168,216,0.6)" },
                socialButtonsBlockButton: {
                  background: "rgba(255,255,255,0.05)",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  color: "#f5f0ff",
                },
                dividerLine: { background: "rgba(255,255,255,0.08)" },
                dividerText: { color: "rgba(184,168,216,0.4)" },
                formButtonPrimary: { background: "linear-gradient(135deg, #ff5599, #9966ff, #4477ff)", border: "none" },
                footerActionLink: { color: "#b388ff" },
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ============ MAIN APP ============
export default function DreamsComeTrue() {
  // ── Todos los hooks PRIMERO, sin excepción ──
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const [tab, setTab] = useState("sonar");

  // Créditos y suscripción reales del backend
  const [credits, setCredits] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionMessage, setSubscriptionMessage] = useState("");

  // Construimos el objeto "user" de la app a partir del usuario real de Clerk
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

  // Carga créditos del backend cuando hay sesión activa
  useEffect(() => {
    if (!isSignedIn || !clerkUser?.id) return;
    callAPI(`/credits/${clerkUser.id}`).then(data => {
      if (!data.error) {
        setCredits(data.credits);
        setSubscriptionStatus(data.subscriptionStatus);
      }
    });
  }, [isSignedIn, clerkUser?.id]);

  // Detecta ?subscribed=true en la URL tras volver de Stripe
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

  // ── Returns condicionales DESPUÉS de todos los hooks ──

  // Mientras Clerk carga, mostramos spinner
  if (!isLoaded) {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Nebula /><Stars />
        <div style={{ position: "relative", zIndex: 2, color: "rgba(184,168,216,0.5)", fontStyle: "italic" }}>Cargando...</div>
      </div>
    );
  }

  // Si no hay sesión, mostramos el login
  if (!isSignedIn) {
    return <LoginScreen />;
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
      minHeight: "100vh", background: "#000",
      position: "relative", overflow: "hidden", fontFamily: "'Inter', sans-serif"
    }}>
      <Nebula />
      <Stars />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea::placeholder { color: rgba(184,168,216,0.35); }
        input::placeholder { color: rgba(184,168,216,0.35); }
        ::-webkit-scrollbar { display: none; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
      `}</style>

      <div style={{ position: "relative", zIndex: 2, paddingBottom: 100, minHeight: "100vh" }}>
        {tab === "sonar" && (
          <SonarScreen
            user={fullUser}
            onDreamCreated={handleDreamCreated}
            credits={credits}
            subscriptionStatus={subscriptionStatus}
            onSubscribe={handleSubscribe}
            subscriptionMessage={subscriptionMessage}
          />
        )}
        {tab === "diario" && <DiarioScreen dreams={dreams} />}
        {tab === "universo" && <UniversoScreen dreams={dreams} currentUserId={fullUser.id} />}
        {tab === "yo" && <ProfileScreen user={fullUser} onUpgrade={handleUpgrade} />}
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        display: "flex", justifyContent: "space-around",
        padding: "12px 0 28px",
        borderTop: "0.5px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(24px)",
        zIndex: 100
      }}>
        {tabs.map(t => (
          <div
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, padding: "6px 16px", cursor: "pointer",
              transition: "all 0.3s"
            }}
          >
            <span style={{
              fontSize: 24,
              opacity: tab === t.id ? 1 : 0.35,
              filter: tab === t.id ? "none" : "grayscale(1)",
              transition: "all 0.3s"
            }}>{t.icon}</span>
            <span style={{
              fontSize: 9, fontWeight: 600,
              letterSpacing: "0.06em",
              color: tab === t.id ? "#f5f0ff" : "rgba(184,168,216,0.35)",
              transition: "color 0.3s",
              textTransform: "uppercase"
            }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
