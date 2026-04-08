// =============================================
// upload.js  –  PRODUCTION VERSION
// Works on Render, Railway, or any live domain.
// The API URL is derived from the current page's
// origin, so it works on localhost AND in production
// without any hardcoded URLs.
// =============================================

// ── Derive API URL from current page origin ──
// On Render: https://resumeiq.onrender.com/analyze
// Locally via Flask: http://127.0.0.1:5000/analyze
const API_URL = window.location.origin + '/analyze';

document.addEventListener('DOMContentLoaded', () => {

  /* ── Element references ── */
  const form            = document.getElementById('uploadForm');
  const dropZone        = document.getElementById('dropZone');
  const fileInput       = document.getElementById('fileInput');
  const dropContent     = document.getElementById('dropContent');
  const fileSelected    = document.getElementById('fileSelected');
  const fileNameEl      = document.getElementById('fileName');
  const fileSizeEl      = document.getElementById('fileSize');
  const removeBtn       = document.getElementById('removeFile');
  const jobRoleInput    = document.getElementById('jobRole');
  const submitBtn       = document.getElementById('submitBtn');
  const btnText         = document.getElementById('btnText');
  const btnSpinner      = document.getElementById('btnSpinner');
  const btnArrow        = document.getElementById('btnArrow');
  const errorMsg        = document.getElementById('errorMsg');
  const errorText       = document.getElementById('errorText');
  const inlineResults   = document.getElementById('inlineResults');
  const scrollToFormBtn = document.getElementById('scrollToFormBtn');
  const ocrToggle       = document.getElementById('ocrToggle');

  let selectedFile = null;

  /* ── Restore previous session result if available ── */
  if (scrollToFormBtn) {
    scrollToFormBtn.addEventListener('click', () => {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const cachedResults = sessionStorage.getItem('resumeResults');
  if (cachedResults && inlineResults && typeof renderResults === 'function') {
    try {
      renderInlinePreview(JSON.parse(cachedResults), false);
    } catch (error) {
      console.warn('Could not restore previous preview:', error);
    }
  }

  /* ──────────────────────────────────────────
     Drag & Drop Handlers
  ────────────────────────────────────────── */
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) setFile(file);
  });

  dropZone.addEventListener('click', (e) => {
    if (e.target.classList.contains('file-browse-label')) return;
    if (e.target === removeBtn || removeBtn.contains(e.target)) return;
    if (!selectedFile) fileInput.click();
  });

  /* ── File input change ── */
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) setFile(fileInput.files[0]);
  });

  /* ── Remove file ── */
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearFile();
  });

  /* ──────────────────────────────────────────
     File helpers
  ────────────────────────────────────────── */
  function setFile(file) {
    const extAllowed = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!extAllowed.includes(ext)) {
      showError('Please upload a PDF, DOC, DOCX, or TXT file.');
      return;
    }

    if (file.size > 16 * 1024 * 1024) {
      showError('File is too large. Maximum allowed size is 16 MB.');
      return;
    }

    selectedFile           = file;
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = formatBytes(file.size);

    dropContent.classList.add('hidden');
    fileSelected.classList.remove('hidden');
    dropZone.classList.add('has-file');
    hideError();
  }

  function clearFile() {
    selectedFile    = null;
    fileInput.value = '';
    dropContent.classList.remove('hidden');
    fileSelected.classList.add('hidden');
    dropZone.classList.remove('has-file');
  }

  function formatBytes(bytes) {
    if (bytes < 1024)    return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  /* ──────────────────────────────────────────
     Quick-pick role chips
  ────────────────────────────────────────── */
  document.querySelectorAll('.role-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      jobRoleInput.value = chip.dataset.role;
      document.querySelectorAll('.role-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      hideError();
    });
  });

  /* ──────────────────────────────────────────
     Error helpers
  ────────────────────────────────────────── */
  function showError(msg) {
    errorText.textContent = msg;
    errorMsg.classList.remove('hidden');
  }
  function hideError() {
    errorMsg.classList.add('hidden');
  }

  /* ──────────────────────────────────────────
     Render inline preview
  ────────────────────────────────────────── */
  function renderInlinePreview(data, shouldScroll = true) {
    if (!inlineResults) return;
    inlineResults.classList.remove('hidden');
    if (typeof renderResults === 'function') {
      renderResults(data);
    }
    if (shouldScroll) {
      requestAnimationFrame(() => {
        inlineResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  /* ──────────────────────────────────────────
     API call — uses dynamic origin-based URL
  ────────────────────────────────────────── */
  async function postAnalysis(formData) {
    return await fetch(API_URL, {
      method: 'POST',
      body: formData
      // Do NOT set Content-Type — browser sets multipart boundary automatically
    });
  }

  function getFriendlyErrorMessage(err) {
    const msg = (err && err.message ? err.message : '').trim();
    if (!msg || /failed to fetch|load failed|networkerror/i.test(msg)) {
      return 'Could not reach the server. Please try again in a few seconds.';
    }
    return msg;
  }

  /* ──────────────────────────────────────────
     Form submission
  ────────────────────────────────────────── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    if (!selectedFile) {
      showError('Please upload your resume first.');
      return;
    }

    const jobRole = jobRoleInput.value.trim();
    if (!jobRole) {
      showError('Please enter a target job role.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('resume',   selectedFile);
    formData.append('job_role', jobRole);
    formData.append('use_ocr',  ocrToggle && ocrToggle.checked ? 'true' : 'false');

    try {
      const response = await postAnalysis(formData);

      if (!response.ok) {
        let message = 'Server error. Please try again.';
        try {
          const errJson = await response.json();
          message = errJson.error || message;
        } catch (_) {}
        throw new Error(message);
      }

      const data = await response.json();
      sessionStorage.setItem('resumeResults', JSON.stringify(data));
      renderInlinePreview(data);

    } catch (err) {
      showError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  });

  /* ──────────────────────────────────────────
     Loading state
  ────────────────────────────────────────── */
  function setLoading(loading) {
    submitBtn.disabled    = loading;
    btnText.textContent   = loading ? 'Analyzing...' : 'Analyze Resume';
    btnSpinner.classList.toggle('hidden', !loading);
    btnArrow.classList.toggle('hidden',   loading);
  }

});
