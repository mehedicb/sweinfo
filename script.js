// State for custom user-added tech stack tags
let customTags = ["Nix", "DuckDB"];

// DOM References
const form = document.getElementById("engineerForm");
const customTagInput = document.getElementById("customTagInput");
const addTagBtn = document.getElementById("addTagBtn");
const customTagsContainer = document.getElementById(
  "customTagsContainer",
);

// Progress Bar DOM
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

// Slider Badges
const yearsExpInput = document.getElementById("yearsExp");
const yearsExpBadge = document.getElementById("yearsExpBadge");
const aiCodeInput = document.getElementById("aiCodePercent");
const aiCodeBadge = document.getElementById("aiCodeBadge");
const ossInput = document.getElementById("ossFrequency");
const ossBadge = document.getElementById("ossBadge");
const workflowNotes = document.getElementById("workflowNotes");
const charCount = document.getElementById("charCount");

// Tabs in Right-hand Inspector
const tabCardBtn = document.getElementById("tabCardBtn");
const tabJsonBtn = document.getElementById("tabJsonBtn");
const cardPreviewPane = document.getElementById("cardPreviewPane");
const jsonPreviewPane = document.getElementById("jsonPreviewPane");

/**
 * Render removable custom stack tag pills
 */
function renderCustomTags() {
  customTagsContainer.innerHTML = "";
  customTags.forEach((tag, index) => {
    const pill = document.createElement("span");
    pill.className =
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30";
    pill.innerHTML = `
          <span>#${escapeHtml(tag)}</span>
          <button type="button" data-index="${index}" class="hover:text-rose-400 transition" aria-label="Remove ${escapeHtml(tag)}">
            <i class="fa-solid fa-xmark text-[10px]"></i>
          </button>
        `;
    pill.querySelector("button").addEventListener("click", () => {
      customTags.splice(index, 1);
      renderCustomTags();
      updateTelemetry();
    });
    customTagsContainer.appendChild(pill);
  });
}

/**
 * Add a new custom tag from input
 */
function addCustomTag() {
  const raw = customTagInput.value.trim();
  if (!raw) return;
  const clean = raw.replace(/^#+/, "").trim();
  if (
    clean &&
    !customTags.some((t) => t.toLowerCase() === clean.toLowerCase())
  ) {
    customTags.push(clean);
    customTagInput.value = "";
    renderCustomTags();
    updateTelemetry();
  } else {
    customTagInput.value = "";
  }
}

addTagBtn.addEventListener("click", addCustomTag);
customTagInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addCustomTag();
  }
});

/**
 * Escape HTML helper to prevent injection in previews
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Gather current form state & compute Agentic Readiness Score
 */
function getFormState() {
  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const githubUrl = document.getElementById("githubUrl").value.trim();
  const jobTitle = document.getElementById("jobTitle").value.trim();
  const primaryRole = document.getElementById("primaryRole").value;
  const seniority = document.getElementById("seniority").value;
  const cloudProvider = document.getElementById("cloudProvider").value;
  const preferredOs = document.getElementById("preferredOs").value;

  const workRadio = document.querySelector(
    'input[name="workArrangement"]:checked',
  );
  const workArrangement = workRadio
    ? workRadio.value
    : "Remote (Distributed)";

  const checkedStack = Array.from(
    document.querySelectorAll('input[name="techStack"]:checked'),
  ).map((cb) => cb.value);
  const checkedAiTools = Array.from(
    document.querySelectorAll('input[name="aiTools"]:checked'),
  ).map((cb) => cb.value);

  const agenticRadio = document.querySelector(
    'input[name="agenticLevel"]:checked',
  );
  const agenticLevel = agenticRadio
    ? agenticRadio.value
    : "Level 2: Active Agentic Coding";
  const baseLevelScore = agenticRadio
    ? parseInt(agenticRadio.getAttribute("data-score") || "50", 10)
    : 50;

  const yearsExp = parseInt(yearsExpInput.value, 10);
  const aiCodePercent = parseInt(aiCodeInput.value, 10);
  const ossFrequency = parseInt(ossInput.value, 10);
  const notes = workflowNotes.value.trim();
  const openToBeta = document.getElementById("openToBeta").checked;

  // Compute composite Agentic Readiness Score (0 - 100)
  const toolBonus = Math.min(20, checkedAiTools.length * 4);
  const velocityContribution = Math.round(aiCodePercent * 0.25);
  const rawScore = Math.round(
    baseLevelScore * 0.55 + toolBonus + velocityContribution,
  );
  const agenticReadinessScore = Math.max(5, Math.min(100, rawScore));

  // Determine Engineer Archetype
  let archetype = "Full-Stack Builder";
  if (agenticReadinessScore >= 82) {
    archetype = "Agentic Systems Pioneer";
  } else if (agenticReadinessScore >= 60) {
    archetype = "AI-Augmented Architect";
  } else if (agenticReadinessScore >= 35) {
    archetype = "Hybrid Pragmatic Engineer";
  } else {
    archetype = "Deterministic Craftsperson";
  }

  return {
    timestamp: new Date().toISOString(),
    identity: {
      fullName: fullName || null,
      email: email || null,
      githubUrl: githubUrl || null,
      jobTitle: jobTitle || null,
      primaryRole,
      seniority,
      workArrangement,
    },
    environment: {
      preferredOs,
      cloudProvider,
    },
    stack: {
      coreTechnologies: checkedStack,
      customTags: [...customTags],
    },
    agenticWorkflow: {
      adoptionLevel: agenticLevel,
      activeTools: checkedAiTools,
      aiAssistedCodePercentage: aiCodePercent,
      agenticReadinessScore,
      archetype,
    },
    metrics: {
      yearsExperience: yearsExp,
      ossContributionCadence: ossFrequency,
      openToBetaTesting: openToBeta,
    },
    workflowArchitectureNotes: notes || null,
  };
}

