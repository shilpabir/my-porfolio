"use client";

import { useMemo, useRef, useState } from "react";

const contentSections = [
  {
    id: "profile",
    title: "Profile & basics",
    description: "Your name, profession, availability, and navigation menu.",
    fields: ["name", "role", "description", "opportunityStatus", "disciplineLine", "navigation", "headerCta"],
  },
  {
    id: "hero",
    title: "Homepage intro",
    description: "The first text and featured video visitors see on your homepage.",
    fields: ["hero"],
  },
  {
    id: "work",
    title: "Work section",
    description: "The heading, intro text, and category filters above your projects.",
    fields: ["work"],
  },
  {
    id: "manifesto",
    title: "Featured message",
    description: "The short statement between your work and about sections.",
    fields: ["manifesto"],
  },
  {
    id: "about",
    title: "About you",
    description: "Your introduction, story, and about-section call to action.",
    fields: ["about"],
  },
  {
    id: "skills",
    title: "Skills & tools",
    description: "The tools you use and the kind of work you do with them.",
    fields: ["skills"],
  },
  {
    id: "experience",
    title: "Experience",
    description: "Your years of experience and a short summary of your work.",
    fields: ["experience"],
  },
  {
    id: "contact",
    title: "Contact & social links",
    description: "Your email, resume, and links to your social profiles.",
    fields: ["contact"],
  },
  {
    id: "footer",
    title: "Footer",
    description: "The closing line and copyright text at the bottom of the page.",
    fields: ["footer"],
  },
  {
    id: "ui",
    title: "Website messages",
    description: "Small button labels and messages shown around the website.",
    fields: ["ui"],
  },
];

const contentFieldLabels = {
  name: "Your name",
  role: "Professional title",
  description: "Short website description",
  opportunityStatus: "Availability message",
  disciplineLine: "Specialties",
  navigation: "Menu links",
  headerCta: "Header button text",
  eyebrow: "Small section label",
  headline: "Main heading",
  introduction: "Intro lines",
  image: "Portrait image URL",
  imageAlt: "Portrait description",
  featuredVideo: "Featured video link",
  featuredVideoLabel: "Featured reel title",
  featuredVideoNote: "Featured reel description",
  playLabel: "Play button text",
  visualHint: "Video hint",
  visualCredit: "Video credit",
  visualNote: "Video note",
  index: "Visual reference",
  footer: "Closing lines",
  heading: "Section heading",
  editHint: "Project editing note",
  projectCategories: "Project filter categories",
  firstLine: "First message line",
  secondLine: "Second message line",
  lead: "Introduction",
  paragraphs: "About paragraphs",
  cta: "Call-to-action text",
  items: "List items",
  number: "Years of experience",
  suffix: "Number ending (for example, +)",
  title: "Experience title",
  email: "Contact email",
  resume: "Resume file URL",
  socialLinks: "Social profiles",
  tagline: "Footer message",
  rights: "Copyright text",
  allWork: "All projects button",
  closeProject: "Close project button",
  openProject: "Open project button",
  openInNewTab: "Open in new tab button",
  noVideoTitle: "Missing video title",
  addVideoInstructions: "Missing video instructions",
  replaceArtwork: "Thumbnail instructions",
  emptyVideoTitle: "Video link title",
  socialLinkMessage: "Social link message",
  heroMark: "Hero monogram",
  label: "Displayed label",
  id: "Category ID",
  url: "Profile URL",
};

function getCollectionItemLabel(path, index) {
  const collection = path.join(".");
  if (collection === "work.projectCategories") return `Category ${index + 1}`;
  if (collection === "about.paragraphs") return `Paragraph ${index + 1}`;
  if (collection === "skills.items") return `Skill ${index + 1}`;
  if (collection === "contact.socialLinks") return `Social profile ${index + 1}`;
  if (collection === "contact.description") return `Contact line ${index + 1}`;
  if (collection === "navigation") return `Menu item ${index + 1}`;
  if (collection.endsWith(".headline")) return `Heading line ${index + 1}`;
  if (collection.endsWith(".introduction")) return `Intro line ${index + 1}`;
  if (collection.endsWith(".footer")) return `Closing line ${index + 1}`;
  if (collection === "work.heading") return `Work heading line ${index + 1}`;
  return `Item ${index + 1}`;
}

