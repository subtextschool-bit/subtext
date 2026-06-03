diff --git a/subtext (3).js b/subtext (3).js
index 7131cfcb0a98249a14c684c83d609cac9270e255..80ef2871f5ddf0cd8a3d55f9451fe16952caa3c1 100644
--- a/subtext (3).js	
+++ b/subtext (3).js	
@@ -91,50 +91,121 @@ function getCourseMappedValue(source, course, fallback = "") {
 
   return fallback;
 }
 
 function getCourseProgress(course = getCurrentCourse()) {
   const user = cabinetData?.user || {};
   const progressSource = user.progressByCourse || user.progresses || user.courseProgress || user.progress;
   return Math.max(0, Math.min(Number(getCourseMappedValue(progressSource, course, 0)) || 0, 100));
 }
 
 function getCourseRank(course = getCurrentCourse()) {
   const user = cabinetData?.user || {};
   const normalized = normalizeCourseName(course);
   const sources = [user.ranks, user.rankings, user.schoolRanks, user.courseRanks, user.rank];
 
   for (const source of sources) {
     const value = getCourseMappedValue(source, course, "");
     if (value !== undefined && value !== null && value !== "") return value;
   }
 
   if (user[`rank_${normalized}`] !== undefined) return user[`rank_${normalized}`];
   if (user[`schoolRank_${normalized}`] !== undefined) return user[`schoolRank_${normalized}`];
   return "";
 }
 
