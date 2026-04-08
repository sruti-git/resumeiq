// =============================================
// results.js  –  Results page rendering
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  if (!document.body.classList.contains('results-page')) return;

  const raw = sessionStorage.getItem('resumeResults');

  if (!raw) {
    alert('No analysis data found. Please upload your resume first.');
    window.location.href = 'upload.html';
    return;
  }

  const data = JSON.parse(raw);
  renderResults(data);
});

window.renderResults = renderResults;

/* ═══════════════════════════════════════════
   Main render function
   ═══════════════════════════════════════════ */
function renderResults(data) {
  if (!document.getElementById('displayRole')) return;

  const {
    job_role       = 'Unknown Role',
    match_score    = 0,
    matched_skills = [],
    missing_skills = [],
    gap_analysis   = '',
    recommendations = []
  } = data;

  // ── 1. Role display ──
  document.getElementById('displayRole').textContent = job_role;

  // ── 2. Animated score ring ──
  animateRing(match_score);

  // ── 3. Animated score bar ──
  setTimeout(() => {
    const fill  = document.getElementById('scoreBarFill');
    const label = document.getElementById('scoreBarLabel');
    fill.style.width = match_score + '%';
    label.textContent = match_score + '%';

    if (match_score >= 75) {
      fill.style.background = 'linear-gradient(90deg, #16a34a, #22c55e)';
    } else if (match_score >= 45) {
      fill.style.background = 'linear-gradient(90deg, #d97706, #f59e0b)';
    } else {
      fill.style.background = 'linear-gradient(90deg, #2563eb, #93c5fd)';
    }
  }, 200);

  // ── 4. Score verdict badge ──
  renderVerdict(match_score);

  // ── 5. Matched skills ──
  renderSkillTags('matchedSkills', 'matchedCount', matched_skills, 'skill-matched');

  // ── 6. Missing skills ──
  renderSkillTags('missingSkills', 'missingCount', missing_skills, 'skill-missing');

  // ── 7. Gap analysis paragraph ──
  renderGapAnalysis(gap_analysis, matched_skills.length, missing_skills.length, match_score);

  // ── 8. Recommendations ──
  renderRecommendations('recommendations', recommendations);
}

/* ═══════════════════════════════════════════
   Score Ring Animator (SVG circle)
   ═══════════════════════════════════════════ */
