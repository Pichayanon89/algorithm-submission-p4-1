const API_ENDPOINT = "https://script.google.com/macros/s/AKfycbzCJb7ZIyPJXsJ4YK8Fzp_TjxdeLPnSwSTzocdsyFpc_yIEzNsOn2gd-1zHckfW7tDw/exec";
const TEACHER_PASSWORD = "mep412569";
const STORAGE_KEY = "p4_1_algorithm_submissions_clean_v2";
const TEACHER_AUTH_KEY = "p4_1_teacher_dashboard_unlocked";

const initialStudents = [];

let submissions = loadSubmissions();
let selectedNo = submissions.find((item) => item.link)?.no ?? null;

const form = document.querySelector("#submissionForm");
const studentNo = document.querySelector("#studentNo");
const studentName = document.querySelector("#studentName");
const driveLink = document.querySelector("#driveLink");
const note = document.querySelector("#note");
const searchInput = document.querySelector("#searchInput");
const statusFilter = document.querySelector("#statusFilter");
const tableBody = document.querySelector("#submissionsTable");
const refreshButton = document.querySelector("#refreshButton");
const exportButton = document.querySelector("#exportButton");
const presentButton = document.querySelector("#presentButton");
const openDriveButton = document.querySelector("#openDriveButton");
const previewMedia = document.querySelector("#previewMedia");
const publicSubmittedList = document.querySelector("#publicSubmittedList");
const teacherLogin = document.querySelector("#teacherLogin");
const teacherDashboard = document.querySelector("#teacherDashboard");
const teacherLoginForm = document.querySelector("#teacherLoginForm");
const teacherPassword = document.querySelector("#teacherPassword");
const teacherLoginError = document.querySelector("#teacherLoginError");
const lockDashboardButton = document.querySelector("#lockDashboardButton");

searchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);
refreshButton.addEventListener("click", () => {
  refreshButton.disabled = true;
  loadRemoteSubmissions().finally(() => {
    refreshButton.disabled = false;
  });
});
exportButton.addEventListener("click", exportCsv);
teacherLoginForm.addEventListener("submit", handleTeacherLogin);
lockDashboardButton.addEventListener("click", lockTeacherDashboard);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector(".primary-button");
  button.disabled = true;
  button.textContent = "กำลังส่งงาน...";

  try {
    const no = Number.parseInt(studentNo.value.trim(), 10);
    if (!Number.isFinite(no)) {
      throw new Error("กรุณากรอกเลขที่เป็นตัวเลข");
    }

    const finalLink = driveLink.value.trim();

    const result = await postToAppsScript({
      action: "submit",
      studentNo: no,
      studentName: studentName.value.trim(),
      link: finalLink,
      note: note.value.trim(),
    });

    if (!result.ok) {
      throw new Error(result.error || "ส่งงานไม่สำเร็จ กรุณาลองใหม่");
    }

    if (Array.isArray(result.submissions)) {
      submissions = normalizeSubmissions(result.submissions);
      saveSubmissions();
    } else {
      upsertSubmission({
      no,
      name: studentName.value.trim(),
      status: "submitted",
      submittedAt: formatThaiDate(new Date()),
      link: finalLink,
      note: note.value.trim(),
      });
    }

    selectedNo = no;
    form.reset();
    render();
    alert("ส่งงานเรียบร้อยแล้วครับ");
  } catch (error) {
    alert(error.message);
  } finally {
    button.disabled = false;
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>ส่งงาน';
  }
});

presentButton.addEventListener("click", async () => {
  const item = submissions.find((entry) => entry.no === selectedNo);
  if (!item || !item.link) return;

  presentButton.disabled = true;
  try {
    const result = await postToAppsScript({
      action: "presented",
      studentNo: selectedNo,
    });

    if (!result.ok) {
      throw new Error(result.error || "อัปเดตสถานะไม่สำเร็จ");
    }

    if (Array.isArray(result.submissions)) {
      submissions = normalizeSubmissions(result.submissions);
      saveSubmissions();
    } else {
      item.status = "presented";
      item.presentedAt = formatThaiDate(new Date());
      saveSubmissions();
    }
    render();
  } catch (error) {
    alert(error.message);
  } finally {
    presentButton.disabled = submissions.find((entry) => entry.no === selectedNo)?.status === "presented";
  }
});

function upsertSubmission(entry) {
  const index = submissions.findIndex((item) => item.no === entry.no);
  if (index >= 0) {
    submissions[index] = { ...submissions[index], ...entry };
  } else {
    submissions.push(entry);
  }
  submissions.sort((a, b) => a.no - b.no);
  saveSubmissions();
}

