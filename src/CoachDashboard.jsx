// ─────────────────────────────────────────────────────────────────
// CoachDashboard.jsx
// Route: /coach
// Auth guard: password checked against VITE_COACH_SECRET env var
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';

const COACH_SECRET   = import.meta.env.VITE_COACH_SECRET;
const DATA_SCRIPT    = import.meta.env.VITE_DATA_SCRIPT_URL;
const CHECKIN_SCRIPT = import.meta.env.VITE_CHECKIN_SCRIPT_URL;
const CONFIG_VALID   = !!COACH_SECRET && !!DATA_SCRIPT;

// ── Utility ──────────────────────────────────────────────────────
function scriptUrl(params) {
  const qs = new URLSearchParams({ ...params, secret: COACH_SECRET }).toString();
  return `${DATA_SCRIPT}?${qs}`;
}

async function apiFetch(params) {
  const res = await fetch(scriptUrl(params));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

async function apiPost(body) {
  // text/plain avoids CORS preflight — Apps Script receives full body via e.postData.contents
  await fetch(DATA_SCRIPT, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ ...body, secret: COACH_SECRET })
  });
  return { success: true };
}

async function checkinPost(body) {
  if (!CHECKIN_SCRIPT) throw new Error('VITE_CHECKIN_SCRIPT_URL is not set — add it to Vercel environment variables.');
  await fetch(CHECKIN_SCRIPT, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  });
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function CoachDashboard() {

  const [authed, setAuthed] = useState(false);
  if (!CONFIG_VALID) return (
    <div style={{minHeight:'100vh',backgroundColor:'#0f1a24',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
      <p style={{color:'#ef4444',fontFamily:'Barlow,sans-serif',fontSize:'15px',textAlign:'center'}}>
        Dashboard not configured.<br/>VITE_COACH_SECRET and VITE_DATA_SCRIPT_URL must be set in Vercel environment variables.
      </p>
    </div>
  );
  if (!authed) return <PasswordGate onSuccess={() => setAuthed(true)} />;
  return <DashboardShell />;
}

// ─────────────────────────────────────────────────────────────────
// DASHBOARD SHELL — manages view state
// ─────────────────────────────────────────────────────────────────
function DashboardShell() {
  const [view, setView]           = useState('list');      // 'list' | 'detail' | 'targets'
  const [selectedClient, setSelected] = useState(null);
  const [clients, setClients]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [filterFlagged, setFilter]= useState(false);

  const loadClients = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch({ action: 'getActiveClients' });
      // Sort: flagged first, then by daysSinceLog desc
      const sorted = [...data.clients].sort((a, b) => {
        if (a.flagged && !b.flagged) return -1;
        if (!a.flagged && b.flagged) return 1;
        return b.daysSinceLog - a.daysSinceLog;
      });
      setClients(sorted);
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  const openClient = (client) => { setSelected(client); setView('detail'); };
  const openTargets= (client) => { setSelected(client); setView('targets'); };
  const goBack     = ()       => { setView('list'); setSelected(null); };

  const flaggedCount = clients.filter(c => c.flagged).length;
  const displayed    = filterFlagged ? clients.filter(c => c.flagged) : clients;

  return (
    <div style={S.shell}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          {view !== 'list' && (
            <button onClick={goBack} style={S.backBtn}>← Back</button>
          )}
          <span style={S.logo}>EVOLVE<span style={S.logoOrange}>:</span>COACH</span>
        </div>
        {view === 'list' && (
          <div style={S.headerRight}>
            {flaggedCount > 0 && (
              <button
                style={{ ...S.filterBtn, ...(filterFlagged ? S.filterBtnActive : {}) }}
                onClick={() => setFilter(f => !f)}
              >
                🔴 {flaggedCount} flagged
              </button>
            )}
            <button onClick={loadClients} style={S.refreshBtn}>↻ Refresh</button>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div style={S.body}>
        {loading && <LoadingState />}
        {error   && <ErrorState msg={error} onRetry={loadClients} />}
        {!loading && !error && (
          <>
            {view === 'list'    && <ClientList clients={displayed} onSelect={openClient} onTargets={openTargets} />}
            {view === 'detail'  && <ClientDetail clientId={selectedClient.clientId} name={selectedClient.name} onTargets={() => openTargets(selectedClient)} />}
            {view === 'targets' && <TargetEditor client={selectedClient} onSaved={goBack} onCancel={goBack} />}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CLIENT LIST
// ─────────────────────────────────────────────────────────────────
function ClientList({ clients, onSelect, onTargets }) {
  if (!clients.length) {
    return (
      <div style={S.empty}>
        <p style={S.emptyText}>No active clients.</p>
        <p style={S.emptyHint}>Add clients by setting Active = TRUE in the Consultations sheet.</p>
      </div>
    );
  }

  return (
    <div style={S.cardGrid}>
      {clients.map(c => (
        <ClientCard key={c.clientId} client={c} onSelect={onSelect} onTargets={onTargets} />
      ))}
    </div>
  );
}

function ClientCard({ client, onSelect, onTargets }) {
  const { name, streak, lastLogDate, daysSinceLog, flagged } = client;

  const statusIcon  = flagged ? '🔴' : daysSinceLog === 0 ? '✅' : daysSinceLog === 1 ? '🟡' : '🟠';
  const statusLabel = flagged
    ? `No log for ${daysSinceLog} days`
    : daysSinceLog === 0 ? 'Logged today'
    : daysSinceLog === 1 ? 'Logged yesterday'
    : `${daysSinceLog} days ago`;

  return (
    <div style={{ ...S.card, ...(flagged ? S.cardFlagged : {}) }}>
      <div style={S.cardTop}>
        <span style={S.cardName}>{name}</span>
        <span style={S.statusBadge}>{statusIcon}</span>
      </div>
      <div style={S.cardMeta}>
        <span style={S.metaItem}>🔥 {streak} day streak</span>
        <span style={{ ...S.metaItem, ...(flagged ? S.metaFlagged : {}) }}>{statusLabel}</span>
      </div>
      <div style={S.cardActions}>
        <button style={S.btnPrimary} onClick={() => onSelect(client)}>View data</button>
        <button style={S.btnSecondary} onClick={() => onTargets(client)}>Targets</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CLIENT DETAIL
// ─────────────────────────────────────────────────────────────────
function ClientDetail({ clientId, name, onTargets }) {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab]     = useState('overview'); // 'overview' | 'logs' | 'checkins'

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const d = await apiFetch({ action: 'getClientDashboard', clientId });
        setData(d);
      } catch(e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId]);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState msg={error} />;

  const { logs, checkins, targets, streak, lastLogDate, daysSinceLog, clientEmail } = data;

  return (
    <div style={S.detailShell}>
      {/* Client header */}
      <div style={S.detailHeader}>
        <div>
          <h2 style={S.detailName}>{name}</h2>
          <p style={S.detailMeta}>
            🔥 {streak} day streak · Last log: {lastLogDate || 'never'} · {daysSinceLog === 0 ? 'Logged today' : `${daysSinceLog}d ago`}
          </p>
        </div>
        <button style={S.btnPrimary} onClick={onTargets}>Edit targets</button>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {['overview','logs','checkins'].map(t => (
          <button
            key={t}
            style={{ ...S.tab, ...(tab === t ? S.tabActive : {}) }}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview'  && <OverviewTab logs={logs} targets={targets} />}
      {tab === 'logs'      && <LogsTab logs={logs} />}
      {tab === 'checkins'  && (
        <CheckinsTab
          checkins={checkins}
          logs={logs}
          targets={targets}
          clientId={clientId}
          clientName={name}
          clientEmail={clientEmail || ''}
        />
      )}
    </div>
  );
}

// ── Overview: 30-day habit summary ───────────────────────────────
function OverviewTab({ logs, targets }) {
  // Build last-30-days calendar data
  const today = new Date();
  const days  = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const logsByDate = {};
  logs.forEach(l => {
    // Handle both 'Date' (capitalised, from Apps Script) and 'date' (lowercase)
    const dateVal = l['Date'] || l['date'];
    if (dateVal) {
      const dateStr = typeof dateVal === 'string'
        ? dateVal.split('T')[0]
        : new Date(dateVal).toISOString().split('T')[0];
      logsByDate[dateStr] = l;
    }
  });

  return (
    <div>
      {/* 30-day mini calendar */}
      <h3 style={S.sectionTitle}>Last 30 days</h3>
      <div style={S.calGrid}>
        {days.map(d => {
          // Logs keyed by 'Date' column value (ISO string)
        const logged = !!logsByDate[d];
          return (
            <div
              key={d}
              title={d}
              style={{ ...S.calCell, backgroundColor: logged ? '#F26419' : '#2a3a4a' }}
            />
          );
        })}
      </div>

      {/* Habit averages */}
      <h3 style={S.sectionTitle}>Habit averages (last 30 days)</h3>
      <HabitAverages logs={logs} targets={targets} />
    </div>
  );
}

function HabitAverages({ logs, targets }) {
  // FIX: keys and units match client app COLUMNS array exactly
  const HABITS = [
    { key: 'Sleep (hrs)',       label: 'Sleep',       unit: 'hrs' },
    { key: 'Steps',             label: 'Steps',       unit: ''    },
    { key: 'Hydration (L)',     label: 'Hydration',   unit: 'L'   },
    { key: 'Meals',             label: 'Meals',       unit: ''    },
    { key: 'Mindfulness (min)', label: 'Mindfulness', unit: 'min' },
    { key: 'Mobility (min)',    label: 'Mobility',    unit: 'min' },
    { key: 'Calories (kcal)',   label: 'Calories',    unit: 'kcal', mode: 'band', bandPercent: 10, amberBandPercent: 15 },
    { key: 'Stress RPE (1-10)', label: 'Stress',      unit: '/10' },
    { key: 'Mood (1-10)',       label: 'Mood',        unit: '/10' },
    { key: 'Energy (1-10)',     label: 'Energy',      unit: '/10' },
    { key: 'Digestion (1-10)',  label: 'Digestion',   unit: '/10' },
  ];

  // Map column header key back to targets object key for reference line
  const TARGET_KEY_MAP = {
    'Sleep (hrs)': 'sleep', 'Steps': 'steps', 'Hydration (L)': 'hydration',
    'Meals': 'meals', 'Mindfulness (min)': 'mindfulness', 'Mobility (min)': 'mobility',
    'Calories (kcal)': 'calories',
    'Stress RPE (1-10)': 'stress', 'Mood (1-10)': 'mood',
    'Energy (1-10)': 'energy', 'Digestion (1-10)': 'digestion',
  };

  const activeHabits = targets?.activeHabits;
  const activeSet = activeHabits
    ? new Set(typeof activeHabits === 'string' ? activeHabits.split(',').map(s => s.trim()).filter(Boolean) : activeHabits)
    : null;
  const visibleHabits = activeSet
    ? HABITS.filter(({ key }) => activeSet.has(TARGET_KEY_MAP[key]))
    : HABITS;

  const recent = logs.slice(-30);

  return (
    <div style={S.habitGrid}>
      {visibleHabits.map(({ key, label, unit, mode, bandPercent, amberBandPercent }) => {
        const vals = recent.map(l => parseFloat(l[key])).filter(v => !isNaN(v));
        const avg  = vals.length ? (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(1) : '—';
        const targetKey = TARGET_KEY_MAP[key];
        const target = targets?.[targetKey];
        const pctOfTarget = target && avg !== '—' ? (parseFloat(avg) / parseFloat(target)) * 100 : null;

        let pct = null, barColor = null;
        if (pctOfTarget !== null) {
          if (mode === 'band') {
            // Band mode: close to 100% of target is good in either direction.
            // Bar is scaled to a 0–200%-of-target range (target sits at the
            // midpoint) so overshoot is visibly distinct from being on target,
            // rather than both pinning the bar to a full 100% width.
            const greenPct = bandPercent ?? 10;
            const amberPct = amberBandPercent ?? greenPct * 2;
            const distPct  = Math.abs(pctOfTarget - 100);
            pct = Math.min(100, pctOfTarget / 2);
            barColor = distPct <= greenPct ? '#22c55e' : distPct <= amberPct ? '#F26419' : '#ef4444';
          } else {
            pct = Math.min(100, pctOfTarget);
            barColor = pct >= 100 ? '#22c55e' : pct >= 70 ? '#F26419' : '#ef4444';
          }
        }

        return (
          <div key={key} style={S.habitCard}>
            <p style={S.habitLabel}>{label}</p>
            <p style={S.habitValue}>{avg}{avg !== '—' ? unit : ''}</p>
            {target && <p style={S.habitTarget}>Target: {target}{unit}</p>}
            {pct !== null && (
              <div style={S.progressBar}>
                <div style={{ ...S.progressFill, width: `${pct}%`, backgroundColor: barColor }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// REPORT HELPERS
// ─────────────────────────────────────────────────────────────────

// Maps sheet column keys to targets object keys (shared with HabitAverages)
const TARGET_KEY_MAP = {
  'Sleep (hrs)': 'sleep', 'Steps': 'steps', 'Hydration (L)': 'hydration',
  'Meals': 'meals', 'Mindfulness (min)': 'mindfulness', 'Mobility (min)': 'mobility',
  'Calories (kcal)': 'calories',
  'Stress RPE (1-10)': 'stress', 'Mood (1-10)': 'mood',
  'Energy (1-10)': 'energy', 'Digestion (1-10)': 'digestion',
};

// Averages over the 7-day window ending on (and including) the check-in's submittedAt date.
// This is the correct window for reports — NOT the rolling-30-day window used in HabitAverages.
function calcPeriodAverages(logs, submittedAt) {
  if (!submittedAt) return { sleep: null, steps: null, hydration: null, stress: null, mood: null, energy: null, completion: null };

  const end   = new Date(submittedAt);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const periodLogs = logs.filter(l => {
    const dateVal = l['Date'] || l['date'];
    if (!dateVal) return false;
    const d = new Date(typeof dateVal === 'string' ? dateVal.split('T')[0] : dateVal);
    return d >= start && d <= end;
  });

  const avg = (colKey) => {
    const vals = periodLogs.map(l => parseFloat(l[colKey])).filter(v => !isNaN(v));
    return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : null;
  };

  const completionVals = periodLogs.map(l => parseFloat(l['Completion %'])).filter(v => !isNaN(v));
  const completion = completionVals.length
    ? parseFloat((completionVals.reduce((a, b) => a + b, 0) / completionVals.length).toFixed(1))
    : null;

  return {
    sleep:      avg('Sleep (hrs)'),
    steps:      avg('Steps'),
    hydration:  avg('Hydration (L)'),
    stress:     avg('Stress RPE (1-10)'),
    mood:       avg('Mood (1-10)'),
    energy:     avg('Energy (1-10)'),
    completion,
  };
}

// Same threshold logic as WeeklyReportCard getStatus() in App.jsx:
// >= target = green, >= 80% of target = amber, else red; inverted for stress.
function getReportStatus(avg, target, invert) {
  if (avg === null || avg === undefined) return 'none';
  const n = Number(avg), t = Number(target);
  if (isNaN(n) || isNaN(t) || t === 0) return 'none';
  if (invert) return n <= t ? 'green' : n <= t * 1.2 ? 'amber' : 'red';
  return n >= t ? 'green' : n >= t * 0.8 ? 'amber' : 'red';
}

// ─────────────────────────────────────────────────────────────────
// SEND REPORT PANEL — expands inside each check-in row
// ─────────────────────────────────────────────────────────────────
function SendReportPanel({ checkin, logs, targets, clientId, clientName, clientEmail, type }) {
  const [note,   setNote]   = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'error'

  const periodIdentifier = checkin['Submitted At'] || '';
  const avgs = calcPeriodAverages(logs, periodIdentifier);

  const REPORT_HABITS = [
    { key: 'sleep',     label: 'Sleep',     unit: 'h',   invert: false },
    { key: 'steps',     label: 'Steps',     unit: '',    invert: false },
    { key: 'hydration', label: 'Hydration', unit: 'L',   invert: false },
    { key: 'stress',    label: 'Stress',    unit: '/10', invert: true  },
    { key: 'mood',      label: 'Mood',      unit: '/10', invert: false },
    { key: 'energy',    label: 'Energy',    unit: '/10', invert: false },
  ];

  const statusColour = { green: '#22c55e', amber: '#F26419', red: '#ef4444', none: '#64748b' };

  const handleSend = async () => {
    if (!note.trim() || status !== 'idle') return;
    setStatus('sending');
    try {
      await checkinPost({
        action:          'sendReport',
        secret:          COACH_SECRET,
        type,
        clientId,
        clientName,
        clientEmail,
        periodIdentifier,
        reportNote:      note.trim(),
        habitAverages:   avgs,
        targets: {
          sleep:     targets?.sleep,
          steps:     targets?.steps,
          hydration: targets?.hydration,
          stress:    targets?.stress,
          mood:      targets?.mood,
          energy:    targets?.energy,
        },
      });
      setStatus('sent');
    } catch(err) {
      console.error('Send report failed:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const dateLabel = periodIdentifier ? periodIdentifier.split('T')[0] : 'unknown date';

  if (!CHECKIN_SCRIPT) {
    return (
      <div style={{ marginTop: 12, borderTop: '1px solid #2a3a4a', paddingTop: 12 }}>
        <p style={S.errorMsg}>
          ⚠ VITE_CHECKIN_SCRIPT_URL is not set. Add it to your Vercel environment variables and redeploy.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid #2a3a4a', paddingTop: 12 }}>
      {/* Period averages preview */}
      <p style={{ ...S.sectionTitle, marginTop: 0, marginBottom: 10 }}>
        Period averages — 7 days to {dateLabel}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
        {REPORT_HABITS.map(h => {
          const avg    = avgs[h.key];
          const tgt    = targets?.[h.key];
          const st     = getReportStatus(avg, tgt, h.invert);
          const col    = statusColour[st];
          const display = avg !== null
            ? (h.key === 'steps' ? Math.round(avg).toLocaleString() : avg) + h.unit
            : '—';
          return (
            <div key={h.key} style={{ background: '#0f1a24', borderRadius: 6, padding: '8px 6px', textAlign: 'center' }}>
              <div style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900, fontSize: 17, color: col }}>{display}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{h.label}</div>
            </div>
          );
        })}
      </div>

      {/* Note textarea */}
      <label style={{ ...S.fieldLabel, display: 'block', marginBottom: 6 }}>Your note to client</label>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Write your report note for this client..."
        rows={5}
        disabled={status === 'sent'}
        style={{
          ...S.input,
          width: '100%',
          boxSizing: 'border-box',
          resize: 'vertical',
          lineHeight: 1.6,
          opacity: status === 'sent' ? 0.6 : 1,
        }}
      />

      {status === 'error' && (
        <p style={{ ...S.errorMsg, marginTop: 6 }}>
          Send failed — check VITE_CHECKIN_SCRIPT_URL is deployed and the Apps Script is published.
        </p>
      )}

      <button
        onClick={handleSend}
        disabled={!note.trim() || status !== 'idle'}
        style={{
          ...S.btnPrimary,
          marginTop: 10,
          width: '100%',
          opacity: (!note.trim() || status !== 'idle') ? 0.5 : 1,
          cursor:  (!note.trim() || status !== 'idle') ? 'not-allowed' : 'pointer',
          background: status === 'sent' ? '#22c55e' : '#F26419',
          padding: '10px 16px',
          textAlign: 'center',
        }}
      >
        {status === 'idle'    && 'Send Report + Email →'}
        {status === 'sending' && 'Sending…'}
        {status === 'sent'    && '✓ Report Sent'}
        {status === 'error'   && 'Send Report + Email →'}
      </button>

      {status === 'sent' && (
        <p style={{ fontSize: 12, color: '#22c55e', marginTop: 6, textAlign: 'center' }}>
          Logged to Report Log and email sent to {clientEmail || 'client'}.
          Re-open to send a revised version.
        </p>
      )}
    </div>
  );
}

// ── Logs tab: raw log table ───────────────────────────────────────
function LogsTab({ logs }) {
  const sorted = [...logs].sort((a,b) => (b['Date']||b.date||'').localeCompare(a['Date']||a.date||''));
  if (!sorted.length) return <p style={S.emptyText}>No logs yet.</p>;

  const keys = Object.keys(sorted[0]).filter(k => k !== 'clientId');

  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>{keys.map(k => <th key={k} style={S.th}>{k}</th>)}</tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i}>
              {keys.map(k => <td key={k} style={S.td}>{String(row[k] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Check-ins tab ─────────────────────────────────────────────────
function CheckinsTab({ checkins, logs, targets, clientId, clientName, clientEmail }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  const sorted = [...checkins].sort((a, b) =>
    (b['Submitted At'] || b['Date'] || b.date || '').localeCompare(
      a['Submitted At'] || a['Date'] || a.date || ''
    )
  );
  if (!sorted.length) return <p style={S.emptyText}>No check-ins submitted yet.</p>;

  const HIDDEN_KEYS = ['clientId', 'date', 'type', 'Client ID', 'Client Name',
                       'Submitted At', 'clientName', 'Client Email'];

  return (
    <div>
      {sorted.map((c, i) => {
        const type      = (c.type || c['Type'] || 'weekly').toLowerCase();
        const dateLabel = c['Submitted At']
          ? c['Submitted At'].split('T')[0]
          : (c['Date'] || c.date || 'No date');
        const isExpanded = expandedIdx === i;

        return (
          <div key={i} style={S.checkinCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <p style={{ ...S.checkinDate, margin: 0 }}>{dateLabel} · {type}</p>
              <button
                style={{ ...S.btnSecondary, fontSize: 12, padding: '4px 12px' }}
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
              >
                {isExpanded ? 'Close' : 'Send Report'}
              </button>
            </div>

            {Object.entries(c)
              .filter(([k]) => !HIDDEN_KEYS.includes(k))
              .map(([k, v]) => (
                <p key={k} style={S.checkinRow}><strong>{k}:</strong> {String(v)}</p>
              ))
            }

            {isExpanded && (
              <SendReportPanel
                checkin={c}
                logs={logs}
                targets={targets}
                clientId={clientId}
                clientName={clientName}
                clientEmail={clientEmail}
                type={type}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TARGET EDITOR
// ─────────────────────────────────────────────────────────────────
function TargetEditor({ client, onSaved, onCancel }) {
  const [targets, setTargets] = useState({ ...client.targets });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  // FIX: keys match client app DEFAULT_TARGETS exactly
  const ALL_HABIT_OPTIONS = [
    { id: 'sleep',       label: 'Sleep Routine',  icon: '🌙' },
    { id: 'steps',       label: 'Daily Steps',    icon: '👟' },
    { id: 'hydration',   label: 'Hydration',      icon: '💧' },
    { id: 'meals',       label: 'Meal Structure', icon: '🥗' },
    { id: 'mindfulness', label: 'Mindfulness',    icon: '🧠' },
    { id: 'mobility',    label: 'Mobility',       icon: '🧘' },
    { id: 'workout',     label: 'Workout',        icon: '💪' },
    { id: 'breathwork',  label: 'Breathwork',     icon: '🫁' },
    { id: 'pace',        label: 'Pace Points',    icon: '🌡️' },
    { id: 'calories',    label: 'Calories',       icon: '🔥' },
  ];

  const DEFAULT_ACTIVE = ['sleep','steps','hydration','meals','mindfulness'];

  const [activeHabits, setActiveHabits] = useState(() => {
    if (client.targets?.activeHabits) {
      const raw = client.targets.activeHabits;
      return typeof raw === 'string' ? raw.split(',').map(s=>s.trim()).filter(Boolean) : raw;
    }
    return DEFAULT_ACTIVE;
  });

  const toggleHabit = (id) => {
    setActiveHabits(prev =>
      prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]
    );
  };

  const TARGET_FIELDS = [
    { key: 'sleep',       label: 'Sleep target (hrs)',          type: 'number', step: '0.5' },
    { key: 'steps',       label: 'Step target',                 type: 'number', step: '500' },
    { key: 'hydration',   label: 'Daily hydration target (L)',  type: 'number', step: '0.25' },
    { key: 'meals',       label: 'Meal target (per day)',       type: 'number', step: '1'   },
    { key: 'mindfulness', label: 'Mindfulness target (min)',    type: 'number', step: '1'   },
    { key: 'mobility',    label: 'Mobility target (min)',       type: 'number', step: '5'   },
    { key: 'pace',        label: 'Pace Points ceiling (0–100)', type: 'number', step: '1'   },
    { key: 'calories',    label: 'Calorie target (kcal)',       type: 'number', step: '50'  },
    { key: 'stress',      label: 'Stress baseline (1–10)',      type: 'number', step: '1'   },
    { key: 'mood',        label: 'Mood baseline (1–10)',        type: 'number', step: '1'   },
    { key: 'energy',      label: 'Energy baseline (1–10)',      type: 'number', step: '1'   },
    { key: 'digestion',   label: 'Digestion baseline (1–10)',   type: 'number', step: '1'   },
  ];

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      await apiPost({ action: 'updateTargets', clientId: client.clientId, targets: { ...targets, activeHabits: activeHabits.join(',') } });
      onSaved();
    } catch(e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={S.editorShell}>
      <h2 style={S.detailName}>Targets — {client.name}</h2>
      <p style={S.detailMeta}>Changes take effect immediately on the client app.</p>

      <div style={S.fieldGrid}>
        {TARGET_FIELDS.map(({ key, label, type, step }) => (
          <div key={key} style={S.fieldGroup}>
            <label style={S.fieldLabel}>{label}</label>
            <input
              type={type}
              step={step}
              value={targets[key] ?? ''}
              onChange={e => setTargets(t => ({ ...t, [key]: e.target.value }))}
              style={S.input}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, marginBottom: 8 }}>
        <h3 style={{ ...S.sectionTitle, marginBottom: 4 }}>Active Habits</h3>
        <p style={{ ...S.detailMeta, marginBottom: 16 }}>Toggle which habits appear in this client's daily log.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ALL_HABIT_OPTIONS.map(h => {
            const on = activeHabits.includes(h.id);
            return (
              <button
                key={h.id}
                onClick={() => toggleHabit(h.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: on ? '#fff7ed' : '#f9fafb',
                  border: `1.5px solid ${on ? '#f97316' : '#e5e7eb'}`,
                  borderRadius: 8, padding: '12px 14px',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
              >
                <span style={{ fontSize: 20 }}>{h.icon}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 15, color: on ? '#1C2B3A' : '#9ca3af' }}>{h.label}</span>
                <span style={{
                  background: on ? '#f97316' : '#e5e7eb',
                  color: on ? '#fff' : '#9ca3af',
                  borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700,
                }}>
                  {on ? 'ON' : 'OFF'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p style={S.errorMsg}>Save failed: {error}</p>}

      <div style={S.editorActions}>
        <button style={S.btnSecondary} onClick={onCancel} disabled={saving}>Cancel</button>
        <button style={S.btnPrimary}   onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save targets'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AUTH STATES
// ─────────────────────────────────────────────────────────────────
function PasswordGate({ onSuccess }) {
  const [input, setInput]   = useState('');
  const [error, setError]   = useState(false);

  const handleSubmit = () => {
    if (input === import.meta.env.VITE_COACH_SECRET) {
      onSuccess();
    } else {
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div style={S.authShell}>
      <span style={S.logo}>EVOLVE<span style={S.logoOrange}>:</span>COACH</span>
      <div style={S.gateBox}>
        <input
          type="password"
          placeholder="Coach password"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{ ...S.input, width: '100%', boxSizing: 'border-box', ...(error ? { borderColor: '#ef4444' } : {}) }}
          autoFocus
        />
        {error && <p style={{ ...S.errorMsg, marginTop: '8px' }}>Incorrect password.</p>}
        <button style={{ ...S.btnPrimary, width: '100%', marginTop: '10px', padding: '12px' }} onClick={handleSubmit}>
          Enter
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// UTILITY COMPONENTS
// ─────────────────────────────────────────────────────────────────
function LoadingState() {
  return <p style={S.loadingText}>Loading…</p>;
}

function ErrorState({ msg, onRetry }) {
  return (
    <div style={S.errorShell}>
      <p style={S.errorMsg}>{msg}</p>
      {onRetry && <button style={S.btnSecondary} onClick={onRetry}>Retry</button>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// STYLES — brand tokens: Navy #1C2B3A | Orange #F26419 | Cream #F0EEF5
// ─────────────────────────────────────────────────────────────────
const S = {
  shell:        { minHeight:'100vh', backgroundColor:'#0f1a24', color:'#F0EEF5', fontFamily:'Barlow, sans-serif' },
  header:       { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', backgroundColor:'#1C2B3A', borderBottom:'2px solid #F26419' },
  headerLeft:   { display:'flex', alignItems:'center', gap:'12px' },
  headerRight:  { display:'flex', alignItems:'center', gap:'8px' },
  logo:         { fontFamily:'"Barlow Condensed", sans-serif', fontWeight:900, fontSize:'20px', letterSpacing:'0.05em', color:'#F0EEF5' },
  logoOrange:   { color:'#F26419' },
  body:         { padding:'20px', maxWidth:'900px', margin:'0 auto' },

  cardGrid:     { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:'16px' },
  card:         { backgroundColor:'#1C2B3A', borderRadius:'10px', padding:'16px', border:'1px solid #2a3a4a' },
  cardFlagged:  { borderColor:'#ef4444', boxShadow:'0 0 0 1px #ef444433' },
  cardTop:      { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' },
  cardName:     { fontFamily:'"Barlow Condensed", sans-serif', fontWeight:700, fontSize:'18px', textTransform:'uppercase' },
  statusBadge:  { fontSize:'20px' },
  cardMeta:     { display:'flex', flexDirection:'column', gap:'2px', marginBottom:'12px' },
  metaItem:     { fontSize:'13px', color:'#94a3b8' },
  metaFlagged:  { color:'#ef4444' },
  cardActions:  { display:'flex', gap:'8px' },

  btnPrimary:   { backgroundColor:'#F26419', color:'#fff', border:'none', borderRadius:'6px', padding:'8px 16px', fontFamily:'Barlow, sans-serif', fontWeight:600, fontSize:'13px', cursor:'pointer' },
  btnSecondary: { backgroundColor:'transparent', color:'#F0EEF5', border:'1px solid #3a4a5a', borderRadius:'6px', padding:'8px 16px', fontFamily:'Barlow, sans-serif', fontWeight:600, fontSize:'13px', cursor:'pointer' },
  backBtn:      { backgroundColor:'transparent', color:'#94a3b8', border:'none', cursor:'pointer', fontFamily:'Barlow, sans-serif', fontSize:'14px', padding:'4px 0' },
  filterBtn:    { backgroundColor:'transparent', color:'#94a3b8', border:'1px solid #3a4a5a', borderRadius:'6px', padding:'6px 12px', fontFamily:'Barlow, sans-serif', fontSize:'13px', cursor:'pointer' },
  filterBtnActive: { borderColor:'#ef4444', color:'#ef4444' },
  refreshBtn:   { backgroundColor:'transparent', color:'#94a3b8', border:'1px solid #3a4a5a', borderRadius:'6px', padding:'6px 12px', fontFamily:'Barlow, sans-serif', fontSize:'13px', cursor:'pointer' },

  detailShell:  { paddingBottom:'40px' },
  detailHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px' },
  detailName:   { fontFamily:'"Barlow Condensed", sans-serif', fontWeight:900, fontSize:'28px', textTransform:'uppercase', margin:'0 0 4px 0' },
  detailMeta:   { fontSize:'13px', color:'#94a3b8', margin:0 },

  tabs:         { display:'flex', gap:'4px', marginBottom:'20px', borderBottom:'1px solid #2a3a4a', paddingBottom:'0' },
  tab:          { backgroundColor:'transparent', color:'#94a3b8', border:'none', borderBottom:'2px solid transparent', padding:'8px 16px', fontFamily:'Barlow, sans-serif', fontWeight:600, fontSize:'14px', cursor:'pointer', marginBottom:'-1px' },
  tabActive:    { color:'#F26419', borderBottomColor:'#F26419' },

  sectionTitle: { fontFamily:'"Barlow Condensed", sans-serif', fontWeight:700, fontSize:'16px', textTransform:'uppercase', letterSpacing:'0.05em', color:'#94a3b8', margin:'20px 0 10px' },

  calGrid:      { display:'grid', gridTemplateColumns:'repeat(10,1fr)', gap:'4px', marginBottom:'8px' },
  calCell:      { height:'24px', borderRadius:'3px' },

  habitGrid:    { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:'12px' },
  habitCard:    { backgroundColor:'#1C2B3A', borderRadius:'8px', padding:'12px' },
  habitLabel:   { fontSize:'12px', color:'#94a3b8', margin:'0 0 4px' },
  habitValue:   { fontFamily:'"Barlow Condensed", sans-serif', fontWeight:700, fontSize:'24px', margin:'0 0 2px' },
  habitTarget:  { fontSize:'11px', color:'#64748b', margin:'0 0 6px' },
  progressBar:  { height:'4px', backgroundColor:'#2a3a4a', borderRadius:'2px', overflow:'hidden' },
  progressFill: { height:'100%', borderRadius:'2px', transition:'width 0.3s' },

  tableWrap:    { overflowX:'auto' },
  table:        { width:'100%', borderCollapse:'collapse', fontSize:'13px' },
  th:           { textAlign:'left', padding:'8px 12px', backgroundColor:'#1C2B3A', color:'#94a3b8', fontWeight:600, whiteSpace:'nowrap', borderBottom:'1px solid #2a3a4a' },
  td:           { padding:'8px 12px', borderBottom:'1px solid #1a2a3a', whiteSpace:'nowrap' },

  checkinCard:  { backgroundColor:'#1C2B3A', borderRadius:'8px', padding:'14px', marginBottom:'10px' },
  checkinDate:  { fontFamily:'"Barlow Condensed", sans-serif', fontWeight:700, fontSize:'15px', margin:'0 0 8px', color:'#F26419' },
  checkinRow:   { fontSize:'13px', margin:'2px 0', color:'#F0EEF5' },

  editorShell:  { maxWidth:'600px' },
  fieldGrid:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', margin:'20px 0' },
  fieldGroup:   { display:'flex', flexDirection:'column', gap:'4px' },
  fieldLabel:   { fontSize:'12px', color:'#94a3b8', fontWeight:600 },
  input:        { backgroundColor:'#1C2B3A', border:'1px solid #2a3a4a', borderRadius:'6px', padding:'8px 12px', color:'#F0EEF5', fontFamily:'Barlow, sans-serif', fontSize:'14px', outline:'none' },
  editorActions:{ display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'20px' },

  authShell:    { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:'16px' },
  authText:     { color:'#94a3b8', fontSize:'14px', textAlign:'center' },
  gateBox:      { width:'100%', maxWidth:'320px', display:'flex', flexDirection:'column' },

  empty:        { textAlign:'center', padding:'60px 20px' },
  emptyText:    { color:'#94a3b8', fontSize:'16px', margin:'0 0 8px' },
  emptyHint:    { color:'#64748b', fontSize:'13px', margin:0 },
  loadingText:  { color:'#94a3b8', textAlign:'center', padding:'60px', fontSize:'16px' },
  errorShell:   { textAlign:'center', padding:'40px 20px' },
  errorMsg:     { color:'#ef4444', fontSize:'14px', margin:'0 0 12px' },
};