/**
 * Calculate form completion percentage (0% - 100%)
 */
function calculateCompletion(state) {
  let completedChecks = 0;
  const totalChecks = 7;

  if (state.identity.fullName && state.identity.fullName.length >= 2)
    completedChecks++;
  if (
    state.identity.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.identity.email)
  )
    completedChecks++;
  if (state.identity.jobTitle && state.identity.jobTitle.length >= 2)
    completedChecks++;
  if (
    state.stack.coreTechnologies.length + state.stack.customTags.length >
    0
  )
    completedChecks++;
  if (state.agenticWorkflow.adoptionLevel) completedChecks++;
  if (
    state.agenticWorkflow.activeTools.length > 0 ||
    state.agenticWorkflow.adoptionLevel.includes("Level 0")
  )
    completedChecks++;
  if (
    state.workflowArchitectureNotes &&
    state.workflowArchitectureNotes.length >= 10
  )
    completedChecks++;

  return Math.round((completedChecks / totalChecks) * 100);
}

/**
 * Update all live UI elements (Sliders, Progress Bar, Spec Card, JSON Inspector)
 */
function updateTelemetry() {
  const state = getFormState();

  // 1. Update Slider Readout Badges
  const yrs = state.metrics.yearsExperience;
  yearsExpBadge.textContent =
    yrs === 25 ? "25+ Years" : `${yrs} ${yrs === 1 ? "Year" : "Years"}`;

  const aiPct = state.agenticWorkflow.aiAssistedCodePercentage;
  let aiLabel = "Manual";
  if (aiPct >= 80) aiLabel = "Agent-First";
  else if (aiPct >= 50) aiLabel = "Agent-Paired";
  else if (aiPct >= 20) aiLabel = "Assisted";
  aiCodeBadge.textContent = `${aiPct}% (${aiLabel})`;

  const oss = state.metrics.ossContributionCadence;
  const ossDescriptions = [
    "Consumer",
    "Occasional Star",
    "Bug Reporter",
    "Doc Fixer",
    "Quarterly PRs",
    "Active Contributor",
    "Monthly PRs",
    "Frequent PRs",
    "Library Author",
    "Core Maintainer",
    "OSS Legend",
  ];
  ossBadge.textContent = `${oss}/10 (${ossDescriptions[oss] || "Contributor"})`;

  // Character Counter
  const noteLen = workflowNotes.value.length;
  charCount.textContent = `${noteLen} / 600`;

  // Stack count badge
  const totalStackCount =
    state.stack.coreTechnologies.length + state.stack.customTags.length;
  document.getElementById("stackCountBadge").textContent =
    `${totalStackCount} selected`;

  // 2. Update Top Progress Bar
  const completionPct = calculateCompletion(state);
  progressBar.style.width = `${completionPct}%`;
  progressText.textContent = `${completionPct}%`;

  // 3. Update Hero Score Pill
  document.getElementById("heroScoreValue").textContent =
    `${state.agenticWorkflow.agenticReadinessScore} / 100`;
  document.getElementById("heroTierBadge").textContent =
    state.agenticWorkflow.archetype;

  // 4. Update Live Engineer Spec Card
  const displayName = state.identity.fullName || "Anonymous Engineer";
  document.getElementById("previewName").textContent = displayName;

  // Generate initials for Avatar
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "SE";
  document.getElementById("previewAvatar").textContent = initials;

  document.getElementById("previewSeniority").textContent =
    state.identity.seniority;
  document.getElementById("previewTitle").textContent =
    state.identity.jobTitle || "Title unconfigured";
  document.getElementById("previewRole").textContent =
    state.identity.primaryRole;

  document.getElementById("previewAgentScore").textContent =
    `${state.agenticWorkflow.agenticReadinessScore} / 100`;
  document.getElementById("previewAgentBar").style.width =
    `${state.agenticWorkflow.agenticReadinessScore}%`;
  document.getElementById("previewAgentLevel").textContent =
    state.agenticWorkflow.adoptionLevel.split("(")[0].trim();
  document.getElementById("previewAiPercent").textContent =
    `${aiPct}% AI Code`;

  document.getElementById("previewOs").textContent =
    state.environment.preferredOs;
  document.getElementById("previewCloud").textContent =
    state.environment.cloudProvider.split("(")[0].trim();
  document.getElementById("previewExpWork").textContent =
    `${yrs}y • ${state.identity.workArrangement.split(" ")[0]}`;
  document.getElementById("previewOss").textContent =
    `${oss}/10 (${ossDescriptions[oss]})`;

  // Render Stack Pills in Card
  const allStack = [
    ...state.stack.coreTechnologies,
    ...state.stack.customTags.map((t) => `#${t}`),
  ];
  const stackContainer = document.getElementById("previewStackPills");
  if (allStack.length === 0) {
    stackContainer.innerHTML = `<span class="text-xs font-mono text-slate-400 italic">No stack selected</span>`;
  } else {
    stackContainer.innerHTML = allStack
      .map(
        (item) =>
          `<span class="px-2 py-0.5 rounded-md text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">${escapeHtml(item)}</span>`,
      )
      .join("");
  }

  // Render AI Tooling Pills in Card
  const aiContainer = document.getElementById("previewAiPills");
  if (state.agenticWorkflow.activeTools.length === 0) {
    aiContainer.innerHTML = `<span class="text-xs font-mono text-slate-400 italic">None configured</span>`;
  } else {
    aiContainer.innerHTML = state.agenticWorkflow.activeTools
      .map(
        (tool) =>
          `<span class="px-2 py-0.5 rounded-md text-[11px] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">${escapeHtml(tool)}</span>`,
      )
      .join("");
  }

  // Render Notes
  document.getElementById("previewNotes").textContent =
    state.workflowArchitectureNotes
      ? `"${state.workflowArchitectureNotes}"`
      : '"Awaiting workflow specification..."';

  // 5. Update Live JSON Payload View
  const jsonString = JSON.stringify(state, null, 2);
  document.getElementById("jsonCodeBlock").textContent = jsonString;
  const byteSize = (new Blob([jsonString]).size / 1024).toFixed(2);
  document.getElementById("jsonSizeBadge").textContent = `${byteSize} KB`;
}

