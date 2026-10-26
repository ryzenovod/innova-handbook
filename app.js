document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Theme Toggle ---
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

  // --- 2. Mobile Sidebar Toggle ---
  const mobileToggle = document.getElementById('mobileToggle');
  const sidebar = document.getElementById('sidebar');
  mobileToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        sidebar.classList.remove('open');
      }
    });
  });

  // --- 3. Tabs Switcher ---
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.tabs-container');
      const targetId = btn.getAttribute('data-tab');
      if (!parent || !targetId) return;

      parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      parent.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      parent.querySelector(`#${targetId}`)?.classList.add('active');
    });
  });

  // --- 4. SOP Accordion Collapsibles ---
  document.querySelectorAll('.sop-header-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.sop-card');
      if (card) {
        card.classList.toggle('open');
      }
    });
  });

  // --- 5. Interactive Checklist & Progress ---
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

  checkboxes.forEach((cb, idx) => {
    const key = `innova_check_v3_${idx}`;
    if (localStorage.getItem(key) === 'true') {
      cb.checked = true;
    }
    cb.addEventListener('change', () => {
      localStorage.setItem(key, cb.checked);
      updateProgress();
    });
  });
  updateProgress();

  // --- 6. Global Search with Auto-Expand ---
  const searchInput = document.getElementById('searchInput');
  searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const sections = document.querySelectorAll('.doc-section');
    sections.forEach(sec => {
      const text = sec.innerText.toLowerCase();
      if (!query || text.includes(query)) {
        sec.style.display = 'block';
        // Auto-expand matching SOP cards
        if (query) {
          sec.querySelectorAll('.sop-card').forEach(card => {
            if (card.innerText.toLowerCase().includes(query)) {
              card.classList.add('open');
            }
          });
        }
      } else {
        sec.style.display = 'none';
      }
    });
  });

  // --- 7. Copy Code Buttons ---
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const codeBlock = btn.closest('.code-block')?.querySelector('code') || 
                        document.querySelector(btn.getAttribute('data-target'));
      if (codeBlock) {
        navigator.clipboard.writeText(codeBlock.innerText.trim()).then(() => {
          const original = btn.textContent;
          btn.textContent = 'Скопировано! ✓';
          btn.classList.add('btn-copied');
          setTimeout(() => { 
            btn.textContent = original; 
            btn.classList.remove('btn-copied');
          }, 2000);
        });
      }
    });
  });

  // --- 8. Active Nav Highlight on Scroll ---
  const sections = document.querySelectorAll('.doc-section');
  const navLinks = document.querySelectorAll('.nav-link');
  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollPos = window.scrollY + 120;

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

  // =========================================================================
  // TOOL 1: ASTM 1394 Frame Decoder
  // =========================================================================
  const astmDecodeBtn = document.getElementById('astmDecodeBtn');
  astmDecodeBtn?.addEventListener('click', () => {
    const rawInput = document.getElementById('astmInput')?.value.trim();
    const outputEl = document.getElementById('astmOutput');
    if (!rawInput || !outputEl) return;

    let clean = rawInput
      .replace(/<STX>|<ETX>|<CR>|<LF>|<ETB>/gi, '')
      .replace(/^[\x02]/, '')
      .replace(/[\x03\x17\r\n].*$/, '')
      .trim();

    let frameNum = '';
    if (/^\d/.test(clean)) {
      frameNum = clean[0];
      clean = clean.slice(1);
    }

    const parts = clean.split('|');
    const recordType = parts[0];

    let resultHtml = `<strong>Тип записи ASTM:</strong> <span class="badge badge-blue">[${recordType}]</span> `;
    const explanations = {
      'H': 'Header (Заголовок сессии передачи)',
      'P': 'Patient (Идентификационные данные пациента)',
      'O': 'Order (Заказ / Направление / Пробирка)',
      'R': 'Result (Результат выполнения теста)',
      'C': 'Comment (Служебный флаг / Комментарий анализатора)',
      'Q': 'Request Information (Запрос теста по штрихкоду у ЛИС)',
      'L': 'Terminator (Окончание сессии)'
    };
    resultHtml += `${explanations[recordType] || 'Нестандартная запись'}\n`;
    if (frameNum) resultHtml += `<strong>Номер кадра:</strong> ${frameNum}\n`;
    resultHtml += `------------------------------------------------------------\n`;

    if (recordType === 'H') {
      resultHtml += `Разделители полей/компонентов: ${parts[1] || '-'}\n`;
      resultHtml += `Идентификатор отправителя (LIS/Analyzer): ${parts[4] || '-'}\n`;
      resultHtml += `Версия спецификации: ${parts[12] || 'ASTM 1394-97'}\n`;
    } else if (recordType === 'P') {
      resultHtml += `Порядковый номер в сессии: ${parts[1] || '-'}\n`;
      resultHtml += `Внутренний ID пациента: ${parts[3] || '-'}\n`;
      resultHtml += `ФИО: ${parts[5] || 'Аноним'}\n`;
      resultHtml += `Дата рождения: ${parts[7] || '-'}\n`;
      resultHtml += `Пол: ${parts[8] === 'M' ? 'Мужской (M)' : (parts[8] === 'F' ? 'Женский (F)' : parts[8] || '-')}\n`;
    } else if (recordType === 'O') {
      resultHtml += `Номер образца в заказе: ${parts[1] || '-'}\n`;
      resultHtml += `ШТРИХКОД (Specimen Barcode): ${parts[2] ? `<strong>${parts[2]}</strong>` : '⚠️ ПУСТОЙ! (Сканер анализатора не прочитал штрихкод)'}\n`;
      resultHtml += `Список тестов (Universal Test ID): ${parts[4] || '-'}\n`;
      resultHtml += `Дата/время забора биоматериала: ${parts[6] || '-'}\n`;
      resultHtml += `Код действия (Action Code): ${parts[11] || 'O (New order)'}\n`;
    } else if (recordType === 'R') {
      resultHtml += `Номер теста в пробе: ${parts[1] || '-'}\n`;
      resultHtml += `КОД ТЕСТА В АНАЛИЗАТОРЕ: <strong>${parts[2]?.replace(/^\^+/, '') || '-'}</strong>\n`;
      resultHtml += `ИЗМЕРЕННОЕ ЗНАЧЕНИЕ: <span style="color:var(--primary);font-weight:700;">${parts[3] || '-'}</span>\n`;
      resultHtml += `Единицы измерения: ${parts[4] || '-'}\n`;
      resultHtml += `Референсный интервал: ${parts[5] || '-'}\n`;
      resultHtml += `Флаг патологии (Abnormal flag): ${parts[6] || 'N (Норма)'}\n`;
      resultHtml += `Статус результата: ${parts[8] === 'F' ? 'F (Final / Окончательный)' : parts[8] || '-'}\n`;
      resultHtml += `Дата и время измерения: ${parts[12] || '-'}\n`;
    } else if (recordType === 'Q') {
      resultHtml += `Номер запроса: ${parts[1] || '-'}\n`;
      resultHtml += `ШТРИХКОД ДЛЯ ПОИСКА ЗАКАЗА: <strong>${parts[2]?.replace(/^\^+/, '') || '-'}</strong>\n`;
      resultHtml += `Критерий поиска: ${parts[4] || 'ALL (Все назначенные тесты)'}\n`;
    } else {
      parts.forEach((p, idx) => {
        resultHtml += `Поле [${idx}]: ${p}\n`;
      });
    }

    outputEl.innerHTML = resultHtml;
  });

  // =========================================================================
  // TOOL 2: ASTM Checksum Calculator (Mod 256)
  // =========================================================================
  const calcChecksumBtn = document.getElementById('calcChecksumBtn');
  calcChecksumBtn?.addEventListener('click', () => {
    const str = document.getElementById('checksumInput')?.value;
    const outputEl = document.getElementById('checksumOutput');
    if (!str || !outputEl) return;

    let sum = 0;
    for (let i = 0; i < str.length; i++) {
      sum = (sum + str.charCodeAt(i)) % 256;
    }
    const hex = sum.toString(16).toUpperCase().padStart(2, '0');
    outputEl.innerHTML = `Входная строка: "${str}"\nДлина пакета: ${str.length} байт\n` +
      `<strong>Контрольная сумма (Mod 256):</strong> <span class="badge badge-green" style="font-size:1.1rem;">${hex}</span>\n\n` +
      `Полная последовательность передачи кадра:\n` +
      `&lt;STX&gt;${str}&lt;CR&gt;&lt;ETX&gt;<strong>${hex}</strong>&lt;CR&gt;&lt;LF&gt;`;
  });

  // =========================================================================
  // TOOL 3: HL7 v2 Inspector & ACK Generator
  // =========================================================================
  const hl7InspectBtn = document.getElementById('hl7InspectBtn');
  hl7InspectBtn?.addEventListener('click', () => {
    const raw = document.getElementById('hl7Input')?.value.trim();
    const outputEl = document.getElementById('hl7Output');
    if (!raw || !outputEl) return;

    // Clean MLLP framing (<VT> = 0x0B, <FS> = 0x1C, <CR> = 0x0D)
    const clean = raw.replace(/^[\x0B]/, '').replace(/[\x1C\x0D]+$/, '').trim();
    const lines = clean.split(/\r\n|\r|\n/);

    let mshControlId = '1001';
    let msgType = 'ORU^R01';
    let breakdown = `<strong>Разбор сегментов HL7 v2:</strong>\n------------------------------------------------------------\n`;

    lines.forEach(line => {
      line = line.trim();
      if (!line) return;
      const f = line.split('|');
      const seg = f[0];

      if (seg === 'MSH') {
        msgType = f[8] || msgType;
        mshControlId = f[9] || mshControlId;
        breakdown += `[MSH] Заголовок сообщения:\n  • Тип: <strong>${msgType}</strong>\n  • Отправитель: ${f[2] || '-'}\n  • Получатель: ${f[4] || '-'}\n  • Время: ${f[6] || '-'}\n  • ID сообщения (Control ID): <strong>${mshControlId}</strong>\n  • Версия HL7: ${f[11] || '2.3.1'}\n`;
      } else if (seg === 'PID') {
        breakdown += `[PID] Пациент:\n  • ID: ${f[3] || '-'}\n  • ФИО: ${f[5]?.replace(/\^/g, ' ') || '-'}\n  • ДР: ${f[7] || '-'}\n  • Пол: ${f[8] || '-'}\n`;
      } else if (seg === 'OBR') {
        breakdown += `[OBR] Заказ исследования:\n  • № Заказа: ${f[1] || '-'}\n  • ШТРИХКОД ПРОБИРКИ: <strong>${f[2] || f[3] || '-'}</strong>\n  • Код услуги: ${f[4] || '-'}\n`;
      } else if (seg === 'OBX') {
        breakdown += `[OBX] Результат анализа:\n  • Код теста: <strong>${f[3]?.replace(/\^/g, ' ') || '-'}</strong>\n  • Значение: <span style="color:var(--primary);font-weight:700;">${f[5] || '-'}</span> ${f[6] || ''}\n  • Норма: ${f[7] || '-'}\n  • Флаг: ${f[8] || 'N'}\n  • Статус: ${f[11] || 'F'}\n`;
      } else {
        breakdown += `[${seg}] Данные: ${line.slice(4)}\n`;
      }
    });

    // Generate matching MSA|AA acknowledgment
    const nowStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const ack = 
`MSH|^~\\&|LIS|INNOVA|ANALYZER|LAB|${nowStr}||ACK|${Date.now().toString().slice(-6)}|P|2.3.1\r` +
`MSA|AA|${mshControlId}\r`;

    breakdown += `\n------------------------------------------------------------\n` +
      `<strong>Сформированный ответ ЛИС (Подтверждение приема MSA|AA):</strong>\n` +
      `<pre style="background:var(--bg-secondary);padding:0.75rem;border-radius:4px;color:var(--accent-green);font-weight:600;">${ack}</pre>`;

    outputEl.innerHTML = breakdown;
  });

  // =========================================================================
  // TOOL 4: VMOM.xml & .test.map Generator
  // =========================================================================
  const genMappingBtn = document.getElementById('genMappingBtn');
  genMappingBtn?.addEventListener('click', () => {
    const devCode = document.getElementById('mapDevCode')?.value.trim();
    const lisCode = document.getElementById('mapLisCode')?.value.trim();
    const coef = document.getElementById('mapCoef')?.value.trim() || '1.0';
    const qualPos = document.getElementById('mapQualPos')?.value.trim();
    const qualNeg = document.getElementById('mapQualNeg')?.value.trim();
    const skipSymbol = document.getElementById('mapSkipSym')?.value.trim();
    const outputEl = document.getElementById('mappingOutput');

    if (!devCode || !outputEl) return;

    let skipAttr = skipSymbol ? ` SkipSymbols="${skipSymbol}"` : '';
    let xml = `<?xml version="1.0" encoding="windows-1251"?>\n<!-- Строгий порядок тегов: <Test>, <SkipTests>, <AllowTests> -->\n<VMOM version="1.0" description="Value Mapping Object Model">\n  <Model${skipAttr}>\n`;
    xml += `    <Test Name="${devCode}" K="${coef}">\n`;
    if (qualPos) xml += `      <Value DeviceValue="POS" LISValue="${qualPos}" />\n`;
    if (qualNeg) xml += `      <Value DeviceValue="NEG" LISValue="${qualNeg}" />\n`;
    xml += `    </Test>\n`;
    xml += `    <!-- Если требуется фильтрация тестов:\n    <SkipTests>\n      <TestRef Code="DEBUG_TEST"/>\n    </SkipTests>\n    <AllowTests>\n      <TestRef Code="${devCode}"/>\n    </AllowTests>\n    -->\n`;
    xml += `  </Model>\n</VMOM>`;

    let ini = `; Альтернативный строчный формат для .test.map:\n[MAPPING]\n${devCode}=${lisCode || '101'}|${coef}`;

    outputEl.textContent = `${xml}\n\n${ini}`;
  });

  // =========================================================================
  // TOOL 5: Interactive T-SQL Query Generator
  // =========================================================================
  const sqlPresetSelect = document.getElementById('sqlPresetSelect');
  const sqlParam1 = document.getElementById('sqlParam1');
  const sqlParam2 = document.getElementById('sqlParam2');
  const sqlParam1Label = document.getElementById('sqlParam1Label');
  const sqlParam2Label = document.getElementById('sqlParam2Label');
  const genSqlBtn = document.getElementById('genSqlBtn');
  const sqlOutput = document.getElementById('sqlOutput');

  function updateSqlInputs() {
    const val = sqlPresetSelect?.value;
    if (val === 'barcode') {
      sqlParam1Label.textContent = 'Штрихкод пробы:';
      sqlParam1.value = '1002345';
      sqlParam2Label.style.display = 'none';
      sqlParam2.style.display = 'none';
    } else if (val === 'locks') {
      sqlParam1Label.textContent = 'Фильтр по SPID (оставить пустым для всех):';
      sqlParam1.value = '';
      sqlParam2Label.style.display = 'none';
      sqlParam2.style.display = 'none';
    } else if (val === 'unlock') {
      sqlParam1Label.textContent = 'Маска таблицы:';
      sqlParam1.value = '%Dictionary%';
      sqlParam2Label.style.display = 'block';
      sqlParam2Label.textContent = 'ID пользователя (UserId, 0 для всех):';
      sqlParam2.style.display = 'block';
      sqlParam2.value = '0';
    } else if (val === 'device') {
      sqlParam1Label.textContent = 'Код / Название анализатора:';
      sqlParam1.value = 'Sysmex_XN550';
      sqlParam2Label.style.display = 'none';
      sqlParam2.style.display = 'none';
    } else if (val === 'reset') {
      sqlParam1Label.textContent = 'Штрихкод пробы для сброса:';
      sqlParam1.value = '1002345';
      sqlParam2Label.style.display = 'none';
      sqlParam2.style.display = 'none';
    }
  }

  sqlPresetSelect?.addEventListener('change', updateSqlInputs);
  updateSqlInputs();

  genSqlBtn?.addEventListener('click', () => {
    const val = sqlPresetSelect?.value;
    const p1 = sqlParam1?.value.trim();
    const p2 = sqlParam2?.value.trim();

    let query = '';
    if (val === 'barcode') {
      query = 
`-- =========================================================================
-- ПОИСК ПРОБЫ, ЗАКАЗА И ТЕСТОВ ПО ШТРИХКОДУ
-- Проверяет приход пробирки, сопоставленные тесты и значения
-- =========================================================================
DECLARE @Barcode NVARCHAR(50) = '${p1 || '1002345'}';

SELECT 
    s.id AS [SpecimenID],
    s.number AS [ШтрихкодПробы],
    s.status AS [КодСтатусаПробы],
    a.number AS [НомерЗаявкиМИС],
    p.lastName + ' ' + p.firstName + ' ' + ISNULL(p.middleName, '') AS [ФИО_Пациента],
    t.code AS [КодТестаЛИС],
    t.name AS [НазваниеТеста],
    r.value AS [РезультатАнализа],
    r.unit AS [Единицы],
    r.state AS [СтатусТеста],
    r.createdAt AS [ВремяПолучения]
FROM Specimen s
JOIN Application a ON s.ApplicationId = a.id
LEFT JOIN Patient p ON a.PatientId = p.id
LEFT JOIN AnalysisResult r ON r.SpecimenId = s.id
LEFT JOIN Test t ON r.TestId = t.id
WHERE s.number = @Barcode
ORDER BY r.createdAt DESC;`;
    } else if (val === 'locks') {
      query = 
`-- =========================================================================
-- МОНИТОРИНГ ЗАВИСШИХ ТРАНЗАКЦИЙ, БЛОКИРОВОК И ДЕДЛОКОВ
-- Колонка [Блокирующий SPID] указывает на виновника затора
-- =========================================================================
SELECT 
    r.blocking_session_id AS [Блокирующий_SPID],
    r.session_id AS [Ждущий_SPID],
    s.login_name AS [Логин_Пользователя],
    s.host_name AS [Имя_ПК],
    s.program_name AS [Приложение],
    r.wait_type AS [Тип_Ожидания],
    r.wait_time / 1000 AS [Время_Ожидания_Сек],
    SUBSTRING(t.text, (r.statement_start_offset/2)+1, 
        ((CASE r.statement_end_offset WHEN -1 THEN DATALENGTH(t.text)
        ELSE r.statement_end_offset END - r.statement_start_offset)/2) + 1) AS [SQL_Запрос]
FROM sys.dm_exec_requests r
JOIN sys.dm_exec_sessions s ON r.session_id = s.session_id
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.blocking_session_id <> 0
${p1 ? `AND (r.blocking_session_id = ${p1} OR r.session_id = ${p1})` : ''};

-- Если найден виновник (например, SPID 84):
-- KILL 84;`;
    } else if (val === 'unlock') {
      query = 
`-- =========================================================================
-- СНЯТИЕ БЛОКИРОВКИ КРАСНОГО СПРАВОЧНИКА (SystemLock)
-- Внимание: выполнять только если пользователь физически закрыл сессию!
-- =========================================================================
-- 1. Проверяем текущие блокировки справочников
SELECT id, TableName, RecordId, UserId, LockedAt, HostName 
FROM SystemLock 
WHERE TableName LIKE '${p1 || '%Dictionary%'}';

-- 2. Очищаем зависшую блокировку
-- DELETE FROM SystemLock 
-- WHERE TableName LIKE '${p1 || '%Dictionary%'}' ${p2 && p2 !== '0' ? `AND UserId = ${p2}` : ''};`;
    } else if (val === 'device') {
      query = 
`-- =========================================================================
-- ПОСЛЕДНИЕ 50 РЕЗУЛЬТАТОВ С ПРИБОРА (${p1 || 'Sysmex'})
-- Показывает, доходят ли измерения из Сервера Драйверов в БД
-- =========================================================================
SELECT TOP 50
    r.id AS [ResultId],
    s.number AS [Штрихкод],
    d.name AS [Анализатор],
    t.code AS [КодТеста],
    r.value AS [Значение],
    r.unit AS [Единицы],
    r.createdAt AS [ВремяЗаписи]
FROM AnalysisResult r
JOIN Specimen s ON r.SpecimenId = s.id
JOIN Device d ON r.DeviceId = d.id
JOIN Test t ON r.TestId = t.id
WHERE d.name LIKE '%${p1 || 'Sysmex'}%' OR d.code LIKE '%${p1 || 'Sysmex'}%'
ORDER BY r.createdAt DESC;`;
    } else if (val === 'reset') {
      query = 
`-- =========================================================================
-- СБРОС СТАТУСА ПРОБЫ ДЛЯ ПОВТОРНОГО ПРИЕМА С АНАЛИЗАТОРА
-- Переводит пробу из финального статуса в статус готовности к обработке
-- =========================================================================
DECLARE @Barcode NVARCHAR(50) = '${p1 || '1002345'}';

BEGIN TRANSACTION;

-- Обнуляем статус результатов, если нужно перезаписать
DELETE FROM AnalysisResult 
WHERE SpecimenId = (SELECT id FROM Specimen WHERE number = @Barcode);

-- Возвращаем статус пробы в 'Зарегистрирована / В работе' (обычно статус 1 или 2)
UPDATE Specimen 
SET status = 1 
WHERE number = @Barcode;

COMMIT TRANSACTION;
PRINT 'Проба ' + @Barcode + ' успешно сброшена для повторного прогона.';`;
    }

    if (sqlOutput) sqlOutput.textContent = query;
  });

  // =========================================================================
  // TOOL 6: Log Diagnostic Lab & Presets
  // =========================================================================
  const logPresets = {
    nak: {
      log: 
`14:10:01.100> >> <ENQ>
14:10:01.120> << <ACK>
14:10:01.200> >> <STX>1H|\\^&|||LIS||||||||1394-97<CR><ETX>A4<CR><LF>
14:10:01.220> << <ACK>
14:10:01.300> >> <STX>2R|1|^^^GLU|5.4|mmol/L|3.9-6.1|N||F<CR><ETX>8F<CR><LF>
14:10:01.320> WARNING: Check Sum FAILED. Calculated 1C, received 8F.
14:10:01.325> << <NAK>
14:10:01.400> >> <STX>2R|1|^^^GLU|5.4|mmol/L|3.9-6.1|N||F<CR><ETX>8F<CR><LF>
14:10:01.425> << <NAK>`,
      status: 'КРИТИЧЕСКАЯ ОШИБКА: Зацикливание NAK (Checksum Mismatch)',
      cause: 'Анализатор прислал контрольную сумму 8F, но расчет суммы байтов дал 1C. Драйвер справедливо шлет <NAK>, прибор повторяет тот же битый кадр до таймаута.',
      solution: '1. Проверь помехи на кабеле RS-232 (заземление, длина кабеля более 15 метров).\n2. Проверь настройки четности (Parity) и скорости (Baud rate) — рассинхрон скорости искажает хвостовые байты.\n3. Если прибор использует нестандартный расчет (например, не включает ETX в сумму) — в свойствах драйвера включить флаг IgnoreChecksum=True.'
    },
    nobarcode: {
      log: 
`14:20:00.105> >> <ENQ>
14:20:00.110> << <ACK>
14:20:00.150> >> <STX>1H|\\^&|||LIS||||||||1394-97<CR><ETX>A4<CR><LF>
14:20:00.160> << <ACK>
14:20:00.200> >> <STX>2O|1||||^^^WBC\\^^^RBC||20261026||||||||||||||||O<CR><ETX>3E<CR><LF>
14:20:00.210> << <ACK>
14:20:00.250> >> <STX>3R|1|^^^WBC|6.2|10*9/L||N||F<CR><ETX>2A<CR><LF>
14:20:00.260> << <ACK>
14:20:00.300> WARNING: Specimen Barcode is empty in Order record! Results orphaned.`,
      status: 'ОШИБКА ДАННЫХ: Пустой штрихкод в кадре заказа (Order)',
      cause: 'В строке кадра 2O поле штрихкода (2-е поле после |) пустое: 2O|1|||... Сканер анализатора не смог прочесть этикетку или лаборант запустил пробу вручную без ввода номера.',
      solution: '1. Результаты измерения физически получены, но ЛИС не знает, к какому пациенту их привязать.\n2. Лаборанту необходимо переклеить этикетку со штрихкодом (проверить качество печати термопринтера Zebra).\n3. В АРМ лаборатории найти результат в папке "Неопознанные пробы / Ручной разбор" и привязать к пациенту вручную.'
    },
    enq_hang: {
      log: 
`15:00:00.010> >> <ENQ>
15:00:05.015> >> <ENQ>
15:00:10.020> >> <ENQ>
15:00:15.025> ERROR: Handshake timeout. No response from Driver Server. Connection aborted by analyzer.`,
      status: 'СБОЙ КАНАЛА СВЯЗИ: Анализатор стучится <ENQ>, ответа от ЛИС нет',
      cause: 'Прибор запрашивает сессию передачи символом <ENQ>, но Сервер Драйверов не возвращает <ACK>. Прибор отваливается по 15-секундному таймауту.',
      solution: '1. Служба LimsDriverServer остановлена или зависла. Выполни: sc query LimsDriverServer и перезапусти: net stop LimsDriverServer && net start LimsDriverServer.\n2. Завис виртуальный COM-порт Moxa NPort: открой NPort Administrator, сделай Reset Port.\n3. Если COM-порт занят другой утилитой — проверь netstat -ano или закрой putty/com-monitor.'
    },
    xml_err: {
      log: 
`16:00:00.001> Starting driver LimsDrvNet.Architect...
16:00:00.050> Loading mapping file: C:\\LIS\\Mapping\\Architect.VMOM.xml
16:00:00.055> WARNING: Failed to load value mappings: Well-formedness is violated.
16:00:00.056> Context: 'ue DeviceValue="<10" LISValue="Менее 10"'.
16:00:00.060> ERROR: Element 'Test' cannot contain character '<' without escaping.`,
      status: 'КРИТИЧЕСКАЯ ОШИБКА КОНФИГУРАЦИИ: Нарушена валидность XML в VMOM.xml',
      cause: 'В файле VMOM.xml использован сырой символ "<" в значении атрибута DeviceValue="<10". По спецификации XML угловые скобки запрещены в атрибутах.',
      solution: '1. Открой Architect.VMOM.xml в блокноте.\n2. Замени символ < на экранированную сущность &lt; : DeviceValue="&lt;10".\n3. Проверь кодировку файла: строго windows-1251!\n4. Перезапусти драйвер в Сервере Драйверов.'
    },
    unknown_test: {
      log: 
`16:30:00.100> Firing results:
16:30:00.105> Collection Requests contains 1 element(s):
16:30:00.110>   Sample: Id=[1002345]
16:30:00.115>     Collection Works contains 0 element(s)
16:30:00.120> WARNING: Unknown test code [042] received from analyzer. Ignored by mapping.`,
      status: 'НЕСООТВЕТСТВИЕ СПРАВОЧНИКА: Неизвестный код теста прибора',
      cause: 'Анализатор прислал результат с кодом теста 042, но в справочнике "Тесты" ЛИС или файле VMOM.xml нет привязки этого кода к параметру исследования.',
      solution: '1. Открой ТК ЛИС -> Справочники -> Рабочие места -> закладка "Тесты анализатора".\n2. Добавь строку: Код в приборе = 042, Тест ЛИС = Биохимический анализ (АЛТ/Глюкоза).\n3. Если код нужно исключить, добавь в VMOM.xml: <SkipTests><TestRef Code="042"/></SkipTests>.'
    },
    access_violation: {
      log: 
`17:00:00.012> ERROR: Error in InternalSendWorklist: Access violation at address 0842CFE8 in module 'LISDeviceDrivers.dll'. Read of address 00000000.
17:00:00.015> CRITICAL: Driver crashed. WatchDog scheduled restart in 30 seconds.`,
      status: 'КРАШ БИБЛИОТЕКИ: Access Violation в C++ модуле LISDeviceDrivers.dll',
      cause: 'Старый 32-битный C++ драйвер упал из-за несовместимости с новой версией Windows Server 2022/2025 или повреждения системных библиотек.',
      solution: '1. Установи режим совместимости с Windows 7 на исполняемый файл сервера драйверов.\n2. Запусти cmd от Администратора и перерегистрируй библиотеки командой: regdrv.exe в папке драйверов.\n3. Проверь, нет ли современной сборки на .NET 8 в папке \\\\lis50\\buildsystem\\dotnetDrivers_Distrib\\.'
    }
  };

  const logDiagInput = document.getElementById('logDiagInput');
  const analyzeLogBtn = document.getElementById('analyzeLogBtn');
  const logDiagOutput = document.getElementById('logDiagOutput');

  document.querySelectorAll('.preset-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.preset-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const key = pill.getAttribute('data-preset');
      const preset = logPresets[key];
      if (preset && logDiagInput) {
        logDiagInput.value = preset.log;
        runLogDiagnosis(preset.log, preset);
      }
    });
  });

  analyzeLogBtn?.addEventListener('click', () => {
    const raw = logDiagInput?.value || '';
    runLogDiagnosis(raw, null);
  });

  function runLogDiagnosis(text, directPreset) {
    if (!logDiagOutput) return;

    let status = 'В ШТАТНОМ РЕЖИМЕ: Ошибок в логе не обнаружено';
    let statusClass = 'badge-green';
    let cause = 'Сессия обмена выполнена корректно или передан информационный лог.';
    let solution = 'Действий со стороны инженера не требуется.';

    if (directPreset) {
      status = directPreset.status;
      statusClass = status.includes('КРИТИЧЕСКАЯ') ? 'badge-red' : (status.includes('ОШИБКА') ? 'badge-red' : 'badge-amber');
      cause = directPreset.cause;
      solution = directPreset.solution;
    } else {
      if (/check\s*sum\s*failed/i.test(text) || /<<\s*<nak>/i.test(text)) {
        status = 'КРИТИЧЕСКАЯ ОШИБКА: Контрольная сумма не совпадает (NAK loop)';
        statusClass = 'badge-red';
        cause = 'Рассинхронизация расчета контрольной суммы или аппаратный шум в кабеле RS-232.';
        solution = '1. Проверь заземление и качество кабеля.\n2. Сверь расчет контрольной суммы в калькуляторе выше.\n3. Проверь флаг IgnoreChecksum в настройках драйвера.';
      } else if (/barcode\s*is\s*empty/i.test(text) || /\|\|\|\|/i.test(text) && /O\|1/i.test(text)) {
        status = 'ОШИБКА ДАННЫХ: Пустой штрихкод образца';
        statusClass = 'badge-amber';
        cause = 'Анализатор передал результаты без номера пробирки.';
        solution = '1. Переклей штрихкод на пробирке.\n2. В ТК ЛИС привяжи результат через ручной разбор.';
      } else if (/access\s*violation/i.test(text)) {
        status = 'КРАШ МОДУЛЯ: Access Violation в драйвере';
        statusClass = 'badge-red';
        cause = 'Падение нативной DLL драйвера или несовместимость с ОС.';
        solution = '1. Поставь режим совместимости Windows 7.\n2. Выполни regdrv.exe от Администратора.\n3. Переведи прибор на .NET 8 версию драйвера.';
      } else if (/well-formedness\s*is\s*violated/i.test(text) || /failed\s*to\s*load\s*value\s*mappings/i.test(text)) {
        status = 'ОШИБКА КОНФИГУРАЦИИ: Ошибка XML файла маппинга';
        statusClass = 'badge-red';
        cause = 'Синтаксическая ошибка в VMOM.xml (неэкранированный знак < или битая кодировка).';
        solution = '1. Замени < на &lt; и > на &gt; в блокноте.\n2. Сохрани файл строго в кодировке windows-1251.';
      } else if (/unknown\s*test\s*code/i.test(text) || /works\s*contains\s*0/i.test(text)) {
        status = 'НЕСООТВЕТСТВИЕ СПРАВОЧНИКА: Тест прибора не распознан ЛИС';
        statusClass = 'badge-amber';
        cause = 'Анализатор выдал код теста, отсутствующий в настройках рабочего места.';
        solution = 'Добавь код теста в справочник "Рабочие места -> Тесты" или добавь исключение в VMOM.xml.';
      }
    }

    logDiagOutput.innerHTML = `
      <div class="diag-status">
        <span class="badge ${statusClass}">${status}</span>
      </div>
      <div style="margin-bottom:0.75rem;">
        <strong>Первопричина:</strong>
        <p style="margin-top:0.25rem;color:var(--text-primary);">${cause}</p>
      </div>
      <div>
        <strong>Пошаговое решение для инженера:</strong>
        <pre style="margin-top:0.35rem;background:var(--bg-secondary);padding:0.75rem;border-radius:6px;font-size:0.85rem;white-space:pre-wrap;line-height:1.6;">${solution}</pre>
      </div>
    `;
  }

  // Run default preset on page load
  document.querySelector('.preset-pill[data-preset="nak"]')?.click();

  // =========================================================================
  // TOOL 7: Interactive Field Readiness Simulator (Quiz)
  // =========================================================================
  document.querySelectorAll('.quiz-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const parent = opt.closest('.quiz-card');
      if (!parent) return;

      const isCorrect = opt.getAttribute('data-correct') === 'true';
      const explanationEl = parent.querySelector('.quiz-explanation');

      // Disable further changes for this question
      parent.querySelectorAll('.quiz-option').forEach(o => {
        o.classList.remove('selected', 'correct', 'incorrect');
        o.style.pointerEvents = 'none';
        if (o.getAttribute('data-correct') === 'true') {
          o.classList.add('correct');
        }
      });

      if (isCorrect) {
        opt.classList.add('correct');
        if (explanationEl) {
          explanationEl.className = 'quiz-explanation show correct-exp';
          explanationEl.innerHTML = `<strong>Правильно! ✓</strong> ` + (opt.getAttribute('data-feedback') || '');
        }
      } else {
        opt.classList.add('incorrect');
        if (explanationEl) {
          explanationEl.className = 'quiz-explanation show incorrect-exp';
          explanationEl.innerHTML = `<strong>Неверно! ✗</strong> ` + (opt.getAttribute('data-feedback') || '');
        }
      }
    });
  });

  // =========================================================================
  // Initialize Mermaid diagrams
  // =========================================================================
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({
      startOnLoad: true,
      theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'default',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
    });
  }
});
