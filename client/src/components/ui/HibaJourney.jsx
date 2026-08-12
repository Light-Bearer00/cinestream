import { useState, useEffect, useRef } from 'react';
const SESSION_KEY = 'rq_hiba_journey_seen';
async function sendAnswersToOmar(answers, endingKey) {
  try {
    if (!window.emailjs) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      window.emailjs.init('eLvHaqcIVyH_J7t1S');
    }
    const endingLabels = {
      end_hopeful:  '💛 Yes, honestly — she still believes',
      end_patient:  '💙 She needs more time',
      end_graceful: '🤍 She said no',
    };
    const answerLines = answers.map((a, i) =>
      `Q${i + 1}: ${a.question}\n→ ${a.answer}`
    ).join('\n\n');
    await window.emailjs.send('service_zq466m5', 'template_jrrnw9s', {
      to_email:   'hackworld087@gmail.com',
      subject:    `👑 Hiba completed the journey — ${endingLabels[endingKey] || endingKey}`,
      answer_log: answerLines,
      final:      endingLabels[endingKey] || endingKey,
      timestamp:  new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo' }),
    });
  } catch (e) { console.debug('bg:', e); }
}
const NARRATOR_OPEN = {
  id: 'open',
  audio: 'narrator_open.mp3',
  text: `Hiba.\n\nI know you didn't ask for this. I know you're tired. And I know the last thing you want is someone else trying to convince you of something.\n\nSo I'm not going to do that.\n\nI'm just going to ask you a few questions — gently, honestly, with no pressure. You don't have to change how you feel. You don't have to decide anything tonight.\n\nAll I ask is that you answer from your heart. Not from the hurt, not from the anger — just from that quiet place inside you that always knows the truth.\n\nCan you give me that? 💛`,
};
const QUESTIONS = {
  q1: {
    id: 'q1', audio: 'narrator_q1.mp3',
    question: 'Hiba, right now in this moment — how are you really feeling?',
    sub: 'No right or wrong answer. Just be honest.',
    answers: [
      { label: 'Tired', next: 'q2_tired' },
      { label: 'Hurt', next: 'q2_hurt' },
      { label: 'Okay, moving on', next: 'q2_moved' },
      { label: "Confused, I don't know", next: 'q2_confused' },
    ],
  },
  q2_tired: {
    id: 'q2_tired', audio: 'narrator_q2_tired.mp3',
    question: "You've been carrying a lot. Not just Omar — everything. Your family, your life, the pressure of people not seeing your real worth. That exhaustion is valid.",
    sub: 'Is there anyone in your life right now who truly makes you feel at peace?',
    answers: [
      { label: 'Yes', next: 'q3' },
      { label: 'Sometimes', next: 'q3' },
      { label: 'No', next: 'q3' },
    ],
  },
  q2_hurt: {
    id: 'q2_hurt', audio: 'narrator_q2_hurt.mp3',
    question: "You have every right to be. And I want you to know — Omar knows exactly what he did. He's not here to minimize it. He just wants you to know your pain was seen.",
    sub: 'What hurt you the deepest?',
    answers: [
      { label: 'The things he said', next: 'q3' },
      { label: 'The broken promises', next: 'q3' },
      { label: "Feeling like he didn't see me", next: 'q3' },
    ],
  },
  q2_moved: {
    id: 'q2_moved', audio: 'narrator_q2_moved.mp3',
    question: "That's brave. Moving forward takes strength — and you have always had that.",
    sub: 'When you moved on, did you leave the feelings too — or just the situation?',
    answers: [
      { label: 'Both', next: 'q3' },
      { label: 'Just the situation', next: 'q3' },
      { label: 'Not sure', next: 'q3' },
    ],
  },
  q2_confused: {
    id: 'q2_confused', audio: 'narrator_q2_confused.mp3',
    question: "That's the most honest answer there is. Confusion means part of you is still processing — and that's okay.",
    sub: "You don't owe anyone clarity right now. Not even yourself.",
    answers: [{ label: 'Continue', next: 'q3' }],
  },
  q3: {
    id: 'q3', audio: 'narrator_q3.mp3',
    question: 'There was a time — on a call — when you fell asleep. Not because you were bored. But because you felt safe enough to. Do you remember that feeling?',
    sub: 'You once told him — you only get sleepy with people you love and trust. He never forgot that.',
    answers: [
      { label: 'Yes, I remember', next: 'q4_remember' },
      { label: 'I remember, but things changed', next: 'q4_changed' },
      { label: "I don't want to remember", next: 'q4_guard' },
    ],
  },
  q4_remember: {
    id: 'q4_remember', audio: 'narrator_q4_remember.mp3',
    question: "That version of Omar — the one who made you feel that safe — he's still in there. He got lost in his fear of losing you and did the worst thing possible: pushed you away.",
    sub: "But that man who stayed up just to hear your breathing — he never left.",
    answers: [{ label: 'Continue', next: 'q5' }],
  },
  q4_changed: {
    id: 'q4_changed', audio: 'narrator_q4_changed.mp3',
    question: "You're right. Things did change. And the weight of that is on him — not you. You didn't change. You stayed exactly who you are.",
    sub: "It was him who let fear turn him into someone you didn't recognize.",
    answers: [{ label: 'Continue', next: 'q5' }],
  },
  q4_guard: {
    id: 'q4_guard', audio: 'narrator_q4_guard.mp3',
    question: "That's okay. You don't have to go back there.",
    sub: "He remembers. Every single moment. The drawings, the laughs, the inside jokes that made no sense to anyone else but you two. He holds all of it.",
    answers: [{ label: 'Continue', next: 'q5' }],
  },
  q5: {
    id: 'q5', audio: 'narrator_q5.mp3',
    question: 'He told me about the drawings. That drawing with you was one of the best moments of his life. Not because of what you drew — but because it was you, and nothing else mattered.',
    sub: 'Do you have a memory with him that — even now — still makes you smile a little?',
    answers: [
      { label: 'Yes, honestly', next: 'q6' },
      { label: 'Maybe, I try not to think about it', next: 'q6' },
      { label: 'No', next: 'q6' },
    ],
  },
  q6: {
    id: 'q6', audio: 'narrator_q6.mp3',
    question: "I need to be honest with you now, Hiba — because you deserve honesty more than anything. Omar knows he became one of the people who hurt you most. He had no friends, no support — and he put all of that weight on you, when you were already carrying your own pain alone.",
    sub: "He's not asking you to forgive that today. He just wants you to know — he finally sees it. Really sees it. Does that matter to you at all?",
    answers: [
      { label: 'Yes, it matters', next: 'q7_open' },
      { label: 'Words are easy', next: 'q7_prove' },
      { label: "I don't know", next: 'q7_neutral' },
    ],
  },
  q7_open: {
    id: 'q7_open', audio: 'narrator_q7_open.mp3',
    question: "Then hear this — he left his family. He's independent now, in debt, building himself from zero. Not for anyone else. For himself first.",
    sub: "And if you give him the chance — for you too.",
    answers: [{ label: 'Continue', next: 'q8' }],
  },
  q7_prove: {
    id: 'q7_prove', audio: 'narrator_q7_prove.mp3',
    question: "You're right. And he knows it. He made promises before — and he couldn't keep them. He owns that. Completely.",
    sub: "So he's not going to make new ones. Because you deserve more than words. What he's offering this time isn't gifts or promises. Just a man who finally understands what he had. And how rare you are.",
    answers: [{ label: 'Continue', next: 'q8' }],
  },
  q7_neutral: {
    id: 'q7_neutral', audio: 'narrator_q7_neutral.mp3',
    question: "That's fair. You don't have to feel anything right now.",
    sub: "This isn't a performance. This is a man sitting with his mistakes and asking, very quietly, for one more chance to do right.",
    answers: [{ label: 'Continue', next: 'q8' }],
  },
  q8: {
    id: 'q8', audio: 'narrator_q8.mp3',
    question: "Hiba, your smile — he told me about it. He said seeing you smile makes his whole world shine, and he wasn't exaggerating.",
    sub: 'When was the last time someone looked at you like that? Like your happiness was literally their whole world?',
    answers: [
      { label: "He did, I won't lie", next: 'q9' },
      { label: 'Not many people', next: 'q9' },
      { label: "I don't need that from anyone", next: 'q9' },
    ],
  },
  q9: {
    id: 'q9', audio: 'narrator_q9.mp3',
    question: "He told me he's not going to beg anymore. He's done chasing. He's going to focus on building himself — his life, his future, his stability.",
    sub: 'But he wanted you to know one thing before he does. What do you think he wants you to know?',
    answers: [
      { label: "That he's sorry", reveal: "Yes. More than you know.", next: 'q10' },
      { label: 'That he loves her', reveal: 'Yes. And that will never change.', next: 'q10' },
      { label: "That she's worth it", reveal: "Yes. You always were. Even when he didn't act like it.", next: 'q10' },
      { label: 'All of the above', reveal: 'You already know him better than he knows himself.', next: 'q10' },
    ],
  },
  q10: {
    id: 'q10', audio: 'narrator_q10.mp3',
    question: 'Last question Hiba. And I mean it — no pressure, no guilt, no wrong answer.',
    sub: 'In that quiet place in your heart, away from everything that happened — is there still a small part of you that believes he could be who you need him to be?',
    answers: [
      { label: 'Yes, honestly', next: 'end_hopeful' },
      { label: 'I need more time', next: 'end_patient' },
      { label: "I don't think so", next: 'end_graceful' },
    ],
  },
};
const ENDINGS = {
  end_hopeful: {
    audio: 'narrator_end_hopeful.mp3',
    emoji: '💛👑',
    title: 'Thank you, Hiba.',
    text: "Then hold onto that. You don't have to do anything with it right now. Just hold it.\n\nOmar will be here — not waiting desperately, not counting days — just becoming the man who deserves to be held onto back.\n\nYou are his queen 👑 and queens don't settle for less than someone who truly sees them.\n\nHe sees you Hiba. He always did.",
    color: '#d97706',
  },
  end_patient: {
    audio: 'narrator_end_patient.mp3',
    emoji: '💙',
    title: 'Take all the time you need.',
    text: "Time is yours. Take every second of it.\n\nOmar isn't sitting by his phone — he's building a life he can actually be proud of. And when you're ready — if you're ever ready — you'll find someone who worked on himself instead of begging.\n\nThat someone is him.\n\nNo rush. No pressure. The door is open. 💛",
    color: '#3b82f6',
  },
  end_graceful: {
    audio: 'narrator_end_graceful.mp3',
    emoji: '🤍',
    title: 'He respects that. Truly.',
    text: "He just wanted you to hear — what you two had was real. Your laugh, your drawings, your inside jokes, the calls where you fell asleep — all of it was real.\n\nAnd you, Hiba, are one of the most beautiful souls someone could ever be lucky enough to know.\n\nWhatever comes next for you — he hopes it's everything you deserve.\n\nYour majesty 👑",
    color: '#6b7280',
  },
};
function useTypewriter(text, speed = 28, active = true) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active || !text) return;
    setDisplayed('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, active]);
  return { displayed, done };
}
export default function HibaJourney() {
  const [phase, setPhase]       = useState('idle');
  const [closing, setClosing]   = useState(false);
  const [currentQ, setCurrentQ] = useState(null);
  const [ending, setEnding]     = useState(null);
  const [reveal, setReveal]     = useState(null);
  const [progress, setProgress] = useState(0);
  const [openDone, setOpenDone] = useState(false);
  const [qDone, setQDone]       = useState(false);
  const audioRef                = useRef(null);
  const answersLog              = useRef([]);
  useEffect(() => {
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setTimeout(() => setPhase('open'), 700);
    }
  }, []);
  useEffect(() => {
    let src = null;
    if (phase === 'open') src = NARRATOR_OPEN.audio;
    else if (phase === 'question' && currentQ) src = QUESTIONS[currentQ]?.audio;
    else if (phase === 'ending' && ending) src = ENDINGS[ending]?.audio;
    if (src && audioRef.current) {
      audioRef.current.src = `/audio/${src}`;
      audioRef.current.play().catch(() => {});
    }
  }, [phase, currentQ, ending]);
  function startJourney() {
    setPhase('question');
    setCurrentQ('q1');
    setProgress(1);
    setQDone(false);
  }
  function handleAnswer(answer) {
    const q = QUESTIONS[currentQ];
    if (q) {
      answersLog.current.push({ question: q.question, answer: answer.label });
    }
    if (answer.reveal) {
      setReveal(answer.reveal);
      setPhase('reveal');
      setTimeout(() => {
        setReveal(null);
        goToNext(answer.next);
      }, 3500);
      return;
    }
    goToNext(answer.next);
  }
  function goToNext(next) {
    if (next.startsWith('end_')) {
      setEnding(next);
      setPhase('ending');
      sessionStorage.setItem(SESSION_KEY, '1');
      sendAnswersToOmar(answersLog.current, next);
      return;
    }
    setQDone(false);
    setPhase('question');
    setCurrentQ(next);
    setProgress(p => Math.min(p + 1, 10));
  }
  function handleClose() {
    setClosing(true);
    setTimeout(() => setPhase('idle'), 450);
  }
  if (phase === 'idle') return null;
  const q = currentQ ? QUESTIONS[currentQ] : null;
  const e = ending   ? ENDINGS[ending]     : null;
  const totalSteps = 10;
  const pct = Math.round((progress / totalSteps) * 100);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
      background: 'rgba(0,0,0,0.92)',
      backdropFilter: 'blur(8px)',
      animation: closing ? 'hj-fade-out 0.4s ease forwards' : 'hj-fade-in 0.4s ease forwards',
    }}>
      <audio ref={audioRef} />
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes hj-fade-in  { from{opacity:0} to{opacity:1} }
        @keyframes hj-fade-out { from{opacity:1} to{opacity:0} }
        @keyframes hj-slide-up {
          from{opacity:0;transform:translateY(28px) scale(0.97)}
          to{opacity:1;transform:translateY(0) scale(1)}
        }
        @keyframes hj-pulse {
          0%,100%{box-shadow:0 0 24px 4px rgba(220,38,38,0.2)}
          50%{box-shadow:0 0 48px 10px rgba(220,38,38,0.4)}
        }
        @keyframes hj-reveal {
          0%{opacity:0;transform:scale(0.85)}
          60%{opacity:1;transform:scale(1.05)}
          100%{opacity:1;transform:scale(1)}
        }
        .hj-card { animation: hj-slide-up 0.5s cubic-bezier(.22,.68,0,1.2) forwards, hj-pulse 4s ease-in-out infinite; }
        .hj-btn { transition: all 0.18s ease; cursor: pointer; border: none; text-align: left; }
        .hj-btn:hover { transform: translateX(5px); background: rgba(220,38,38,0.15) !important; border-color: rgba(220,38,38,0.5) !important; }
        .hj-btn:active { transform: scale(0.98) translateX(3px); }
        .hj-continue { transition: all 0.2s ease; cursor: pointer; border: none; }
        .hj-continue:hover { opacity: 0.85; transform: scale(1.02); }
        .hj-reveal-pop { animation: hj-reveal 0.5s cubic-bezier(.22,.68,0,1.2) forwards; }
        .hj-text { white-space: pre-line; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(220,38,38,0.3); border-radius: 99px; }
      ` }} />
      <div className="hj-card" style={{
        width: '100%', maxWidth: 500,
        background: 'linear-gradient(160deg, #1a1a1a 0%, #0f0f0f 100%)',
        border: '1px solid rgba(220,38,38,0.25)',
        borderRadius: 22, overflow: 'hidden',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ height: 3, flexShrink: 0, background: 'linear-gradient(90deg, #dc2626, #f59e0b, #ec4899, #dc2626)', backgroundSize: '200%' }} />
        {phase === 'question' && (
          <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div style={{ height: '100%', width: \`\${pct}%\`, background: 'rgba(220,38,38,0.7)', transition: 'width 0.6s ease' }} />
          </div>
        )}
        <div style={{ padding: '28px 28px 24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #dc2626, #991b1b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎙</div>
            <div>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, margin: 0, lineHeight: 1.2 }}>
                {phase === 'ending' ? 'Final message' : 'A message for Hiba'}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '3px 0 0' }}>
                {phase === 'question' ? `Question ${progress} of ${totalSteps}` : phase === 'ending' ? 'From Omar, with love' : 'Please listen'}
              </p>
            </div>
          </div>
          {phase === 'open' && <OpeningPhase onDone={() => setOpenDone(true)} onStart={startJourney} ready={openDone} />}
          {phase === 'question' && q && <QuestionPhase q={q} onAnswer={handleAnswer} onTypeDone={() => setQDone(true)} typeDone={qDone} />}
          {phase === 'reveal' && reveal && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="hj-reveal-pop" style={{ fontSize: 48, marginBottom: 16 }}>💛</div>
              <p className="hj-reveal-pop" style={{ color: '#fff', fontSize: 18, fontWeight: 600, lineHeight: 1.6, fontStyle: 'italic' }}>"{reveal}"</p>
            </div>
          )}
          {phase === 'ending' && e && <EndingPhase e={e} onClose={handleClose} />}
        </div>
      </div>
    </div>
  );
}
function OpeningPhase({ onDone, onStart, ready }) {
  const { displayed, done } = useTypewriter(NARRATOR_OPEN.text, 22, true);
  useEffect(() => { if (done) onDone(); }, [done]);
  return (
    <>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 20px', marginBottom: 24, minHeight: 180 }}>
        <p className="hj-text" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 2, margin: 0 }}>
          {displayed}
          {!done && <span style={{ opacity: 0.5, animation: 'hj-fade-in 0.5s ease infinite alternate' }}>▌</span>}
        </p>
      </div>
      <button onClick={ready ? onStart : undefined} className="hj-continue" style={{
        width: '100%', padding: '13px', borderRadius: 14,
        background: ready ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'rgba(255,255,255,0.05)',
        color: ready ? '#fff' : 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600,
        cursor: ready ? 'pointer' : 'not-allowed',
        boxShadow: ready ? '0 0 24px rgba(220,38,38,0.3)' : 'none',
      }}>
        {ready ? "Yes, I'll answer 💛" : 'Please read first...'}
      </button>
    </>
  );
}
function QuestionPhase({ q, onAnswer, onTypeDone, typeDone }) {
  const fullText = q.sub ? \`\${q.question}\n\n\${q.sub}\` : q.question;
  const { displayed, done } = useTypewriter(fullText, 20, true);
  useEffect(() => { if (done) onTypeDone(); }, [done]);
  return (
    <>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 20px', marginBottom: 20, minHeight: 100 }}>
        <p className="hj-text" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 1.95, margin: 0 }}>
          {displayed}
          {!done && <span style={{ opacity: 0.5 }}>▌</span>}
        </p>
      </div>
      {typeDone && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {q.answers.map((a, i) => (
            <button key={i} className="hj-btn" onClick={() => onAnswer(a)} style={{
              padding: '12px 16px', borderRadius: 11,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.8)', fontSize: 13.5,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, border: '1px solid rgba(220,38,38,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'rgba(220,38,38,0.8)', fontWeight: 600 }}>
                {String.fromCharCode(65 + i)}
              </span>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
function EndingPhase({ e, onClose }) {
  const { displayed, done } = useTypewriter(e.text, 24, true);
  const [canClose, setCanClose] = useState(false);
  useEffect(() => { if (done) setTimeout(() => setCanClose(true), 800); }, [done]);
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 42, marginBottom: 10 }}>{e.emoji}</div>
        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px', letterSpacing: '0.02em' }}>{e.title}</h2>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 20px', marginBottom: 22 }}>
        <p className="hj-text" style={{ color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 2, margin: 0 }}>
          {displayed}
          {!done && <span style={{ opacity: 0.5 }}>▌</span>}
        </p>
      </div>
      <button onClick={canClose ? onClose : undefined} className="hj-continue" style={{
        width: '100%', padding: '13px', borderRadius: 14, border: 'none',
        background: canClose ? `linear-gradient(135deg, ${e.color}, ${e.color}cc)` : 'rgba(255,255,255,0.05)',
        color: canClose ? '#fff' : 'rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600,
        cursor: canClose ? 'pointer' : 'not-allowed',
        boxShadow: canClose ? `0 0 24px ${e.color}44` : 'none',
      }}>
        {canClose ? 'Close 💛' : 'Reading...'}
      </button>
    </>
  );
}