// Listen to all form changes in real time
form.addEventListener("input", updateTelemetry);
form.addEventListener("change", updateTelemetry);

// Quick Prompt Chips for Textarea
document.querySelectorAll(".prompt-chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    workflowNotes.value = btn.getAttribute("data-prompt");
    document.getElementById("err-workflowNotes").classList.add("hidden");
    workflowNotes.classList.remove("border-rose-500");
    updateTelemetry();
  });
});

// Inspector Tab Switching (Spec Card vs telemetry.json)
tabCardBtn.addEventListener("click", () => {
  cardPreviewPane.classList.remove("hidden");
  jsonPreviewPane.classList.add("hidden");
  tabCardBtn.className =
    "px-3 py-1 rounded-md text-xs font-mono font-semibold bg-white dark:bg-obsidian-900 text-emerald-600 dark:text-emerald-400 shadow-sm transition";
  tabJsonBtn.className =
    "px-3 py-1 rounded-md text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition";
});

tabJsonBtn.addEventListener("click", () => {
  jsonPreviewPane.classList.remove("hidden");
  cardPreviewPane.classList.add("hidden");
  tabJsonBtn.className =
    "px-3 py-1 rounded-md text-xs font-mono font-semibold bg-white dark:bg-obsidian-900 text-emerald-600 dark:text-emerald-400 shadow-sm transition";
  tabCardBtn.className =
    "px-3 py-1 rounded-md text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition";
});

