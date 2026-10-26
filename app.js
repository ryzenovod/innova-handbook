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

  // Tabs switcher
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.tabs-container');
      const targetId = btn.getAttribute('data-tab');
      
      parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      parent.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      parent.querySelector(`#${targetId}`)?.classList.add('active');
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
    const key = `innova_check_v2_${idx}`;
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
      const codeBlock = btn.closest('.code-block')?.querySelector('code') || 
                        document.querySelector(btn.getAttribute('data-target'));
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

  // --- INTERACTIVE TOOLBOX 1: ASTM Frame Decoder ---
  const astmDecodeBtn = document.getElementById('astmDecodeBtn');
  astmDecodeBtn?.addEventListener('click', () => {
    const rawInput = document.getElementById('astmInput')?.value.trim();
    const outputEl = document.getElementById('astmOutput');
    if (!rawInput || !outputEl) return;

    // Clean common control characters representation
    let clean = rawInput
      .replace(/<STX>|<ETX>|<CR>|<LF>|<ETB>/gi, '')
      .replace(/^[\x02]/, '')
      .replace(/[\x03\x17\r\n].*$/, '')
      .trim();

    // Strip frame number if present at start (e.g., '4R|' -> 'R|')
    let frameNum = '';
    if (/^\d/.test(clean)) {
      frameNum = clean[0];
      clean = clean.slice(1);
    }

    const parts = clean.split('|');
    const recordType = parts[0];

    let resultHtml = `<strong>Тип записи:</strong> [${recordType}] `;
    const explanations = {
      'H': 'Header (Заголовок сессии)',
      'P': 'Patient (Данные пациента)',
      'O': 'Order (Заказ / Пробирка / Штрихкод)',
      'R': 'Result (Результат теста)',
      'C': 'Comment (Комментарий / флаги анализатора)',
      'Q': 'Request Information (Запрос теста по штрихкоду)',
      'L': 'Terminator (Окончание сообщения)'
    };
    resultHtml += `${explanations[recordType] || 'Неизвестная запись'}\n`;
    if (frameNum) resultHtml += `<strong>Номер фрейма:</strong> ${frameNum}\n`;
    resultHtml += `-----------------------------------------\n`;

    if (recordType === 'H') {
      resultHtml += `Разделители: ${parts[1] || '-'}\n`;
      resultHtml += `ID отправителя: ${parts[4] || '-'}\n`;
      resultHtml += `Версия протокола: ${parts[12] || 'ASTM 1394-97'}\n`;
    } else if (recordType === 'P') {
      resultHtml += `№ Пациента: ${parts[1] || '-'}\n`;
      resultHtml += `Внутренний ID: ${parts[3] || '-'}\n`;
      resultHtml += `ФИО: ${parts[5] || '-'}\n`;
      resultHtml += `Дата рождения: ${parts[7] || '-'}\n`;
      resultHtml += `Пол: ${parts[8] || '-'}\n`;
    } else if (recordType === 'O') {
      resultHtml += `№ Образца: ${parts[1] || '-'}\n`;
      resultHtml += `ШТРИХКОД (Specimen ID): ${parts[2] || '⚠️ ПУСТОЙ! (Сканер не прочитал)'}\n`;
      resultHtml += `Запрошенные тесты: ${parts[4] || '-'}\n`;
      resultHtml += `Дата/время забора: ${parts[6] || '-'}\n`;
      resultHtml += `Тип действия: ${parts[11] || '-'}\n`;
    } else if (recordType === 'R') {
      resultHtml += `№ Теста: ${parts[1] || '-'}\n`;
      resultHtml += `КОД ТЕСТА В АНАЛИЗАТОРЕ: ${parts[2]?.replace(/^\^+/, '') || '-'}\n`;
      resultHtml += `ЗНАЧЕНИЕ РЕЗУЛЬТАТА: ${parts[3] || '-'}\n`;
      resultHtml += `Единицы измерения: ${parts[4] || '-'}\n`;
      resultHtml += `Референсный диапазон: ${parts[5] || '-'}\n`;
      resultHtml += `Флаг отклонения: ${parts[6] || 'N (Норма)'}\n`;
      resultHtml += `Статус результата: ${parts[8] || 'F (Окончательный)'}\n`;
      resultHtml += `Дата выполнения: ${parts[12] || '-'}\n`;
    } else {
      parts.forEach((p, idx) => {
        resultHtml += `Поле [${idx}]: ${p}\n`;
      });
    }

    outputEl.innerHTML = resultHtml;
  });

  // --- INTERACTIVE TOOLBOX 2: ASTM Checksum Calculator ---
  const calcChecksumBtn = document.getElementById('calcChecksumBtn');
  calcChecksumBtn?.addEventListener('click', () => {
    const str = document.getElementById('checksumInput')?.value;
    const outputEl = document.getElementById('checksumOutput');
    if (!str || !outputEl) return;

    // Calculate sum of char codes modulo 256
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
      sum = (sum + str.charCodeAt(i)) % 256;
    }
    const hex = sum.toString(16).toUpperCase().padStart(2, '0');
    outputEl.innerHTML = `Строка для проверки: "${str}"\nДлина (байт): ${str.length}\n<strong>Контрольная сумма (Mod 256):</strong> <span style="color: var(--accent-green); font-weight: 700; font-size: 1.1rem;">${hex}</span>\n\nПример полного пакета:\n&lt;STX&gt;${str}&lt;CR&gt;&lt;ETX&gt;<strong>${hex}</strong>&lt;CR&gt;&lt;LF&gt;`;
  });

  // --- INTERACTIVE TOOLBOX 3: VMOM Mapping Generator ---
  const genMappingBtn = document.getElementById('genMappingBtn');
  genMappingBtn?.addEventListener('click', () => {
    const devCode = document.getElementById('mapDevCode')?.value.trim();
    const lisCode = document.getElementById('mapLisCode')?.value.trim();
    const coef = document.getElementById('mapCoef')?.value.trim() || '1.0';
    const qualPos = document.getElementById('mapQualPos')?.value.trim();
    const qualNeg = document.getElementById('mapQualNeg')?.value.trim();
    const outputEl = document.getElementById('mappingOutput');

    if (!devCode || !outputEl) return;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<VMOM version="1.0" description="Value Mapping Object Model">\n  <Model>\n`;
    xml += `    <Test Name="${devCode}" K="${coef}">\n`;
    if (qualPos) xml += `      <Value DeviceValue="POS" LISValue="${qualPos}" />\n`;
    if (qualNeg) xml += `      <Value DeviceValue="NEG" LISValue="${qualNeg}" />\n`;
    xml += `    </Test>\n  </Model>\n</VMOM>`;

    let ini = `; Альтернативный строчный формат для .test.map:\n[MAPPING]\n${devCode}=${lisCode || '101'}|${coef}`;

    outputEl.textContent = `${xml}\n\n${ini}`;
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
