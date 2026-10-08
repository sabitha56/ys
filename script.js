/* ---------- Data ---------- */
const jobs = [
  { title: "Software Developer", type: "Full Time", loc: "Chennai", exp: "2+ yrs", desc: "Build and maintain scalable web applications." },
  { title: "Web Designer", type: "Part Time", loc: "Remote", exp: "1+ yrs", desc: "Design responsive, attractive websites." },
  { title: "Data Analyst", type: "Full Time", loc: "Bengaluru", exp: "1+ yrs", desc: "Turn data into insights and dashboards." },
  { title: "HR Executive", type: "Full Time", loc: "Chennai", exp: "0-2 yrs", desc: "Manage recruitment and employee relations." },
  { title: "UI/UX Designer", type: "Remote", loc: "Remote", exp: "2+ yrs", desc: "Create intuitive user experiences and prototypes." }
];
const STATUSES = ["Pending", "Reviewed", "Interview", "Selected", "Rejected"];
const $ = id => document.getElementById(id);

/* ---------- Local Storage helpers ---------- */
const getApps = () => JSON.parse(localStorage.getItem("applications") || "[]");
const saveApps = a => localStorage.setItem("applications", JSON.stringify(a));

/* ---------- Popup Messages ---------- */
function showPopup(title, html) {
  $("modalTitle").textContent = title;
  $("modalBody").innerHTML = html;
  $("modal").classList.remove("hidden");
}
function closePopup() { $("modal").classList.add("hidden"); }
$("modalClose").onclick = closePopup;
$("modal").onclick = e => { if (e.target === $("modal")) closePopup(); };

/* ---------- Login Validation ---------- */
$("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const u = $("username").value.trim(), p = $("password").value;
  const err = $("loginError");
  if (!u || !p) return (err.textContent = "Please enter username and password.");
  if (p.length < 6) return (err.textContent = "Password must be at least 6 characters.");
  if (u === "admin" && p === "admin123") {
    err.textContent = "";
    sessionStorage.setItem("user", u);
    enterSite();
  } else err.textContent = "Invalid username or password.";
});

function enterSite() {
  $("loginPage").classList.add("hidden");
  $("mainSite").classList.remove("hidden");
  $("welcome").textContent = "Welcome back, " + (sessionStorage.getItem("user") || "User") + "!";
  refreshAll();
}
$("logoutBtn").onclick = () => {
  sessionStorage.removeItem("user");
  $("mainSite").classList.add("hidden");
  $("loginPage").classList.remove("hidden");
  $("loginForm").reset();
};

/* Forgot Username / Password popups */
$("forgotUser").onclick = e => {
  e.preventDefault();
  showPopup("Forgot Username", `<label>Registered Email</label><input type="email" id="fuEmail" placeholder="you@example.com">
    <small class="error" id="fuErr"></small><button class="btn" id="fuBtn">Send Username</button>`);
  $("fuBtn").onclick = () => submitRecovery("fuEmail", "fuErr", "Your username has been sent to your email.");
};
$("forgotPass").onclick = e => {
  e.preventDefault();
  showPopup("Forgot Password", `<label>Username</label><input type="text" id="fpUser">
    <label>Registered Email</label><input type="email" id="fpEmail" placeholder="you@example.com">
    <small class="error" id="fpErr"></small><button class="btn" id="fpBtn">Reset Password</button>`);
  $("fpBtn").onclick = () => {
    if (!$("fpUser").value.trim()) return ($("fpErr").textContent = "Enter your username.");
    submitRecovery("fpEmail", "fpErr", "A password reset link has been sent to your email.");
  };
};
function submitRecovery(emailId, errId, okMsg) {
  if (!validEmail($(emailId).value.trim())) return ($(errId).textContent = "Enter a valid email address.");
  showPopup("Success", `<p>${okMsg}</p><p class="muted">(Demo only - no email is actually sent.)</p>`);
}

/* ---------- Validators ---------- */
const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validPhone = v => /^[6-9]\d{9}$/.test(v);

/* ---------- Jobs + Search Filter ---------- */
function renderJobs() {
  const q = $("searchInput").value.trim().toLowerCase();
  const t = $("typeFilter").value;
  const list = jobs.filter(j =>
    (t === "all" || j.type === t) &&
    (j.title + j.desc + j.loc).toLowerCase().includes(q));
  $("jobGrid").innerHTML = list.map(j => `
    <div class="card job">
      <h3>${j.title}</h3>
      <span class="tag">${j.type}</span><span class="tag">${j.loc}</span><span class="tag">${j.exp}</span>
      <p class="muted">${j.desc}</p>
      <button class="btn" onclick="applyFor('${j.title}')">Apply Now</button>
    </div>`).join("");
  $("noJobs").classList.toggle("hidden", list.length > 0);
}
$("searchInput").addEventListener("input", renderJobs);
$("typeFilter").addEventListener("change", renderJobs);