function render() {
  renderPublicSubmittedList();
  renderSummary();
  renderTable();
  renderPreview();
}

function loadRemoteSubmissions() {
  return new Promise((resolve) => {
    const callbackName = `p41Submissions_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const script = document.createElement("script");
    const cleanup = () => {
      delete window[callbackName];
      script.remove();
    };

    window[callbackName] = (result) => {
      cleanup();
      if (result?.ok && Array.isArray(result.submissions)) {
        submissions = normalizeSubmissions(result.submissions);
        selectedNo = submissions.find((item) => item.no === selectedNo)?.no ?? submissions.find((item) => item.link)?.no ?? null;
        saveSubmissions();
      }
      render();
      resolve(result);
    };

    script.onerror = () => {
      cleanup();
      render();
      resolve({ ok: false, error: "ไม่สามารถโหลดข้อมูลจาก Google Sheet ได้" });
    };

    script.src = `${API_ENDPOINT}?action=list&callback=${encodeURIComponent(callbackName)}&ts=${Date.now()}`;
    document.body.append(script);
  });
}

function postToAppsScript(payload) {
  return new Promise((resolve, reject) => {
    const iframeName = `apps_script_frame_${Date.now()}`;
    const iframe = document.createElement("iframe");
    iframe.name = iframeName;
    iframe.hidden = true;

    const formElement = document.createElement("form");
    formElement.method = "POST";
    formElement.action = API_ENDPOINT;
    formElement.target = iframeName;
    formElement.hidden = true;

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "payload";
    input.value = JSON.stringify(payload);
    formElement.append(input);

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("ระบบบันทึกข้อมูลใช้เวลานานเกินไป กรุณาลองใหม่"));
    }, 30000);

    const onMessage = (event) => {
      if (event.data?.type !== "p4-1-api-result") return;
      cleanup();
      resolve(event.data.result || { ok: false, error: "ไม่พบผลลัพธ์จากระบบ" });
    };

    const cleanup = () => {
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      iframe.remove();
      formElement.remove();
    };

    window.addEventListener("message", onMessage);
    document.body.append(iframe, formElement);
    formElement.submit();
  });
}

function normalizeSubmissions(rows) {
  return rows
    .map((item) => ({
      no: Number.parseInt(item.no ?? item.studentNo, 10),
      name: String(item.name ?? item.studentName ?? "").trim(),
      status: item.status || "submitted",
      submittedAt: item.submittedAt || "",
      link: item.link || "",
      note: item.note || "",
      presentedAt: item.presentedAt || "",
    }))
    .filter((item) => Number.isFinite(item.no) && item.name)
    .sort((a, b) => a.no - b.no);
}

function renderPublicSubmittedList() {
  const rows = submissions
    .filter((item) => item.status === "submitted" || item.status === "presented")
    .sort((a, b) => a.no - b.no);

  if (!rows.length) {
    publicSubmittedList.innerHTML = '<p class="public-empty">ยังไม่มีนักเรียนส่งงาน</p>';
    return;
  }

  publicSubmittedList.innerHTML = rows.map((item) => `
    <article class="public-submitted-item">
      <span class="public-no">เลขที่ ${item.no}</span>
      <strong>${escapeHtml(item.name)}</strong>
      ${statusChip(item.status)}
    </article>
  `).join("");
}

function handleTeacherLogin(event) {
  event.preventDefault();
  if (teacherPassword.value.trim() !== TEACHER_PASSWORD) {
    teacherLoginError.textContent = "รหัสผ่านไม่ถูกต้อง";
    teacherPassword.select();
    return;
  }

  teacherLoginError.textContent = "";
  teacherPassword.value = "";
  sessionStorage.setItem(TEACHER_AUTH_KEY, "true");
  setTeacherDashboardAccess(true);
}

function lockTeacherDashboard() {
  sessionStorage.removeItem(TEACHER_AUTH_KEY);
  setTeacherDashboardAccess(false);
}

function setTeacherDashboardAccess(unlocked) {
  teacherLogin.hidden = unlocked;
  teacherDashboard.hidden = !unlocked;
  if (unlocked) {
    render();
  } else {
    teacherPassword.focus();
  }
}

function renderSummary() {
  document.querySelector("#totalCount").textContent = submissions.length;
  document.querySelector("#submittedCount").textContent = submissions.filter((item) => item.status === "submitted" || item.status === "presented").length;
  document.querySelector("#pendingCount").textContent = submissions.filter((item) => item.status === "pending").length;
  document.querySelector("#presentedCount").textContent = submissions.filter((item) => item.status === "presented").length;
}

function renderTable() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const rows = submissions.filter((item) => {
    const matchesQuery = !query || String(item.no).includes(query) || item.name.toLowerCase().includes(query);
    const matchesStatus = status === "all" || item.status === status || (status === "submitted" && item.status === "presented");
    return matchesQuery && matchesStatus;
  });

  tableBody.innerHTML = "";
  if (!rows.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td class="empty-row" colspan="6">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</td>';
    tableBody.append(row);
    return;
  }

  for (const item of rows) {
    const row = document.createElement("tr");
    row.classList.toggle("selected", item.no === selectedNo);
    row.innerHTML = `
      <td>${item.no}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${statusChip(item.status)}</td>
      <td>${escapeHtml(item.submittedAt || "-")}</td>
      <td>${item.link ? driveIcon() : "-"}</td>
      <td>
        ${item.link ? '<button class="table-action" type="button" title="ดูคลิป"><svg viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>' : "-"}
      </td>
    `;
    row.addEventListener("click", () => {
      selectedNo = item.no;
      render();
    });
    tableBody.append(row);
  }
}

function renderPreview() {
  const item = submissions.find((entry) => entry.no === selectedNo);
  document.querySelector("#previewNo").textContent = item?.no ?? "-";
  document.querySelector("#previewName").textContent = item?.name ?? "-";
  document.querySelector("#previewDate").textContent = item?.submittedAt ?? "-";
  document.querySelector("#previewStatus").innerHTML = item ? statusChip(item.status) : '<span class="status-chip muted">ยังไม่ได้เลือก</span>';
  document.querySelector("#previewNote").textContent = item?.note ? `หมายเหตุ: ${item.note}` : "หมายเหตุจะแสดงตรงนี้เมื่อเลือกงานของนักเรียน";

  if (item?.link) {
    const embedUrl = toDriveEmbedUrl(item.link);
    previewMedia.innerHTML = embedUrl
      ? `<iframe src="${embedUrl}" allow="autoplay; fullscreen" allowfullscreen title="ตัวอย่างคลิปของ ${escapeHtml(item.name)}"></iframe>`
      : `<div class="placeholder-video"><svg viewBox="0 0 24 24"><path d="m10 8 6 4-6 4V8Z"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg><p>คลิปนี้ต้องเปิดจากลิงก์ภายนอก</p></div>`;
    openDriveButton.href = item.link;
    openDriveButton.classList.remove("disabled");
    presentButton.disabled = item.status === "presented";
  } else {
    previewMedia.innerHTML = `<div class="placeholder-video"><svg viewBox="0 0 24 24"><path d="m10 8 6 4-6 4V8Z"/><rect x="3" y="5" width="18" height="14" rx="2"/></svg><p>เลือกนักเรียนที่ส่งงานแล้วเพื่อเปิดคลิปนำเสนอในห้อง</p></div>`;
    openDriveButton.href = "#";
    openDriveButton.classList.add("disabled");
    presentButton.disabled = true;
  }
}

function statusChip(status) {
  const label = status === "presented" ? "นำเสนอแล้ว" : status === "pending" ? "ยังไม่ส่ง" : "ส่งแล้ว";
  const className = status === "presented" ? "presented" : status === "pending" ? "pending" : "";
  return `<span class="status-chip ${className}">${label}</span>`;
}

function driveIcon() {
  return '<svg style="color:#0f9d58" viewBox="0 0 24 24" aria-label="มีลิงก์คลิป"><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1"/></svg>';
}

function toDriveEmbedUrl(url) {
  const match = url.match(/\/file\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
  return match && match[1].length >= 20 ? `https://drive.google.com/file/d/${match[1]}/preview` : "";
}

function formatThaiDate(date) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function exportCsv() {
  const header = ["เลขที่", "ชื่อ-สกุล", "สถานะ", "วันที่ส่ง", "ลิงก์", "หมายเหตุ"];
  const rows = submissions.map((item) => [item.no, item.name, statusText(item.status), item.submittedAt, item.link, item.note || ""]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "submission-p4-1.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function statusText(status) {
  return status === "presented" ? "นำเสนอแล้ว" : status === "pending" ? "ยังไม่ส่ง" : "ส่งแล้ว";
}

function loadSubmissions() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? normalizeSubmissions(JSON.parse(saved)) : initialStudents;
}

function saveSubmissions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

setTeacherDashboardAccess(sessionStorage.getItem(TEACHER_AUTH_KEY) === "true");
render();
loadRemoteSubmissions();
