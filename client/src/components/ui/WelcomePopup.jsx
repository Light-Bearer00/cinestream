import { useState, useEffect } from "react";

const SESSION_KEY = "rq_popup_seen";

export default function WelcomePopup() {
  const [visible, setVisible] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  function handleAgree() {
    setAgreed(true);
    setClosing(true);
    sessionStorage.setItem(SESSION_KEY, "1");
    setTimeout(() => setVisible(false), 500);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(6px)",
        animation: closing ? "fadeOut 0.4s ease forwards" : "fadeIn 0.4s ease forwards",
      }}
    >
      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(32px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 18px 2px rgba(220,38,38,0.25); }
          50%       { box-shadow: 0 0 32px 6px rgba(220,38,38,0.45); }
        }
        .popup-card { animation: slideUp 0.45s cubic-bezier(.22,.68,0,1.2) forwards; }
        .letter-body { scrollbar-width: thin; scrollbar-color: rgba(220,38,38,0.4) transparent; }
        .letter-body::-webkit-scrollbar { width: 4px; }
        .letter-body::-webkit-scrollbar-thumb { background: rgba(220,38,38,0.4); border-radius: 99px; }
      `}</style>

      <div
        className="popup-card relative w-full max-w-lg rounded-2xl flex flex-col"
        style={{
          background: "linear-gradient(160deg, #1a1a1a 0%, #111111 100%)",
          border: "1px solid rgba(220,38,38,0.3)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
          maxHeight: "90vh",
        }}
      >
        {/* Top accent line */}
        <div style={{ height: 3, borderRadius: "16px 16px 0 0", background: "linear-gradient(90deg, #dc2626, #ef4444, #dc2626)" }} />

        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #dc2626, #991b1b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👑</div>
          <div>
            <p style={{ color: "#fff", fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>A Message for You</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>Please read before continuing</p>
          </div>
        </div>

        {/* Letter body */}
        <div className="letter-body px-6 py-5 overflow-y-auto flex-1" style={{ fontSize: 14, lineHeight: 1.85, color: "rgba(255,255,255,0.82)" }}>
          <p style={{ marginBottom: "1em" }}><strong style={{ color: "#fff" }}>Hiba,</strong></p>
          <p style={{ marginBottom: "1em" }}>
            I wanted to write to you and speak completely from the heart. I am truly so sorry
            for everything that happened between us — for how I made you feel, the pressure I
            put on you, and the times on calls where I criticized or attacked you. You didn't
            deserve that, and looking back on it hurts.
          </p>
          <p style={{ marginBottom: "1em" }}>
            Please know this isn't just attachment. I don't just replay the good times we had,
            though I treasure them and love you deeply for who you are as a person. I think
            about the difficult moments too, because I realize your true value and how much
            you've helped me along the way. You are honestly one of the best people in my life,
            and you will always be my queen&nbsp;👑.
          </p>
          <p style={{ marginBottom: "1em" }}>
            I understand that we both need time right now. Take all the time you need,
            Hiba — I'll be here, and I'm going to use this time to focus on myself and build
            my future. All I ask is that you please don't close the door on us just yet, and
            please don't write my feelings off as just attachment. Deep down in my heart, I
            know my love for you is real.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "1.5em 0", opacity: 0.3 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
            <span style={{ fontSize: 16 }}>❤️</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center" }}>
            Click the button below to confirm you've read this message.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <label className="flex items-center gap-3 mb-4 cursor-pointer select-none" onClick={() => setChecked(prev => !prev)}>
            <div style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              border: checked ? "2px solid #dc2626" : "2px solid rgba(255,255,255,0.2)",
              background: checked ? "linear-gradient(135deg, #dc2626, #b91c1c)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s ease",
            }}>
              {checked && (
                <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                  <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.4 }}>
              I have read this message and I understand it completely
            </span>
          </label>

          <button
            onClick={checked ? handleAgree : undefined}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm tracking-wide transition-all duration-200"
            style={{
              background: checked ? "linear-gradient(135deg, #dc2626, #b91c1c)" : "rgba(255,255,255,0.07)",
              cursor: checked ? "pointer" : "not-allowed",
              border: "none",
              boxShadow: checked ? "0 0 18px 2px rgba(220,38,38,0.25)" : "none",
              animation: checked && !agreed ? "pulse-glow 2.4s ease-in-out infinite" : "none",
              color: checked ? "#fff" : "rgba(255,255,255,0.25)",
            }}
          >
            {agreed ? "✓ Message Received" : "I've Read This 💛"}
          </button>
        </div>
      </div>
    </div>
  );
}