+
+function getMappedLink(source, course) {
+  if (!source) return "";
+
+  const normalized = normalizeCourseName(course);
+  const readLink = (value) => {
+    if (!value) return "";
+    if (typeof value === "string") return value.trim();
+    if (typeof value !== "object" || Array.isArray(value)) return "";
+    return String(value.link || value.url || value.form || value.formUrl || "").trim();
+  };
+
+  if (Array.isArray(source)) {
+    const item = source.find(entry => normalizeCourseName(entry?.course || entry?.subject || entry?.name || entry?.title) === normalized);
+    return readLink(item);
+  }
+
+  if (typeof source === "object") {
+    const candidates = [course, normalized, `form_${normalized}`, `${normalized}_form`].filter(Boolean);
+    for (const key of candidates) {
+      if (Object.prototype.hasOwnProperty.call(source, key)) {
+        const link = readLink(source[key]);
+        if (link) return link;
+      }
+    }
+  }
+
+  return readLink(source);
+}
+
+function getSubmissionFormLink(course = getCurrentCourse()) {
+  const data = cabinetData || {};
+  const user = data.user || {};
+  const sources = [
+    data.submissionForms,
+    data.formLinks,
+    data.forms,
+    data.courseForms,
+    data.subjectForms,
+    user.submissionForms,
+    user.formLinks,
+    user.forms,
+    user.courseForms,
+    user.subjectForms,
+  ];
+
+  for (const source of sources) {
+    const link = getMappedLink(source, course);
+    if (link) return link;
+  }
+
+  return "";
+}
+
+function renderSubmissionFormLink(course = getCurrentCourse()) {
+  const linkEl = document.getElementById("submission-form-link");
+  const emptyEl = document.getElementById("submission-form-empty");
+  if (!linkEl) return;
+
+  const link = getSubmissionFormLink(course);
+  if (link) {
+    linkEl.href = link;
+    linkEl.classList.remove("hidden");
+    if (emptyEl) emptyEl.classList.add("hidden");
+  } else {
+    linkEl.removeAttribute("href");
+    linkEl.classList.add("hidden");
+    if (emptyEl) emptyEl.classList.remove("hidden");
+  }
+}
+
 function renderCourseProgressMeta(course = getCurrentCourse()) {
   const progressValue = getCourseProgress(course);
   const rankValue = getCourseRank(course);
   const courseLabel = getCourseLabel(course);
 
   setText("progress", progressValue);
   renderProgress(progressValue);
 
   const rankEl = document.getElementById("course-rank");
   if (!rankEl) return;
 
   if (!rankValue) {
     rankEl.textContent = `Рейтинг по предмету «${courseLabel}» пока не указан`;
     return;
   }
 
   const rankText = String(rankValue).trim();
   const looksLikeNumber = /^\d+$/.test(rankText);
   rankEl.innerHTML = looksLikeNumber
     ? `<strong>${escapeHtml(rankText)} место</strong> по школе · ${escapeHtml(courseLabel)}`
     : `${escapeHtml(rankText)} · ${escapeHtml(courseLabel)}`;
 }
 
 function unlockNotificationSound() {
   soundUnlocked = true;
@@ -290,50 +361,51 @@ async function markNotificationsRead() {
 }
 
 
 
 
 // ================= UI =================
 function showSection(sectionId) {
   document.querySelectorAll(".section").forEach(el => el.classList.add("hidden"));
   const el = document.getElementById(sectionId);
   if (el) el.classList.remove("hidden");
   if (sectionId === "schedule") loadSlots();
 }
 
 function confirmBuy(index, name, price) {
   if (confirm(`Хотите купить?\n\n${name}\nЦена: ${price} монет`)) buyItem(index);
 }
 
 function setCourse(course) {
   currentCourse = course;
   window.currentCourse = course;
   const levels = cabinetData?.user?.levels || {};
    setText("level", getCourseMappedValue(levels, course, "—") || "—");
   renderCourseProgressMeta(course);
   renderCourseTabs();
   renderCourseData();
+  renderSubmissionFormLink(course);
 }
 
 function renderCourseTabs() {
   const courses = cabinetData?.user?.courses || [];
   const profile = document.getElementById("profile");
   if (!profile) return;
   let tabs = document.getElementById("course-tabs");
   if (!tabs) {
     tabs = document.createElement("div");
     tabs.id = "course-tabs";
     tabs.style.cssText = "display:flex; gap:8px; margin:10px 0; flex-wrap:wrap; justify-content:center;";
     profile.prepend(tabs);
   }
   if (courses.length <= 1) {
     tabs.innerHTML = "";
     return;
   }
   tabs.innerHTML = courses.map(c => 
     `<button class="buy-btn" style="opacity:${c === getCurrentCourse() ? '1' : '0.5'}" onclick="setCourse('${escapeAttr(c)}')">
           ${escapeHtml(getCourseLabel(c))}
      </button>`
   ).join("");
 }
 
 // ================= LOAD DATA =================
@@ -379,50 +451,51 @@ async function loadCabinet() {
     setText("coins", u.coins || 0);
     renderCourseProgressMeta(currentCourse);
     const lessonLinkEl = document.getElementById("lesson-link");
 
 if (lessonLinkEl) {
   if (u.link) {
     lessonLinkEl.innerHTML = `
       <a href="${u.link}"
          target="_blank"
          rel="noopener"
          class="lesson-btn">
          🎥 Подключиться к занятию
       </a>
     `;
   } else {
     lessonLinkEl.textContent = "Ссылка пока не назначена";
   }
 }
     setText("lesson-schedule", u.schedule || "Не указано");
 
     const avatarImg = document.getElementById("avatar-img");
     if (avatarImg) avatarImg.src = u.avatarUrl || "https://via.placeholder.com/120/2e7d32/FFFFFF?text=👤";
 
     renderCourseTabs();
     renderCourseData();
+    renderSubmissionFormLink(currentCourse);
     renderNotifications(collectNotificationsFromData(data));
  
     document.getElementById("loading")?.classList.add("hidden");
     document.getElementById("main")?.classList.remove("hidden");
     startNotificationsPolling();
   } catch (e) {
     console.error(e);
     setText("loading", `❌ ${e.message}`);
    }
  }
 
 function renderProgress(progress) {
   const progressValue = Math.min(Number(progress) || 0, 100);
   const xpFill = document.getElementById("xp-fill");
   if (!xpFill) return;
   xpFill.style.width = `${progressValue}%`;
   if (progressValue >= 100) {
     xpFill.style.background = "linear-gradient(90deg, gold, orange)";
     xpFill.style.boxShadow = "0 0 18px rgba(255,215,0,.9)";
   } else if (progressValue >= 75) {
     xpFill.style.background = "linear-gradient(90deg, #7b1fa2, #ba68c8)";
     xpFill.style.boxShadow = "0 0 14px rgba(186,104,200,.8)";
   } else {
     xpFill.style.background = "linear-gradient(90deg, #2e7d32, #66bb6a)";
     xpFill.style.boxShadow = "0 0 10px rgba(76,175,80,.6)";
@@ -431,51 +504,50 @@ function renderProgress(progress) {
 
 function renderCourseData() {
   if (!cabinetData) return;
   const course = getCurrentCourse();
   
   const achievements = document.getElementById("achievements-list");
   if (achievements) {
     const list = (cabinetData.achievements || []).filter(a => a.course === course);
     achievements.innerHTML = list.length
       ? list.map(a => `<div style="display:flex;flex-direction:column;align-items:center;width:100px;">
           <div style="width:80px;height:80px;border-radius:50%;overflow:hidden;box-shadow:0 6px 16px rgba(0,0,0,.15);background:#fff;display:flex;align-items:center;justify-content:center;margin-bottom:8px;">
             <img src="${escapeAttr(a.image)}" alt="${escapeAttr(a.title)}" style="width:100%;height:100%;object-fit:cover;">
           </div>
           <div style="font-size:0.8rem;text-align:center;font-weight:600;">${escapeHtml(a.title)}</div>
         </div>`).join("")
       : '<p style="opacity:.6">Пока нет достижений</p>';
   }
 
   const lessons = document.getElementById("lessons-list");
   if (lessons) {
     const list = (cabinetData.lessons || []).filter(l => l.course === course);
     lessons.innerHTML = list.length
       ? list.map(l => `<div class="lesson-card">
           <strong>Урок ${escapeHtml(l.num)}</strong><br>
           <a href="${escapeAttr(l.link)}" target="_blank" rel="noopener">Материалы</a>
-          ${l.hwLink && l.hwLink !== "-" ? `<br><a href="${escapeAttr(l.hwLink)}" target="_blank" rel="noopener">ДЗ</a>` : ""}
         </div>`).join("")
       : "<p>Нет доступных уроков.</p>";
   }
 
   const materials = document.getElementById("materials-list");
   if (materials) {
     const list = (cabinetData.materials || []).filter(m => m.course === course);
     materials.innerHTML = list.length
       ? list.map(m => `<div class="lesson-card">
           <strong>${escapeHtml(m.title)}</strong><br>
           <a href="${escapeAttr(m.link)}" target="_blank" rel="noopener" class="lesson-btn">Открыть</a>
         </div>`).join("")
       : "<p>Материалы пока не добавлены.</p>";
   }
 
   const shop = document.getElementById("shop-items");
   if (shop) {
     const list = (cabinetData.shop || []).filter(s => s.course === course);
     setText("shop-coins", cabinetData.user?.coins || 0);
     shop.innerHTML = list.length
       ? list.map((item, idx) => {
           const realIdx = cabinetData.shop.indexOf(item);
           return `<div class="shop-item">
             ${item.image ? `<div style="height:120px;display:flex;align-items:center;justify-content:center;margin-bottom:.5rem">
               <img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.name)}" style="max-width:100%;max-height:100%;object-fit:contain">

