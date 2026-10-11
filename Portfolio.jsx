"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const localVideoPattern = /\.(mp4|webm|ogg)(?:[?#]|$)/i;

function getYouTubeId(url = "") {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] || "";
    }
    if (
      parsed.hostname === "youtube.com" ||
      parsed.hostname.endsWith(".youtube.com")
    ) {
      if (
        parsed.pathname.startsWith("/embed/") ||
        parsed.pathname.startsWith("/shorts/")
      ) {
        return parsed.pathname.split("/").filter(Boolean)[1] || "";
      }
      return parsed.searchParams.get("v") || "";
    }
  } catch {
    return "";
  }
  return "";
}

function getPosterUrl(project) {
  return project.thumbnail || "";
}

function YouTubeThumbnail({ videoId, className, alt, priority = false }) {
  const thumbnailSizes = ["maxresdefault", "sddefault", "hqdefault", "mqdefault"];
  const [sizeIndex, setSizeIndex] = useState(0);
  const src = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/${thumbnailSizes[sizeIndex]}.jpg`;

  function useNextSize() {
    setSizeIndex((currentIndex) =>
      Math.min(currentIndex + 1, thumbnailSizes.length - 1),
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      onError={useNextSize}
      onLoad={(event) => {
        const { naturalWidth, naturalHeight } = event.currentTarget;
        if (naturalWidth < 640 && naturalHeight < 640) useNextSize();
      }}
    />
  );
}

function getPlayer(project) {
  if (!project?.videoUrl) return null;
  if (localVideoPattern.test(project.videoUrl)) {
    return { type: "file", src: project.videoUrl };
  }

  const youtubeId = getYouTubeId(project.videoUrl);
  if (youtubeId) {
    return {
      type: "embed",
      src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?autoplay=1&playsinline=1`,
    };
  }

  try {
    const parsed = new URL(project.videoUrl);
    if (
      parsed.hostname === "vimeo.com" ||
      parsed.hostname.endsWith(".vimeo.com")
    ) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (/^\d+$/.test(id || "")) {
        return {
          type: "embed",
          src: `https://player.vimeo.com/video/${id}?autoplay=1`,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

function formatConfigText(text, siteConfig) {
  return text
    .replaceAll("{name}", siteConfig.name)
    .replaceAll("{role}", siteConfig.role)
    .replaceAll(
      "{years}",
      `${siteConfig.experience.number}${siteConfig.experience.suffix}`,
    );
}

function ProjectCard({ siteConfig, project, index, onOpen }) {
  const cardRef = useRef(null);
  const localVideo = localVideoPattern.test(project.videoUrl || "");
  const poster = getPosterUrl(project);
  const youtubeId = !project.thumbnail ? getYouTubeId(project.videoUrl) : "";
  const artwork = project.artwork
    .split("\n")
    .map((line, lineIndex) => (
      <React.Fragment key={`${line}-${lineIndex}`}>
        {lineIndex > 0 && <br />}
        {line}
      </React.Fragment>
    ));

  useEffect(() => {
    const video = cardRef.current?.querySelector("video");
    if (!video) return undefined;

    if (!("IntersectionObserver" in window)) {
      video.src = video.dataset.src;
      video.play().catch(() => {});
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!entry.target.src) entry.target.src = entry.target.dataset.src;
            entry.target.play().catch(() => {});
          } else {
            entry.target.pause();
          }
        });
      },
      { threshold: 0.1 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [project.videoUrl]);

  return (
    <article
      ref={cardRef}
      className="project-card reveal"
      data-reveal="up"
      tabIndex={0}
      role="button"
      aria-label={`Open ${project.title}`}
      onClick={() => onOpen(project)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(project);
        }
      }}
      style={{
        "--thumb-bg": project.background,
        "--thumb-accent": project.accent,
        transitionDelay: `${index * 65}ms`,
      }}
    >
      <div className="project-thumb">
        <span className="thumb-code">SG / {String(project.id).padStart(2, "0")}</span>
        {localVideo ? (
          <video
            className="thumb-video"
            data-src={project.videoUrl}
            poster={poster || siteConfig.hero.image}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
          />
        ) : youtubeId ? (
          <YouTubeThumbnail
            key={youtubeId}
            videoId={youtubeId}
            alt={`${project.title} thumbnail`}
            className="youtube-thumbnail"
          />
        ) : poster ? (
          <img
            src={poster}
            alt={`${project.title} thumbnail`}
            loading="lazy"
          />
        ) : (
          <div className="thumb-art"><strong>{artwork}</strong></div>
        )}
        <span className="thumb-play" aria-hidden="true">▶</span>
      </div>
      <div className="project-info">
        <div>
          <h3>{project.title}</h3>
          <p>{project.categoryLabel}</p>
        </div>
        <span className="project-arrow" aria-hidden="true">↗</span>
      </div>
    </article>
  );
}

