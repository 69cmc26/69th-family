(() => {
  const intro = document.getElementById("introScreen");
  const status = document.getElementById("introStatus");
  const started = performance.now();
  const minIntroMs = 900;
  const maxIntroMs = 2200;

  function hideIntro() {
    const elapsed = performance.now() - started;
    const wait = Math.max(0, Math.min(minIntroMs - elapsed, maxIntroMs - elapsed));
    window.setTimeout(() => {
      intro?.classList.add("is-hidden");
      window.setTimeout(() => intro?.remove(), 750);
    }, wait);
  }
  if (document.readyState === "complete") hideIntro();
  else window.addEventListener("load", hideIntro, { once: true });
  window.setTimeout(() => {
    if (intro && !intro.classList.contains("is-hidden")) {
      if (status) status.textContent = "Welcome to 69th FAMILY";
      hideIntro();
    }
  }, maxIntroMs);

  const menuToggle = document.getElementById("menuToggle");
  const nav = document.querySelector(".desktop-nav");
  menuToggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
  nav?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }));

  const list = document.getElementById("announcementList");
  const footnote = document.getElementById("updatesFootnote");
  const config = window.FAMILY_CONFIG || {};
  const configured = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }
  function formatDate(value) {
    if (!value) return "BATCH<br>UPDATE";
    const date = new Date(value + (String(value).length === 10 ? "T12:00:00" : ""));
    if (Number.isNaN(date.getTime())) return "BATCH<br>UPDATE";
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).replace(" ", "<br>");
  }
  function renderAnnouncements(rows) {
    if (!rows?.length) {
      list.innerHTML = '<div class="announcement-empty">No announcements published yet. Check back here for batch updates.</div>';
      footnote.textContent = "This noticeboard will update when new announcements are published.";
      return;
    }
    list.innerHTML = rows.map(row => `
      <article class="announcement-item">
        <div class="announcement-date">${formatDate(escapeHTML(row.published_at || row.created_at))}</div>
        <div class="announcement-content"><h3>${escapeHTML(row.title)}</h3><p>${escapeHTML(row.body)}</p></div>
        <span class="announcement-tag">${escapeHTML(row.category || "ANNOUNCEMENT")}</span>
      </article>`).join("");
    footnote.textContent = "Showing the latest published announcements.";
  }

  async function loadAnnouncements() {
    if (!configured) {
      list.innerHTML = '<div class="announcement-empty">The noticeboard is ready. Supabase connection will be enabled during setup.</div>';
      footnote.textContent = "Platform links are available now; live announcements will appear after configuration.";
      return;
    }
    try {
      const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
      const { data, error } = await client.from("family_announcements")
        .select("id,title,body,category,published_at,created_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      renderAnnouncements(data || []);
    } catch (error) {
      console.error("Could not load announcements:", error);
      list.innerHTML = '<div class="announcement-error">Announcements could not load right now. Please try again later.</div>';
      footnote.textContent = "Other homepage links remain available.";
    }
  }
  loadAnnouncements();
})();
