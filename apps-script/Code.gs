const SPREADSHEET_ID = '1p4syLunOnujH1OOmBwNZKXTTV9f0Org9oTpAv0lQ9No';
const SHEET_HEADERS = ['เลขที่', 'ชื่อ-สกุล', 'สถานะ', 'วันที่ส่ง', 'ลิงก์', 'หมายเหตุ', 'วันที่นำเสนอ'];
const MESSAGE_TYPE = 'p4-1-api-result';
const TIMEZONE = 'Asia/Bangkok';

function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action === 'list') {
    return jsonpOrJson_(e, {
      ok: true,
      submissions: readSubmissions_(),
    });
  }

  return jsonOutput_({
    ok: true,
    message: 'P4/1 submission API is ready.',
  });
}

function doPost(e) {
  try {
    const payloadText = (e && e.parameter && e.parameter.payload) || (e && e.postData && e.postData.contents) || '{}';
    const payload = JSON.parse(payloadText);
    const action = payload.action || 'submit';

    if (action === 'submit') {
      upsertSubmission_(payload);
    } else if (action === 'presented') {
      markPresented_(payload.studentNo);
    } else {
      throw new Error('ไม่รู้จักคำสั่งที่ส่งมา');
    }

    return htmlMessage_({
      ok: true,
      submissions: readSubmissions_(),
    });
  } catch (error) {
    return htmlMessage_({
      ok: false,
      error: error.message || String(error),
    });
  }
}

function authorizeSheets() {
  return readSubmissions_().length;
}

function upsertSubmission_(payload) {
  const no = String(payload.studentNo || '').trim();
  const name = String(payload.studentName || '').trim();
  const link = String(payload.link || '').trim();
  const note = String(payload.note || '').trim();

  if (!no) throw new Error('กรุณากรอกเลขที่');
  if (!name) throw new Error('กรุณากรอกชื่อ-สกุล');
  if (!link) throw new Error('กรุณาวางลิงก์คลิป');

  const sheet = getSubmissionSheet_();
  const row = findRowByNo_(sheet, no);
  const values = [no, name, 'submitted', formatDate_(new Date()), link, note, ''];

  if (row) {
    sheet.getRange(row, 1, 1, SHEET_HEADERS.length).setValues([values]);
  } else {
    sheet.appendRow(values);
  }
}

function markPresented_(studentNo) {
  const no = String(studentNo || '').trim();
  if (!no) throw new Error('ไม่พบเลขที่นักเรียน');

  const sheet = getSubmissionSheet_();
  const row = findRowByNo_(sheet, no);
  if (!row) throw new Error('ไม่พบงานของนักเรียนเลขที่นี้');

  sheet.getRange(row, 3).setValue('presented');
  sheet.getRange(row, 7).setValue(formatDate_(new Date()));
}

function readSubmissions_() {
  const sheet = getSubmissionSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet
    .getRange(2, 1, lastRow - 1, SHEET_HEADERS.length)
    .getValues()
    .map((row) => ({
      no: row[0],
      name: row[1],
      status: row[2] || 'submitted',
      submittedAt: row[3],
      link: row[4],
      note: row[5],
      presentedAt: row[6],
    }))
    .filter((item) => item.no && item.name)
    .sort((a, b) => Number(a.no) - Number(b.no));
}

function getSubmissionSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheets()[0];
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
  const current = headerRange.getValues()[0];
  const hasAnyHeader = current.some((value) => String(value || '').trim());

  if (!hasAnyHeader) {
    headerRange.setValues([SHEET_HEADERS]);
    sheet.setFrozenRows(1);
    return;
  }

  const next = SHEET_HEADERS.map((header, index) => current[index] || header);
  headerRange.setValues([next]);
  sheet.setFrozenRows(1);
}

function findRowByNo_(sheet, no) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const index = values.findIndex((row) => String(row[0]).trim() === String(no).trim());
  return index >= 0 ? index + 2 : 0;
}

function formatDate_(date) {
  return Utilities.formatDate(date, TIMEZONE, 'dd/MM/yyyy HH:mm');
}

function jsonpOrJson_(e, data) {
  const callback = e && e.parameter && e.parameter.callback;
  if (callback && /^[A-Za-z0-9_.$]+$/.test(callback)) {
    return ContentService
      .createTextOutput(`${callback}(${JSON.stringify(data)});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return jsonOutput_(data);
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function htmlMessage_(data) {
  const safeJson = JSON.stringify(data).replace(/</g, '\\u003c');
  return HtmlService
    .createHtmlOutput(`
      <!doctype html>
      <html>
        <body>
          <script>
            window.parent.postMessage({
              type: '${MESSAGE_TYPE}',
              result: ${safeJson}
            }, '*');
          </script>
        </body>
      </html>
    `)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