function ProjectModal({ siteConfig, project, onClose }) {
  const panelRef = useRef(null);
  const player = getPlayer(project);
  const poster = getPosterUrl(project) || siteConfig.hero.image;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const closeButton = panelRef.current?.querySelector(".modal-close");
    closeButton?.focus();
    document.body.classList.add("modal-open");

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "Tab" && panelRef.current) {
        const focusable = [
          ...panelRef.current.querySelectorAll(
            "button:not([disabled]),a[href],iframe",
          ),
        ].filter((element) => element.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
      previousFocus?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="modal open"
      aria-hidden="false"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel" ref={panelRef}>
        <button
          className="modal-close"
          type="button"
          onClick={onClose}
          aria-label={siteConfig.ui.closeProject}
        >
          ×
        </button>
        <div className="modal-media">
          {player?.type === "embed" && (
            <iframe
              src={player.src}
              title={project.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
          {player?.type === "file" && (
            <video
              src={player.src}
              poster={poster}
              controls
              autoPlay
              playsInline
            />
          )}
          {!player && project.videoUrl && (
            <div className="media-placeholder">
              {siteConfig.ui.emptyVideoTitle}
              <br />
              <a href={project.videoUrl} target="_blank" rel="noreferrer">
                {siteConfig.ui.openInNewTab}
              </a>
            </div>
          )}
          {!player && !project.videoUrl && (
            <div className="media-placeholder">
              {siteConfig.ui.noVideoTitle}
              <br />
              {siteConfig.ui.addVideoInstructions}
              <br />
              {siteConfig.ui.replaceArtwork}
            </div>
          )}
        </div>
        <p className="eyebrow">{project.categoryLabel || "PROJECT"}</p>
        <h2 id="modal-title">{project.title}</h2>
        <p>{project.description}</p>
        <div className="modal-meta">
          <span>{project.role || "Contribution: add confirmed details"}</span>
          {project.videoUrl && (
            <a href={project.videoUrl} target="_blank" rel="noreferrer">
              {siteConfig.ui.openProject}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Portfolio({ siteConfig }) {
  const [filter, setFilter] = useState("all");
  const [activeProject, setActiveProject] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const heroVisualRef = useRef(null);
  const toastTimer = useRef(null);
  const heroFeaturedProject =
    siteConfig.work.projects.find((project) => project.id === 1) ||
    siteConfig.work.projects[0];
  const heroProject = useMemo(
    () => ({
      id: "featured-reel",
      title: siteConfig.hero.featuredVideoLabel || "Featured reel",
      categoryLabel: siteConfig.hero.featuredVideoLabel || "FEATURED REEL",
      role: `${siteConfig.name} — ${siteConfig.role}`,
      description:
        siteConfig.hero.featuredVideoNote ||
        `Featured video by ${siteConfig.name}.`,
      videoUrl: siteConfig.hero.featuredVideo || heroFeaturedProject?.videoUrl || "",
      thumbnail: siteConfig.hero.image,
    }),
    [heroFeaturedProject],
  );
  const heroPlayer = getPlayer(heroProject);
  const heroYouTubeId = getYouTubeId(heroProject.videoUrl);

  const closeProject = useCallback(() => setActiveProject(null), []);

  useEffect(() => {
    document.title = `${siteConfig.name} — ${siteConfig.role}`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = siteConfig.description;
  }, []);

  useEffect(() => {
    const updateScroll = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(
        scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0,
      );
      setScrolled(window.scrollY > 18);
    };
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  useEffect(() => {
    const revealItems = document.querySelectorAll(".reveal");
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -45px 0px" },
    );
    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [filter]);

  useEffect(() => {
    if (!toast) return undefined;
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(toastTimer.current);
  }, [toast]);

  useEffect(() => {
    const visual = heroVisualRef.current;
    if (
      !visual ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(hover:hover) and (pointer:fine)").matches
    ) {
      return undefined;
    }
    const onPointerMove = (event) => {
      const rect = visual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      visual.style.setProperty("--pointer-x", `${x * 14}px`);
      visual.style.setProperty("--pointer-y", `${y * 14}px`);
      const mark = visual.querySelector(".visual-center-mark");
      if (mark) mark.style.translate = `${x * 9}px ${y * 9}px`;
    };
    const onPointerLeave = () => {
      visual.style.setProperty("--pointer-x", "0px");
      visual.style.setProperty("--pointer-y", "0px");
      const mark = visual.querySelector(".visual-center-mark");
      if (mark) mark.style.translate = "";
    };
    visual.addEventListener("pointermove", onPointerMove);
    visual.addEventListener("pointerleave", onPointerLeave);
    return () => {
      visual.removeEventListener("pointermove", onPointerMove);
      visual.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  const filteredProjects = siteConfig.work.projects.filter(
    (project) => filter === "all" || project.category === filter,
  );
  const showToast = (message) => setToast(message);
  const navLinks = [
    { id: "work", label: siteConfig.navigation[0], number: "01" },
    { id: "about", label: siteConfig.navigation[1], number: "02" },
    { id: "skills", label: siteConfig.navigation[2], number: "03" },
    { id: "contact", label: siteConfig.navigation[3], number: "04" },
  ];

  return (
    <>
      <div className="scroll-progress" aria-hidden="true">
        <span
          id="scroll-progress-bar"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      <div className="grain" aria-hidden="true" />
      <header className={`site-header${scrolled ? " scrolled" : ""}`}>
        <a className="wordmark" href="#top" aria-label={`${siteConfig.name} home`}>
          {siteConfig.name.toUpperCase()}<span>®</span>
        </a>
        <nav
          className={`desktop-nav${menuOpen ? " open" : ""}`}
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <a
              href={`#${link.id}`}
              key={link.id}
              onClick={() => setMenuOpen(false)}
            >
              {link.label} <span>{link.number}</span>
            </a>
          ))}
        </nav>
        <a className="header-cta" href="#contact">
          {siteConfig.headerCta} <span>↗</span>
        </a>
        <button
          className={`menu-toggle${menuOpen ? " open" : ""}`}
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <i />
          <i />
        </button>
      </header>

      <main id="top">
        <section className="hero section-wrap">
          <div className="hero-topline">
            <span><b className="status-dot" /> {siteConfig.opportunityStatus}</span>
            <span>{siteConfig.disciplineLine}</span>
          </div>
          <div className="hero-copy">
            <p className="eyebrow">
              {formatConfigText(siteConfig.hero.eyebrow, siteConfig).toUpperCase()}
            </p>
            <h1>
              {siteConfig.hero.headline.map((line, index) => (
                <React.Fragment key={`${line}-${index}`}>
                  {index > 0 && <br />}
                  {index === 1 ? (
                    <span className="outline-text">{line}</span>
                  ) : (
                    line
                  )}
                  {index === siteConfig.hero.headline.length - 1 && (
                    <span className="lime-dot">.</span>
                  )}
                </React.Fragment>
              ))}
            </h1>
            <div className="hero-bottom">
              <p className="hero-intro">
                {siteConfig.hero.introduction.map((line) => (
                  <React.Fragment key={line}>{formatConfigText(line, siteConfig)}<br /></React.Fragment>
                ))}
              </p>
              <a
                className="round-link"
                href="#work"
                aria-label="Explore selected work"
              >
                <span>EXPLORE<br />THE WORK</span><b>↓</b>
              </a>
            </div>
            <img
              className="hero-portrait"
              src={siteConfig.hero.image}
              alt={siteConfig.hero.imageAlt}
              fetchPriority="high"
            />
          </div>
          <div
            className={`hero-visual${heroYouTubeId || heroPlayer?.type === "file" ? " has-featured-media" : ""}`}
            aria-label="Featured reel preview"
            data-parallax
            ref={heroVisualRef}
          >
            {heroYouTubeId && (
              <YouTubeThumbnail
                key={heroYouTubeId}
                videoId={heroYouTubeId}
                alt=""
                className="hero-visual-youtube-thumb"
                priority
              />
            )}
            {heroPlayer?.type === "file" && (
              <video
                className="featured-reel-video"
                src={heroPlayer.src}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
              />
            )}
            <div className="visual-grid" />
            <div className="visual-orb orb-one" />
            <div className="visual-orb orb-two" />
            <div className="visual-label label-left">
              <span>{siteConfig.hero.featuredVideoLabel || "FEATURED REEL"}</span>
              <small>{siteConfig.hero.featuredVideoNote}</small>
            </div>
            {/* <div className="visual-center-mark">{siteConfig.ui.heroMark}<span>✳</span></div> */}
            <div className="visual-ring visual-ring-one" aria-hidden="true" />
            <div className="visual-ring visual-ring-two" aria-hidden="true" />
            <button
              className="play-button"
              type="button"
              aria-label={siteConfig.hero.playLabel}
              onClick={() => setActiveProject(heroProject)}
            >
              <span>▶</span>
            </button>
            <span className="visual-hint">{siteConfig.hero.visualHint}</span>
            <div className="visual-label label-right">
              <span>{siteConfig.hero.visualCredit}</span>
              <small>{siteConfig.hero.visualNote}</small>
            </div>
            <div className="visual-index">{siteConfig.hero.index}</div>
          </div>
          <div className="hero-foot">
            {siteConfig.hero.footer.map((item, index) => (
              <span key={item}>
                {formatConfigText(item, siteConfig)}
                {index === 1 && <i>↘</i>}
              </span>
            ))}
          </div>
        </section>

        <section className="work-section section-wrap" id="work">
          <div className="section-heading reveal" data-reveal="up">
            <div>
              <p className="eyebrow">{siteConfig.work.eyebrow}</p>
              <h2>
                {siteConfig.work.heading[0]}<br />
                <span className="muted-heading">{siteConfig.work.heading[1]}</span>
              </h2>
            </div>
            <p className="section-note">{siteConfig.work.description}</p>
          </div>
          <div className="filter-row" role="group" aria-label="Filter projects">
            <button
              className={`filter-btn${filter === "all" ? " active" : ""}`}
              type="button"
              data-filter="all"
              onClick={() => setFilter("all")}
            >
              {siteConfig.ui.allWork} <span>{String(siteConfig.work.projects.length).padStart(2, "0")}</span>
            </button>
            {siteConfig.work.projectCategories.map((category) => (
              <button
                className={`filter-btn${filter === category.id ? " active" : ""}`}
                data-filter={category.id}
                type="button"
                key={category.id}
                onClick={() => setFilter(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>
          <div className="project-grid" id="project-grid" aria-live="polite">
            {filteredProjects.map((project, index) => (
              <ProjectCard
                siteConfig={siteConfig}
                key={project.id}
                project={project}
                index={index}
                onOpen={setActiveProject}
              />
            ))}
          </div>
          <p className="edit-hint">
            <span>↳</span> {siteConfig.work.editHint}
          </p>
        </section>

        <section className="manifesto-section">
          <div className="manifesto-inner section-wrap">
            <p className="eyebrow">{siteConfig.manifesto.eyebrow}</p>
            <p className="manifesto">
              {siteConfig.manifesto.firstLine.split("{show}")[0]}
              <span className="strike-word">show</span>.
              <br />
              {siteConfig.manifesto.secondLine.split("{feel}")[0]}
              <span className="lime-word">feel.</span>
            </p>
            <div className="manifesto-bottom">
              {siteConfig.manifesto.footer.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
        </section>

        <section className="about-section section-wrap" id="about">
          <div className="about-left reveal" data-reveal="left">
            <p className="eyebrow">{siteConfig.about.eyebrow}</p>
            <h2>
              {siteConfig.about.headline.map((line, index) => (
                <React.Fragment key={line}>
                  {index > 0 && <br />}
                  {index === 2 ? <span className="muted-heading">{line}</span> : line}
                </React.Fragment>
              ))}
            </h2>
          </div>
          <div className="about-right reveal" data-reveal="right">
            <div className="about-symbol">{siteConfig.name.slice(0, 1)}<span>✳</span></div>
            <p className="about-lead">{formatConfigText(siteConfig.about.lead, siteConfig)}</p>
            {siteConfig.about.paragraphs.map((paragraph, index) => (
              <p
                className={`about-copy${index === siteConfig.about.paragraphs.length - 1 ? " note-placeholder" : ""}`}
                key={paragraph}
              >
                {paragraph}
              </p>
            ))}
            <a className="text-link" href="#contact">
              {siteConfig.about.cta} <span>↗</span>
            </a>
          </div>
        </section>

        <section className="skills-section section-wrap" id="skills">
          <div className="section-heading compact-heading reveal" data-reveal="up">
            <div>
              <p className="eyebrow">{siteConfig.skills.eyebrow}</p>
              <h2>
                {siteConfig.skills.headline[0]}<br />
                <span className="muted-heading">{siteConfig.skills.headline[1]}</span>
              </h2>
            </div>
            <p className="section-note">{siteConfig.skills.description}</p>
          </div>
          <div className="software-grid">
            {siteConfig.skills.items.map(([name, detail], index) => (
              <div className="software-item reveal" data-reveal="up" key={name}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <b>{name}</b>
                <small>{detail}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="experience-section section-wrap">
          <div className="experience-title reveal" data-reveal="left">
            <p className="eyebrow">{siteConfig.experience.eyebrow}</p>
            <h2>
              {siteConfig.experience.headline[0]}<br />
              <span className="muted-heading">{siteConfig.experience.headline[1]}</span>
            </h2>
          </div>
          <div className="experience-card reveal" data-reveal="right">
            <div className="experience-number">
              {siteConfig.experience.number}<span>{siteConfig.experience.suffix}</span>
            </div>
            <div>
              <h3>{siteConfig.experience.title}</h3>
              <p>{siteConfig.experience.description}</p>
              <small>{siteConfig.experience.note}</small>
            </div>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="contact-inner section-wrap">
            <p className="eyebrow">{siteConfig.contact.eyebrow}</p>
            <h2>
              {siteConfig.contact.headline[0]}<br />
              <span className="outline-text">{siteConfig.contact.headline[1]}</span>
              <br />
              {siteConfig.contact.headline[2]}<span className="lime-dot">.</span>
            </h2>
            <div className="contact-bottom">
              <p>
                {siteConfig.contact.description.map((line) => (
                  <React.Fragment key={line}>{line}<br /></React.Fragment>
                ))}
              </p>
              <a
                className="contact-email"
                id="contact-email"
                href={`mailto:${siteConfig.contact.email}`}
              >
                {siteConfig.contact.email === "your.email@example.com"
                  ? "YOUR EMAIL HERE"
                  : siteConfig.contact.email.toUpperCase()}
                <span>↗</span>
              </a>
            </div>
            <div className="social-links">
              {siteConfig.contact.socialLinks.map((link) => {
                const url = link.url || (
                  link.id === "resume" ? siteConfig.contact.resume : ""
                );
                return (
                  <a
                    href={url || "#"}
                    key={link.id}
                    target={url ? "_blank" : undefined}
                    rel={url ? "noopener noreferrer" : undefined}
                    download={link.id === "resume" && url ? true : undefined}
                    onClick={(event) => {
                      if (!url) {
                        event.preventDefault();
                        showToast(siteConfig.ui.socialLinkMessage.replace("{network}", link.id));
                      }
                    }}
                  >
                    {link.label} ↗
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer section-wrap">
        <a className="wordmark" href="#top">
          {siteConfig.name.toUpperCase()}<span>®</span>
        </a>
        <span>{siteConfig.footer.tagline}</span>
        <span>
          © <span>{new Date().getFullYear()}</span> {siteConfig.name.toUpperCase()} · {siteConfig.footer.rights}
        </span>
      </footer>

      {toast && <div className="toast show" role="status" aria-live="polite">{toast}</div>}

      {activeProject && (
        <ProjectModal siteConfig={siteConfig} project={activeProject} onClose={closeProject} />
      )}
    </>
  );
}
