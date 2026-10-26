document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('innova_theme') || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);

  themeToggle?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('innova_theme', newTheme);
  });

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const sidebar = document.getElementById('sidebar');
  mobileToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Close sidebar on link click (mobile)
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        sidebar.classList.remove('open');
      }
    });
  });

  // Interactive Checklist & Progress
  const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');

  function updateProgress() {
    if (checkboxes.length === 0) return;
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const percent = Math.round((checkedCount / checkboxes.length) * 100);
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `${percent}% (${checkedCount}/${checkboxes.length})`;
  }

  // Restore checklist state from localStorage
  checkboxes.forEach((cb, idx) => {
    const key = `innova_check_${idx}`;
    if (localStorage.getItem(key) === 'true') {
      cb.checked = true;
    }
    cb.addEventListener('change', () => {
      localStorage.setItem(key, cb.checked);
      updateProgress();
    });
  });
  updateProgress();

  // Search filter
  const searchInput = document.getElementById('searchInput');
  searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const sections = document.querySelectorAll('.doc-section');
    sections.forEach(sec => {
      const text = sec.innerText.toLowerCase();
      if (!query || text.includes(query)) {
        sec.style.display = 'block';
      } else {
        sec.style.display = 'none';
      }
    });
  });

  // Copy code buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const codeBlock = btn.closest('.code-block').querySelector('code');
      if (codeBlock) {
        navigator.clipboard.writeText(codeBlock.innerText.trim()).then(() => {
          const original = btn.textContent;
          btn.textContent = 'Скопировано!';
          setTimeout(() => { btn.textContent = original; }, 2000);
        });
      }
    });
  });

  // Active navigation highlight on scroll
  const sections = document.querySelectorAll('.doc-section');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollPos = window.scrollY + 100;

    sections.forEach(sec => {
      if (sec.offsetTop <= scrollPos) {
        currentId = sec.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  });

  // Initialize Mermaid if available
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({
      startOnLoad: true,
      theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
    });
  }
});