/**
 * Clipboard Helper compatible with iframe environments
 */
function copyTextToClipboard(text, feedbackElemId, defaultLabel) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    const labelEl = document.getElementById(feedbackElemId);
    if (labelEl) {
      labelEl.textContent = "Copied!";
      setTimeout(() => {
        labelEl.textContent = defaultLabel;
      }, 1800);
    }
  } catch (err) {
    console.error("Copy failed", err);
  }
  document.body.removeChild(textarea);
}

document
  .getElementById("copyLiveJsonBtn")
  .addEventListener("click", () => {
    const jsonStr = JSON.stringify(getFormState(), null, 2);
    copyTextToClipboard(jsonStr, "copyLiveJsonText", "Copy JSON");
  });

/**
 * Auto-Fill Demo Data Button for instant evaluation
 */
document.getElementById("fillDemoBtn").addEventListener("click", () => {
  document.getElementById("fullName").value = "Linus Torvalds-Chen";
  document.getElementById("email").value = "linus.chen@kernel-agents.dev";
  document.getElementById("githubUrl").value =
    "https://github.com/linus-agents";
  document.getElementById("jobTitle").value =
    "Principal Systems & Agentic Architect";
  document.getElementById("primaryRole").value =
    "AI / ML / Agentic Engineer";
  document.getElementById("seniority").value =
    "Staff / Principal (L6-L7)";
  document.getElementById("cloudProvider").value =
    "AWS (Amazon Web Services)";
  document.getElementById("preferredOs").value =
    "Linux (Arch / NixOS / Fedora)";

  // Select Level 3 Agentic radio
  const radios = document.querySelectorAll('input[name="agenticLevel"]');
  if (radios[3]) radios[3].checked = true;

  // Check core stacks
  const desiredStacks = [
    "TypeScript",
    "Python",
    "Rust",
    "Go (Golang)",
    "PostgreSQL",
    "Kubernetes / Docker",
    "Vector DBs (pgvector/Qdrant)",
  ];
  document.querySelectorAll('input[name="techStack"]').forEach((cb) => {
    cb.checked = desiredStacks.includes(cb.value);
  });

  // Check AI tools
  const desiredAi = [
    "Claude Code CLI",
    "Cursor (Composer/Agent)",
    "MCP Servers (Model Context Protocol)",
    "LangGraph / CrewAI / AutoGen",
    "Local LLMs (Ollama / vLLM)",
  ];
  document.querySelectorAll('input[name="aiTools"]').forEach((cb) => {
    cb.checked = desiredAi.includes(cb.value);
  });

  customTags = ["NixOS", "WebAssembly", "Temporal", "DuckDB"];
  renderCustomTags();

  yearsExpInput.value = 11;
  aiCodeInput.value = 75;
  ossInput.value = 9;
  workflowNotes.value =
    "Running Claude Code CLI paired with custom Postgres, Sentry, and GitHub MCP servers. Sub-agents autonomously triage production regressions, synthesize property-based tests in Rust/Python, and open verified PRs.";

  clearValidationErrors();
  updateTelemetry();
});

/**
 * Reset Form Button
 */
document.getElementById("resetFormBtn").addEventListener("click", () => {
  form.reset();
  customTags = [];
  renderCustomTags();
  clearValidationErrors();
  updateTelemetry();
});

/**
 * Form Validation Logic
 */
function clearValidationErrors() {
  document.getElementById("validationBanner").classList.add("hidden");
  ["fullName", "email", "githubUrl", "jobTitle", "workflowNotes"].forEach(
    (id) => {
      const input = document.getElementById(id);
      const err = document.getElementById(`err-${id}`);
      if (input) input.classList.remove("border-rose-500");
      if (err) err.classList.add("hidden");
    },
  );
  document.getElementById("err-techStack").classList.add("hidden");
}

