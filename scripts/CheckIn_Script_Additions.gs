// ═══════════════════════════════════════════════════════════════════════
// CHECK-IN SCRIPT ADDITIONS — Coach Report feature
// Paste each section into your Check-In Apps Script in the indicated position.
// Do NOT replace existing functions — these are additions only.
// ═══════════════════════════════════════════════════════════════════════


// ── SECTION 1: Add near the top of the script, alongside CHECKIN_SHEET_ID ──
// ⚠ ASK KATH: Replace the placeholder with the actual COACH_SECRET value.
//   It must match the VITE_COACH_SECRET value you have set in Vercel.
const COACH_SECRET = 'REPLACE_WITH_YOUR_COACH_SECRET';

const REPORT_LOG_SHEET_NAME = '📨 Report Log';


// ── SECTION 2: Add this helper (only if one does not already exist) ────
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ── SECTION 3: Add a doGet function (the script currently has none) ────
function doGet(e) {
  const action = e.parameter.action;
  if (action === 'getLatestReport') return handleGetLatestReport(e);
  return jsonResponse({ error: 'Unknown action' });
}


// ── SECTION 4: Extend doPost to route the new action ──────────────────
// Inside your existing doPost, add this BEFORE the default error/return:
//
//   if (data.action === 'sendReport') return handleSendReport(e);
//
// For example your doPost probably looks like:
//
//   function doPost(e) {
//     const data = JSON.parse(e.postData.contents);
//     if (data.type === 'weekly')  return writeWeeklyCheckIn(e);
//     if (data.type === 'monthly') return writeMonthlyCheckIn(e);
//     // ← ADD THIS LINE:
//     if (data.action === 'sendReport') return handleSendReport(e);
//     return jsonResponse({ error: 'Unknown action' });
//   }


// ── SECTION 5: New functions — paste anywhere in the script ───────────

