
(() => {
  const config = window.FAMILY_CONFIG || {};

  const status = document.getElementById("status");
  const loginPanel = document.getElementById("login-panel");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("login-form");
  const announcementForm = document.getElementById("announcement-form");
  const list = document.getElementById("announcement-list");
  const saveButton = document.getElementById("save-button");

  let client;
  let announcements = [];

  function message(text, isError = false) {
    status.textContent = text;
    status.style.background = isError ? "#fff0f0" : "#f5eaf0";
    status.style.color = isError ? "#9b303e" : "#58182F";
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function showLogin() {
    loginPanel.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }

  function showDashboard() {
    loginPanel.classList.add("hidden");
    dashboard.classList.remove("hidden");
  }

  function resetForm() {
    announcementForm.reset();
    document.getElementById("announcement-id").value = "";
    document.getElementById("form-heading").textContent =
      "Create announcement";
    saveButton.textContent = "Save announcement";
    document.getElementById("cancel-edit").classList.add("hidden");
  }

  async function loadAnnouncements() {
    list.textContent = "Loading announcements…";

    const { data, error } = await client
      .from("family_announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      list.textContent = "Unable to load notices: " + error.message;
      message("Could not load announcements.", true);
      return;
    }

    announcements = data || [];

    if (!announcements.length) {
      list.textContent = "No announcements yet. Create one above.";
      return;
    }

    list.innerHTML = announcements.map(item => `
      <article class="announcement">
        <h3>${escapeHTML(item.title)}</h3>
        <p class="announcement-meta">
          ${escapeHTML(item.category || "General")} ·
          ${item.is_published ? "Published" : "Draft"}
        </p>
        <div class="announcement-body">${escapeHTML(item.body)}</div>
        <div class="admin-actions">
          <button class="admin-button secondary" type="button"
            data-edit="${escapeHTML(item.id)}">Edit</button>
          <button class="admin-button" type="button"
            data-toggle="${escapeHTML(item.id)}">
            ${item.is_published ? "Unpublish" : "Publish"}
          </button>
          <button class="admin-button danger" type="button"
            data-delete="${escapeHTML(item.id)}">Delete</button>
        </div>
      </article>
    `).join("");

    list.querySelectorAll("[data-edit]").forEach(button => {
      button.addEventListener("click", () => {
        const item = announcements.find(
          row => String(row.id) === button.dataset.edit
        );
        if (!item) return;

        document.getElementById("announcement-id").value = item.id;
        document.getElementById("title").value = item.title || "";
        document.getElementById("body").value = item.body || "";
        document.getElementById("category").value =
          item.category || "General";
        document.getElementById("published").checked =
          Boolean(item.is_published);

        document.getElementById("form-heading").textContent =
          "Edit announcement";
        saveButton.textContent = "Save changes";
        document.getElementById("cancel-edit").classList.remove("hidden");

        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });

    list.querySelectorAll("[data-toggle]").forEach(button => {
      button.addEventListener("click", async () => {
        const item = announcements.find(
          row => String(row.id) === button.dataset.toggle
        );
        if (!item) return;

        button.disabled = true;
        const publish = !item.is_published;

        const { error } = await client
          .from("family_announcements")
          .update({
            is_published: publish,
            published_at: publish
              ? new Date().toISOString()
              : null,
            updated_at: new Date().toISOString()
          })
          .eq("id", item.id);

        if (error) {
          message("Could not change publication status: " +
            error.message, true);
        } else {
          message(publish ? "Announcement published." :
            "Announcement moved to drafts.");
        }

        await loadAnnouncements();
      });
    });

    list.querySelectorAll("[data-delete]").forEach(button => {
      button.addEventListener("click", async () => {
        const item = announcements.find(
          row => String(row.id) === button.dataset.delete
        );
        if (!item) return;

        if (!window.confirm(
          `Permanently delete "${item.title}"?`
        )) return;

        button.disabled = true;

        const { error } = await client
          .from("family_announcements")
          .delete()
          .eq("id", item.id);

        if (error) {
          message("Could not delete announcement: " +
            error.message, true);
        } else {
          message("Announcement deleted.");
        }

        await loadAnnouncements();
      });
    });
  }

  async function checkSession() {
    const { data, error } = await client.auth.getSession();

    if (error) {
      message("Unable to check login: " + error.message, true);
      showLogin();
      return;
    }

    if (!data.session) {
      showLogin();
      return;
    }

    showDashboard();
    await loadAnnouncements();
  }

  if (
    !config.supabaseUrl ||
    !config.supabaseAnonKey ||
    !window.supabase?.createClient
  ) {
    message(
      "Supabase configuration is missing. Check config.js.",
      true
    );
    return;
  }

  client = window.supabase.createClient(
    config.supabaseUrl,
    config.supabaseAnonKey
  );

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const button = loginForm.querySelector('button[type="submit"]');
    button.disabled = true;
    message("Signing in…");

    const { error } = await client.auth.signInWithPassword({
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value
    });

    button.disabled = false;

    if (error) {
      message("Login failed: " + error.message, true);
      return;
    }

    message("Login successful.");
    await checkSession();
  });

  announcementForm.addEventListener("submit", async event => {
    event.preventDefault();
    saveButton.disabled = true;

    const id = document.getElementById("announcement-id").value;
    const publish = document.getElementById("published").checked;
    const now = new Date().toISOString();

    const record = {
      title: document.getElementById("title").value.trim(),
      body: document.getElementById("body").value.trim(),
      category: document.getElementById("category").value,
      is_published: publish,
      published_at: publish ? now : null,
      updated_at: now
    };

    let result;

    if (id) {
      result = await client
        .from("family_announcements")
        .update(record)
        .eq("id", id);
    } else {
      record.created_at = now;
      result = await client
        .from("family_announcements")
        .insert(record);
    }

    saveButton.disabled = false;

    if (result.error) {
      message("Could not save: " + result.error.message, true);
      return;
    }

    message(id ? "Announcement updated." : "Announcement saved.");
    resetForm();
    await loadAnnouncements();
  });

  document.getElementById("cancel-edit").addEventListener(
    "click", resetForm
  );

  document.getElementById("signout").addEventListener(
    "click", async () => {
      const { error } = await client.auth.signOut();

      if (error) {
        message("Sign-out failed: " + error.message, true);
        return;
      }

      resetForm();
      showLogin();
      message("You have signed out.");
    }
  );

  client.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) {
      showLogin();
    }
  });

  checkSession();
})();