function validateForm() {
  clearValidationErrors();
  let isValid = true;
  let firstInvalidEl = null;

  const state = getFormState();

  if (!state.identity.fullName || state.identity.fullName.length < 2) {
    isValid = false;
    const el = document.getElementById("fullName");
    el.classList.add("border-rose-500");
    document.getElementById("err-fullName").classList.remove("hidden");
    firstInvalidEl = firstInvalidEl || el;
  }

  if (
    !state.identity.email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.identity.email)
  ) {
    isValid = false;
    const el = document.getElementById("email");
    el.classList.add("border-rose-500");
    document.getElementById("err-email").classList.remove("hidden");
    firstInvalidEl = firstInvalidEl || el;
  }

  if (
    state.identity.githubUrl &&
    !/^https?:\/\/.+/i.test(state.identity.githubUrl)
  ) {
    isValid = false;
    const el = document.getElementById("githubUrl");
    el.classList.add("border-rose-500");
    document.getElementById("err-githubUrl").classList.remove("hidden");
    firstInvalidEl = firstInvalidEl || el;
  }

  if (!state.identity.jobTitle || state.identity.jobTitle.length < 2) {
    isValid = false;
    const el = document.getElementById("jobTitle");
    el.classList.add("border-rose-500");
    document.getElementById("err-jobTitle").classList.remove("hidden");
    firstInvalidEl = firstInvalidEl || el;
  }

  if (
    state.stack.coreTechnologies.length +
    state.stack.customTags.length ===
    0
  ) {
    isValid = false;
    document.getElementById("err-techStack").classList.remove("hidden");
    firstInvalidEl =
      firstInvalidEl || document.getElementById("techStackGrid");
  }

  if (
    !state.workflowArchitectureNotes ||
    state.workflowArchitectureNotes.length < 10
  ) {
    isValid = false;
    const el = document.getElementById("workflowNotes");
    el.classList.add("border-rose-500");
    document
      .getElementById("err-workflowNotes")
      .classList.remove("hidden");
    firstInvalidEl = firstInvalidEl || el;
  }

  if (!isValid) {
    const banner = document.getElementById("validationBanner");
    banner.classList.remove("hidden");
    if (firstInvalidEl) {
      firstInvalidEl.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      if (typeof firstInvalidEl.focus === "function")
        firstInvalidEl.focus();
    }
  }

  return isValid;
}

/**
 * Form Submit Handler -> Opens Spec Sheet Modal
 */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const state = getFormState();
  const hash = Math.random().toString(16).substring(2, 6).toUpperCase();
  document.getElementById("modalSpecId").textContent =
    `#ENG-2026-${hash}`;
  document.getElementById("modalArchetype").textContent =
    state.agenticWorkflow.archetype;
  document.getElementById("modalName").textContent =
    state.identity.fullName;
  document.getElementById("modalRoleTitle").textContent =
    `${state.identity.jobTitle} • ${state.identity.primaryRole}`;
  document.getElementById("modalScore").textContent =
    `${state.agenticWorkflow.agenticReadinessScore} / 100`;
  document.getElementById("modalSeniority").textContent =
    state.identity.seniority;
  document.getElementById("modalAiVelocity").textContent =
    `${state.agenticWorkflow.aiAssistedCodePercentage}% Agent Code`;
  document.getElementById("modalEnv").textContent =
    state.environment.cloudProvider.split("(")[0].trim();
  document.getElementById("modalYears").textContent =
    `${state.metrics.yearsExperience} Years`;

  const combinedBadges = [
    ...state.stack.coreTechnologies,
    ...state.stack.customTags.map((t) => `#${t}`),
    ...state.agenticWorkflow.activeTools,
  ];
  document.getElementById("modalTagsList").innerHTML = combinedBadges
    .map(
      (item) =>
        `<span class="px-2.5 py-1 rounded-md text-xs font-mono bg-white/10 text-emerald-300 border border-white/10">${escapeHtml(item)}</span>`,
    )
    .join("");

  const modal = document.getElementById("submissionModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
});

// Modal Actions
function closeModal() {
  const modal = document.getElementById("submissionModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

document
  .getElementById("closeModalBtn")
  .addEventListener("click", closeModal);
document
  .getElementById("submitAnotherBtn")
  .addEventListener("click", closeModal);

document
  .getElementById("modalCopyJsonBtn")
  .addEventListener("click", () => {
    const jsonStr = JSON.stringify(getFormState(), null, 2);
    copyTextToClipboard(jsonStr, "modalCopyText", "Copy JSON Payload");
  });

document
  .getElementById("modalDownloadBtn")
  .addEventListener("click", () => {
    const state = getFormState();
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (state.identity.fullName || "engineer")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    a.href = url;
    a.download = `${safeName}-telemetry-spec.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

// Dark / Light Theme Toggle
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");
themeToggleBtn.addEventListener("click", () => {
  const htmlEl = document.documentElement;
  const isDark = htmlEl.classList.toggle("dark");
  themeIcon.className = isDark
    ? "fa-solid fa-sun text-amber-400"
    : "fa-solid fa-moon text-indigo-600";
});

// Initialize on load
window.addEventListener("DOMContentLoaded", () => {
  renderCustomTags();
  updateTelemetry();
});