function getOrCreateReportLogSheet(ss) {
  let sheet = ss.getSheetByName(REPORT_LOG_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(REPORT_LOG_SHEET_NAME);
    sheet.appendRow([
      'Sent At', 'Type', 'Client ID', 'Client Name', 'Period Identifier',
      'Report Note', 'Sleep Avg', 'Steps Avg', 'Hydration Avg',
      'Stress Avg', 'Mood Avg', 'Energy Avg', 'Completion Avg'
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function handleGetLatestReport(e) {
  const clientId = e.parameter.clientId;
  const type     = e.parameter.type;
  if (!clientId || !type) return jsonResponse({ error: 'Missing clientId or type' });

  const ss    = SpreadsheetApp.openById(CHECKIN_SHEET_ID);
  const sheet = getOrCreateReportLogSheet(ss);
  const rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return jsonResponse({ report: null });

  const headers = rows[0];
  const idx = {};
  headers.forEach(function(h, i) { idx[h] = i; });

  var best = null;
  for (var r = 1; r < rows.length; r++) {
    var row = rows[r];
    if (String(row[idx['Client ID']]).trim() !== String(clientId).trim()) continue;
    if (String(row[idx['Type']]).toLowerCase() !== String(type).toLowerCase()) continue;
    if (!best || String(row[idx['Sent At']]) > String(best[idx['Sent At']])) {
      best = row;
    }
  }
  if (!best) return jsonResponse({ report: null });

  var report = {};
  headers.forEach(function(h, i) { report[h] = best[i]; });
  return jsonResponse({ report: report });
}

function handleSendReport(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch(err) {
    return jsonResponse({ error: 'Invalid JSON body' });
  }

  if (data.secret !== COACH_SECRET) return jsonResponse({ error: 'Unauthorized' });

  var type             = data.type;
  var clientId         = data.clientId;
  var clientName       = data.clientName;
  var clientEmail      = data.clientEmail;
  var periodIdentifier = data.periodIdentifier;
  var reportNote       = data.reportNote;
  var avgs             = data.habitAverages || {};
  var targets          = data.targets || {};

  var ss    = SpreadsheetApp.openById(CHECKIN_SHEET_ID);
  var sheet = getOrCreateReportLogSheet(ss);

  sheet.appendRow([
    new Date().toISOString(),
    type,
    clientId,
    clientName,
    periodIdentifier,
    reportNote,
    avgs.sleep       != null ? avgs.sleep       : '',
    avgs.steps       != null ? avgs.steps       : '',
    avgs.hydration   != null ? avgs.hydration   : '',
    avgs.stress      != null ? avgs.stress      : '',
    avgs.mood        != null ? avgs.mood        : '',
    avgs.energy      != null ? avgs.energy      : '',
    avgs.completion  != null ? avgs.completion  : '',
  ]);

  if (clientEmail) {
    sendReportEmail({
      type: type,
      clientName: clientName,
      clientEmail: clientEmail,
      reportNote: reportNote,
      habitAverages: avgs,
      targets: targets,
      periodIdentifier: periodIdentifier,
    });
  }

  return jsonResponse({ success: true });
}

function sendReportEmail(params) {
  var type             = params.type;
  var clientName       = params.clientName;
  var clientEmail      = params.clientEmail;
  var reportNote       = params.reportNote;
  var avgs             = params.habitAverages;
  var targets          = params.targets;
  var periodIdentifier = params.periodIdentifier;

  var firstName = clientName ? clientName.split(' ')[0] : 'there';
  var submittedAt = periodIdentifier ? new Date(periodIdentifier) : new Date();

  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

  var subject, dateRange, bodyHeading;
  if (type === 'monthly') {
    var monthName   = MONTHS[submittedAt.getMonth()] + ' ' + submittedAt.getFullYear();
    subject         = 'Your Monthly Report — ' + monthName + ', ' + firstName;
    dateRange       = monthName;
    bodyHeading     = 'Your Monthly Report';
  } else {
    var dateTo   = new Date(submittedAt);
    var dateFrom = new Date(submittedAt);
    dateFrom.setDate(dateTo.getDate() - 6);
    var fmtShort = function(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()]; };
    var fromStr  = fmtShort(dateFrom);
    var toStr    = fmtShort(dateTo);
    subject      = 'Your Weekly Report — Week of ' + fromStr + ' to ' + toStr + ', ' + firstName;
    dateRange    = fromStr + ' – ' + toStr;
    bodyHeading  = 'Your Weekly Report';
  }

  // colour-code averages using same thresholds as the in-app WeeklyReportCard
  var getStatus = function(avg, target, invert) {
    if (avg == null || avg === '' || isNaN(parseFloat(avg))) return 'none';
    var n = parseFloat(avg), t = parseFloat(target);
    if (isNaN(t)) return 'none';
    if (invert) return n <= t ? 'green' : n <= t * 1.2 ? 'amber' : 'red';
    return n >= t ? 'green' : n >= t * 0.8 ? 'amber' : 'red';
  };

  var colourMap = { green: '#2e7d32', amber: '#e65100', red: '#c62828', none: '#718096' };
  var bgMap     = { green: '#e8f5e9', amber: '#fff3e0', red: '#ffebee', none: '#f7f7f7' };

  var habitDefs = [
    { key: 'sleep',     label: 'Sleep',     unit: 'h',   targetKey: 'sleep',     invert: false },
    { key: 'steps',     label: 'Steps',     unit: '',    targetKey: 'steps',     invert: false },
    { key: 'hydration', label: 'Hydration', unit: 'L',   targetKey: 'hydration', invert: false },
    { key: 'stress',    label: 'Stress',    unit: '/10', targetKey: 'stress',    invert: true  },
    { key: 'mood',      label: 'Mood',      unit: '/10', targetKey: 'mood',      invert: false },
    { key: 'energy',    label: 'Energy',    unit: '/10', targetKey: 'energy',    invert: false },
  ];

  var habitCells = habitDefs.map(function(h) {
    var avg    = avgs[h.key];
    var target = targets[h.targetKey];
    var status = getStatus(avg, target, h.invert);
    var colour = colourMap[status];
    var bg     = bgMap[status];
    var displayVal;
    if (avg != null && avg !== '') {
      var n = parseFloat(avg);
      if (h.key === 'steps') {
        displayVal = Math.round(n).toLocaleString() + h.unit;
      } else {
        displayVal = n.toFixed(1) + h.unit;
      }
    } else {
      displayVal = '—';
    }
    var targetLine = target != null
      ? '<div style="font-size:11px;color:#aaa;margin-top:1px;">target: ' + target + h.unit + '</div>'
      : '';
    return '<td style="padding:10px 6px;text-align:center;background:' + bg + ';border-radius:6px;">'
      + '<div style="font-family:Arial,sans-serif;font-weight:900;font-size:20px;color:' + colour + ';">' + displayVal + '</div>'
      + '<div style="font-size:12px;color:#718096;margin-top:3px;">' + h.label + '</div>'
      + targetLine
      + '</td>';
  }).join('');

  var escapedNote = String(reportNote).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');

  var html = '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">'
    + '<tr><td align="center">'
    + '<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;">'

    + '<tr><td style="background:#1C2B3A;padding:28px 32px;">'
    + '<div style="font-family:Arial,sans-serif;font-weight:900;font-size:26px;letter-spacing:3px;color:#ffffff;">EVOLVE<span style="color:#F26419;">:</span>HUMAN</div>'
    + '<div style="font-family:Arial,sans-serif;font-weight:700;font-size:18px;color:rgba(255,255,255,0.75);margin-top:6px;text-transform:uppercase;letter-spacing:2px;">' + bodyHeading + '</div>'
    + '</td></tr>'

    + '<tr><td style="background:#F0EEF5;padding:32px;">'
    + '<p style="font-size:17px;color:#2d3748;margin:0 0 6px;">Hi ' + firstName + ',</p>'
    + '<p style="font-size:16px;color:#4a5568;margin:0 0 24px;">Here\'s your summary for ' + dateRange + '.</p>'

    + '<table width="100%" cellspacing="6" cellpadding="0" style="margin-bottom:24px;"><tr>' + habitCells + '</tr></table>'

    + '<div style="border-top:1px solid rgba(28,43,58,0.15);margin:24px 0;text-align:center;color:#94a3b8;font-size:13px;letter-spacing:4px;">— — —</div>'

    + '<div style="font-family:Arial,sans-serif;font-weight:700;font-size:14px;color:#1C2B3A;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">A note from your coach:</div>'
    + '<div style="font-size:16px;color:#2d3748;line-height:1.7;">' + escapedNote + '</div>'

    + '<div style="border-top:1px solid rgba(28,43,58,0.15);margin:24px 0;text-align:center;color:#94a3b8;font-size:13px;letter-spacing:4px;">— — —</div>'

    + '<p style="font-size:16px;color:#2d3748;margin:0;">Kath<br>'
    + '<span style="font-family:Arial,sans-serif;font-weight:700;font-size:14px;color:#F26419;text-transform:uppercase;letter-spacing:2px;">Evolve:Human</span></p>'

    + '</td></tr>'
    + '</table></td></tr></table>'
    + '</body></html>';

  MailApp.sendEmail({
    to:       clientEmail,
    subject:  subject,
    htmlBody: html,
  });
}


// ── SECTION 6: Test function (matches existing test*Post() pattern) ───
function testSendReport() {
  var mockE = {
    postData: {
      contents: JSON.stringify({
        action:          'sendReport',
        secret:          COACH_SECRET,
        type:            'weekly',
        clientId:        'test-client',
        clientName:      'Test Client',
        clientEmail:     '',  // leave blank to skip actual email during testing
        periodIdentifier: new Date().toISOString(),
        reportNote:      'Great week — really strong consistency on sleep and steps. Keep it up!',
        habitAverages: {
          sleep:      7.2,
          steps:      8500,
          hydration:  2.3,
          stress:     4.1,
          mood:       7.5,
          energy:     7.0,
          completion: 85,
        },
        targets: {
          sleep:      7.5,
          steps:      8000,
          hydration:  2.5,
          stress:     5,
          mood:       6,
          energy:     6,
        },
      }),
    },
  };
  var result = handleSendReport(mockE);
  Logger.log(result.getContent());
}