function applyFor(title) {
  $("position").value = title;
  $("apply").scrollIntoView({ behavior: "smooth" });
}
$("position").innerHTML = '<option value="">Select</option>' + jobs.map(j => `<option>${j.title}</option>`).join("");

/* ---------- Apply Form Validation + Save ---------- */
function setErr(id, msg) {
  $(id).parentElement.querySelector(".error").textContent = msg;
  return msg === "";
}
$("applyForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("fullName").value.trim(), email = $("email").value.trim(), phone = $("phone").value.trim();
  const qual = $("qualification").value, exp = $("experience").value, pos = $("position").value;
  const file = $("resume").files[0];
  const checks = [
    setErr("fullName", name.length < 3 ? "Enter your full name (min 3 chars)." : ""),
    setErr("email", validEmail(email) ? "" : "Enter a valid email."),
    setErr("phone", validPhone(phone) ? "" : "Enter a valid 10-digit phone number."),
    setErr("qualification", qual ? "" : "Select your qualification."),
    setErr("experience", exp !== "" && exp >= 0 ? "" : "Enter your experience."),
    setErr("position", pos ? "" : "Select a position."),
    setErr("resume", file ? "" : "Please upload your resume.")
  ];
  if (checks.includes(false)) return;
  const apps = getApps();
  apps.push({
    id: Date.now(), name, email, phone, qual, exp, pos,
    resume: file.name, date: new Date().toLocaleDateString(), status: "Pending"
  });
  saveApps(apps);
  $("applyForm").reset();
  refreshAll();
  showPopup("Application Submitted", `<p>Thank you, <b>${name}</b>! Your application for <b>${pos}</b> has been received.</p>`);
});

/* ---------- Profile, Status, Dashboard ---------- */
function renderProfile() {
  const apps = getApps(), a = apps[apps.length - 1];
  if (!a) return;
  $("avatar").textContent = a.name.charAt(0).toUpperCase();
  $("profileInfo").innerHTML = `
    <h3>${a.name}</h3>
    <p>Email: ${a.email}</p><p>Phone: ${a.phone}</p>
    <p>Qualification: ${a.qual} | Experience: ${a.exp} yrs</p>
    <p>Applied for: <b>${a.pos}</b> | Resume: ${a.resume}</p>`;
}
function renderStatus() {
  const apps = getApps();
  $("statusBody").innerHTML = apps.length ? apps.map((a, i) => `
    <tr><td>${i + 1}</td><td>${a.name}</td><td>${a.pos}</td><td>${a.date}</td>
    <td><select data-id="${a.id}" class="statusSel">
      ${STATUSES.map(s => `<option ${s === a.status ? "selected" : ""}>${s}</option>`).join("")}
    </select> <span class="badge ${a.status}">${a.status}</span></td></tr>`).join("")
    : '<tr><td colspan="5" class="muted">No applications yet.</td></tr>';
  document.querySelectorAll(".statusSel").forEach(sel => sel.onchange = () => {
    const apps = getApps();
    apps.find(x => x.id == sel.dataset.id).status = sel.value;
    saveApps(apps);
    refreshAll();
  });
}
function renderStats() {
  const apps = getApps();
  animateCount("statJobs", jobs.length);
  animateCount("statApps", apps.length);
  animateCount("statInt", apps.filter(a => a.status === "Interview").length);
  animateCount("statSel", apps.filter(a => a.status === "Selected").length);
}
function animateCount(id, target) {
  const el = $(id); let n = 0;
  const step = Math.max(1, Math.ceil(target / 25));
  const t = setInterval(() => {
    n = Math.min(n + step, target);
    el.textContent = n;
    if (n >= target) clearInterval(t);
  }, 30);
}
function refreshAll() { renderJobs(); renderProfile(); renderStatus(); renderStats(); }

/* ---------- Contact Form ---------- */
$("contactForm").addEventListener("submit", e => {
  e.preventDefault();
  if (!$("cName").value.trim() || !validEmail($("cEmail").value.trim()) || !$("cMsg").value.trim())
    return showPopup("Error", "<p>Please fill all fields with a valid email.</p>");
  $("contactForm").reset();
  showPopup("Message Sent", "<p>Thanks for contacting us. We'll reply soon!</p>");
});

/* ---------- Dark Mode ---------- */
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");
$("darkToggle").onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
};

/* ---------- Responsive Nav + Smooth Scrolling ---------- */
$("menuBtn").onclick = () => $("navMenu").classList.toggle("open");
document.querySelectorAll('nav a[href^="#"]').forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    document.querySelector(link.getAttribute("href")).scrollIntoView({ behavior: "smooth" });
    $("navMenu").classList.remove("open");
  });
});

/* ---------- Init ---------- */
if (sessionStorage.getItem("user")) enterSite();
