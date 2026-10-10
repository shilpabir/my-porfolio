"use client";

import { useMemo, useState } from "react";

function createProject(projects, categories) {
  return {
    id: Math.max(0, ...projects.map((project) => Number(project.id) || 0)) + 1,
    title: "New project",
    category: categories[0]?.id || "other",
    categoryLabel: categories[0]?.label || "PROJECT",
    role: "",
    description: "",
    thumbnail: "",
    videoUrl: "",
    accent: "#c8f169",
    background: "#272e20",
    artwork: "NEW\nPROJECT",
  };
}

function isEditablePortfolio(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.name === "string" &&
      typeof value.role === "string" &&
      value.hero &&
      value.work &&
      Array.isArray(value.work.projects) &&
      Array.isArray(value.work.projectCategories) &&
      value.about &&
      value.skills &&
      value.experience &&
      value.contact &&
      value.footer,
  );
}

export default function AdminEditor({ initialContent }) {
  const [content, setContent] = useState(initialContent);
  const [jsonText, setJsonText] = useState(() => JSON.stringify(initialContent, null, 2));
  const [jsonError, setJsonError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(
    initialContent.work.projects[0]?.id ?? null,
  );
  const [showJson, setShowJson] = useState(false);
  const selectedProject = content.work.projects.find(
    (project) => String(project.id) === String(selectedProjectId),
  );

  const projectCount = useMemo(() => content.work.projects.length, [content]);

  function updateContent(nextContent) {
    setContent(nextContent);
    setJsonText(JSON.stringify(nextContent, null, 2));
    setJsonError("");
    setMessage("");
  }

  function updateProject(key, value) {
    updateContent({
      ...content,
      work: {
        ...content.work,
        projects: content.work.projects.map((project) =>
          String(project.id) === String(selectedProjectId)
            ? { ...project, [key]: value }
            : project,
        ),
      },
    });
  }

  function addProject() {
    const project = createProject(content.work.projects, content.work.projectCategories);
    updateContent({
      ...content,
      work: { ...content.work, projects: [...content.work.projects, project] },
    });
    setSelectedProjectId(project.id);
    setMessage("New project added. Save changes to publish it.");
  }

  async function removeProject() {
    if (!selectedProject) return;
    if (
      !window.confirm(
        `Remove "${selectedProject.title}" from your portfolio? This saves the removal immediately.`,
      )
    ) {
      return;
    }
    const projects = content.work.projects.filter(
      (project) => String(project.id) !== String(selectedProjectId),
    );
    const nextContent = {
      ...content,
      work: { ...content.work, projects },
    };

    setSaving(true);
    setMessage("");
    try {
      const saved = await persistContent(nextContent);
      setContent(saved);
      setJsonText(JSON.stringify(saved, null, 2));
      setJsonError("");
      setSelectedProjectId(projects[0]?.id ?? null);
      setMessage("Project removed and saved. Your live portfolio is updated.");
    } catch (removeError) {
      setMessage(removeError.message);
    } finally {
      setSaving(false);
    }
  }

  function updateJson(value) {
    setJsonText(value);
    setMessage("");
    try {
      const parsed = JSON.parse(value);
      if (!isEditablePortfolio(parsed)) {
        setJsonError("Keep all required portfolio sections and project lists.");
        return;
      }
      setContent(parsed);
      setJsonError("");
    } catch (error) {
      setJsonError(error.message);
    }
  }

  async function persistContent(nextContent) {
    const response = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextContent),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to save.");
    return result.content;
  }

  async function save() {
    let nextContent = content;
    try {
      nextContent = JSON.parse(jsonText);
    } catch (error) {
      setJsonError(error.message);
      setMessage("Fix the JSON error before saving.");
      return;
    }
    if (!isEditablePortfolio(nextContent)) {
      setJsonError("Keep all required portfolio sections and project lists.");
      setMessage("The portfolio content is missing required sections.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const saved = await persistContent(nextContent);
      setContent(saved);
      setJsonText(JSON.stringify(saved, null, 2));
      setJsonError("");
      setMessage("Changes saved. Your live portfolio is updated.");
    } catch (saveError) {
      setMessage(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <a className="admin-brand" href="/">SHILPA <span>PORTFOLIO CMS</span></a>
        <div>
          <a href="/" target="_blank" rel="noreferrer">View portfolio ↗</a>
          <button className="admin-logout" onClick={logout}>Sign out</button>
        </div>
      </header>

      <section className="admin-heading">
        <div>
          <p className="admin-kicker">CONTENT STUDIO</p>
          <h1>Manage your work.</h1>
          <p>Update portfolio content here. Changes are saved in MongoDB.</p>
        </div>
        <button className="admin-primary admin-save-top" onClick={save} disabled={saving || Boolean(jsonError)}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </section>

      <section className="admin-stats" aria-label="Portfolio overview">
        <div><span>PROJECTS</span><strong>{String(projectCount).padStart(2, "0")}</strong></div>
        <div><span>PORTFOLIO</span><strong>{content.name}</strong></div>
        <div><span>DATABASE</span><strong>MongoDB</strong></div>
      </section>

      <section className="admin-workspace">
        <div className="admin-panel admin-projects">
          <div className="admin-panel-title">
            <div><p className="admin-kicker">01 / SELECTED WORK</p><h2>Projects</h2></div>
            <button className="admin-secondary" onClick={addProject} disabled={saving}>+ Add project</button>
          </div>
          <div className="admin-project-layout">
            <nav className="admin-project-list" aria-label="Portfolio projects">
              {content.work.projects.map((project) => (
                <button
                  key={project.id}
                  className={String(project.id) === String(selectedProjectId) ? "selected" : ""}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <span>{project.title || "Untitled project"}</span>
                  <small>{project.categoryLabel || "PROJECT"}</small>
                </button>
              ))}
            </nav>
            {selectedProject ? (
              <div className="admin-project-form">
                <div className="admin-project-form-title">
                  <h3>Edit project</h3>
                  <button className="admin-danger" onClick={removeProject} disabled={saving || Boolean(jsonError)}>
                    {saving ? "Saving..." : "Remove project"}
                  </button>
                </div>
                <div className="admin-fields-grid">
                  <label>Project title<input value={selectedProject.title || ""} onChange={(event) => updateProject("title", event.target.value)} /></label>
                  <label>Category label<input value={selectedProject.categoryLabel || ""} onChange={(event) => updateProject("categoryLabel", event.target.value)} /></label>
                  <label>Category filter
                    <select value={selectedProject.category || ""} onChange={(event) => updateProject("category", event.target.value)}>
                      {content.work.projectCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                    </select>
                  </label>
                  <label>Your role<input value={selectedProject.role || ""} onChange={(event) => updateProject("role", event.target.value)} /></label>
                  <label className="admin-field-wide">Thumbnail URL<input value={selectedProject.thumbnail || ""} onChange={(event) => updateProject("thumbnail", event.target.value)} placeholder="/assets/project-image.jpg" /></label>
                  <label className="admin-field-wide">Video URL<input value={selectedProject.videoUrl || ""} onChange={(event) => updateProject("videoUrl", event.target.value)} placeholder="YouTube, Vimeo or video file URL" /></label>
                  <label className="admin-field-wide">Project description<textarea rows="3" value={selectedProject.description || ""} onChange={(event) => updateProject("description", event.target.value)} /></label>
                  <label>Artwork text<input value={selectedProject.artwork || ""} onChange={(event) => updateProject("artwork", event.target.value)} /></label>
                  <label>Accent color<input type="color" value={/^#[\da-f]{6}$/i.test(selectedProject.accent || "") ? selectedProject.accent : "#c8f169"} onChange={(event) => updateProject("accent", event.target.value)} /></label>
                </div>
              </div>
            ) : (
              <div className="admin-empty">No projects yet. Add a project to get started.</div>
            )}
          </div>
        </div>
      </section>

      <section className="admin-panel admin-json">
        <button className="admin-json-toggle" onClick={() => setShowJson((visible) => !visible)}>
          <span><p className="admin-kicker">02 / FULL CONTENT</p><strong>{showJson ? "Hide" : "Edit"} all portfolio content</strong></span>
          <span>{showJson ? "−" : "+"}</span>
        </button>
        {showJson && (
          <div className="admin-json-body">
            <p>Edit any text, section, social link, toolkit item, or portfolio setting. Keep the JSON structure valid.</p>
            <textarea
              aria-label="Complete portfolio content JSON"
              spellCheck="false"
              value={jsonText}
              onChange={(event) => updateJson(event.target.value)}
            />
            {jsonError && <p className="admin-error" role="alert">JSON error: {jsonError}</p>}
          </div>
        )}
      </section>

      <footer className="admin-footer">
        {message && <p className={message.includes("saved") ? "admin-success" : "admin-feedback"} role="status">{message}</p>}
        <span>Every content update is stored in your MongoDB database.</span>
        <button className="admin-primary" onClick={save} disabled={saving || Boolean(jsonError)}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </footer>
    </main>
  );
}
