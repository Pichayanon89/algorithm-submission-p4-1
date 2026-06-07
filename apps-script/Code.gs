const DEFAULT_FOLDER_ID = '1gksEfcJGqgyHpC4zYco_ySL25vX7COIS';

function doPost(e) {
  try {
    const payloadText = e.parameter.payload || e.postData.contents || '{}';
    const payload = JSON.parse(payloadText);
    const folderId = payload.folderId || DEFAULT_FOLDER_ID;
    const folder = DriveApp.getFolderById(folderId);
    const studentNo = sanitizeName(payload.studentNo || 'ไม่ระบุเลขที่');
    const studentName = sanitizeName(payload.studentName || 'ไม่ระบุชื่อ');
    const originalName = sanitizeName(payload.filename || 'video.mp4');
    const mimeType = payload.mimeType || 'video/mp4';

    if (!payload.data) {
      throw new Error('ไม่พบข้อมูลไฟล์วิดีโอ');
    }

    const bytes = Utilities.base64Decode(payload.data);
    const filename = `${padNo(studentNo)}_${studentName}_${new Date().getTime()}_${originalName}`;
    const blob = Utilities.newBlob(bytes, mimeType, filename);
    const file = folder.createFile(blob);

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return htmlMessage({
      ok: true,
      id: file.getId(),
      name: file.getName(),
      url: file.getUrl(),
      previewUrl: `https://drive.google.com/file/d/${file.getId()}/preview`,
    });
  } catch (error) {
    return htmlMessage({
      ok: false,
      error: error.message || String(error),
    });
  }
}

function doGet() {
  return jsonOutput({
    ok: true,
    message: 'P4/1 video upload endpoint is ready.',
  });
}

function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function htmlMessage(data) {
  const safeJson = JSON.stringify(data).replace(/</g, '\\u003c');
  return HtmlService
    .createHtmlOutput(`
      <!doctype html>
      <html>
        <body>
          <script>
            window.parent.postMessage({
              type: 'p4-1-upload-result',
              result: ${safeJson}
            }, '*');
          </script>
        </body>
      </html>
    `)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function sanitizeName(value) {
  return String(value)
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function padNo(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return sanitizeName(value);
  return String(number).padStart(2, '0');
}