function getContentFieldLabel(path) {
  const fieldName = path.at(-1);
  if (fieldName === "id" && path[0] === "work") return "Filter key";
  if (fieldName === "id" && path[0] === "contact") return "Social network";
  if (fieldName === "url" && path[0] === "contact") return "Profile link";
  return contentFieldLabels[fieldName] || formatFieldName(fieldName);
}

function getContentFieldHint(path) {
  const fieldPath = path.join(".");
  if (fieldPath === "work.projectCategories.0.id" || path[0] === "work" && path.at(-1) === "id") {
    return "Short key used to match projects to this filter, for example: product.";
  }
  if (path[0] === "contact" && path.at(-1) === "id") {
    return "Use a simple name such as instagram, linkedin, behance, or resume.";
  }
  if (path[0] === "contact" && path.at(-1) === "url") {
    return "Paste the full link, including https://.";
  }
  if (fieldPath === "hero.image") {
    return "Paste a public image link, or use a file in public/assets.";
  }
  if (fieldPath === "hero.featuredVideo") {
    return "Paste a YouTube, Vimeo, or video-file link.";
  }
  if (fieldPath === "hero.featuredVideoLabel") {
    return "This title appears on the featured reel and in its video details.";
  }
  if (fieldPath === "hero.featuredVideoNote") {
    return "A short description shown with the featured reel and in its video details.";
  }
  if (fieldPath === "contact.email") {
    return "Visitors will use this address to email you.";
  }
  return "";
}

function formatFieldName(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function createEmptyValue(value) {
  if (Array.isArray(value)) return value.map(createEmptyValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, createEmptyValue(child)]),
    );
  }
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  return "";
}