function animateRing(score) {
  const ring          = document.getElementById('ringFill');
  const numberEl      = document.getElementById('scoreNumber');
  const circumference = 2 * Math.PI * 80; // r=80

  const svg = ring.closest('svg');
  const existingDefs = svg.querySelector('#ringGradient');
  if (existingDefs && existingDefs.parentNode) {
    existingDefs.parentNode.remove();
  }

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="${score >= 75 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444'}"/>
      <stop offset="100%" stop-color="${score >= 75 ? '#86efac' : score >= 45 ? '#fcd34d' : '#fca5a5'}"/>
    </linearGradient>`;
  svg.prepend(defs);
  ring.setAttribute('stroke', 'url(#ringGradient)');
  ring.style.strokeDashoffset = circumference;

  const targetOffset = circumference - (score / 100) * circumference;
  setTimeout(() => {
    ring.style.strokeDashoffset = targetOffset;
  }, 200);

  if (numberEl._counterTimer) {
    clearInterval(numberEl._counterTimer);
  }

  numberEl.textContent = '0%';
  let current = 0;
  const step  = Math.max(1, Math.floor(score / 60));
  numberEl._counterTimer = setInterval(() => {
    current += step;
    if (current >= score) {
      current = score;
      clearInterval(numberEl._counterTimer);
    }
    numberEl.textContent = current + '%';
  }, 20);
}

/* ═══════════════════════════════════════════
   Verdict Badge
   ═══════════════════════════════════════════ */
function renderVerdict(score) {
  const iconEl = document.getElementById('verdictIcon');
  const textEl = document.getElementById('verdictText');
  const verdict = document.getElementById('scoreVerdict');

  let icon, text, color;
  if (score >= 80) {
    icon = '🎉'; text = 'Excellent match! You are a strong candidate.';
    color = 'rgba(34,197,94,0.15)'; verdict.style.borderColor = 'rgba(34,197,94,0.35)';
  } else if (score >= 60) {
    icon = '👍'; text = 'Good match! A few skill gaps to address.';
    color = 'rgba(59,130,246,0.15)'; verdict.style.borderColor = 'rgba(59,130,246,0.35)';
  } else if (score >= 40) {
    icon = '📚'; text = 'Moderate match — focus on the missing skills below.';
    color = 'rgba(245,158,11,0.15)'; verdict.style.borderColor = 'rgba(245,158,11,0.35)';
  } else {
    icon = '🔧'; text = 'Low match — significant upskilling recommended.';
    color = 'rgba(239,68,68,0.12)'; verdict.style.borderColor = 'rgba(239,68,68,0.3)';
  }

  iconEl.textContent = icon;
  textEl.textContent = text;
  verdict.style.background = color;
}

/* ═══════════════════════════════════════════
   Skill Tag Renderer
   ═══════════════════════════════════════════ */
function renderSkillTags(containerId, countId, skills, cssClass) {
  const container = document.getElementById(containerId);
  const countEl   = document.getElementById(countId);

  countEl.textContent = skills.length;

  if (!skills.length) {
    container.innerHTML = '<p class="empty-state">None found.</p>';
    return;
  }

  container.innerHTML = skills
    .map(skill => `<span class="skill-tag ${cssClass}">${escapeHtml(skill)}</span>`)
    .join('');
}

/* ═══════════════════════════════════════════
   Gap Analysis Paragraph
   ═══════════════════════════════════════════ */
function renderGapAnalysis(serverText, matchedCount, missingCount, score) {
  const el = document.getElementById('gapAnalysis');

  // Use server-provided text if available, otherwise generate client-side
  if (serverText && serverText.trim().length > 10) {
    el.innerHTML = `<p class="gap-paragraph">${escapeHtml(serverText)}</p>`;
    return;
  }

  // Fallback generated text
  const total = matchedCount + missingCount;
  const lines = [];

  if (score >= 80) {
    lines.push(`Your profile is a <span class="gap-highlight">strong match</span> for this role. You have ${matchedCount} out of ${total} required skills, putting you well ahead of most applicants.`);
    lines.push(`The ${missingCount} missing skill${missingCount !== 1 ? 's' : ''} represent minor gaps. Addressing them would make you an <span class="gap-highlight">outstanding candidate</span>.`);
  } else if (score >= 60) {
    lines.push(`You match <span class="gap-highlight">${matchedCount} of ${total}</span> required skills — a solid foundation. Employers will notice your strengths, but the missing skills may affect shortlisting.`);
    lines.push(`Focus on closing the ${missingCount} gap${missingCount !== 1 ? 's' : ''} identified below. With targeted learning (2–4 weeks), you can significantly improve your chances.`);
  } else if (score >= 40) {
    lines.push(`You currently match <span class="gap-highlight">${matchedCount} of ${total}</span> skills for this role. There's meaningful room for improvement before applying.`);
    lines.push(`The ${missingCount} missing skill${missingCount !== 1 ? 's' : ''} are important for this role. We recommend a structured <span class="gap-highlight">learning plan</span> using the courses listed below.`);
  } else {
    lines.push(`Your current profile matches <span class="gap-highlight">${matchedCount} of ${total}</span> skills required. This role may be a stretch target right now — and that's okay.`);
    lines.push(`Consider building your foundation with the recommended resources below. A <span class="gap-highlight">2–3 month</span> learning plan could dramatically improve your profile.`);
  }

  el.innerHTML = lines.map(l => `<p class="gap-paragraph">${l}</p>`).join('');
}

/* ═══════════════════════════════════════════
   Recommendations Renderer
   ═══════════════════════════════════════════ */
function renderRecommendations(containerId, recs) {
  const container = document.getElementById(containerId);

  if (!recs || !recs.length) {
    container.innerHTML = '<p class="empty-state">No recommendations available — great job, keep it up!</p>';
    return;
  }

  container.innerHTML = recs.map(rec => `
    <div class="rec-card">
      <div class="rec-skill">📌 ${escapeHtml(rec.skill)}</div>
      <div class="rec-course">${escapeHtml(rec.course)}</div>
      <span class="rec-platform">${escapeHtml(rec.platform)}</span>
    </div>
  `).join('');
}

/* ─ Helper ─ */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}
