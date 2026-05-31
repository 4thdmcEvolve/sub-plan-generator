import React, { useState } from "react";
import ReactDOM from "react-dom/client";


const NAVY = "#1B3A6B";
const GOLD = "#C9A84C";
const DARK = "#0d1b2a";

const GRADES = ["K", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th", "College"];
const SUBJECTS = ["English / ELA", "Math", "Science", "Social Studies", "Business", "History", "Art", "PE / Health", "Foreign Language", "Special Education", "Other"];
const PERIODS = ["1 class period", "Half day", "Full day", "Multiple days"];

// Class length 30 to 90 min in 10 min intervals
const CLASS_LENGTHS = ["30 min", "40 min", "50 min", "60 min", "70 min", "80 min", "90 min"];

const ACTIVITIES = [
  "Independent work",
  "Partner work",
  "Small groups",
  "Silent reading",
  "Reading aloud",
  "Worksheet packet",
  "Movie / Video",
  "Watch and discuss",
  "Review game",
  "Discussion",
  "Writing prompt",
  "Vocabulary practice",
  "Note-taking",
  "Research / Computer time",
  "Test review",
  "Study hall",
  "Hands-on activity",
  "Worksheets from folder",
];

const LIMITS = {
  topic: 150,
  classSize: 30,
  startTime: 20,
  endTime: 20,
  fullSchedule: 600,
  iep: 500,
  emergency: 300,
  general: 500,
};

const inp = (extra = {}) => ({
  width: "100%",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 8,
  color: "#fff",
  padding: "12px 14px",
  fontSize: 15,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  WebkitAppearance: "none",
  ...extra,
});

const Label = ({ text, required }) => (
  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 7 }}>
    {text} {required && <span style={{ color: GOLD }}>*</span>}
  </div>
);

const CharCount = ({ current, max }) => (
  <div style={{ textAlign: "right", fontSize: 10, color: current > max * 0.9 ? "#ffb066" : "rgba(255,255,255,0.3)", marginTop: 4, letterSpacing: 1 }}>
    {current} / {max}
  </div>
);