function ContentValueEditor({ value, path, onChange, labelOverride }) {
  const fieldName = path.at(-1);
  const isListItem = /^\d+$/.test(fieldName);
  const fieldLabel =
    labelOverride ||
    (isListItem
      ? getCollectionItemLabel(path.slice(0, -1), Number(fieldName))
      : getContentFieldLabel(path));

  if (path.join(".") === "work.projects") return null;

  if (Array.isArray(value)) {
    return (
      <fieldset className="admin-content-group admin-content-collection">
        <legend>{fieldLabel}</legend>
        <div className="admin-content-items">
          {value.map((item, index) => (
            <div
              className={`admin-content-item${item && typeof item === "object" && !Array.isArray(item) ? " admin-content-object-item" : ""}`}
              key={`${path.join(".")}-${index}`}
            >
              <h4 className="admin-content-item-title">
                {getCollectionItemLabel(path, index)}
              </h4>
              {Array.isArray(item) &&
              item.every((part) => part === null || typeof part !== "object") ? (
                <div className="admin-content-tuple">
                  {item.map((part, partIndex) => (
                    <ContentValueEditor
                      key={`${path.join(".")}-${index}-${partIndex}`}
                      value={part}
                      path={[...path, String(index), String(partIndex)]}
                      onChange={onChange}
                      labelOverride={
                        path.join(".") === "skills.items"
                          ? partIndex === 0
                            ? "Tool or skill"
                            : "Work type"
                          : `Line ${partIndex + 1}`
                      }
                    />
                  ))}
                </div>
              ) : (
                <ContentValueEditor
                  value={item}
                  path={[...path, String(index)]}
                  onChange={onChange}
                />
              )}
              <button
                className="admin-danger"
                type="button"
                aria-label={`Remove ${getCollectionItemLabel(path, index)}`}
                onClick={() => onChange(path, value.filter((_, itemIndex) => itemIndex !== index))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          className="admin-secondary admin-content-add"
          type="button"
          onClick={() => {
            const collection = path.join(".");
            const template = value[0];
            const newItem =
              template !== undefined
                ? createEmptyValue(template)
                : collection === "skills.items"
                  ? ["", ""]
                  : collection === "work.projectCategories"
                    ? { id: "", label: "" }
                    : collection === "contact.socialLinks"
                      ? { id: "", label: "", url: "" }
                      : "";
            onChange(path, [...value, newItem]);
          }}
        >
          + Add {fieldLabel.replace(/s$/, "").toLowerCase()}
        </button>
      </fieldset>
    );
  }

  if (value && typeof value === "object") {
    return (
      <fieldset className="admin-content-group">
        <legend>{fieldLabel}</legend>
        <div className="admin-content-grid">
          {Object.entries(value).map(([key, child]) => (
            <ContentValueEditor
              key={[...path, key].join(".")}
              value={child}
              path={[...path, key]}
              onChange={onChange}
            />
          ))}
        </div>
      </fieldset>
    );
  }

  const isLongText =
    typeof value === "string" &&
    (value.length > 100 || /description|paragraph|lead|note|instructions/i.test(fieldName));
  const fieldHint = getContentFieldHint(path);

  return (
    <label className={isLongText ? "admin-content-field admin-field-wide" : "admin-content-field"}>
      {fieldLabel}
      {isLongText ? (
        <textarea
          rows="3"
          value={value ?? ""}
          onChange={(event) => onChange(path, event.target.value)}
        />
      ) : typeof value === "boolean" ? (
        <input
          type="checkbox"
          checked={value}
          onChange={(event) => onChange(path, event.target.checked)}
        />
      ) : (
        <input
          type={typeof value === "number" ? "number" : "text"}
          value={value ?? ""}
          onChange={(event) =>
            onChange(path, typeof value === "number" ? Number(event.target.value) : event.target.value)
          }
        />
      )}
      {fieldHint && <span className="admin-content-help">{fieldHint}</span>}
    </label>
  );
}

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
  const contentRef = useRef(initialContent);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(
    initialContent.work.projects[0]?.id ?? null,
  );
  const [selectedContentSection, setSelectedContentSection] = useState("profile");
  const selectedProject = content.work.projects.find(
    (project) => String(project.id) === String(selectedProjectId),
  );
  const activeContentSection =
    contentSections.find((section) => section.id === selectedContentSection) ||
    contentSections[0];

  const projectCount = useMemo(() => content.work.projects.length, [content]);

  function updateContent(nextContent) {
    contentRef.current = nextContent;
    setContent(nextContent);
    setMessage("");
  }

  function updateContentAtPath(path, value) {
    const updateAtPath = (current, depth = 0) => {
      if (depth === path.length) return value;
      const key = path[depth];
      const index = Number(key);
      if (Array.isArray(current)) {
        const next = [...current];
        next[index] = updateAtPath(next[index], depth + 1);
        return next;
      }
      return {
        ...current,
        [key]: updateAtPath(current[key], depth + 1),
      };
    };

    updateContent(updateAtPath(contentRef.current));
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
      contentRef.current = saved;
      setContent(saved);
      setSelectedProjectId(projects[0]?.id ?? null);
      setMessage("Project removed and saved. Your live portfolio is updated.");
    } catch (removeError) {
      setMessage(removeError.message);
    } finally {
      setSaving(false);
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

  async function uploadThumbnail(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    const projectId = selectedProjectId;
    setUploadingThumbnail(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to upload thumbnail.");
      }
      if (typeof result.url !== "string") {
        throw new Error("Upload completed without an image URL.");
      }
      const latestContent = contentRef.current;
      let projectFound = false;
      const nextContent = {
        ...latestContent,
        work: {
          ...latestContent.work,
          projects: latestContent.work.projects.map((project) => {
            if (String(project.id) !== String(projectId)) return project;
            projectFound = true;
            return { ...project, thumbnail: result.url };
          }),
        },
      };
      if (!projectFound) {
        throw new Error("The project was removed before the upload finished.");
      }
      updateContent(nextContent);
      setMessage("Thumbnail uploaded. Save changes to publish it.");
    } catch (uploadError) {
      setMessage(uploadError.message || "Unable to upload thumbnail.");
    } finally {
      setUploadingThumbnail(false);
      input.value = "";
    }
  }

  async function save() {
    const nextContent = contentRef.current;
    if (!isEditablePortfolio(nextContent)) {
      setMessage("The portfolio content is missing required sections.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const saved = await persistContent(nextContent);
      contentRef.current = saved;
      setContent(saved);
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
          <h1>Manage your portfolio.</h1>
          <p>Choose what you want to edit below. Click “Save changes” to publish your updates.</p>
        </div>
        <button className="admin-primary admin-save-top" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </section>

      <section className="admin-stats" aria-label="Portfolio overview">
        <div><span>PROJECTS</span><strong>{String(projectCount).padStart(2, "0")}</strong></div>
        <div><span>PORTFOLIO</span><strong>{content.name}</strong></div>
        <div><span>WHEN CHANGES GO LIVE</span><strong>After you save</strong></div>
      </section>

      <section className="admin-workspace">
        <div className="admin-panel admin-projects">
          <div className="admin-panel-title">
            <div>
              <p className="admin-kicker">01 / YOUR WORK</p>
              <h2>Projects</h2>
              <p className="admin-panel-hint">Select a project to edit it. Removing a project saves immediately.</p>
            </div>
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
                  <button className="admin-danger" onClick={removeProject} disabled={saving}>
                    {saving ? "Saving..." : "Remove project"}
                  </button>
                </div>
                <div className="admin-fields-grid">
                  <label>Project title<input value={selectedProject.title || ""} onChange={(event) => updateProject("title", event.target.value)} /></label>
                  <label>Category shown on site<input value={selectedProject.categoryLabel || ""} onChange={(event) => updateProject("categoryLabel", event.target.value)} /></label>
                  <label>Category filter
                    <select value={selectedProject.category || ""} onChange={(event) => updateProject("category", event.target.value)}>
                      {content.work.projectCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                    </select>
                  </label>
                  <label>Your role<input value={selectedProject.role || ""} onChange={(event) => updateProject("role", event.target.value)} /></label>
                  <label className="admin-field-wide">Thumbnail URL<input value={selectedProject.thumbnail || ""} onChange={(event) => updateProject("thumbnail", event.target.value)} placeholder="/assets/project-image.jpg" /></label>
                  <label className="admin-field-wide">Upload thumbnail
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={uploadThumbnail}
                      disabled={uploadingThumbnail || saving}
                    />
                    <span className="admin-upload-hint">
                      {uploadingThumbnail ? "Uploading..." : "JPG, PNG, WebP, or GIF; maximum 5 MB. Cloudinary required."}
                    </span>
                  </label>
                  {selectedProject.thumbnail && (
                    <div className="admin-thumbnail-preview">
                      <img src={selectedProject.thumbnail} alt="Current project thumbnail preview" />
                    </div>
                  )}
                  <label className="admin-field-wide">Video URL<input value={selectedProject.videoUrl || ""} onChange={(event) => updateProject("videoUrl", event.target.value)} placeholder="YouTube, Vimeo or video file URL" /></label>
                  <label className="admin-field-wide">Project description<textarea rows="3" value={selectedProject.description || ""} onChange={(event) => updateProject("description", event.target.value)} /></label>
                  <label className="admin-field-wide">Fallback artwork text<input value={selectedProject.artwork || ""} onChange={(event) => updateProject("artwork", event.target.value)} /><span className="admin-upload-hint">Only shown when there is no thumbnail image.</span></label>
                  <label>Project accent color<input type="color" value={/^#[\da-f]{6}$/i.test(selectedProject.accent || "") ? selectedProject.accent : "#c8f169"} onChange={(event) => updateProject("accent", event.target.value)} /></label>
                </div>
              </div>
            ) : (
              <div className="admin-empty">No projects yet. Add a project to get started.</div>
            )}
          </div>
        </div>
      </section>

      <section className="admin-panel admin-content-editor">
        <div className="admin-panel-title">
          <div>
            <p className="admin-kicker">02 / WEBSITE CONTENT</p>
            <h2>What would you like to update?</h2>
          </div>
        </div>
        <div className="admin-content-layout">
          <nav className="admin-content-nav" aria-label="Website content sections">
            {contentSections.map((section) => (
              <button
                key={section.id}
                className={selectedContentSection === section.id ? "selected" : ""}
                type="button"
                aria-current={selectedContentSection === section.id ? "page" : undefined}
                onClick={() => setSelectedContentSection(section.id)}
              >
                {section.title}
              </button>
            ))}
          </nav>
          <div className="admin-content-body">
            <div className="admin-content-section-heading">
              <h3>{activeContentSection.title}</h3>
              <p>{activeContentSection.description}</p>
            </div>
            <div className="admin-content-fields">
              {activeContentSection.fields.map((key) => (
                <ContentValueEditor
                  key={key}
                  value={content[key]}
                  path={[key]}
                  onChange={updateContentAtPath}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="admin-footer">
        {message && <p className={message.includes("saved") || message.includes("uploaded") ? "admin-success" : "admin-feedback"} role="status">{message}</p>}
        <span>Project and website edits go live when you save. Removing a project saves immediately.</span>
        <button className="admin-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </footer>
    </main>
  );
}
