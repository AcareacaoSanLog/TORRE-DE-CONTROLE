(function () {
  const cepMap = window.TXF_CEP_MAP || {};
  const state = {
    rows: [],
    columns: {},
    detectedColumns: {},
    headers: [],
    currentRows: [],
    stats: null,
    summary: '',
    mapSummary: '',
    managerText: '',
    actionPlanText: '',
    history: [],
    importId: '',
    importFiles: [],
    filters: {
      status: '',
      city: '',
      driver: '',
      scope: ''
    },
    issues: []
  };

  const els = {
    cepCount: document.getElementById('cepCount'),
    lastUpdate: document.getElementById('lastUpdate'),
    emptyState: document.getElementById('emptyState'),
    fileInput: document.getElementById('fileInput'),
    dropZone: document.getElementById('dropZone'),
    columnNotice: document.getElementById('columnNotice'),
    columnNoticeText: document.getElementById('columnNoticeText'),
    columnBadge: document.getElementById('columnBadge'),
    columnMapper: document.getElementById('columnMapper'),
    columnQuality: document.getElementById('columnQuality'),
    previewRows: document.getElementById('previewRows'),
    applyColumnsBtn: document.getElementById('applyColumnsBtn'),
    resetColumnsBtn: document.getElementById('resetColumnsBtn'),
    kpis: document.getElementById('kpis'),
    slaRing: document.getElementById('slaRing'),
    slaPct: document.getElementById('slaPct'),
    slaTitle: document.getElementById('slaTitle'),
    slaText: document.getElementById('slaText'),
    dsRing: document.getElementById('dsRing'),
    dsPct: document.getElementById('dsPct'),
    dsTitle: document.getElementById('dsTitle'),
    dsText: document.getElementById('dsText'),
    targetPace: document.getElementById('targetPace'),
    targetLevers: document.getElementById('targetLevers'),
    priorityList: document.getElementById('priorityList'),
    cityRadar: document.getElementById('cityRadar'),
    assignedRadar: document.getElementById('assignedRadar'),
    operationMap: document.getElementById('operationMap'),
    copyMapBtn: document.getElementById('copyMapBtn'),
    missionBadge: document.getElementById('missionBadge'),
    missionList: document.getElementById('missionList'),
    receivedTable: document.getElementById('receivedTable'),
    assignedTable: document.getElementById('assignedTable'),
    cityTable: document.getElementById('cityTable'),
    driverTable: document.getElementById('driverTable'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    modal: document.getElementById('detailModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalSubtitle: document.getElementById('modalSubtitle'),
    modalSearch: document.getElementById('modalSearch'),
    modalRows: document.getElementById('modalRows'),
    copyRowsBtn: document.getElementById('copyRowsBtn'),
    copySummaryBtn: document.getElementById('copySummaryBtn'),
    copyMissionBtn: document.getElementById('copyMissionBtn'),
    downloadPendingBtn: document.getElementById('downloadPendingBtn'),
    managerSummary: document.getElementById('managerSummary'),
    comparisonCards: document.getElementById('comparisonCards'),
    actionPlan: document.getElementById('actionPlan'),
    historyList: document.getElementById('historyList'),
    copyManagerBtn: document.getElementById('copyManagerBtn'),
    copyActionPlanBtn: document.getElementById('copyActionPlanBtn'),
    exportHistoryBtn: document.getElementById('exportHistoryBtn'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    filterBar: document.getElementById('filterBar'),
    globalStatusFilter: document.getElementById('globalStatusFilter'),
    globalCityFilter: document.getElementById('globalCityFilter'),
    globalDriverFilter: document.getElementById('globalDriverFilter'),
    exportVisibleBtn: document.getElementById('exportVisibleBtn'),
    qualityBadge: document.getElementById('qualityBadge'),
    qualityOverview: document.getElementById('qualityOverview'),
    qualityIssueList: document.getElementById('qualityIssueList'),
    exportIssuesBtn: document.getElementById('exportIssuesBtn'),
    toolsToggle: document.getElementById('toolsToggle'),
    toolsMenu: document.getElementById('toolsMenu')
  };

  const HISTORY_KEY = 'txf-plus-import-history-v1';

  const columnHints = {
    status: ['status', 'shipment status', 'current status', 'delivery status', 'station status'],
    city: ['cidade', 'city', 'buyer city', 'receiver city', 'recipient city'],
    bairro: ['bairro', 'district', 'neighborhood', 'receiver district', 'recipient district'],
    driver: ['driver name', 'driver', 'motorista', 'nome do motorista'],
    tracking: ['sls tracking', 'tracking', 'rastreio', 'awb', 'br', 'order id', 'shipment id'],
    cep: ['zipcode name', 'zipcode', 'zip code', 'cep', 'postal code', 'coluna 1']
  };

  const columnLabels = {
    tracking: 'Tracking / BR',
    status: 'Status',
    cep: 'CEP',
    city: 'Cidade',
    bairro: 'Bairro',
    driver: 'Driver'
  };

  const requiredColumns = ['tracking', 'status', 'cep'];

  const regionRules = [
    { name: 'Teixeira urbano', cities: ['Teixeira de Freitas'] },
    { name: 'Extremo sul norte', cities: ['Itamaraju', 'Jucurucu', 'Jucuruçu', 'Prado', 'Alcobaca', 'Alcobaça'] },
    { name: 'Costa e distritos', cities: ['Caravelas', 'Nova Vicosa', 'Nova Viçosa', 'Posto da Mata', 'Mucuri'] },
    { name: 'Interior oeste', cities: ['Medeiros Neto', 'Itanhem', 'Itanhém', 'Vereda', 'Lajedao', 'Lajedão', 'Ibirapua', 'Ibirapuã'] }
  ];

  const statusConfig = {
    Delivered: { label: 'Delivered', className: 'st-delivered', tone: 'good' },
    Delivering: { label: 'Delivering', className: 'st-delivering', tone: 'normal' },
    Hub_Received: { label: 'Received', className: 'st-received', tone: 'high' },
    Return_Hub_Received: { label: 'Received retorno', className: 'st-received', tone: 'high' },
    Hub_Assigned: { label: 'Assigned', className: 'st-assigned', tone: 'normal' },
    Hub_Assigning: { label: 'Assigning', className: 'st-assigned', tone: 'normal' },
    OnHold: { label: 'OnHold', className: 'st-hold', tone: 'critical' },
    Other: { label: 'Outros', className: 'st-other', tone: 'normal' }
  };

  function clean(value) {
    return repairText(String(value ?? '')).trim();
  }

  function repairText(value) {
    if (!/[ÃÂ�]/.test(value)) return value;
    try {
      const bytes = Uint8Array.from(Array.from(value), char => char.charCodeAt(0) & 255);
      const fixed = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      return fixed || value;
    } catch (error) {
      return value
        .replaceAll('Ã¡', 'á')
        .replaceAll('Ã ', 'à')
        .replaceAll('Ã¢', 'â')
        .replaceAll('Ã£', 'ã')
        .replaceAll('Ã©', 'é')
        .replaceAll('Ãª', 'ê')
        .replaceAll('Ã­', 'í')
        .replaceAll('Ã³', 'ó')
        .replaceAll('Ã´', 'ô')
        .replaceAll('Ãµ', 'õ')
        .replaceAll('Ãº', 'ú')
        .replaceAll('Ã§', 'ç')
        .replaceAll('Ã‡', 'Ç')
        .replaceAll('Â°', '°')
        .replaceAll('Âº', 'º')
        .replaceAll('Âª', 'ª')
        .replaceAll('Â', '');
    }
  }

  function low(value) {
    return clean(value).toLowerCase();
  }

  function html(value) {
    return clean(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function number(value) {
    return Number(value || 0).toLocaleString('pt-BR');
  }

  function percent(part, total) {
    return total ? `${((part / total) * 100).toFixed(2).replace('.', ',')}%` : '0%';
  }

  function percentNumber(part, total) {
    return total ? (part / total) * 100 : 0;
  }

  function loadHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      state.history = Array.isArray(parsed) ? parsed.slice(0, 30) : [];
    } catch (error) {
      state.history = [];
    }
  }

  function persistHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history.slice(0, 30)));
  }

  function previousSnapshot() {
    return state.history.find(item => item.id !== state.importId) || null;
  }

  function createSnapshot(stats) {
    const topCities = Array.from(stats.byCityPending.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const topRegions = Array.from(stats.byRegion.entries()).map(([name, data]) => ({
      name,
      pending: data.pending,
      hold: data.hold,
      received: data.received,
      assigned: data.assigned,
      score: data.hold * 5 + data.received * 3 + data.assigned * 2 + data.delivering
    })).sort((a, b) => b.score - a.score).slice(0, 4);
    const pending = Math.max(stats.total - stats.delivered, 0);
    const sla = percentNumber(stats.delivered, stats.total);

    return {
      id: state.importId || String(Date.now()),
      date: new Date().toISOString(),
      files: state.importFiles.slice(),
      total: stats.total,
      delivered: stats.delivered,
      pending,
      delivering: stats.delivering,
      received: stats.received,
      assigned: stats.assigned,
      hold: stats.hold,
      sla,
      ds: sla,
      topCities,
      topRegions
    };
  }

  function saveCurrentImport() {
    const fullStats = summarizeRows(state.rows);
    if (!fullStats.total) return;
    const snapshot = createSnapshot(fullStats);
    state.history = [snapshot].concat(state.history.filter(item => item.id !== snapshot.id)).slice(0, 30);
    persistHistory();
    state.stats = summarize();
  }

  function deltaValue(current, previous, key) {
    if (!previous) return null;
    return current[key] - previous[key];
  }

  function signed(value, suffix = '') {
    if (value === null || value === undefined) return 'novo';
    const sign = value > 0 ? '+' : '';
    const formatted = typeof value === 'number' && !Number.isInteger(value)
      ? value.toFixed(2).replace('.', ',')
      : number(value);
    return `${sign}${formatted}${suffix}`;
  }

  function normalizeStatus(value) {
    const x = low(value);
    if (!x) return '(vazio)';
    if (x.includes('delivered') || x.includes('entregue')) return 'Delivered';
    if (x.includes('delivering') || x.includes('em rota')) return 'Delivering';
    if (x.includes('return_hub_received')) return 'Return_Hub_Received';
    if (x.includes('hub_received') || x === 'received' || x.includes('received')) return 'Hub_Received';
    if (x.includes('hub_assigning')) return 'Hub_Assigning';
    if (x.includes('hub_assigned')) return 'Hub_Assigned';
    if (x.includes('onhold') || x.includes('on hold') || x.includes('hold')) return 'OnHold';
    if (x.includes('lmhub_packed')) return 'LMHub_Packed';
    if (x.includes('lhtransported')) return 'SOC_LHTransported';
    return clean(value);
  }

  function isReceived(status) {
    return ['Hub_Received', 'Return_Hub_Received'].includes(normalizeStatus(status));
  }

  function isAssigned(status) {
    return ['Hub_Assigned', 'Hub_Assigning'].includes(normalizeStatus(status));
  }

  function detectColumns(rows) {
    const headers = new Set();
    rows.slice(0, 30).forEach(row => Object.keys(row || {}).forEach(key => headers.add(key)));
    const keys = Array.from(headers);
    return Object.fromEntries(Object.entries(columnHints).map(([type, hints]) => {
      const found = keys.find(key => hints.some(hint => low(key).includes(hint)));
      return [type, found || ''];
    }));
  }

  function detectHeaders(rows) {
    const headers = new Set();
    rows.slice(0, 100).forEach(row => Object.keys(row || {}).forEach(key => {
      if (!key.startsWith('__')) headers.add(key);
    }));
    return Array.from(headers);
  }

  function columnCompleteness(type) {
    if (!state.rows.length) return 0;
    return state.rows.filter(row => clean(value(row, type))).length;
  }

  function columnIssues() {
    const missing = requiredColumns.filter(type => !state.columns[type]);
    const lowCoverage = requiredColumns.filter(type => state.columns[type] && columnCompleteness(type) < Math.max(1, state.rows.length * .65));
    return { missing, lowCoverage };
  }

  function qualityStats() {
    const total = state.rows.length || 0;
    const missingCep = state.rows.filter(row => !cepOf(row)).length;
    const unmappedCep = state.rows.filter(row => {
      const cep = cepOf(row);
      return cep && !cepMap[cep] && (!raw(row, 'city') || !raw(row, 'bairro'));
    }).length;
    const missingTracking = state.rows.filter(row => !raw(row, 'tracking')).length;
    const missingDriver = state.rows.filter(row => !raw(row, 'driver')).length;
    return { total, missingCep, unmappedCep, missingTracking, missingDriver };
  }

  function collectIssues() {
    if (!state.rows.length) {
      state.issues = [];
      return state.issues;
    }
    const issues = [];
    const trackingCounts = new Map();
    state.rows.forEach(row => {
      const tracking = value(row, 'tracking');
      if (tracking && tracking !== 'Sem tracking') bump(trackingCounts, tracking);
    });

    const missingColumns = requiredColumns.filter(type => !state.columns[type]);
    missingColumns.forEach(type => {
      issues.push({
        type: 'Coluna obrigatória',
        title: `${columnLabels[type]} não mapeada`,
        detail: 'Corrija na tela Colunas antes de analisar a operação.',
        filter: null
      });
    });

    state.rows.forEach(row => {
      const tracking = value(row, 'tracking');
      const status = statusOf(row);
      const cep = cepOf(row);
      const city = value(row, 'city');
      const driver = value(row, 'driver');

      if (!raw(row, 'tracking')) {
        issues.push({ type: 'Tracking vazio', title: tracking, detail: `Arquivo: ${row.__file || ''}`, filter: null });
      }
      if (trackingCounts.get(tracking) > 1) {
        issues.push({ type: 'Tracking duplicado', title: tracking, detail: `${trackingCounts.get(tracking)} ocorrências encontradas`, filter: { tracking } });
      }
      if (!cep) {
        issues.push({ type: 'CEP vazio', title: tracking, detail: `${status} | ${driver}`, filter: { tracking } });
      } else if (!cepMap[cep] && (!raw(row, 'city') || !raw(row, 'bairro'))) {
        issues.push({ type: 'CEP sem mapa', title: cep, detail: `${tracking} | ${city}`, filter: { tracking } });
      }
      if (!raw(row, 'driver')) {
        issues.push({ type: 'Driver vazio', title: tracking, detail: `${status} | ${city}`, filter: { tracking } });
      }
      if (!statusConfig[status] && !['LMHub_Packed', 'SOC_LHTransported', '(vazio)'].includes(status)) {
        issues.push({ type: 'Status desconhecido', title: status, detail: `${tracking} | ${city}`, filter: { tracking } });
      }
    });

    const seen = new Set();
    state.issues = issues.filter(issue => {
      const key = `${issue.type}|${issue.title}|${issue.detail}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 1000);
    return state.issues;
  }

  function renderQuality() {
    const issues = collectIssues();
    const counts = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});
    els.qualityBadge.textContent = issues.length;
    els.qualityBadge.classList.toggle('hidden', !state.rows.length);
    els.qualityOverview.innerHTML = [
      ['Problemas', issues.length],
      ['Tracking duplicado', counts['Tracking duplicado'] || 0],
      ['CEP sem mapa', counts['CEP sem mapa'] || 0],
      ['Status desconhecido', counts['Status desconhecido'] || 0],
      ['Driver vazio', counts['Driver vazio'] || 0]
    ].map(([label, qty]) => `<div class="quality-card"><strong>${number(qty)}</strong><span>${html(label)}</span></div>`).join('');

    els.qualityIssueList.innerHTML = issues.length ? issues.slice(0, 300).map(issue => `
      <button class="issue-item" type="button" ${issue.filter ? `data-open='${html(JSON.stringify({ kind: 'all', tracking: issue.filter.tracking }))}'` : 'data-view-jump="columns"'}>
        <b class="issue-type">${html(issue.type)}</b>
        <span><strong>${html(issue.title)}</strong><span>${html(issue.detail)}</span></span>
        <b class="severity ${issue.type.includes('Coluna') || issue.type.includes('duplicado') ? 'high' : 'normal'}">${issue.filter ? 'Abrir' : 'Ajustar'}</b>
      </button>
    `).join('') : '<div class="issue-item"><b class="issue-type">OK</b><span><strong>Sem problemas críticos</strong><span>Não encontramos inconsistências na importação atual.</span></span><b class="severity good">OK</b></div>';
  }

  function renderColumnReview() {
    const issues = columnIssues();
    const issueCount = issues.missing.length + issues.lowCoverage.length;
    els.columnBadge.textContent = issueCount;
    els.columnBadge.classList.toggle('hidden', !state.rows.length);
    els.columnNotice.classList.toggle('hidden', !state.rows.length);

    if (!state.rows.length) {
      els.columnMapper.innerHTML = '<p class="muted">Importe uma planilha para revisar as colunas.</p>';
      els.columnQuality.innerHTML = '';
      els.previewRows.innerHTML = '<tr><td colspan="7">Aguardando importação.</td></tr>';
      return;
    }

    els.columnNoticeText.textContent = issueCount
      ? `${issueCount} ponto(s) de atenção no mapeamento. Confira antes de tomar decisão operacional.`
      : 'Colunas principais detectadas. Você ainda pode ajustar manualmente se algo estiver fora.';

    const options = ['<option value="">Não usar</option>'].concat(
      state.headers.map(header => `<option value="${html(header)}">${html(header)}</option>`)
    ).join('');

    els.columnMapper.innerHTML = Object.keys(columnLabels).map(type => {
      const detected = state.detectedColumns[type] || '';
      const current = state.columns[type] || '';
      const coverage = columnCompleteness(type);
      const tag = requiredColumns.includes(type)
        ? '<span class="column-required">Obrigatória</span>'
        : '<span class="column-optional">Opcional</span>';
      return `
        <div class="column-field">
          <label>${html(columnLabels[type])}${tag}</label>
          <select data-column-type="${html(type)}">
            ${options}
          </select>
          <small>${detected ? `Detectada: ${html(detected)}` : 'Não detectada automaticamente'} | ${number(coverage)} preenchidos</small>
        </div>
      `;
    }).join('');

    els.columnMapper.querySelectorAll('select').forEach(select => {
      select.value = state.columns[select.dataset.columnType] || '';
    });

    const qs = qualityStats();
    els.columnQuality.innerHTML = [
      ['Registros', qs.total],
      ['Sem tracking', qs.missingTracking],
      ['Sem CEP', qs.missingCep],
      ['CEP sem mapa', qs.unmappedCep],
      ['Sem driver', qs.missingDriver]
    ].map(([label, qty]) => `<div class="quality-card"><strong>${number(qty)}</strong><span>${html(label)}</span></div>`).join('');

    els.previewRows.innerHTML = state.rows.slice(0, 12).map(row => `
      <tr>
        <td>${html(value(row, 'tracking'))}</td>
        <td>${statusPill(statusOf(row))}</td>
        <td>${html(cepOf(row))}</td>
        <td>${html(value(row, 'city'))}</td>
        <td>${html(value(row, 'bairro'))}</td>
        <td>${html(value(row, 'driver'))}</td>
        <td>${html(row.__file || '')}</td>
      </tr>
    `).join('') || '<tr><td colspan="7">Sem linhas para exibir.</td></tr>';
  }

  function renderGlobalFilters() {
    els.filterBar.classList.toggle('hidden', !state.rows.length);
    const statuses = Array.from(new Set(state.rows.map(row => statusOf(row)))).sort();
    const cities = Array.from(new Set(state.rows.map(row => value(row, 'city')))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const drivers = Array.from(new Set(state.rows.map(row => value(row, 'driver')))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    fillSelect(els.globalStatusFilter, [['', 'Todos'], ['notDelivered', 'Pendentes']], statuses.map(item => [item, item]), state.filters.status);
    fillSelect(els.globalCityFilter, [['', 'Todas']], cities.map(item => [item, item]), state.filters.city);
    fillSelect(els.globalDriverFilter, [['', 'Todos']], drivers.map(item => [item, item]), state.filters.driver);
  }

  function fillSelect(select, leading, options, selected) {
    const current = selected || '';
    select.innerHTML = leading.concat(options).map(([valueText, label]) => `<option value="${html(valueText)}">${html(label)}</option>`).join('');
    select.value = Array.from(select.options).some(option => option.value === current) ? current : '';
  }

  function clearFilters() {
    state.filters = { status: '', city: '', driver: '', scope: '' };
  }

  function raw(row, type) {
    const key = state.columns[type];
    return key ? clean(row[key]) : '';
  }

  function cepOf(row) {
    const digits = clean(raw(row, 'cep')).replace(/\D/g, '');
    return digits ? digits.padStart(8, '0').slice(-8) : '';
  }

  function value(row, type) {
    if (type === 'city' || type === 'bairro') {
      const mapped = cepMap[cepOf(row)] || {};
      const fallback = type === 'city' ? 'Sem cidade' : 'Sem bairro';
      return raw(row, type) || mapped[type === 'city' ? 'cidade' : 'bairro'] || fallback;
    }
    const fallbacks = {
      driver: 'Sem driver',
      tracking: 'Sem tracking',
      status: '(vazio)',
      cep: 'Sem CEP'
    };
    return raw(row, type) || fallbacks[type] || '';
  }

  function statusOf(row) {
    return normalizeStatus(value(row, 'status') || row.__sheet || row.__file);
  }

  function groupKey(parts) {
    return parts.map(part => clean(part).replaceAll('|', '/')).join('|');
  }

  function bump(map, key, amount = 1) {
    map.set(key, (map.get(key) || 0) + amount);
  }

  function rowMatches(row, filter) {
    const status = statusOf(row);
    if (filter.kind === 'notDelivered' && status === 'Delivered') return false;
    if (filter.kind === 'Hub_Received' && !isReceived(status)) return false;
    if (filter.kind === 'Hub_Assigned' && !isAssigned(status)) return false;
    if (filter.kind && !['all', 'notDelivered', 'Hub_Received', 'Hub_Assigned'].includes(filter.kind) && status !== filter.kind) return false;
    if (filter.city && value(row, 'city') !== filter.city) return false;
    if (filter.bairro && value(row, 'bairro') !== filter.bairro) return false;
    if (filter.driver && value(row, 'driver') !== filter.driver) return false;
    return true;
  }

  function filteredRows(filter) {
    return state.rows.filter(row => rowMatches(row, filter));
  }

  function visibleRows() {
    return state.rows.filter(row => {
      const status = statusOf(row);
      const city = value(row, 'city');
      const driver = value(row, 'driver');
      if (state.filters.status === 'notDelivered' && status === 'Delivered') return false;
      if (state.filters.status && state.filters.status !== 'notDelivered' && status !== state.filters.status) return false;
      if (state.filters.city && city !== state.filters.city) return false;
      if (state.filters.driver && driver !== state.filters.driver) return false;
      if (state.filters.scope === 'teixeira' && removeAccents(city) !== 'teixeira de freitas') return false;
      if (state.filters.scope === 'interior' && removeAccents(city) === 'teixeira de freitas') return false;
      return true;
    });
  }

  function rowsByRegion(region) {
    return state.rows.filter(row => statusOf(row) !== 'Delivered' && regionOf(value(row, 'city')) === region);
  }

  function statusPill(status) {
    const key = statusConfig[status] ? status : 'Other';
    return `<span class="status-pill ${statusConfig[key].className}">${html(statusConfig[key].label || status)}</span>`;
  }

  function summarize() {
    return summarizeRows(visibleRows());
  }

  function summarizeRows(sourceRows) {
    const stats = {
      total: sourceRows.length,
      delivered: 0,
      delivering: 0,
      received: 0,
      assigned: 0,
      hold: 0,
      byReceived: new Map(),
      byAssigned: new Map(),
      byAssignedCity: new Map(),
      byCityStatus: new Map(),
      byCity: new Map(),
      byDeliveredCity: new Map(),
      byCityPending: new Map(),
      byRegion: new Map(),
      byDriver: new Map()
    };

    sourceRows.forEach(row => {
      const status = statusOf(row);
      const city = value(row, 'city');
      const bairro = value(row, 'bairro');
      const driver = value(row, 'driver');
      const cityBairro = groupKey([city, bairro]);
      const pending = status !== 'Delivered';
      const region = regionOf(city);

      if (status === 'Delivered') {
        stats.delivered += 1;
        bump(stats.byDeliveredCity, city);
      }
      if (status === 'Delivering') stats.delivering += 1;
      if (status === 'OnHold') stats.hold += 1;
      if (isReceived(status)) {
        stats.received += 1;
        bump(stats.byReceived, cityBairro);
      }
      if (isAssigned(status)) {
        stats.assigned += 1;
        bump(stats.byAssigned, cityBairro);
        bump(stats.byAssignedCity, city);
      }

      bump(stats.byCityStatus, groupKey([status, city, bairro]));
      bump(stats.byCity, city);
      if (pending) bump(stats.byCityPending, city);
      if (!stats.byRegion.has(region)) {
        stats.byRegion.set(region, { total: 0, delivered: 0, pending: 0, received: 0, assigned: 0, delivering: 0, hold: 0, cities: new Map() });
      }
      const regionData = stats.byRegion.get(region);
      regionData.total += 1;
      if (status === 'Delivered') regionData.delivered += 1;
      if (pending) regionData.pending += 1;
      if (isReceived(status)) regionData.received += 1;
      if (isAssigned(status)) regionData.assigned += 1;
      if (status === 'Delivering') regionData.delivering += 1;
      if (status === 'OnHold') regionData.hold += 1;
      bump(regionData.cities, city);

      if (!stats.byDriver.has(driver)) {
        stats.byDriver.set(driver, { Delivered: 0, Delivering: 0, Received: 0, Assigned: 0, OnHold: 0, total: 0 });
      }
      const bucket = stats.byDriver.get(driver);
      if (status === 'Delivered') bucket.Delivered += 1;
      if (status === 'Delivering') bucket.Delivering += 1;
      if (isReceived(status)) bucket.Received += 1;
      if (isAssigned(status)) bucket.Assigned += 1;
      if (status === 'OnHold') bucket.OnHold += 1;
      bucket.total += 1;
    });

    state.stats = stats;
    return stats;
  }

  function regionOf(city) {
    const normalizedCity = removeAccents(city);
    const found = regionRules.find(rule => rule.cities.some(item => removeAccents(item) === normalizedCity));
    return found ? found.name : 'Outras cidades';
  }

  function removeAccents(value) {
    return low(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function renderKpis(stats) {
    const items = [
      ['Total', stats.total, 'Todos os pacotes', 'all'],
      ['Delivered', stats.delivered, percent(stats.delivered, stats.total), 'Delivered'],
      ['Received', stats.received, 'Aguardando avanço', 'Hub_Received'],
      ['Assigned', stats.assigned, 'Atribuidos no hub', 'Hub_Assigned'],
      ['Delivering', stats.delivering, 'Em rota', 'Delivering'],
      ['OnHold', stats.hold, percent(stats.hold, stats.total), 'OnHold']
    ];
    els.kpis.innerHTML = items.map(([label, qty, hint, filter]) => `
      <article class="kpi">
        <button type="button" data-filter="${html(filter)}">
          <span>${html(label)}</span>
          <strong>${number(qty)}</strong>
          <small>${html(hint)}</small>
        </button>
      </article>
    `).join('');
  }

  function renderGoals(stats) {
    const sla = percentNumber(stats.delivered, stats.total);
    const ds = sla;
    const needSla = Math.max(Math.ceil(stats.total * .995) - stats.delivered, 0);
    const needDs = Math.max(Math.ceil(stats.total * .98) - stats.delivered, 0);
    const pending = Math.max(stats.total - stats.delivered, 0);
    const hoursLeft = operationalHoursLeft();
    const requiredNow = Math.max(needSla, needDs);
    const perHour = hoursLeft ? Math.ceil(requiredNow / hoursLeft) : requiredNow;

    updateRing(els.slaRing, els.slaPct, sla, sla >= 99.5);
    updateRing(els.dsRing, els.dsPct, ds, ds >= 98);

    els.slaTitle.textContent = sla >= 99.5 ? 'SLA batido' : `${number(needSla)} pacotes faltando`;
    els.slaText.textContent = `${percent(stats.delivered, stats.total)} entregue de ${number(stats.total)} pacotes.`;
    els.dsTitle.textContent = ds >= 98 ? 'DS batido' : `${number(needDs)} pacotes faltando`;
    els.dsText.textContent = `${percent(stats.delivered, stats.total)} entregue de ${number(stats.total)} pacotes.`;

    els.targetPace.innerHTML = [
      ['Pendentes totais', pending, 'Pacotes ainda não finalizados'],
      ['Faltam para SLA', needSla, 'Meta oficial de 99,5%'],
      ['Faltam para DS', needDs, 'Meta oficial de 98%'],
      ['Ritmo sugerido', perHour, `${hoursLeft} hora(s) operacionais restantes hoje`]
    ].map(([label, qty, note]) => `
      <div class="metric-row">
        <span><strong>${html(label)}</strong><span>${html(note)}</span></span>
        <b class="metric-value">${number(qty)}</b>
      </div>
    `).join('');

    const topPending = Array.from(stats.byCityPending.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const levers = [
      ['Atacar OnHold', stats.hold, 'Maior risco de travar SLA e DS', 'OnHold'],
      ['Avançar Received', stats.received, 'Transforma fila parada em ação de hub', 'Hub_Received'],
      ['Acompanhar Delivering', stats.delivering, 'Confirma o que ja esta em rota', 'Delivering']
    ].filter(item => item[1] > 0);
    if (topPending.length) {
      levers.push([`Top cidade: ${topPending[0][0]}`, topPending[0][1], 'Maior concentração de pendentes', 'notDelivered']);
    }
    els.targetLevers.innerHTML = levers.length ? levers.map(([label, qty, note, filter]) => `
      <button class="metric-row" type="button" data-filter="${html(filter)}">
        <span><strong>${html(label)}</strong><span>${html(note)}</span></span>
        <b class="metric-value">${number(qty)}</b>
      </button>
    `).join('') : '<div class="metric-row"><span><strong>Sem alavancas pendentes</strong><span>Importe dados ou confira colunas para validar.</span></span><b class="metric-value">0</b></div>';

    state.summary = [
      'RESUMO EXECUTIVO - TORRE TXF PLUS',
      '',
      `Total importado: ${number(stats.total)}`,
      `Delivered: ${number(stats.delivered)}`,
      `SLA atual: ${percent(stats.delivered, stats.total)} | Meta: 99,5%`,
      `DS atual: ${percent(stats.delivered, stats.total)} | Meta: 98%`,
      `Faltam para SLA: ${number(needSla)}`,
      `Faltam para DS: ${number(needDs)}`,
      `Received: ${number(stats.received)}`,
      `Hub Assigned: ${number(stats.assigned)}`,
      `Delivering: ${number(stats.delivering)}`,
      `OnHold: ${number(stats.hold)}`,
      `Ritmo sugerido: ${number(perHour)} pacote(s)/hora por ${hoursLeft} hora(s)`,
      '',
      'Prioridade: tratar OnHold, Received e Assigned nas cidades com maior volume.',
      ...topPending.map(([city, qty], index) => `${index + 1}. ${city}: ${number(qty)} pendentes`)
    ].join('\n');
  }

  function operationalHoursLeft() {
    const now = new Date();
    const end = new Date(now);
    end.setHours(18, 0, 0, 0);
    if (now >= end) return 1;
    return Math.max(1, Math.ceil((end - now) / 3600000));
  }

  function updateRing(ring, label, value, done) {
    const capped = Math.min(value, 100);
    const color = done ? 'var(--green)' : value >= 90 ? 'var(--amber)' : 'var(--red)';
    ring.style.background = `conic-gradient(${color} 0 ${capped}%, var(--surface-3) ${capped}% 100%)`;
    label.textContent = `${value.toFixed(2).replace('.', ',')}%`;
  }

  function renderPriority(stats) {
    const rows = [
      ['OnHold', stats.hold, 'Pacotes precisam de tratativa operacional', 'critical', 'OnHold'],
      ['Received', stats.received, 'Pacotes aguardando avanço de status', 'high', 'Hub_Received'],
      ['Assigned', stats.assigned, 'Pacotes atribuídos ou em separação', 'normal', 'Hub_Assigned'],
      ['Delivering', stats.delivering, 'Pacotes em rota para acompanhar', 'normal', 'Delivering']
    ].filter(item => item[1] > 0);

    els.priorityList.innerHTML = rows.length ? rows.map(([title, qty, desc, severity, filter]) => `
      <button class="list-row" type="button" data-filter="${filter}">
        <span><strong>${html(title)}: ${number(qty)}</strong><span>${html(desc)}</span></span>
        <b class="severity ${severity}">${severityLabel(severity)}</b>
      </button>
    `).join('') : `<div class="list-row"><span><strong>Nenhuma pendência crítica</strong><span>Importe ou confira os arquivos para validar a operação.</span></span><b class="severity good">OK</b></div>`;

    els.missionBadge.textContent = rows.length;
    els.missionList.innerHTML = rows.length ? rows.map(([title, qty, desc, severity, filter]) => `
      <button class="list-row" type="button" data-filter="${filter}">
        <span><strong>${html(title)}</strong><span>${number(qty)} pacotes. ${html(desc)}.</span></span>
        <b class="severity ${severity}">${severityLabel(severity)}</b>
      </button>
    `).join('') : '<div class="list-row"><span><strong>Operação sem fila crítica</strong><span>Não há itens pendentes após a importação atual.</span></span><b class="severity good">OK</b></div>';
  }

  function severityLabel(severity) {
    return { critical: 'Crítico', high: 'Alto', normal: 'Monitorar', good: 'OK' }[severity] || 'Info';
  }

  function renderCityRadar(stats) {
    renderCityBars(els.cityRadar, stats.byDeliveredCity, 'Delivered', 'Nenhuma BR entregue por cidade.');
    renderCityBars(els.assignedRadar, stats.byAssignedCity, 'Hub_Assigned', 'Nenhuma BR em Hub Assigned.');
  }

  function renderCityBars(target, sourceMap, kind, emptyText) {
    const cities = Array.from(sourceMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const max = Math.max(...cities.map(item => item[1]), 1);
    target.innerHTML = cities.length ? cities.map(([city, qty]) => `
      <button class="city-line" type="button" data-city="${html(city)}" data-city-kind="${html(kind)}">
        <strong>${html(city)}</strong>
        <span>${number(qty)}</span>
        <div class="bar"><span style="width:${Math.max(4, qty / max * 100)}%"></span></div>
      </button>
    `).join('') : `<p class="muted">${html(emptyText)}</p>`;
  }

  function renderOperationMap(stats) {
    const regions = Array.from(stats.byRegion.entries()).map(([name, data]) => ({
      name,
      ...data,
      score: data.hold * 5 + data.received * 3 + data.assigned * 2 + data.delivering
    })).sort((a, b) => b.score - a.score || b.pending - a.pending);

    state.mapSummary = regions.map(region => {
      const topCities = Array.from(region.cities.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
      return `${region.name}: ${number(region.pending)} pendentes | OnHold ${number(region.hold)} | Received ${number(region.received)} | Assigned ${number(region.assigned)} | Top: ${topCities.map(([city, qty]) => `${city} (${number(qty)})`).join(', ')}`;
    }).join('\n');

    els.operationMap.innerHTML = regions.length ? regions.map(region => {
      const topCities = Array.from(region.cities.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const riskClass = region.score >= 20 || region.hold > 0 ? ' hot' : '';
      const priority = priorityLabel(region);
      return `
        <article class="region-card${riskClass}">
          <div class="region-title">
            <strong>${html(region.name)}</strong>
            <span class="region-score ${html(priority.className)}">${html(priority.label)}</span>
          </div>
          <div class="region-stats">
            <span><b>${number(region.pending)}</b>Pendentes</span>
            <span><b>${number(region.hold)}</b>OnHold</span>
            <span><b>${number(region.received)}</b>Received</span>
            <span><b>${number(region.assigned)}</b>Assigned</span>
          </div>
          <div class="city-chips">
            ${topCities.map(([city, qty]) => `<button class="city-chip" type="button" data-city="${html(city)}">${html(city)} ${number(qty)}</button>`).join('')}
          </div>
          <button class="mini-button" data-region="${html(region.name)}">Abrir pendentes da região</button>
        </article>
      `;
    }).join('') : '<p class="muted">Importe os dados para gerar o mapa operacional.</p>';
  }

  function priorityLabel(region) {
    if (region.hold > 0 || region.score >= 80 || region.pending >= 100) {
      return { label: 'Prioridade alta', className: 'high' };
    }
    if (region.score >= 25 || region.pending >= 30) {
      return { label: 'Prioridade média', className: 'medium' };
    }
    return { label: 'Prioridade baixa', className: 'low' };
  }

  function renderManager(stats) {
    const snapshot = createSnapshot(stats);
    const previous = previousSnapshot();
    const actionItems = buildActionItems(stats, snapshot);
    state.actionPlanText = actionItems.map((item, index) => `${index + 1}. ${item.title} - ${item.detail}`).join('\n');
    state.managerText = buildManagerText(snapshot, previous, actionItems);

    els.managerSummary.value = state.managerText;
    renderComparison(snapshot, previous);
    els.actionPlan.innerHTML = actionItems.length ? actionItems.map((item, index) => `
      <button class="action-item" type="button" ${item.city ? `data-open='${html(JSON.stringify({ kind: 'notDelivered', city: item.city }))}'` : `data-filter="${html(item.filter)}"`}>
        <b class="action-index">${index + 1}</b>
        <span><strong>${html(item.title)}</strong><span>${html(item.detail)}</span></span>
        <b class="severity ${html(item.severity)}">${html(severityLabel(item.severity))}</b>
      </button>
    `).join('') : '<div class="action-item"><b class="action-index">OK</b><span><strong>Sem plano crítico</strong><span>Importe os dados para gerar prioridades.</span></span><b class="severity good">OK</b></div>';
  }

  function buildActionItems(stats, snapshot) {
    const items = [];
    if (stats.hold > 0) {
      items.push({
        title: `Tratar OnHold (${number(stats.hold)})`,
        detail: 'Prioridade máxima: remover bloqueios antes de atacar volume.',
        filter: 'OnHold',
        severity: 'critical'
      });
    }
    if (stats.received > 0) {
      items.push({
        title: `Avançar Received (${number(stats.received)})`,
        detail: 'Separar por cidade/bairro e transformar fila parada em avanço operacional.',
        filter: 'Hub_Received',
        severity: 'high'
      });
    }
    if (stats.assigned > 0) {
      items.push({
        title: `Conferir Assigned (${number(stats.assigned)})`,
        detail: 'Validar atribuição, separação e próximos passos no hub.',
        filter: 'Hub_Assigned',
        severity: 'normal'
      });
    }
    if (stats.delivering > 0) {
      items.push({
        title: `Monitorar Delivering (${number(stats.delivering)})`,
        detail: 'Acompanhar retorno de rota para converter em Delivered.',
        filter: 'Delivering',
        severity: 'normal'
      });
    }
    snapshot.topCities.slice(0, 2).forEach(([city, qty]) => {
      items.push({
        title: `Focar ${city}`,
        detail: `${number(qty)} pendente(s) concentrados na cidade.`,
        filter: 'notDelivered',
        city,
        severity: qty >= 10 ? 'high' : 'normal'
      });
    });
    return items.slice(0, 6);
  }

  function buildManagerText(snapshot, previous, actionItems) {
    const diff = previous ? [
      `Variação vs importação anterior:`,
      `Delivered: ${signed(snapshot.delivered - previous.delivered)}`,
      `Pendentes: ${signed(snapshot.pending - previous.pending)}`,
      `OnHold: ${signed(snapshot.hold - previous.hold)}`,
      `SLA: ${signed(snapshot.sla - previous.sla, ' p.p.')}`
    ] : ['Primeira importação salva no histórico desta sessão.'];
    const topCityText = snapshot.topCities.length
      ? snapshot.topCities.slice(0, 5).map(([city, qty], index) => `${index + 1}. ${city}: ${number(qty)} pendente(s)`).join('\n')
      : 'Sem cidades pendentes.';
    const actions = actionItems.length
      ? actionItems.map((item, index) => `${index + 1}. ${item.title}: ${item.detail}`).join('\n')
      : 'Sem ação crítica identificada.';

    return [
      'RESUMO GERENCIAL - TORRE TXF PLUS',
      `Atualização: ${new Date(snapshot.date).toLocaleString('pt-BR')}`,
      `Arquivos: ${snapshot.files.join(', ') || 'sem nome'}`,
      '',
      `Total: ${number(snapshot.total)}`,
      `Delivered: ${number(snapshot.delivered)} (${snapshot.sla.toFixed(2).replace('.', ',')}%)`,
      `Pendentes: ${number(snapshot.pending)}`,
      `Received: ${number(snapshot.received)} | Assigned: ${number(snapshot.assigned)} | Delivering: ${number(snapshot.delivering)} | OnHold: ${number(snapshot.hold)}`,
      '',
      ...diff,
      '',
      'Cidades críticas:',
      topCityText,
      '',
      'Plano de ação:',
      actions
    ].join('\n');
  }

  function renderComparison(snapshot, previous) {
    const rows = [
      ['Total', snapshot.total, deltaValue(snapshot, previous, 'total')],
      ['Delivered', snapshot.delivered, deltaValue(snapshot, previous, 'delivered')],
      ['Pendentes', snapshot.pending, deltaValue(snapshot, previous, 'pending')],
      ['Received', snapshot.received, deltaValue(snapshot, previous, 'received')],
      ['Assigned', snapshot.assigned, deltaValue(snapshot, previous, 'assigned')],
      ['OnHold', snapshot.hold, deltaValue(snapshot, previous, 'hold')],
      ['SLA', snapshot.sla, previous ? snapshot.sla - previous.sla : null, 'p.p.']
    ];
    els.comparisonCards.innerHTML = rows.map(([label, value, delta, suffix]) => {
      const cls = comparisonTone(label, delta);
      const displayValue = label === 'SLA' ? `${value.toFixed(2).replace('.', ',')}%` : number(value);
      return `
        <div class="comparison-card">
          <span><strong>${html(label)}</strong><span>Atual: ${html(displayValue)}</span></span>
          <b class="delta ${cls}">${html(signed(delta, suffix ? ` ${suffix}` : ''))}</b>
        </div>
      `;
    }).join('');
  }

  function comparisonTone(label, delta) {
    if (delta === null || delta === undefined || delta === 0) return 'flat';
    const higherIsGood = ['Delivered', 'SLA'].includes(label);
    return (delta > 0 && higherIsGood) || (delta < 0 && !higherIsGood) ? 'up' : 'down';
  }

  function renderHistory() {
    if (!state.history.length) {
      els.historyList.innerHTML = '<div class="history-item"><strong>Nenhuma importação salva</strong><span>Aplique o mapeamento de colunas para salvar o primeiro histórico.</span></div>';
      return;
    }
    els.historyList.innerHTML = state.history.map(item => `
      <div class="history-item">
        <span><strong>${new Date(item.date).toLocaleString('pt-BR')}</strong><span>${html(item.files.join(', ') || 'sem nome')}</span></span>
        <span class="history-stat"><b>${number(item.total)}</b><small>Total</small></span>
        <span class="history-stat"><b>${number(item.delivered)}</b><small>Delivered</small></span>
        <span class="history-stat"><b>${number(item.pending)}</b><small>Pendentes</small></span>
        <span class="history-stat"><b>${number(item.received)}</b><small>Received</small></span>
        <span class="history-stat"><b>${number(item.assigned)}</b><small>Assigned</small></span>
        <span class="history-stat"><b>${number(item.hold)}</b><small>OnHold</small></span>
      </div>
    `).join('');
  }

  function mapRows(map, statusFilter) {
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([key, qty]) => {
      const [city, bairro] = key.split('|');
      return `<tr class="clickable">
        <td>${html(city)}</td>
        <td>${html(bairro)}</td>
        <td>${number(qty)}</td>
        <td><button class="mini-button" data-open='${html(JSON.stringify({ kind: statusFilter, city, bairro }))}'>Abrir</button></td>
      </tr>`;
    }).join('') || '<tr><td colspan="4">Nenhum pacote.</td></tr>';
  }

  function renderTables(stats) {
    els.receivedTable.innerHTML = mapRows(stats.byReceived, 'Hub_Received');
    els.assignedTable.innerHTML = mapRows(stats.byAssigned, 'Hub_Assigned');

    els.cityTable.innerHTML = Array.from(stats.byCityStatus.entries()).sort((a, b) => b[1] - a[1]).slice(0, 500).map(([key, qty]) => {
      const [status, city, bairro] = key.split('|');
      return `<tr class="clickable">
        <td>${statusPill(status)}</td>
        <td>${html(city)}</td>
        <td>${html(bairro)}</td>
        <td>${number(qty)}</td>
        <td><button class="mini-button" data-open='${html(JSON.stringify({ kind: status, city, bairro }))}'>Abrir</button></td>
      </tr>`;
    }).join('') || '<tr><td colspan="5">Nenhum pacote.</td></tr>';

    els.driverTable.innerHTML = Array.from(stats.byDriver.entries()).sort((a, b) => b[1].total - a[1].total).slice(0, 500).map(([driver, data]) => `
      <tr class="clickable">
        <td>${html(driver)}</td>
        <td>${number(data.Delivered)}</td>
        <td>${number(data.Delivering)}</td>
        <td>${number(data.Received)}</td>
        <td>${number(data.Assigned)}</td>
        <td>${number(data.OnHold)}</td>
        <td>${number(data.total)}</td>
        <td><button class="mini-button" data-open='${html(JSON.stringify({ kind: 'all', driver }))}'>Abrir</button></td>
      </tr>
    `).join('') || '<tr><td colspan="8">Nenhum driver.</td></tr>';
  }

  function renderAll() {
    const stats = summarize();
    renderColumnReview();
    renderGlobalFilters();
    renderKpis(stats);
    renderGoals(stats);
    renderPriority(stats);
    renderCityRadar(stats);
    renderOperationMap(stats);
    renderManager(stats);
    renderHistory();
    renderQuality();
    renderTables(stats);
    renderSearch();
    els.emptyState.classList.toggle('hidden', stats.total > 0);
    els.lastUpdate.textContent = stats.total ? new Date().toLocaleString('pt-BR') : 'Aguardando importação';
    refreshIcons();
  }

  async function handleFiles(files) {
    if (!files || !files.length) return;
    if (typeof XLSX === 'undefined') {
      alert('A biblioteca XLSX não carregou. Abra com internet ativa para importar planilhas.');
      return;
    }

    const allRows = [];
    for (const file of files) {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      workbook.SheetNames.forEach(sheetName => {
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
        json.forEach(row => allRows.push({ ...row, __file: file.name, __sheet: sheetName }));
      });
    }

    state.rows = allRows;
    state.importId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    state.importFiles = Array.from(files).map(file => file.name);
    clearFilters();
    state.headers = detectHeaders(allRows);
    state.detectedColumns = detectColumns(allRows);
    state.columns = { ...state.detectedColumns };
    renderAll();
    setView('columns');
  }

  function openDetails(filter, title) {
    state.currentRows = filteredRows(filter);
    els.modalTitle.textContent = title || 'Detalhes';
    els.modalSubtitle.textContent = `${number(state.currentRows.length)} pacotes encontrados`;
    els.modalSearch.value = '';
    renderModalRows();
    els.modal.showModal();
    refreshIcons();
  }

  function renderModalRows() {
    const query = low(els.modalSearch.value);
    const rows = state.currentRows.filter(row => !query || low(rowSearchText(row)).includes(query)).slice(0, 1500);
    els.modalRows.innerHTML = rows.map(row => `
      <tr>
        <td>${html(value(row, 'tracking'))}</td>
        <td>${statusPill(statusOf(row))}</td>
        <td>${html(cepOf(row))}</td>
        <td>${html(value(row, 'city'))}</td>
        <td>${html(value(row, 'bairro'))}</td>
        <td>${html(value(row, 'driver'))}</td>
        <td>${html(row.__file || '')}</td>
      </tr>
    `).join('') || '<tr><td colspan="7">Nada encontrado.</td></tr>';
  }

  function rowSearchText(row) {
    return [
      value(row, 'tracking'),
      statusOf(row),
      cepOf(row),
      value(row, 'city'),
      value(row, 'bairro'),
      value(row, 'driver'),
      row.__file,
      row.__sheet
    ].join(' ');
  }

  function renderSearch() {
    const query = low(els.searchInput.value);
    if (!query) {
      els.searchResults.innerHTML = '';
      return;
    }
    const rows = state.rows.filter(row => low(rowSearchText(row)).includes(query)).slice(0, 80);
    els.searchResults.innerHTML = rows.map(row => `
      <button class="list-row" type="button" data-open='${html(JSON.stringify({ kind: 'all', tracking: value(row, 'tracking') }))}'>
        <span><strong>${html(value(row, 'tracking'))}</strong><span>${html(statusOf(row))} | ${html(cepOf(row))} | ${html(value(row, 'city'))} | ${html(value(row, 'bairro'))} | ${html(value(row, 'driver'))}</span></span>
        <b class="severity normal">Abrir</b>
      </button>
    `).join('') || '<p class="muted">Nada encontrado.</p>';
  }

  function copyRows(rows) {
    const text = rows.map(row => [
      value(row, 'tracking'),
      statusOf(row),
      cepOf(row),
      value(row, 'city'),
      value(row, 'bairro'),
      value(row, 'driver'),
      row.__file || ''
    ].join('\t')).join('\n');
    navigator.clipboard?.writeText(text);
  }

  function downloadPending() {
    const rows = filteredRows({ kind: 'notDelivered' });
    downloadRowsCsv(rows, 'pendentes-txf.csv');
  }

  function exportHistory() {
    const header = ['Data', 'Arquivos', 'Total', 'Delivered', 'Pendentes', 'Received', 'Assigned', 'Delivering', 'OnHold', 'SLA'];
    const body = state.history.map(item => [
      new Date(item.date).toLocaleString('pt-BR'),
      item.files.join(' | '),
      item.total,
      item.delivered,
      item.pending,
      item.received,
      item.assigned,
      item.delivering,
      item.hold,
      item.sla.toFixed(2).replace('.', ',') + '%'
    ]);
    const csv = [header, ...body].map(line => line.map(cell => `"${clean(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'historico-importacoes-txf.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function exportVisibleRows() {
    downloadRowsCsv(visibleRows(), 'visao-filtrada-txf.csv');
  }

  function exportIssues() {
    const header = ['Tipo', 'Titulo', 'Detalhe'];
    const body = state.issues.map(issue => [issue.type, issue.title, issue.detail]);
    downloadCsv([header, ...body], 'problemas-dados-txf.csv');
  }

  function sortTableByHeader(th) {
    const table = th.closest('table');
    const tbody = table?.querySelector('tbody');
    if (!table || !tbody) return;
    const index = Array.from(th.parentElement.children).indexOf(th);
    const direction = th.dataset.sortDir === 'asc' ? 'desc' : 'asc';
    th.parentElement.querySelectorAll('th').forEach(cell => delete cell.dataset.sortDir);
    th.dataset.sortDir = direction;
    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.sort((a, b) => compareCells(a.children[index]?.textContent || '', b.children[index]?.textContent || '', direction));
    rows.forEach(row => tbody.appendChild(row));
  }

  function compareCells(a, b, direction) {
    const na = Number(clean(a).replace(/\./g, '').replace(',', '.'));
    const nb = Number(clean(b).replace(/\./g, '').replace(',', '.'));
    const result = Number.isFinite(na) && Number.isFinite(nb)
      ? na - nb
      : clean(a).localeCompare(clean(b), 'pt-BR', { numeric: true, sensitivity: 'base' });
    return direction === 'asc' ? result : -result;
  }

  function downloadRowsCsv(rows, filename) {
    const header = ['Tracking', 'Status', 'CEP', 'Cidade', 'Bairro', 'Driver', 'Arquivo'];
    const body = rows.map(row => [
      value(row, 'tracking'),
      statusOf(row),
      cepOf(row),
      value(row, 'city'),
      value(row, 'bairro'),
      value(row, 'driver'),
      row.__file || ''
    ]);
    downloadCsv([header, ...body], filename);
  }

  function downloadCsv(lines, filename) {
    const csv = lines.map(line => line.map(cell => `"${clean(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function bindEvents() {
    document.querySelectorAll('.nav-button').forEach(button => {
      if (button.dataset.view) button.addEventListener('click', () => setView(button.dataset.view));
    });
    els.toolsToggle.addEventListener('click', () => toggleTools());

    document.body.addEventListener('click', event => {
      const filterButton = event.target.closest('[data-filter]');
      if (filterButton) {
        openDetails({ kind: filterButton.dataset.filter }, `Detalhes: ${filterButton.dataset.filter}`);
      }

      const openButton = event.target.closest('[data-open]');
      if (openButton) {
        const filter = JSON.parse(openButton.dataset.open);
        if (filter.tracking) {
          filter.kind = 'all';
          const tracking = filter.tracking;
          state.currentRows = state.rows.filter(row => value(row, 'tracking') === tracking);
          els.modalTitle.textContent = `Tracking: ${tracking}`;
          els.modalSubtitle.textContent = `${number(state.currentRows.length)} registros encontrados`;
          els.modalSearch.value = '';
          renderModalRows();
          els.modal.showModal();
          refreshIcons();
          return;
        }
        openDetails(filter, filter.driver ? `Driver: ${filter.driver}` : 'Detalhes');
      }

      const cityButton = event.target.closest('[data-city]');
      if (cityButton) {
        const kind = cityButton.dataset.cityKind || 'notDelivered';
        const label = kind === 'Delivered' ? 'Entregues' : kind === 'Hub_Assigned' ? 'Hub Assigned' : 'Pendentes';
        openDetails({ kind, city: cityButton.dataset.city }, `${label}: ${cityButton.dataset.city}`);
      }

      const regionButton = event.target.closest('[data-region]');
      if (regionButton) {
        const region = regionButton.dataset.region;
        state.currentRows = rowsByRegion(region);
        els.modalTitle.textContent = `Região: ${region}`;
        els.modalSubtitle.textContent = `${number(state.currentRows.length)} pendentes encontrados`;
        els.modalSearch.value = '';
        renderModalRows();
        els.modal.showModal();
        refreshIcons();
      }

      const viewJump = event.target.closest('[data-view-jump]');
      if (viewJump) setView(viewJump.dataset.viewJump);

      const sortHeader = event.target.closest('th');
      if (sortHeader) sortTableByHeader(sortHeader);
    });

    els.fileInput.addEventListener('change', event => handleFiles(event.target.files));
    els.searchInput.addEventListener('input', renderSearch);
    els.modalSearch.addEventListener('input', renderModalRows);
    els.copyRowsBtn.addEventListener('click', () => copyRows(state.currentRows));
    els.copySummaryBtn.addEventListener('click', () => navigator.clipboard?.writeText(state.summary || 'Importe os arquivos para gerar o resumo.'));
    els.copyMissionBtn.addEventListener('click', () => navigator.clipboard?.writeText(state.summary || 'Importe os arquivos para gerar a missão.'));
    els.copyMapBtn.addEventListener('click', () => navigator.clipboard?.writeText(state.mapSummary || 'Importe os arquivos para gerar o mapa operacional.'));
    els.copyManagerBtn.addEventListener('click', () => navigator.clipboard?.writeText(state.managerText || 'Importe os arquivos para gerar o resumo gerencial.'));
    els.copyActionPlanBtn.addEventListener('click', () => navigator.clipboard?.writeText(state.actionPlanText || 'Importe os arquivos para gerar o plano de ação.'));
    els.downloadPendingBtn.addEventListener('click', downloadPending);
    els.exportVisibleBtn.addEventListener('click', exportVisibleRows);
    els.exportIssuesBtn.addEventListener('click', exportIssues);
    els.exportHistoryBtn.addEventListener('click', exportHistory);
    els.clearHistoryBtn.addEventListener('click', () => {
      state.history = [];
      persistHistory();
      renderAll();
    });
    els.applyColumnsBtn.addEventListener('click', () => {
      els.columnMapper.querySelectorAll('select').forEach(select => {
        state.columns[select.dataset.columnType] = select.value;
      });
      renderAll();
      saveCurrentImport();
      renderHistory();
      renderManager(state.stats);
      setView('dashboard');
    });
    els.resetColumnsBtn.addEventListener('click', () => {
      state.detectedColumns = detectColumns(state.rows);
      state.columns = { ...state.detectedColumns };
      renderAll();
    });
    els.globalStatusFilter.addEventListener('change', event => {
      state.filters.status = event.target.value;
      renderAll();
    });
    els.globalCityFilter.addEventListener('change', event => {
      state.filters.city = event.target.value;
      renderAll();
    });
    els.globalDriverFilter.addEventListener('change', event => {
      state.filters.driver = event.target.value;
      renderAll();
    });

    document.querySelectorAll('[data-quick-filter]').forEach(button => {
      button.addEventListener('click', () => {
        const type = button.dataset.quickFilter;
        clearFilters();
        if (type === 'pending') state.filters.status = 'notDelivered';
        if (type === 'teixeira') state.filters.scope = 'teixeira';
        if (type === 'interior') state.filters.scope = 'interior';
        renderAll();
      });
    });

    ['dragenter', 'dragover'].forEach(type => els.dropZone.addEventListener(type, event => {
      event.preventDefault();
      els.dropZone.classList.add('dragging');
    }));
    ['dragleave', 'drop'].forEach(type => els.dropZone.addEventListener(type, event => {
      event.preventDefault();
      els.dropZone.classList.remove('dragging');
    }));
    els.dropZone.addEventListener('drop', event => handleFiles(event.dataTransfer.files));
  }

  function setView(id) {
    document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === id));
    document.querySelectorAll('.nav-button').forEach(button => button.classList.toggle('active', button.dataset.view === id));
    const active = document.querySelector(`.nav-button[data-view="${id}"] span`);
    document.getElementById('viewTitle').textContent = active ? active.textContent : 'Dashboard';
    setToolsOpen(['history', 'search'].includes(id));
  }

  function toggleTools(force) {
    const shouldOpen = typeof force === 'boolean' ? force : !els.toolsMenu.classList.contains('open');
    setToolsOpen(shouldOpen);
  }

  function setToolsOpen(open) {
    els.toolsMenu.classList.toggle('open', open);
    els.toolsToggle.classList.toggle('open', open);
    els.toolsToggle.setAttribute('aria-expanded', String(open));
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function init() {
    loadHistory();
    els.cepCount.textContent = number(Object.keys(cepMap).length);
    bindEvents();
    renderAll();
    refreshIcons();
  }

  init();
}());