const renderResult = (text) =>
  text.split("\n").map((line, i) => {
    const t = line.trim();
    if (!t) return <div key={i} style={{ height: 8 }} />;
    if (/^#{1,3}\s/.test(t) || /^\*\*[^*]+\*\*$/.test(t)) {
      return (
        <div key={i} style={{ fontWeight: 900, fontSize: 15, color: NAVY, borderLeft: `4px solid ${GOLD}`, paddingLeft: 12, margin: "18px 0 8px" }}>
          {t.replace(/^#+\s*/, "").replace(/\*\*/g, "")}
        </div>
      );
    }
    if (/^\d+\.\s/.test(t)) {
      return (
        <div key={i} style={{ fontWeight: 800, fontSize: 14, color: NAVY, borderLeft: `4px solid ${GOLD}`, paddingLeft: 12, margin: "16px 0 6px" }}>
          {t.replace(/\*\*/g, "")}
        </div>
      );
    }
    if (t.startsWith("-") || t.startsWith("•")) {
      return (
        <div key={i} style={{ display: "flex", gap: 10, margin: "4px 0 4px 10px", fontSize: 14, color: "#333", lineHeight: 1.6 }}>
          <span style={{ color: GOLD, fontWeight: 900, flexShrink: 0 }}>•</span>
          <span>{t.replace(/^[-•]\s*/, "").replace(/\*\*/g, "")}</span>
        </div>
      );
    }
    return <div key={i} style={{ fontSize: 14, color: "#444", lineHeight: 1.75, margin: "3px 0" }}>{t.replace(/\*\*/g, "")}</div>;
  });

const cleanForCopy = (text) =>
  text
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/^\s*[-•]\s*/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

function App() {
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("1 class period");
  const [classLength, setClassLength] = useState("50 min");
  const [classSize, setClassSize] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [fullSchedule, setFullSchedule] = useState("");
  const [activities, setActivities] = useState([]);
  const [specialNotes, setSpecialNotes] = useState("");
  const [seatingChart, setSeatingChart] = useState(false);
  const [iepStudents, setIepStudents] = useState("");
  const [emergencyInfo, setEmergencyInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [unlocked, setUnlocked] = useState(
    typeof window !== "undefined" && localStorage.getItem("toolkit_unlocked") === "yes"
  );
  const [pwInput, setPwInput] = useState("");
  const [authChecking, setAuthChecking] = useState(false);
  const [authError, setAuthError] = useState("");

  const toggleActivity = (a) => {
    setActivities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const handleCapped = (setter, max) => (e) => {
    if (e.target.value.length <= max) setter(e.target.value);
  };

  const buildPrompt = () => {
    // Build context strictly from what the teacher provided
    const contextLines = [
      `Subject: ${subject || "General"}`,
      `Grade Level: ${grade || "Not specified"}`,
      `Topic: ${topic || "Not specified"}`,
      `Duration: ${duration}`,
      `Class Length: ${classLength}`,
    ];
    if (classSize) contextLines.push(`Class Size: ${classSize}`);
    if (startTime || endTime) contextLines.push(`Class Times: ${startTime || "[not provided]"} to ${endTime || "[not provided]"}`);
    if (fullSchedule) contextLines.push(`Full Schedule Provided by Teacher:\n${fullSchedule}`);
    if (activities.length) contextLines.push(`Preferred Activities: ${activities.join(", ")}`);
    if (iepStudents) contextLines.push(`IEP / Accommodation Notes: ${iepStudents}`);
    if (specialNotes) contextLines.push(`Class Notes: ${specialNotes}`);
    if (emergencyInfo) contextLines.push(`Emergency Info: ${emergencyInfo}`);
    if (seatingChart) contextLines.push("Seating chart will be attached.");

    return `You are an experienced teacher writing a CONCISE, practical substitute teacher plan.

WHAT YOU CAN AND CANNOT ADD:
- YOU CAN add standard classroom mechanics any sub plan needs: taking attendance, settling students, walking around to monitor, checking for raised hands, transitions between activities, normal dismissal procedures, basic classroom management notes appropriate for the grade level.
- YOU CANNOT invent academic content the teacher did not mention: do not add warm-up activities, exit tickets, discussion questions, vocabulary reviews, additional lessons, or any educational task the teacher didn't specify. If the teacher said "students work on packets," that IS the lesson — do not add academic activities before or after it.
- The rule: classroom logistics yes, invented academic content no. Use your teaching expertise for standard procedures, not for inventing curriculum.

WHAT THE TEACHER PROVIDED:
${contextLines.join("\n")}

OUTPUT — exactly these 9 sections, no more no less:

1. WELCOME NOTE TO SUB
Write 2-3 sentences in the TEACHER'S OWN VOICE — first person, as if the teacher is writing the note themselves. Use "I" not "the teacher." Examples: "Thank you for covering my class today. My students are working on..." or "Thanks for stepping in! Today my students are..." Do NOT write in third person. Do NOT refer to "the teacher" — you ARE the teacher writing this.

2. CLASS OVERVIEW
2-3 short bullets. Grade, subject, general behavior expectations appropriate to grade level.

3. SCHEDULE & TIMELINE
${startTime || endTime || fullSchedule
  ? "Use the times and schedule the teacher provided. Format as a bullet list. You may add brief logistics like 'attendance' and 'dismissal' but do not invent academic activities."
  : `Use the class length (${classLength}) to create a reasonable time block structure with standard logistics (attendance, settling in, the activity the teacher specified, and dismissal). Do NOT invent specific clock times. Format as a bullet list.`}

4. LESSON / ACTIVITY INSTRUCTIONS
Step-by-step instructions for ONLY the activities/work the teacher specified. Maximum 5 short numbered steps. You may add reasonable logistics (passing out materials, collecting work) but do NOT invent additional academic content.

5. CLASSROOM MANAGEMENT TIPS
3 bullets max. One sentence each. Use your knowledge of typical grade-level behavior — these can be general management wisdom for this age group.

6. IMPORTANT STUDENTS TO KNOW
${iepStudents ? "Brief notes based on what the teacher provided." : 'Write only: "No specific student notes provided. Treat all students equitably and reach out to the front office if any concerns arise."'}

7. IF THEY FINISH EARLY
${activities.length > 0
  ? "3 short bullet activities pulled ONLY from the teacher's preferred activities list. One line each."
  : 'Write 2-3 SAFE, generic options that do not invent academic content. Examples: "Read silently from a book they have," "Free draw or quiet sketching," "Wait quietly at their seat." Do NOT invent worksheets, reviews, or academic tasks.'}

8. END OF DAY CHECKLIST
4-5 short bullets. Standard logistics only — clean up materials, push in chairs, collect any work, dismiss when bell rings, leave the room as found, etc. Do NOT invent academic wrap-up tasks.

9. LEAVE A NOTE
Format exactly:
"How did the day go?
What got finished:
What didn't get finished:
Any issues:
Anything I should know:"

WRITING RULES:
- NEVER invent academic activities or curriculum the teacher did not provide
- DO use teaching expertise for standard classroom mechanics and grade-appropriate management
- Be CONCISE — every section short and scannable
- Use bullets and numbered lists, not paragraphs
- Plain text only — no markdown headers or bold
- A sub should be able to scan the whole plan in 60 seconds`;
  };

  const generate = async () => {
    if (!grade) { setError("Please select a grade level."); return; }
    setError(""); setResult(""); setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1500,
          messages: [{ role: "user", content: buildPrompt() }],
          toolkitPassword: localStorage.getItem("toolkit_password") || "",
        }),
      });
      const json = await res.json();
      if (json.error) {
        if (json.error.code === "AUTH_REQUIRED") {
          localStorage.removeItem("toolkit_unlocked");
          localStorage.removeItem("toolkit_password");
          setUnlocked(false);
          setError("That password is no longer valid. Please re-enter.");
          return;
        }
        setError("Error: " + json.error.message); return;
      }
      const text = (json.content || []).filter(b => b.type === "text").map(b => b.text).join("");
      if (!text) { setError("Nothing returned. Try again."); return; }
      setResult(text);
    } catch (e) {
      setError("Request failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(cleanForCopy(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
   <>
    {!unlocked && (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "linear-gradient(160deg, #08111e 0%, #0d1f3c 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', system-ui, sans-serif", padding: 20,
      }}>
        <div style={{
          maxWidth: 380, width: "100%", textAlign: "center",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.25)",
          borderRadius: 12, padding: "40px 32px",
        }}>
          <div style={{
            display: "inline-block", border: "1px solid #C9A84C", color: "#C9A84C",
            fontSize: 10, letterSpacing: 4, padding: "4px 14px", marginBottom: 20,
            fontWeight: 700, borderRadius: 2, textTransform: "uppercase",
            fontFamily: "monospace",
          }}>4THDMC | EVOLVE LLC</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 10 }}>Sub Plan Generator</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>Enter your access password to continue.</div>
          <input
            type="password"
            value={pwInput}
            disabled={authChecking}
            onChange={(e) => { setPwInput(e.target.value); setAuthError(""); }}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && pwInput.trim() && !authChecking) {
                setAuthChecking(true);
                setAuthError("");
                try {
                  const r = await fetch("/api/auth", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password: pwInput.trim() }),
                  });
                  if (r.ok) {
                    localStorage.setItem("toolkit_password", pwInput.trim());
                    localStorage.setItem("toolkit_unlocked", "yes");
                    setUnlocked(true);
                  } else {
                    setAuthError("Incorrect password. Try again.");
                  }
                } catch (err) {
                  setAuthError("Connection error. Try again.");
                } finally {
                  setAuthChecking(false);
                }
              }
            }}
            placeholder="Access password"
            style={{
              width: "100%", boxSizing: "border-box", padding: "13px 16px",
              background: "rgba(255,255,255,0.07)",
              border: `1px solid ${authError ? "rgba(255,80,80,0.5)" : "rgba(255,255,255,0.2)"}`,
              borderRadius: 8, color: "#fff", fontSize: 15, outline: "none", marginBottom: authError ? 8 : 16,
              opacity: authChecking ? 0.6 : 1,
            }}
          />
          {authError && (
            <div style={{ color: "#ff9090", fontSize: 12, marginBottom: 16, textAlign: "left" }}>
              ⚠ {authError}
            </div>
          )}
          <button
            disabled={authChecking || !pwInput.trim()}
            onClick={async () => {
              if (!pwInput.trim() || authChecking) return;
              setAuthChecking(true);
              setAuthError("");
              try {
                const r = await fetch("/api/auth", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ password: pwInput.trim() }),
                });
                if (r.ok) {
                  localStorage.setItem("toolkit_password", pwInput.trim());
                  localStorage.setItem("toolkit_unlocked", "yes");
                  setUnlocked(true);
                } else {
                  setAuthError("Incorrect password. Try again.");
                }
              } catch (err) {
                setAuthError("Connection error. Try again.");
              } finally {
                setAuthChecking(false);
              }
            }}
            style={{
              width: "100%", padding: 14,
              background: authChecking ? "rgba(201,168,76,0.5)" : "#C9A84C",
              color: "#08111e",
              border: "none", borderRadius: 8, fontWeight: 900, fontSize: 14,
              letterSpacing: 2, cursor: authChecking ? "wait" : "pointer", textTransform: "uppercase",
            }}
          >{authChecking ? "Checking..." : "Unlock Tool"}</button>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 20, lineHeight: 1.5 }}>Not a subscriber yet? Visit brrteaching.com to join.</div>
        </div>
      </div>
    )}
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${DARK} 0%, ${NAVY} 100%)`, fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "0 0 80px" }}>

      {/* NAV */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 900, fontSize: 16, color: "#fff", letterSpacing: 1 }}>
          4THDMC <span style={{ color: GOLD }}>|</span> EVOLVE LLC
        </div>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>Teacher Toolkit</div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 18px" }}>

        {/* HEADER */}
        {!result && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "inline-block", border: `1px solid ${GOLD}`, color: GOLD, fontSize: 10, letterSpacing: 4, padding: "4px 14px", marginBottom: 12, fontWeight: 700, borderRadius: 2, textTransform: "uppercase" }}>
              4THDMC | EVOLVE LLC
            </div>
            <div style={{ fontSize: "clamp(28px, 7vw, 44px)", fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
              SUB PLAN<br /><span style={{ color: GOLD }}>GENERATOR</span>
            </div>
            <div style={{ width: 40, height: 3, background: GOLD, margin: "12px 0 8px" }} />
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontStyle: "italic" }}>
              Print-ready sub plan in under 60 seconds. Built by a teacher.
            </div>
          </div>
        )}

        {!result && (
          <>
            {/* CLASS INFO */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "22px 18px", marginBottom: 16 }}>
              <div style={{ color: GOLD, fontWeight: 700, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 18 }}>✦ Class Info</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <Label text="Subject" />
                  <select value={subject} onChange={e => setSubject(e.target.value)} style={inp({ background: "#162d52", color: subject ? "#fff" : "rgba(255,255,255,0.35)" })}>
                    <option value="">Select...</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label text="Grade Level" required />
                  <select value={grade} onChange={e => setGrade(e.target.value)} style={inp({ background: "#162d52", color: grade ? "#fff" : "rgba(255,255,255,0.35)" })}>
                    <option value="">Select...</option>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <Label text="Topic / What we're covering" />
                <input value={topic} onChange={handleCapped(setTopic, LIMITS.topic)}
                  placeholder="e.g. Chapter 5 review, finish persuasive essay draft..."
                  style={inp()} />
                <CharCount current={topic.length} max={LIMITS.topic} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <Label text="Class Size" />
                  <input value={classSize} onChange={handleCapped(setClassSize, LIMITS.classSize)}
                    placeholder="e.g. 28 students" style={inp()} />
                </div>
                <div>
                  <Label text="Duration" />
                  <select value={duration} onChange={e => setDuration(e.target.value)} style={inp({ background: "#162d52" })}>
                    {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Class Length */}
              <div style={{ marginBottom: 14 }}>
                <Label text="Class Length" />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {CLASS_LENGTHS.map(l => (
                    <button key={l} onClick={() => setClassLength(l)} style={{
                      padding: "8px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      border: `1px solid ${classLength === l ? GOLD : "rgba(255,255,255,0.2)"}`,
                      background: classLength === l ? "rgba(201,168,76,0.15)" : "transparent",
                      color: classLength === l ? GOLD : "rgba(255,255,255,0.5)",
                    }}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Seating chart toggle */}
              <button onClick={() => setSeatingChart(!seatingChart)} style={{
                width: "100%", padding: "12px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12,
                border: `1px solid ${seatingChart ? GOLD : "rgba(255,255,255,0.15)"}`,
                background: seatingChart ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.02)",
              }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${seatingChart ? GOLD : "rgba(255,255,255,0.3)"}`, background: seatingChart ? GOLD : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {seatingChart && <span style={{ color: DARK, fontSize: 13, fontWeight: 900 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: seatingChart ? GOLD : "rgba(255,255,255,0.7)" }}>I'll attach a seating chart</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Plan will reference it</div>
                </div>
              </button>
            </div>

            {/* SCHEDULE & TIMES */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "22px 18px", marginBottom: 16 }}>
              <div style={{ color: GOLD, fontWeight: 700, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>✦ Class Schedule (Optional)</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 14 }}>Tell the sub when class starts and ends. Or paste a full schedule below.</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <Label text="Class Starts" />
                  <input value={startTime} onChange={handleCapped(setStartTime, LIMITS.startTime)}
                    placeholder="e.g. 8:30 AM" style={inp()} />
                </div>
                <div>
                  <Label text="Class Ends" />
                  <input value={endTime} onChange={handleCapped(setEndTime, LIMITS.endTime)}
                    placeholder="e.g. 9:20 AM" style={inp()} />
                </div>
              </div>

              <div>
                <Label text="Full Schedule (Optional)" />
                <textarea value={fullSchedule} onChange={handleCapped(setFullSchedule, LIMITS.fullSchedule)}
                  placeholder="Paste your daily schedule here if multiple periods. e.g. Period 1 8:30-9:20 / Period 2 9:25-10:15..."
                  rows={4} style={{ ...inp(), resize: "vertical", lineHeight: 1.5 }} />
                <CharCount current={fullSchedule.length} max={LIMITS.fullSchedule} />
              </div>
            </div>

            {/* PREFERRED ACTIVITIES */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "22px 18px", marginBottom: 16 }}>
              <div style={{ color: GOLD, fontWeight: 700, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>✦ Preferred Activities</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 14 }}>Tap all that work for your class — leave blank if no preference</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ACTIVITIES.map(a => (
                  <button key={a} onClick={() => toggleActivity(a)} style={{
                    padding: "7px 13px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: `1px solid ${activities.includes(a) ? GOLD : "rgba(255,255,255,0.18)"}`,
                    background: activities.includes(a) ? "rgba(201,168,76,0.18)" : "transparent",
                    color: activities.includes(a) ? GOLD : "rgba(255,255,255,0.5)",
                  }}>{a}</button>
                ))}
              </div>
            </div>

            {/* IMPORTANT NOTES */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "22px 18px", marginBottom: 16 }}>
              <div style={{ color: GOLD, fontWeight: 700, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>✦ Important Notes for Sub</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginBottom: 16 }}>Optional — keep notes short and specific</div>

              <div style={{ marginBottom: 14 }}>
                <Label text="IEP / Accommodation Notes" />
                <textarea value={iepStudents} onChange={handleCapped(setIepStudents, LIMITS.iep)}
                  placeholder="e.g. Marcus has IEP — extended time. Aisha leaves for resource room at 10am..."
                  rows={3} style={{ ...inp(), resize: "vertical", lineHeight: 1.5 }} />
                <CharCount current={iepStudents.length} max={LIMITS.iep} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <Label text="Emergency / Critical Info" />
                <textarea value={emergencyInfo} onChange={handleCapped(setEmergencyInfo, LIMITS.emergency)}
                  placeholder="e.g. Fire drill at 10:15. Nurse pass for Jordan..."
                  rows={2} style={{ ...inp(), resize: "vertical", lineHeight: 1.5 }} />
                <CharCount current={emergencyInfo.length} max={LIMITS.emergency} />
              </div>

              <div>
                <Label text="General Class Notes" />
                <textarea value={specialNotes} onChange={handleCapped(setSpecialNotes, LIMITS.general)}
                  placeholder="e.g. This class responds well to humor. Avoid free time — they get loud quickly..."
                  rows={3} style={{ ...inp(), resize: "vertical", lineHeight: 1.5 }} />
                <CharCount current={specialNotes.length} max={LIMITS.general} />
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(255,80,80,0.12)", border: "1px solid rgba(255,80,80,0.3)", color: "#ff9090", padding: "12px 16px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>
            )}

            <button onClick={generate} disabled={loading} style={{
              width: "100%", padding: 18, background: loading ? "rgba(201,168,76,0.4)" : GOLD,
              color: DARK, border: "none", borderRadius: 12, fontWeight: 900,
              fontSize: 16, letterSpacing: 3, cursor: loading ? "not-allowed" : "pointer",
              textTransform: "uppercase", boxShadow: loading ? "none" : "0 4px 24px rgba(201,168,76,0.3)",
            }}>
              {loading ? "⏳  Building Your Sub Plan..." : "GENERATE SUB PLAN"}
            </button>
          </>
        )}

        {/* RESULT */}
        {result && (
          <div>
            <div style={{ background: "#fff", borderRadius: 16, padding: "26px 20px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 16, borderBottom: `2px solid ${GOLD}`, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ display: "inline-block", background: "rgba(201,168,76,0.12)", border: `1px solid ${GOLD}`, color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 2, padding: "4px 10px", borderRadius: 20, marginBottom: 8, textTransform: "uppercase" }}>✓ Ready to Print</div>
                  <div style={{ fontWeight: 900, fontSize: 20, color: NAVY, lineHeight: 1.2 }}>Sub Plan — {grade} Grade</div>
                  <div style={{ color: "#999", fontSize: 12, marginTop: 4 }}>{subject || "General"} · {topic || "Current Unit"} · {classLength}</div>
                </div>
              </div>

              <div>{renderResult(result)}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={copy} style={{
                padding: 16, background: copied ? "#2a9d5c" : NAVY, color: "#fff", border: "none",
                borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer",
                textTransform: "uppercase", letterSpacing: 1, transition: "background 0.2s",
              }}>
                {copied ? "✓ Copied!" : "📋 Copy Full Sub Plan"}
              </button>
              <button onClick={() => { setResult(""); setError(""); }} style={{
                padding: 16, background: "transparent", color: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
                fontWeight: 700, fontSize: 14, cursor: "pointer", textTransform: "uppercase",
              }}>
                ← Create New Plan
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", color: "rgba(255,255,255,0.18)", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", marginTop: 20, padding: "0 16px 24px" }}>
        <div>© 2025 <span style={{ color: "rgba(201,168,76,0.55)" }}>4THDMC | EVOLVE LLC</span> · All Rights Reserved</div>
        <div style={{ marginTop: 6, fontSize: 9, letterSpacing: 2, color: "rgba(255,255,255,0.12)" }}>Brandon Russell · The Multiplier · Chattanooga, TN</div>
      </div>
    </div>
   </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
