(function () {
  const cepMap = window.TXF_CEP_MAP || {};
  const driverDb = window.TXF_DRIVER_DB || { byId: {}, byName: {} };
  const manualDriverCorrections = {
    3839315: { id: '3839315', name: 'RYAN NUNES' },
    702410: { id: '702410', name: 'LUIS ROBERTO CIRQUEIRA SAMPAIO' },
    2074147: { id: '2074147', name: 'RAIQUE DE JESUS SANTOS' },
    2527410: { id: '2527410', name: 'LARIANE SILVA SANTANA' },
    2551853: { id: '2551853', name: 'LUIS EDUARDO PORTO PINHEIRO' },
    2375728: { id: '2375728', name: 'GUSTAVO FERREIRA SANTOS' },
    2140415: { id: '2140415', name: 'PAULO RICARDO LIMA DE JESUS' },
    2066856: { id: '2066856', name: 'NATASHA GOMES LOPES' },
    2139717: { id: '2139717', name: 'PAULO HENRIQUE NOVAIS NUNES' }
  };
  const SUPABASE_URL = 'https://ionlbxgwaqyracpztoiv.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_5W-VMD2kk7OmRP1vpEYJ4g_TZCUB93g';
  const CLOUD_TABLE = 'dashboard_state';
  const CLOUD_ID = 'torre-controle-txf-latest';
  const CLOUD_LH_ID = 'torre-controle-txf-lh';
  let cloudSaveTimer = null;

  const state = {
    rows: [],
    columns: {},
    detectedColumns: {},
    headers: [],
    currentRows: [],
    currentFilter: null,
    stats: null,
    summary: '',
    mapSummary: '',
    managerText: '',
    actionPlanText: '',
    history: [],
    damageRegistry: {},
    treatmentRegistry: {},
    routeCity: '',
    routeCities: [],
    routeViewMode: 'grid',
    routeSelectionTouched: false,
    importId: '',
    importFiles: [],
    filters: {
      status: '',
      city: '',
      driver: '',
      scope: ''
    },
    receivedMonitor: {
      city: '',
      bairro: '',
      sort: 'desc',
      search: ''
    },
    assignedMonitor: {
      city: '',
      bairro: '',
      sort: 'desc',
      search: ''
    },
    lhRows: [],
    lhColumns: {},
    lhFiles: [],
    lhFilter: {
      status: 'all',
      city: '',
      search: ''
    },
    lhRouteCities: [],
    lhRouteViewMode: 'grid',
    lhRouteSelectionTouched: false,
    issues: []
  };

  const els = {
    cepCount: document.getElementById('cepCount'),
    lastUpdate: document.getElementById('lastUpdate'),
    emptyState: document.getElementById('emptyState'),
    fileInput: document.getElementById('fileInput'),
    dropZone: document.getElementById('dropZone'),
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
    receivedCityFilter: document.getElementById('receivedCityFilter'),
    receivedBairroFilter: document.getElementById('receivedBairroFilter'),
    receivedSort: document.getElementById('receivedSort'),
    receivedSearch: document.getElementById('receivedSearch'),
    receivedSearchResults: document.getElementById('receivedSearchResults'),
    assignedTable: document.getElementById('assignedTable'),
    assignedCityFilter: document.getElementById('assignedCityFilter'),
    assignedBairroFilter: document.getElementById('assignedBairroFilter'),
    assignedSort: document.getElementById('assignedSort'),
    assignedSearch: document.getElementById('assignedSearch'),
    assignedSearchResults: document.getElementById('assignedSearchResults'),
    damageForm: document.getElementById('damageForm'),
    damageTracking: document.getElementById('damageTracking'),
    damageBulkTrackings: document.getElementById('damageBulkTrackings'),
    damageCepPreview: document.getElementById('damageCepPreview'),
    damageTreatment: document.getElementById('damageTreatment'),
    damageCityPreview: document.getElementById('damageCityPreview'),
    damageBairroPreview: document.getElementById('damageBairroPreview'),
    damageStats: document.getElementById('damageStats'),
    damageTable: document.getElementById('damageTable'),
    routeCitySelect: document.getElementById('routeCitySelect'),
    routeCityChecklist: document.getElementById('routeCityChecklist'),
    routeDefaultBtn: document.getElementById('routeDefaultBtn'),
    routeAllBtn: document.getElementById('routeAllBtn'),
    routeClearBtn: document.getElementById('routeClearBtn'),
    routeSummary: document.getElementById('routeSummary'),
    routeBairroTable: document.getElementById('routeBairroTable'),
    routeSelectedCities: document.getElementById('routeSelectedCities'),
    routeCityTable: document.getElementById('routeCityTable'),
    copyRouteBtn: document.getElementById('copyRouteBtn'),
    cityTable: document.getElementById('cityTable'),
    driverTable: document.getElementById('driverTable'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    lhFileInput: document.getElementById('lhFileInput'),
    lhStats: document.getElementById('lhStats'),
    lhStatusBars: document.getElementById('lhStatusBars'),
    lhCityRadar: document.getElementById('lhCityRadar'),
    lhBairroRadar: document.getElementById('lhBairroRadar'),
    lhStatusFilter: document.getElementById('lhStatusFilter'),
    lhCityFilter: document.getElementById('lhCityFilter'),
    lhSearch: document.getElementById('lhSearch'),
    lhExportBtn: document.getElementById('lhExportBtn'),
    lhClearBtn: document.getElementById('lhClearBtn'),
    lhTable: document.getElementById('lhTable'),
    lhRouteDefaultBtn: document.getElementById('lhRouteDefaultBtn'),
    lhRouteAllBtn: document.getElementById('lhRouteAllBtn'),
    lhRouteClearBtn: document.getElementById('lhRouteClearBtn'),
    lhRouteCityChecklist: document.getElementById('lhRouteCityChecklist'),
    lhRouteSummary: document.getElementById('lhRouteSummary'),
    lhRouteBairroTable: document.getElementById('lhRouteBairroTable'),
    lhRouteSelectedCities: document.getElementById('lhRouteSelectedCities'),
    lhRouteCityTable: document.getElementById('lhRouteCityTable'),
    copyLhRouteBtn: document.getElementById('copyLhRouteBtn'),
    modal: document.getElementById('detailModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalSubtitle: document.getElementById('modalSubtitle'),
    modalSearch: document.getElementById('modalSearch'),
    modalHeader: document.getElementById('modalHeader'),
    modalRows: document.getElementById('modalRows'),
    copyRowsBtn: document.getElementById('copyRowsBtn'),
    copySummaryBtn: document.getElementById('copySummaryBtn'),
    copyMissionBtn: document.getElementById('copyMissionBtn'),
    downloadPendingBtn: document.getElementById('downloadPendingBtn'),
    managerSummary: document.getElementById('managerSummary'),
    comparisonCards: document.getElementById('comparisonCards'),
    actionPlan: document.getElementById('actionPlan'),
    historyList: document.getElementById('historyList'),
    historyEvolution: document.getElementById('historyEvolution'),
    historyCityChanges: document.getElementById('historyCityChanges'),
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
    toolsMenu: document.getElementById('toolsMenu'),
    monitorToggle: document.getElementById('monitorToggle'),
    monitorMenu: document.getElementById('monitorMenu'),
    lhToggle: document.getElementById('lhToggle'),
    lhMenu: document.getElementById('lhMenu'),
    cloudStatus: document.getElementById('cloudStatus'),
    loadCloudBtn: document.getElementById('loadCloudBtn'),
    saveCloudBtn: document.getElementById('saveCloudBtn')
  };

  const HISTORY_KEY = 'txf-plus-import-history-v1';
  const LH_STORAGE_KEY = 'txf-plus-lh-control-v1';
  const HISTORY_LIMIT = 120;

  const columnHints = {
    status: ['status', 'shipment status', 'current status', 'delivery status', 'station status'],
    city: ['cidade', 'city', 'buyer city', 'receiver city', 'recipient city'],
    bairro: ['bairro', 'district', 'neighborhood', 'receiver district', 'recipient district'],
    driverId: ['driver id', 'driver_id', 'driverid', 'id driver', 'id motorista', 'motorista id'],
    driver: ['driver name', 'nome do motorista', 'motorista', 'driver'],
    tracking: ['sls tracking', 'tracking', 'rastreio', 'awb', 'br', 'order id', 'shipment id'],
    cep: ['zipcode name', 'zipcode', 'zip code', 'cep', 'postal code', 'coluna 1']
  };

  const columnLabels = {
    tracking: 'Tracking / BR',
    status: 'Status',
    cep: 'CEP',
    city: 'Cidade',
    bairro: 'Bairro',
    driverId: 'Driver ID',
    driver: 'Driver'
  };

  const requiredColumns = ['tracking', 'status', 'cep'];

  const regionRules = [
    { name: 'Teixeira urbano', cities: ['Teixeira de Freitas'] },
    { name: 'Extremo sul norte', cities: ['Itamaraju', 'Jucurucu', 'JucuruÃ§u', 'Prado', 'Alcobaca', 'AlcobaÃ§a'] },
    { name: 'Costa e distritos', cities: ['Caravelas', 'Nova Vicosa', 'Nova ViÃ§osa', 'Posto da Mata', 'Mucuri'] },
    { name: 'Interior oeste', cities: ['Medeiros Neto', 'Itanhem', 'ItanhÃ©m', 'Vereda', 'Lajedao', 'LajedÃ£o', 'Ibirapua', 'IbirapuÃ£'] }
  ];

  const statusConfig = {
    Delivered: { label: 'Delivered', className: 'st-delivered', tone: 'good' },
    Delivering: { label: 'Delivering', className: 'st-delivering', tone: 'normal' },
    Hub_Received: { label: 'Received', className: 'st-received', tone: 'high' },
    Return_Hub_Received: { label: 'Received retorno', className: 'st-received', tone: 'high' },
    Hub_Assigned: { label: 'Assigned', className: 'st-assigned', tone: 'normal' },
    Hub_Assigning: { label: 'Assigning', className: 'st-assigned', tone: 'normal' },
    SOC_LHTransported: { label: 'SOC LH', className: 'st-soc-lh', tone: 'normal' },
    Avaria: { label: 'Avaria', className: 'st-damage', tone: 'high' },
    OnHold: { label: 'OnHold', className: 'st-hold', tone: 'critical' },
    Other: { label: 'Outros', className: 'st-other', tone: 'normal' }
  };

  function clean(value) {
    return repairText(String(value ?? '')).trim();
  }

  function repairText(value) {
    if (!/[ÃƒÃ‚ï¿½]/.test(value)) return value;
    try {
      const bytes = Uint8Array.from(Array.from(value), char => char.charCodeAt(0) & 255);
      const fixed = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      return fixed || value;
    } catch (error) {
      return value
        .replaceAll('ÃƒÂ¡', 'Ã¡')
        .replaceAll('Ãƒ ', 'Ã ')
        .replaceAll('ÃƒÂ¢', 'Ã¢')
        .replaceAll('ÃƒÂ£', 'Ã£')
        .replaceAll('ÃƒÂ©', 'Ã©')
        .replaceAll('ÃƒÂª', 'Ãª')
        .replaceAll('ÃƒÂ­', 'Ã­')
        .replaceAll('ÃƒÂ³', 'Ã³')
        .replaceAll('ÃƒÂ´', 'Ã´')
        .replaceAll('ÃƒÂµ', 'Ãµ')
        .replaceAll('ÃƒÂº', 'Ãº')
        .replaceAll('ÃƒÂ§', 'Ã§')
        .replaceAll('Ãƒâ€¡', 'Ã‡')
        .replaceAll('Ã‚Â°', 'Â°')
        .replaceAll('Ã‚Âº', 'Âº')
        .replaceAll('Ã‚Âª', 'Âª')
        .replaceAll('Ã‚', '');
    }
  }

  function low(value) {
    return clean(value).toLowerCase();
  }

  function normalizeTextKey(value) {
    return low(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
  }

  function driverIdKey(value) {
    const text = clean(value).replaceAll("'", '').replace(',', '.');
    if (!text) return '';
    const numeric = Number(text);
    if (Number.isFinite(numeric)) return String(Math.trunc(numeric));
    return text.replace(/\D/g, '');
  }

  function driverRecordById(driverId) {
    const key = driverIdKey(driverId);
    return manualDriverCorrections[key] || driverDb.byId?.[key] || null;
  }

  function driverRecordByName(name) {
    const id = driverDb.byName?.[normalizeTextKey(name)];
    return id ? driverRecordById(id) : null;
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

  function plural(value, singular, pluralText) {
    return Number(value) === 1 ? singular : pluralText;
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
      state.history = Array.isArray(parsed) ? parsed.slice(0, HISTORY_LIMIT) : [];
    } catch (error) {
      state.history = [];
    }
  }

  function persistHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history.slice(0, HISTORY_LIMIT)));
  }

  function persistLhControl() {
    try {
      localStorage.setItem(LH_STORAGE_KEY, JSON.stringify({
        savedAt: new Date().toISOString(),
        rows: state.lhRows,
        columns: state.lhColumns,
        files: state.lhFiles
      }));
      return true;
    } catch (error) {
      console.warn('persistLhControl', error);
      alert('A triagem LH foi importada, mas nao coube no armazenamento do navegador. Se apertar F5, talvez precise importar novamente.');
      return false;
    }
  }

  function loadLhControl() {
    try {
      const payload = JSON.parse(localStorage.getItem(LH_STORAGE_KEY) || 'null');
      if (!payload || !Array.isArray(payload.rows)) return;
      state.lhRows = payload.rows;
      state.lhColumns = payload.columns || detectColumns(payload.rows);
      state.lhFiles = Array.isArray(payload.files) ? payload.files : ['triagem LH salva'];
      state.lhFilter = { status: 'all', city: '', search: '' };
      state.lhRouteCities = [];
      state.lhRouteSelectionTouched = false;
    } catch (error) {
      console.warn('loadLhControl', error);
      localStorage.removeItem(LH_STORAGE_KEY);
    }
  }

  function lhCloudPayload() {
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      files: state.lhFiles.slice(),
      rows: state.lhRows,
      columns: state.lhColumns
    };
  }

  function applyLhCloudPayload(payload) {
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    state.lhRows = rows;
    state.lhColumns = payload?.columns || detectColumns(rows);
    state.lhFiles = Array.isArray(payload?.files) ? payload.files : [];
    state.lhFilter = { status: 'all', city: '', search: '' };
    state.lhRouteCities = [];
    state.lhRouteSelectionTouched = false;
    if (rows.length) persistLhControl();
    else localStorage.removeItem(LH_STORAGE_KEY);
    renderLhControl();
  }

  async function saveLhCloudState(options = {}) {
    if (!state.lhRows.length && !options.allowEmpty) {
      if (!options.silent) setCloudStatus('Nuvem LH: importe a triagem antes de salvar.', 'warn');
      return false;
    }
    const payload = lhCloudPayload();
    if (!options.silent) setCloudStatus('Nuvem LH: salvando triagem...', 'warn');
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${CLOUD_TABLE}?on_conflict=id`, {
        method: 'POST',
        headers: cloudHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify({ id: CLOUD_LH_ID, payload, updated_at: payload.savedAt })
      });
      if (!response.ok) throw new Error(await response.text());
      if (!options.silent) setCloudStatus(`Nuvem LH: triagem salva em ${new Date(payload.savedAt).toLocaleString('pt-BR')}.`, 'ok');
      return true;
    } catch (error) {
      if (!options.silent) setCloudStatus('Nuvem LH: nao foi possivel salvar a triagem.', 'error');
      console.warn('saveLhCloudState', error);
      return false;
    }
  }

  async function loadLhCloudState(options = {}) {
    if (!options.silent) setCloudStatus('Nuvem LH: carregando triagem...', 'warn');
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${CLOUD_TABLE}?id=eq.${encodeURIComponent(CLOUD_LH_ID)}&select=payload,updated_at`, {
        headers: cloudHeaders()
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      if (!data.length) {
        if (!options.silent) setCloudStatus('Nuvem LH: nenhuma triagem salva ainda.', 'warn');
        return false;
      }
      applyLhCloudPayload(data[0].payload);
      const savedAt = data[0].updated_at || data[0].payload?.savedAt;
      if (!options.silent) setCloudStatus(`Nuvem LH: triagem carregada de ${new Date(savedAt).toLocaleString('pt-BR')}.`, 'ok');
      return true;
    } catch (error) {
      if (!options.silent) setCloudStatus('Nuvem LH: nao foi possivel carregar a triagem.', 'error');
      console.warn('loadLhCloudState', error);
      return false;
    }
  }

  function clearLhControl() {
    state.lhRows = [];
    state.lhColumns = {};
    state.lhFiles = [];
    state.lhFilter = { status: 'all', city: '', search: '' };
    state.lhRouteCities = [];
    state.lhRouteSelectionTouched = false;
    localStorage.removeItem(LH_STORAGE_KEY);
    if (els.lhFileInput) els.lhFileInput.value = '';
    if (isLhModal()) {
      state.currentRows = [];
      if (els.modal?.open) els.modal.close();
    }
    renderLhControl();
    if (document.querySelector('.view.active')?.id === 'lh-route') setView('lh');
    saveLhCloudState({ allowEmpty: true, silent: true });
  }

  function previousSnapshot() {
    return state.history.find(item => item.id !== state.importId) || null;
  }

  function createSnapshot(stats) {
    const topCities = Array.from(stats.byCityPending.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const cityCritical = cityCriticalSnapshot(stats);
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
      socLH: stats.socLH,
      received: stats.received,
      assigned: stats.assigned,
      hold: stats.hold,
      sla,
      ds: sla,
      topCities,
      cityCritical,
      topRegions
    };
  }

  function criticalScore(data) {
    return Number(data?.received || 0) + Number(data?.assigned || 0) + Number(data?.socLH || 0) + Number(data?.hold || 0);
  }

  function cityCriticalSnapshot(stats) {
    const cities = new Map();
    const ensureCity = city => {
      if (!cities.has(city)) {
        cities.set(city, {
          city,
          total: stats.byCity.get(city) || 0,
          pending: stats.byCityPending.get(city) || 0,
          received: 0,
          assigned: 0,
          socLH: 0,
          hold: 0
        });
      }
      return cities.get(city);
    };

    stats.byCity.forEach((qty, city) => {
      const entry = ensureCity(city);
      entry.total = qty;
    });

    stats.byCityStatus.forEach((qty, key) => {
      const [status, city] = key.split('|');
      const entry = ensureCity(city);
      if (isReceived(status)) entry.received += qty;
      if (isAssigned(status)) entry.assigned += qty;
      if (status === 'SOC_LHTransported') entry.socLH += qty;
      if (status === 'OnHold') entry.hold += qty;
    });

    return Array.from(cities.values())
      .map(entry => ({ ...entry, critical: criticalScore(entry) }))
      .sort((a, b) => b.critical - a.critical || b.pending - a.pending || a.city.localeCompare(b.city, 'pt-BR'));
  }

  function saveCurrentImport() {
    const fullStats = summarizeRows(state.rows);
    if (!fullStats.total) return;
    const snapshot = createSnapshot(fullStats);
    state.history = [snapshot].concat(state.history.filter(item => item.id !== snapshot.id)).slice(0, HISTORY_LIMIT);
    persistHistory();
    state.stats = summarize();
  }

  function deltaValue(current, previous, key) {
    if (!previous) return null;
    return Number(current[key] || 0) - Number(previous[key] || 0);
  }

  function signed(value, suffix = '') {
    if (value === null || value === undefined) return 'novo';
    const sign = value > 0 ? '+' : '';
    const formatted = typeof value === 'number' && !Number.isInteger(value)
      ? value.toFixed(2).replace('.', ',')
      : number(value);
    return `${sign}${formatted}${suffix}`;
  }

  function setCloudStatus(message, type = '') {
    els.cloudStatus.textContent = message;
    els.cloudStatus.className = `cloud-status ${type}`.trim();
  }

  function cloudHeaders(extra = {}) {
    return {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...extra
    };
  }

  function normalizedCloudRows() {
    return state.rows.map(row => ({
      tracking: value(row, 'tracking'),
      status: statusOf(row),
      cep: cepOf(row),
      city: value(row, 'city'),
      bairro: value(row, 'bairro'),
      driverId: value(row, 'driverId'),
      driver: value(row, 'driver'),
      __file: row.__file || '',
      __sheet: row.__sheet || '',
      __txfRowId: row.__txfRowId || '',
      __txfTratativa: row.__txfTratativa || '',
      __txfStatusOverride: row.__txfStatusOverride || '',
      __txfStatusAction: row.__txfStatusAction || '',
      __txfDamage: row.__txfDamage || '',
      __txfDamageCreatedAt: row.__txfDamageCreatedAt || ''
    }));
  }

  function normalizedDamageRegistry() {
    return Object.fromEntries(Object.entries(state.damageRegistry || {}).map(([key, item]) => [key, {
      tracking: item.tracking || key,
      cep: item.cep || '',
      city: item.city || '',
      bairro: item.bairro || '',
      treatment: item.treatment || '',
      createdAt: item.createdAt || ''
    }]));
  }

  function buildTreatmentRegistryFromRows(rows) {
    return rows.reduce((registry, row) => {
      const key = trackingKey(row.tracking || row.__tracking || row.__txfTracking || row.tracking_code || value(row, 'tracking') || '');
      if (!key) return registry;
      const treatment = row.__txfTratativa || '';
      const statusAction = row.__txfStatusAction || '';
      const statusOverride = row.__txfStatusOverride || '';
      if (treatment || statusAction || statusOverride) {
        registry[key] = {
          tracking: key,
          treatment,
          statusAction,
          statusOverride,
          updatedAt: row.__txfTreatmentUpdatedAt || new Date().toISOString()
        };
      }
      return registry;
    }, {});
  }

  function normalizedTreatmentRegistry() {
    captureTreatmentRegistryFromRows();
    return Object.fromEntries(Object.entries(state.treatmentRegistry || {}).map(([key, item]) => [key, {
      tracking: item.tracking || key,
      treatment: item.treatment || '',
      statusAction: item.statusAction || '',
      statusOverride: item.statusOverride || '',
      updatedAt: item.updatedAt || ''
    }]));
  }

  function normalizedHistory() {
    return (state.history || []).slice(0, HISTORY_LIMIT).map(item => ({
      ...item,
      files: Array.isArray(item.files) ? item.files : [],
      topCities: Array.isArray(item.topCities) ? item.topCities : [],
      topRegions: Array.isArray(item.topRegions) ? item.topRegions : [],
      cityCritical: Array.isArray(item.cityCritical) ? item.cityCritical : []
    }));
  }

  function applyHistoryFromCloud(history) {
    if (!Array.isArray(history)) return;
    const byId = new Map();
    normalizedHistory().concat(history).forEach(item => {
      if (!item?.id) return;
      byId.set(item.id, {
        ...item,
        socLH: Number(item.socLH || 0),
        cityCritical: Array.isArray(item.cityCritical) ? item.cityCritical : []
      });
    });
    state.history = Array.from(byId.values())
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, HISTORY_LIMIT);
    persistHistory();
  }

  function applyCloudRows(payload) {
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    state.rows = rows;
    state.headers = ['tracking', 'status', 'cep', 'city', 'bairro', 'driverId', 'driver'];
    state.detectedColumns = {
      tracking: 'tracking',
      status: 'status',
      cep: 'cep',
      city: 'city',
      bairro: 'bairro',
      driverId: 'driverId',
      driver: 'driver'
    };
    state.columns = { ...state.detectedColumns };
    state.damageRegistry = payload?.damageRegistry || buildDamageRegistryFromRows(rows);
    state.treatmentRegistry = {
      ...buildTreatmentRegistryFromRows(rows),
      ...(payload?.treatmentRegistry || {})
    };
    state.importFiles = Array.isArray(payload?.files) ? payload.files : ['importaÃ§Ã£o salva na nuvem'];
    state.importId = `cloud-${payload?.savedAt || Date.now()}`;
    state.routeCities = [];
    state.routeCity = '';
    state.routeSelectionTouched = false;
    applyHistoryFromCloud(payload?.history);
    ensureRowIds();
    applyDamageRegistryToRows();
    applyTreatmentRegistryToRows();
    clearFilters();
    renderAll();
  }

  async function saveCloudState() {
    if (!state.rows.length) {
      setCloudStatus('Nuvem: importe uma planilha antes de salvar.', 'warn');
      return false;
    }
    const payload = {
      version: 1,
      savedAt: new Date().toISOString(),
      files: state.importFiles.slice(),
      rows: normalizedCloudRows(),
      damageRegistry: normalizedDamageRegistry(),
      treatmentRegistry: normalizedTreatmentRegistry(),
      history: normalizedHistory()
    };

    setCloudStatus('Nuvem: salvando Ãºltima importaÃ§Ã£o...', 'warn');
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${CLOUD_TABLE}?on_conflict=id`, {
        method: 'POST',
        headers: cloudHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify({ id: CLOUD_ID, payload, updated_at: payload.savedAt })
      });
      if (!response.ok) throw new Error(await response.text());
      setCloudStatus(`Nuvem: Ãºltima importaÃ§Ã£o salva em ${new Date(payload.savedAt).toLocaleString('pt-BR')}.`, 'ok');
      return true;
    } catch (error) {
      setCloudStatus('Nuvem: nÃ£o foi possÃ­vel salvar. Confira se a tabela do Supabase foi criada.', 'error');
      console.warn('saveCloudState', error);
      return false;
    }
  }

  function scheduleCloudSave(delay = 900) {
    if (!state.rows.length) return;
    window.clearTimeout(cloudSaveTimer);
    cloudSaveTimer = window.setTimeout(() => saveCloudState(), delay);
  }

  async function loadCloudState(options = {}) {
    if (!options.silent) setCloudStatus('Nuvem: carregando Ãºltima importaÃ§Ã£o...', 'warn');
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${CLOUD_TABLE}?id=eq.${encodeURIComponent(CLOUD_ID)}&select=payload,updated_at`, {
        headers: cloudHeaders()
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      if (!data.length) {
        setCloudStatus('Nuvem: nenhuma importaÃ§Ã£o salva ainda.', 'warn');
        return false;
      }
      applyCloudRows(data[0].payload);
      const savedAt = data[0].updated_at || data[0].payload?.savedAt;
      setCloudStatus(`Nuvem: importaÃ§Ã£o carregada de ${new Date(savedAt).toLocaleString('pt-BR')}.`, 'ok');
      setView('dashboard');
      return true;
    } catch (error) {
      setCloudStatus(options.silent ? 'Nuvem: configure a tabela para carregar dados compartilhados.' : 'Nuvem: nÃ£o foi possÃ­vel carregar. Confira a tabela do Supabase.', options.silent ? 'warn' : 'error');
      console.warn('loadCloudState', error);
      return false;
    }
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

  function trackingKey(value) {
    return clean(value).toUpperCase();
  }

  function ensureRowIds() {
    state.rows.forEach((row, index) => {
      if (!row.__txfRowId) row.__txfRowId = `txf-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
    });
  }

  function buildDamageRegistryFromRows(rows) {
    return rows.filter(row => row.__txfDamage).reduce((registry, row) => {
      const key = trackingKey(row.tracking || row.__tracking || row.__txfTracking || row.tracking_code || '');
      if (key) {
        registry[key] = {
          tracking: key,
          cep: row.cep || '',
          city: row.city || '',
          bairro: row.bairro || '',
          treatment: row.__txfTratativa || 'Avaria registrada',
          createdAt: row.__txfDamageCreatedAt || ''
        };
      }
      return registry;
    }, {});
  }

  function registerDamage(tracking, lookup, treatment) {
    const key = trackingKey(tracking);
    if (!key) return null;
    state.damageRegistry[key] = {
      tracking: key,
      cep: lookup.cep || '',
      city: lookup.city || '',
      bairro: lookup.bairro || '',
      treatment: treatment || 'Avaria registrada',
      createdAt: state.damageRegistry[key]?.createdAt || new Date().toISOString()
    };
    return state.damageRegistry[key];
  }

  function applyDamageRegistryToRows() {
    state.rows.forEach(row => {
      const registryItem = state.damageRegistry[trackingKey(value(row, 'tracking'))];
      if (!registryItem) return;
      row.__txfDamage = '1';
      row.__txfDamageCreatedAt = registryItem.createdAt || row.__txfDamageCreatedAt || '';
      if (!row.__txfTratativa) row.__txfTratativa = registryItem.treatment || 'Avaria registrada';
      if (!raw(row, 'cep') && registryItem.cep) row.cep = registryItem.cep;
      if (!raw(row, 'city') && registryItem.city) row.city = registryItem.city;
      if (!raw(row, 'bairro') && registryItem.bairro) row.bairro = registryItem.bairro;
    });
  }

  function rememberTreatment(row) {
    const key = trackingKey(value(row, 'tracking'));
    if (!key) return;
    const treatment = row.__txfTratativa || '';
    const statusAction = row.__txfStatusAction || '';
    const statusOverride = row.__txfStatusOverride || '';
    if (!treatment && !statusAction && !statusOverride) {
      delete state.treatmentRegistry[key];
      return;
    }
    state.treatmentRegistry[key] = {
      tracking: key,
      treatment,
      statusAction,
      statusOverride,
      updatedAt: new Date().toISOString()
    };
  }

  function captureTreatmentRegistryFromRows() {
    state.rows.forEach(row => {
      if (row.__txfTratativa || row.__txfStatusAction || row.__txfStatusOverride) rememberTreatment(row);
    });
  }

  function applyTreatmentRegistryToRows() {
    state.rows.forEach(row => {
      const registryItem = state.treatmentRegistry[trackingKey(value(row, 'tracking'))];
      if (!registryItem) return;
      const realStatus = normalizeStatus(raw(row, 'status') || row.status || row.__sheet || row.__file);
      if (registryItem.treatment) row.__txfTratativa = registryItem.treatment;
      if (registryItem.statusAction) row.__txfStatusAction = registryItem.statusAction;
      if (registryItem.statusOverride && isReceived(realStatus)) {
        row.__txfStatusOverride = registryItem.statusOverride;
      }
      row.__txfTreatmentUpdatedAt = registryItem.updatedAt || row.__txfTreatmentUpdatedAt || '';
    });
  }

  function isDamageRow(row) {
    return Boolean(row.__txfDamage);
  }

  function detectColumns(rows) {
    const headers = new Set();
    rows.slice(0, 30).forEach(row => Object.keys(row || {}).forEach(key => headers.add(key)));
    const keys = Array.from(headers);
    return Object.fromEntries(Object.entries(columnHints).map(([type, hints]) => {
      const found = findColumn(keys, type, hints);
      return [type, found || ''];
    }));
  }

  function findColumn(keys, type, hints) {
    const normalized = keys.map(key => ({ key, low: low(key) }));
    const exact = normalized.find(item => hints.some(hint => item.low === hint));
    if (exact) return exact.key;
    if (type === 'driver') {
      const nameColumn = normalized.find(item => /driver\s*name|nome.*motorista|motorista.*nome/.test(item.low));
      if (nameColumn) return nameColumn.key;
      const generic = normalized.find(item => item.low.includes('driver') && !item.low.includes('id'));
      if (generic) return generic.key;
    }
    if (type === 'driverId') {
      const idColumn = normalized.find(item => item.low.includes('driver') && item.low.includes('id'));
      if (idColumn) return idColumn.key;
    }
    const partial = normalized.find(item => hints.some(hint => item.low.includes(hint)));
    return partial?.key || '';
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
    const missingDriver = state.rows.filter(row => value(row, 'driver') === 'Sem driver').length;
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
        type: 'Coluna obrigatÃ³ria',
        title: `${columnLabels[type]} nÃ£o mapeada`,
        detail: 'Corrija na tela Colunas antes de analisar a operaÃ§Ã£o.',
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
        issues.push({ type: 'Tracking duplicado', title: tracking, detail: `${trackingCounts.get(tracking)} ocorrÃªncias encontradas`, filter: { tracking } });
      }
      if (!cep) {
        issues.push({ type: 'CEP vazio', title: tracking, detail: `${status} | ${driver}`, filter: { tracking } });
      } else if (!cepMap[cep] && (!raw(row, 'city') || !raw(row, 'bairro'))) {
        issues.push({ type: 'CEP sem mapa', title: cep, detail: `${tracking} | ${city}`, filter: { tracking } });
      }
      if (value(row, 'driver') === 'Sem driver') {
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
    `).join('') : '<div class="issue-item"><b class="issue-type">OK</b><span><strong>Sem problemas crÃ­ticos</strong><span>NÃ£o encontramos inconsistÃªncias na importaÃ§Ã£o atual.</span></span><b class="severity good">OK</b></div>';
  }

  function renderColumnReview() {
    const issues = columnIssues();
    const issueCount = issues.missing.length + issues.lowCoverage.length;
    els.columnBadge.textContent = issueCount;
    els.columnBadge.classList.toggle('hidden', !state.rows.length || issueCount === 0);

    if (!state.rows.length) {
      els.columnMapper.innerHTML = '<p class="muted">Importe uma planilha para revisar as colunas.</p>';
      els.columnQuality.innerHTML = '';
      els.previewRows.innerHTML = '<tr><td colspan="7">Aguardando importaÃ§Ã£o.</td></tr>';
      return;
    }

    const options = ['<option value="">NÃ£o usar</option>'].concat(
      state.headers.map(header => `<option value="${html(header)}">${html(header)}</option>`)
    ).join('');

    els.columnMapper.innerHTML = Object.keys(columnLabels).map(type => {
      const detected = state.detectedColumns[type] || '';
      const current = state.columns[type] || '';
      const coverage = columnCompleteness(type);
      const tag = requiredColumns.includes(type)
        ? '<span class="column-required">ObrigatÃ³ria</span>'
        : '<span class="column-optional">Opcional</span>';
      return `
        <div class="column-field">
          <label>${html(columnLabels[type])}${tag}</label>
          <select data-column-type="${html(type)}">
            ${options}
          </select>
          <small>${detected ? `Detectada: ${html(detected)}` : 'NÃ£o detectada automaticamente'} | ${number(coverage)} preenchidos</small>
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
        <td>${statusPill(displayStatusOf(row))}</td>
        <td>${html(cepOf(row))}</td>
        <td>${html(value(row, 'city'))}</td>
        <td>${html(value(row, 'bairro'))}</td>
        <td>${html(value(row, 'driverId'))}</td>
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
    return clean((key ? row[key] : '') || row[type] || '');
  }

  function driverIdOf(row) {
    const explicit = driverIdKey(raw(row, 'driverId'));
    if (explicit) return explicit;
    const driverRaw = raw(row, 'driver');
    const asId = driverIdKey(driverRaw);
    return driverRecordById(asId) ? asId : '';
  }

  function driverInfo(row) {
    const id = driverIdOf(row);
    const byId = id ? driverRecordById(id) : null;
    const rawDriver = raw(row, 'driver');
    const byName = rawDriver ? driverRecordByName(rawDriver) : null;
    const record = byId || byName || null;
    const driverName = record?.name || (driverRecordById(driverIdKey(rawDriver))?.name) || rawDriver || 'Sem driver';
    return {
      id: record?.id || id || '',
      name: driverName,
      vehicleType: record?.vehicleType || '',
      licensePlate: record?.licensePlate || '',
      city: record?.city || value(row, 'city'),
      known: Boolean(record)
    };
  }

  function hasDriverAssignment(row) {
    const info = driverInfo(row);
    return Boolean(info.id || (info.name && info.name !== 'Sem driver'));
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
    if (type === 'driver') return driverInfo(row).name;
    if (type === 'driverId') return driverInfo(row).id || 'Sem ID';
    const fallbacks = {
      driver: 'Sem driver',
      driverId: 'Sem ID',
      tracking: 'Sem tracking',
      status: '(vazio)',
      cep: 'Sem CEP'
    };
    return raw(row, type) || fallbacks[type] || '';
  }

  function statusOf(row) {
    if (row.__txfStatusOverride) return normalizeStatus(row.__txfStatusOverride);
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
    if (filter.missingDriver && hasDriverAssignment(row)) return false;
    return true;
  }

  function filteredRows(filter) {
    return state.rows.filter(row => globalFilterMatches(row) && rowMatches(row, filter));
  }

  function isTeixeiraCity(city) {
    return removeAccents(city) === 'teixeira de freitas';
  }

  function isInteriorScopeCity(city) {
    const normalizedCity = removeAccents(city);
    return regionRules
      .filter(rule => rule.name !== 'Teixeira urbano')
      .some(rule => rule.cities.some(item => removeAccents(item) === normalizedCity));
  }

  function globalFilterMatches(row) {
    const status = statusOf(row);
    const city = value(row, 'city');
    const driver = value(row, 'driver');
    if (state.filters.status === 'notDelivered' && status === 'Delivered') return false;
    if (state.filters.status && state.filters.status !== 'notDelivered' && status !== state.filters.status) return false;
    if (state.filters.city && city !== state.filters.city) return false;
    if (state.filters.driver && driver !== state.filters.driver) return false;
    if (state.filters.scope === 'teixeira' && !isTeixeiraCity(city)) return false;
    if (state.filters.scope === 'interior' && !isInteriorScopeCity(city)) return false;
    return true;
  }

  function visibleRows() {
    return state.rows.filter(globalFilterMatches);
  }

  function rowsByRegion(region) {
    return state.rows.filter(row => statusOf(row) !== 'Delivered' && regionOf(value(row, 'city')) === region);
  }

  function statusPill(status) {
    const key = statusConfig[status] ? status : 'Other';
    return `<span class="status-pill ${statusConfig[key].className}">${html(statusConfig[key].label || status)}</span>`;
  }

  function displayStatusOf(row) {
    return isDamageRow(row) ? 'Avaria' : statusOf(row);
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
      socLH: 0,
      hold: 0,
      byReceived: new Map(),
      byAssigned: new Map(),
      byAssignedCity: new Map(),
      byAssignedDriver: new Map(),
      byAssignedNoDriver: new Map(),
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
      if (status === 'SOC_LHTransported') stats.socLH += 1;
      if (status === 'OnHold') stats.hold += 1;
      if (isReceived(status)) {
        stats.received += 1;
        bump(stats.byReceived, cityBairro);
      }
      if (isAssigned(status)) {
        stats.assigned += 1;
        bump(stats.byAssigned, cityBairro);
        bump(stats.byAssignedCity, city);
        const driver = driverInfo(row);
        if (hasDriverAssignment(row)) {
          const driverKey = groupKey([driver.id || 'Sem ID', driver.name, driver.vehicleType || '-', driver.city || city]);
          if (!stats.byAssignedDriver.has(driverKey)) {
            stats.byAssignedDriver.set(driverKey, { ...driver, total: 0 });
          }
          stats.byAssignedDriver.get(driverKey).total += 1;
        } else {
          bump(stats.byAssignedNoDriver, cityBairro);
        }
      }

      bump(stats.byCityStatus, groupKey([status, city, bairro]));
      bump(stats.byCity, city);
      if (pending) bump(stats.byCityPending, city);
      if (!stats.byRegion.has(region)) {
        stats.byRegion.set(region, { total: 0, delivered: 0, pending: 0, received: 0, assigned: 0, delivering: 0, socLH: 0, hold: 0, cities: new Map() });
      }
      const regionData = stats.byRegion.get(region);
      regionData.total += 1;
      if (status === 'Delivered') regionData.delivered += 1;
      if (pending) regionData.pending += 1;
      if (isReceived(status)) regionData.received += 1;
      if (isAssigned(status)) regionData.assigned += 1;
      if (status === 'Delivering') regionData.delivering += 1;
      if (status === 'SOC_LHTransported') regionData.socLH += 1;
      if (status === 'OnHold') regionData.hold += 1;
      bump(regionData.cities, city);

      if (!stats.byDriver.has(driver)) {
        stats.byDriver.set(driver, { Delivered: 0, Delivering: 0, SOC_LH: 0, Received: 0, Assigned: 0, OnHold: 0, total: 0 });
      }
      const bucket = stats.byDriver.get(driver);
      if (status === 'Delivered') bucket.Delivered += 1;
      if (status === 'Delivering') bucket.Delivering += 1;
      if (status === 'SOC_LHTransported') bucket.SOC_LH += 1;
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
      ['Received', stats.received, 'Aguardando avanÃ§o', 'Hub_Received'],
      ['Assigned', stats.assigned, 'AtribuÃ­dos no hub', 'Hub_Assigned'],
      ['Delivering', stats.delivering, 'Em rota', 'Delivering'],
      ['SOC LH', stats.socLH, 'Transportado no line haul', 'SOC_LHTransported'],
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
      ['Pendentes totais', pending, 'Pacotes ainda nÃ£o finalizados'],
      ['Faltam para SLA', needSla, 'Meta oficial de 99,5%'],
      ['Faltam para DS', needDs, 'Meta oficial de 98%'],
      ['Ritmo sugerido', perHour, `${number(hoursLeft)} ${plural(hoursLeft, 'hora operacional restante', 'horas operacionais restantes')} hoje`]
    ].map(([label, qty, note]) => `
      <div class="metric-row">
        <span><strong>${html(label)}</strong><span>${html(note)}</span></span>
        <b class="metric-value">${number(qty)}</b>
      </div>
    `).join('');

    const topPending = Array.from(stats.byCityPending.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const levers = [
      ['Atacar OnHold', stats.hold, 'Maior risco de travar SLA e DS', 'OnHold'],
      ['AvanÃ§ar Received', stats.received, 'Transforma fila parada em aÃ§Ã£o de hub', 'Hub_Received'],
      ['Acompanhar Delivering', stats.delivering, 'Confirma o que jÃ¡ estÃ¡ em rota', 'Delivering']
    ].filter(item => item[1] > 0);
    if (topPending.length) {
      levers.push([`Top cidade: ${topPending[0][0]}`, topPending[0][1], 'Maior concentraÃ§Ã£o de pendentes', 'notDelivered']);
    }
    els.targetLevers.innerHTML = levers.length ? levers.map(([label, qty, note, filter]) => `
      <button class="metric-row" type="button" data-filter="${html(filter)}">
        <span><strong>${html(label)}</strong><span>${html(note)}</span></span>
        <b class="metric-value">${number(qty)}</b>
      </button>
    `).join('') : '<div class="metric-row"><span><strong>Sem alavancas pendentes</strong><span>Importe dados ou confira colunas para validar.</span></span><b class="metric-value">0</b></div>';

    state.summary = [
      'RESUMO EXECUTIVO - TORRE DE CONTROLE TXF',
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
      `SOC LH: ${number(stats.socLH)}`,
      `OnHold: ${number(stats.hold)}`,
      `Ritmo sugerido: ${number(perHour)} ${plural(perHour, 'pacote/hora', 'pacotes/hora')} por ${number(hoursLeft)} ${plural(hoursLeft, 'hora operacional restante', 'horas operacionais restantes')}`,
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
    const color = done ? 'var(--green)' : 'var(--orange)';
    ring.style.background = `conic-gradient(${color} 0 ${capped}%, var(--surface-3) ${capped}% 100%)`;
    label.textContent = `${value.toFixed(2).replace('.', ',')}%`;
  }

  function renderPriority(stats) {
    const rows = [
      ['OnHold', stats.hold, 'Pacotes precisam de tratativa operacional', 'critical', 'OnHold'],
      ['Received', stats.received, 'Pacotes aguardando avanÃ§o de status', 'high', 'Hub_Received'],
      ['Assigned', stats.assigned, 'Pacotes atribuÃ­dos ou em separaÃ§Ã£o', 'normal', 'Hub_Assigned'],
      ['Delivering', stats.delivering, 'Pacotes em rota para acompanhar', 'normal', 'Delivering'],
      ['SOC LH', stats.socLH, 'Pacotes transportados no line haul', 'normal', 'SOC_LHTransported']
    ].filter(item => item[1] > 0);

    els.priorityList.innerHTML = rows.length ? rows.map(([title, qty, desc, severity, filter]) => `
      <button class="list-row" type="button" data-filter="${filter}">
        <span><strong>${html(title)}: ${number(qty)}</strong><span>${html(desc)}</span></span>
        <b class="severity ${severity}">${severityLabel(severity)}</b>
      </button>
    `).join('') : `<div class="list-row"><span><strong>Nenhuma pendÃªncia crÃ­tica</strong><span>Importe ou confira os arquivos para validar a operaÃ§Ã£o.</span></span><b class="severity good">OK</b></div>`;

    els.missionBadge.textContent = rows.length;
    els.missionList.innerHTML = rows.length ? rows.map(([title, qty, desc, severity, filter]) => `
      <button class="list-row" type="button" data-filter="${filter}">
        <span><strong>${html(title)}</strong><span>${number(qty)} pacotes. ${html(desc)}.</span></span>
        <b class="severity ${severity}">${severityLabel(severity)}</b>
      </button>
    `).join('') : '<div class="list-row"><span><strong>OperaÃ§Ã£o sem fila crÃ­tica</strong><span>NÃ£o hÃ¡ itens pendentes apÃ³s a importaÃ§Ã£o atual.</span></span><b class="severity good">OK</b></div>';
  }

  function severityLabel(severity) {
    return { critical: 'CrÃ­tico', high: 'Alto', normal: 'Monitorar', good: 'OK' }[severity] || 'Info';
  }

  function detailTitle(kind) {
    return {
      all: 'Todos os pacotes',
      notDelivered: 'Pendentes',
      Delivered: 'Delivered',
      Delivering: 'Delivering',
      SOC_LHTransported: 'SOC LH',
      Hub_Received: 'Received - tratativa',
      Hub_Assigned: 'Hub Assigned',
      OnHold: 'OnHold'
    }[kind] || `Detalhes: ${kind}`;
  }

  function renderCityRadar(stats) {
    renderCityBars(els.cityRadar, stats.byDeliveredCity, 'Delivered', 'Nenhuma BR entregue identificada por cidade.');
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
          <button class="mini-button" data-region="${html(region.name)}">Abrir pendentes da regiÃ£o</button>
        </article>
      `;
    }).join('') : '<p class="muted">Importe os dados para gerar o mapa operacional.</p>';
  }

  function priorityLabel(region) {
    if (region.hold > 0 || region.score >= 80 || region.pending >= 100) {
      return { label: 'Prioridade alta', className: 'high' };
    }
    if (region.score >= 25 || region.pending >= 30) {
      return { label: 'Prioridade mÃ©dia', className: 'medium' };
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
    `).join('') : '<div class="action-item"><b class="action-index">OK</b><span><strong>Sem plano crÃ­tico</strong><span>Importe os dados para gerar prioridades.</span></span><b class="severity good">OK</b></div>';
  }

  function buildActionItems(stats, snapshot) {
    const items = [];
    if (stats.hold > 0) {
      items.push({
        title: `Tratar OnHold (${number(stats.hold)})`,
        detail: 'Prioridade mÃ¡xima: remover bloqueios antes de atacar volume.',
        filter: 'OnHold',
        severity: 'critical'
      });
    }
    if (stats.received > 0) {
      items.push({
        title: `AvanÃ§ar Received (${number(stats.received)})`,
        detail: 'Separar por cidade/bairro e transformar fila parada em avanÃ§o operacional.',
        filter: 'Hub_Received',
        severity: 'high'
      });
    }
    if (stats.assigned > 0) {
      items.push({
        title: `Conferir Assigned (${number(stats.assigned)})`,
        detail: 'Validar atribuiÃ§Ã£o, separaÃ§Ã£o e prÃ³ximos passos no hub.',
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
    if (stats.socLH > 0) {
      items.push({
        title: `Acompanhar SOC LH (${number(stats.socLH)})`,
        detail: 'Pacotes transportados no line haul para seguir o avanÃ§o atÃ© rota ou baixa.',
        filter: 'SOC_LHTransported',
        severity: 'normal'
      });
    }
    snapshot.topCities.slice(0, 2).forEach(([city, qty]) => {
      items.push({
        title: `Focar ${city}`,
        detail: `${number(qty)} ${plural(qty, 'pendente concentrado', 'pendentes concentrados')} na cidade.`,
        filter: 'notDelivered',
        city,
        severity: qty >= 10 ? 'high' : 'normal'
      });
    });
    return items.slice(0, 6);
  }

  function buildManagerText(snapshot, previous, actionItems) {
    const diff = previous ? [
      `VariaÃ§Ã£o vs importaÃ§Ã£o anterior:`,
      `Delivered: ${signed(snapshot.delivered - previous.delivered)}`,
      `Pendentes: ${signed(snapshot.pending - previous.pending)}`,
      `OnHold: ${signed(snapshot.hold - previous.hold)}`,
      `SLA: ${signed(snapshot.sla - previous.sla, ' p.p.')}`
    ] : ['Primeira importaÃ§Ã£o salva no histÃ³rico desta sessÃ£o.'];
    const topCityText = snapshot.topCities.length
      ? snapshot.topCities.slice(0, 5).map(([city, qty], index) => `${index + 1}. ${city}: ${number(qty)} ${plural(qty, 'pendente', 'pendentes')}`).join('\n')
      : 'Sem cidades pendentes.';
    const actions = actionItems.length
      ? actionItems.map((item, index) => `${index + 1}. ${item.title}: ${item.detail}`).join('\n')
      : 'Sem aÃ§Ã£o crÃ­tica identificada.';

    return [
      'RESUMO GERENCIAL - TORRE DE CONTROLE TXF',
      `AtualizaÃ§Ã£o: ${new Date(snapshot.date).toLocaleString('pt-BR')}`,
      `Arquivos: ${snapshot.files.join(', ') || 'sem nome'}`,
      '',
      `Total: ${number(snapshot.total)}`,
      `Delivered: ${number(snapshot.delivered)} (${snapshot.sla.toFixed(2).replace('.', ',')}%)`,
      `Pendentes: ${number(snapshot.pending)}`,
      `Received: ${number(snapshot.received)} | Assigned: ${number(snapshot.assigned)} | Delivering: ${number(snapshot.delivering)} | SOC LH: ${number(snapshot.socLH)} | OnHold: ${number(snapshot.hold)}`,
      '',
      ...diff,
      '',
      'Cidades crÃ­ticas:',
      topCityText,
      '',
      'Plano de aÃ§Ã£o:',
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
      ['SOC LH', snapshot.socLH, deltaValue(snapshot, previous, 'socLH')],
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

  function criticalMetrics() {
    return [
      { key: 'received', label: 'Received' },
      { key: 'assigned', label: 'Assigned' },
      { key: 'socLH', label: 'SOC LH' },
      { key: 'hold', label: 'OnHold' }
    ];
  }

  function renderHistoryInsights() {
    if (!state.history.length) {
      els.historyEvolution.innerHTML = '<p class="muted">Salve ao menos uma importaÃ§Ã£o para acompanhar evoluÃ§Ã£o.</p>';
      els.historyCityChanges.innerHTML = '<p class="muted">Com duas importaÃ§Ãµes, o painel mostra cidades que melhoraram ou pioraram.</p>';
      return;
    }

    const timeline = state.history.slice(0, 8).reverse();
    els.historyEvolution.innerHTML = criticalMetrics().map(metric => {
      const values = timeline.map(item => Number(item[metric.key] || 0));
      const max = Math.max(...values, 1);
      const latest = Number(state.history[0]?.[metric.key] || 0);
      const previous = state.history[1] ? Number(state.history[1][metric.key] || 0) : null;
      const delta = previous === null ? null : latest - previous;
      const tone = delta === null || delta === 0 ? 'flat' : delta < 0 ? 'up' : 'down';
      return `
        <article class="evolution-card">
          <div class="evolution-title">
            <span>${html(metric.label)}</span>
            <strong>${number(latest)}</strong>
            <b class="delta ${tone}">${html(signed(delta))}</b>
          </div>
          <div class="spark-bars" aria-label="EvoluÃ§Ã£o de ${html(metric.label)}">
            ${values.map(value => `<span style="height:${Math.max(8, value / max * 52)}px" title="${number(value)}"></span>`).join('')}
          </div>
        </article>
      `;
    }).join('');

    renderCityChanges(state.history[0], state.history[1]);
  }

  function cityCriticalMap(snapshot) {
    return new Map((snapshot?.cityCritical || []).map(item => [item.city, {
      ...item,
      critical: Number(item.critical ?? criticalScore(item)),
      pending: Number(item.pending || 0),
      received: Number(item.received || 0),
      assigned: Number(item.assigned || 0),
      socLH: Number(item.socLH || 0),
      hold: Number(item.hold || 0)
    }]));
  }

  function renderCityChanges(current, previous) {
    if (!current || !previous) {
      els.historyCityChanges.innerHTML = '<p class="muted">Salve uma segunda importaÃ§Ã£o para comparar cidades.</p>';
      return;
    }

    const currentMap = cityCriticalMap(current);
    const previousMap = cityCriticalMap(previous);
    const cityNames = new Set([...currentMap.keys(), ...previousMap.keys()]);
    const changes = Array.from(cityNames).map(city => {
      const now = currentMap.get(city) || { city, critical: 0, pending: 0, received: 0, assigned: 0, socLH: 0, hold: 0 };
      const before = previousMap.get(city) || { critical: 0, pending: 0 };
      return {
        ...now,
        delta: Number(now.critical || 0) - Number(before.critical || 0),
        pendingDelta: Number(now.pending || 0) - Number(before.pending || 0)
      };
    }).filter(item => item.delta !== 0 || item.pendingDelta !== 0);

    const worse = changes.filter(item => item.delta > 0 || (item.delta === 0 && item.pendingDelta > 0))
      .sort((a, b) => b.delta - a.delta || b.pendingDelta - a.pendingDelta)
      .slice(0, 6);
    const better = changes.filter(item => item.delta < 0 || (item.delta === 0 && item.pendingDelta < 0))
      .sort((a, b) => a.delta - b.delta || a.pendingDelta - b.pendingDelta)
      .slice(0, 6);

    els.historyCityChanges.innerHTML = `
      <div class="city-change-column">
        <h5>Pioraram</h5>
        ${renderCityChangeList(worse, 'down')}
      </div>
      <div class="city-change-column">
        <h5>Melhoraram</h5>
        ${renderCityChangeList(better, 'up')}
      </div>
    `;
  }

  function renderCityChangeList(items, tone) {
    return items.length ? items.map(item => `
      <button class="city-change ${tone}" type="button" data-open='${html(JSON.stringify({ kind: 'notDelivered', city: item.city }))}'>
        <span>
          <strong>${html(item.city)}</strong>
          <small>R ${number(item.received)} | A ${number(item.assigned)} | SOC ${number(item.socLH)} | OH ${number(item.hold)}</small>
        </span>
        <b>${signed(item.delta)}</b>
      </button>
    `).join('') : '<div class="city-change empty"><span><strong>Nenhuma cidade</strong><small>Sem variaÃ§Ã£o relevante.</small></span><b>0</b></div>';
  }

  function renderHistory() {
    renderHistoryInsights();
    if (!state.history.length) {
      els.historyList.innerHTML = '<div class="history-item"><strong>Nenhuma importaÃ§Ã£o salva</strong><span>Aplique o mapeamento de colunas para salvar o primeiro histÃ³rico.</span></div>';
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
        <span class="history-stat"><b>${number(item.socLH)}</b><small>SOC LH</small></span>
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

  function receivedMonitorRows() {
    return visibleRows().filter(row => isReceived(statusOf(row)));
  }

  function renderReceivedMonitor() {
    const rows = receivedMonitorRows();
    const cityOptions = Array.from(new Set(rows.map(row => value(row, 'city'))))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    if (state.receivedMonitor.city && !cityOptions.includes(state.receivedMonitor.city)) {
      state.receivedMonitor.city = '';
    }
    fillSelect(els.receivedCityFilter, [['', 'Todas']], cityOptions.map(item => [item, item]), state.receivedMonitor.city);

    const cityRows = rows.filter(row => !state.receivedMonitor.city || value(row, 'city') === state.receivedMonitor.city);
    const bairroOptions = Array.from(new Set(cityRows.map(row => value(row, 'bairro'))))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    if (state.receivedMonitor.bairro && !bairroOptions.includes(state.receivedMonitor.bairro)) {
      state.receivedMonitor.bairro = '';
    }
    fillSelect(els.receivedBairroFilter, [['', 'Todos']], bairroOptions.map(item => [item, item]), state.receivedMonitor.bairro);
    els.receivedSort.value = state.receivedMonitor.sort === 'asc' ? 'asc' : 'desc';
    els.receivedSearch.value = state.receivedMonitor.search || '';

    const filtered = cityRows.filter(row => !state.receivedMonitor.bairro || value(row, 'bairro') === state.receivedMonitor.bairro);
    const grouped = new Map();
    filtered.forEach(row => {
      const key = groupKey([value(row, 'city'), value(row, 'bairro')]);
      if (!grouped.has(key)) grouped.set(key, { qty: 0, treatments: new Map() });
      const data = grouped.get(key);
      data.qty += 1;
      const treatment = clean(row.__txfTratativa || row.__txfStatusAction || '');
      if (treatment) data.treatments.set(treatment, (data.treatments.get(treatment) || 0) + 1);
    });
    const direction = state.receivedMonitor.sort === 'asc' ? 1 : -1;

    els.receivedTable.innerHTML = Array.from(grouped.entries())
      .map(([key, data]) => {
        const [city, bairro] = key.split('|');
        return { city, bairro, qty: data.qty, treatment: formatGroupTreatments(data.treatments) };
      })
      .sort((a, b) => (a.qty - b.qty) * direction || a.city.localeCompare(b.city, 'pt-BR') || a.bairro.localeCompare(b.bairro, 'pt-BR'))
      .map(item => `<tr class="clickable">
        <td>${html(item.city)}</td>
        <td>${html(item.bairro)}</td>
        <td class="treatment-summary">${html(item.treatment)}</td>
        <td>${number(item.qty)}</td>
        <td><button class="mini-button" data-open='${html(JSON.stringify({ kind: 'Hub_Received', city: item.city, bairro: item.bairro }))}'>Abrir</button></td>
      </tr>`)
      .join('') || '<tr><td colspan="5">Nenhum Received encontrado.</td></tr>';

    renderReceivedSearch(filtered);
  }

  function formatGroupTreatments(treatments) {
    const items = Array.from(treatments.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'));
    if (!items.length) return 'Sem tratativa';
    const visible = items.slice(0, 2).map(([text, qty]) => qty > 1 ? `${text} (${number(qty)})` : text);
    const extra = items.length > 2 ? ` +${number(items.length - 2)}` : '';
    return visible.join(' | ') + extra;
  }

  function renderReceivedSearch(rows) {
    const query = low(state.receivedMonitor.search);
    if (!query) {
      els.receivedSearchResults.innerHTML = '';
      return;
    }
    const matches = rows.filter(row => low(rowSearchText(row)).includes(query)).slice(0, 80);
    els.receivedSearchResults.innerHTML = matches.map(row => `
      <button class="list-row" type="button" data-open='${html(JSON.stringify({ kind: 'all', tracking: value(row, 'tracking') }))}'>
        <span>
          <strong>${html(value(row, 'tracking'))}</strong>
          <span>${html(displayStatusOf(row))} | ${html(cepOf(row))} | ${html(value(row, 'city'))} | ${html(value(row, 'bairro'))} | ${html(value(row, 'driverId'))} | ${html(value(row, 'driver'))}</span>
        </span>
        <b class="severity high">Abrir</b>
      </button>
    `).join('') || '<p class="muted">Nenhuma BR em Received encontrada.</p>';
  }

  function assignedMonitorRows() {
    return visibleRows().filter(row => isAssigned(statusOf(row)));
  }

  function renderAssignedMonitor() {
    const rows = assignedMonitorRows();
    const cityOptions = Array.from(new Set(rows.map(row => value(row, 'city'))))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    if (state.assignedMonitor.city && !cityOptions.includes(state.assignedMonitor.city)) {
      state.assignedMonitor.city = '';
    }
    fillSelect(els.assignedCityFilter, [['', 'Todas']], cityOptions.map(item => [item, item]), state.assignedMonitor.city);

    const cityRows = rows.filter(row => !state.assignedMonitor.city || value(row, 'city') === state.assignedMonitor.city);
    const bairroOptions = Array.from(new Set(cityRows.map(row => value(row, 'bairro'))))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    if (state.assignedMonitor.bairro && !bairroOptions.includes(state.assignedMonitor.bairro)) {
      state.assignedMonitor.bairro = '';
    }
    fillSelect(els.assignedBairroFilter, [['', 'Todos']], bairroOptions.map(item => [item, item]), state.assignedMonitor.bairro);
    els.assignedSort.value = state.assignedMonitor.sort === 'asc' ? 'asc' : 'desc';
    els.assignedSearch.value = state.assignedMonitor.search || '';

    const filtered = cityRows.filter(row => !state.assignedMonitor.bairro || value(row, 'bairro') === state.assignedMonitor.bairro);
    const grouped = new Map();
    filtered.forEach(row => bump(grouped, groupKey([value(row, 'city'), value(row, 'bairro')])));
    const direction = state.assignedMonitor.sort === 'asc' ? 1 : -1;

    els.assignedTable.innerHTML = Array.from(grouped.entries())
      .map(([key, qty]) => {
        const [city, bairro] = key.split('|');
        return { city, bairro, qty };
      })
      .sort((a, b) => (a.qty - b.qty) * direction || a.city.localeCompare(b.city, 'pt-BR') || a.bairro.localeCompare(b.bairro, 'pt-BR'))
      .map(item => `<tr class="clickable">
        <td>${html(item.city)}</td>
        <td>${html(item.bairro)}</td>
        <td>${number(item.qty)}</td>
        <td><button class="mini-button" data-open='${html(JSON.stringify({ kind: 'Hub_Assigned', city: item.city, bairro: item.bairro }))}'>Abrir</button></td>
      </tr>`)
      .join('') || '<tr><td colspan="4">Nenhum Assigned encontrado.</td></tr>';

    renderAssignedSearch(filtered);
  }

  function renderAssignedSearch(rows) {
    const query = low(state.assignedMonitor.search);
    if (!query) {
      els.assignedSearchResults.innerHTML = '';
      return;
    }
    const matches = rows.filter(row => low(rowSearchText(row)).includes(query)).slice(0, 80);
    els.assignedSearchResults.innerHTML = matches.map(row => `
      <button class="list-row" type="button" data-open='${html(JSON.stringify({ kind: 'all', tracking: value(row, 'tracking') }))}'>
        <span>
          <strong>${html(value(row, 'tracking'))}</strong>
          <span>${html(displayStatusOf(row))} | ${html(cepOf(row))} | ${html(value(row, 'city'))} | ${html(value(row, 'bairro'))} | ${html(value(row, 'driverId'))} | ${html(value(row, 'driver'))}</span>
        </span>
        <b class="severity normal">Abrir</b>
      </button>
    `).join('') || '<p class="muted">Nenhuma BR em Assigned encontrada.</p>';
  }

  function renderTables(stats) {
    renderReceivedMonitor();
    renderAssignedMonitor();

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
        <td>${number(data.SOC_LH)}</td>
        <td>${number(data.Received)}</td>
        <td>${number(data.Assigned)}</td>
        <td>${number(data.OnHold)}</td>
        <td>${number(data.total)}</td>
        <td><button class="mini-button" data-open='${html(JSON.stringify({ kind: 'all', driver }))}'>Abrir</button></td>
      </tr>
    `).join('') || '<tr><td colspan="9">Nenhum driver.</td></tr>';
  }

  function cepLookup(cep) {
    const digits = clean(cep).replace(/\D/g, '').padStart(8, '0').slice(-8);
    const mapped = cepMap[digits] || {};
    return {
      cep: digits,
      city: mapped.cidade || 'Sem cidade',
      bairro: mapped.bairro || 'Sem bairro'
    };
  }

  function findDamageSourceRow(tracking) {
    const key = trackingKey(tracking);
    if (!key) return null;
    return state.rows.find(row => trackingKey(value(row, 'tracking')) === key && row.__file !== 'Avaria manual')
      || state.rows.find(row => trackingKey(value(row, 'tracking')) === key)
      || null;
  }

  function damageLookupFromTracking(tracking) {
    const row = findDamageSourceRow(tracking);
    if (!row) return null;
    return {
      row,
      cep: cepOf(row),
      city: value(row, 'city'),
      bairro: value(row, 'bairro')
    };
  }

  function updateDamagePreview() {
    const tracking = clean(els.damageTracking.value);
    if (!tracking) {
      els.damageCepPreview.textContent = 'Digite a BR';
      els.damageCityPreview.textContent = 'Digite a BR';
      els.damageBairroPreview.textContent = 'Digite a BR';
      return;
    }
    const lookup = damageLookupFromTracking(tracking);
    if (!lookup) {
      els.damageCepPreview.textContent = 'BR nÃ£o encontrada';
      els.damageCityPreview.textContent = 'Importe a planilha';
      els.damageBairroPreview.textContent = 'ou confira a BR';
      return;
    }
    els.damageCepPreview.textContent = lookup.cep || 'Sem CEP';
    els.damageCityPreview.textContent = lookup.city || 'Sem cidade';
    els.damageBairroPreview.textContent = lookup.bairro || 'Sem bairro';
  }

  function damageRows() {
    return state.rows.filter(row => row.__txfDamage);
  }

  function parseDamageTrackings() {
    const single = clean(els.damageTracking.value);
    const bulk = clean(els.damageBulkTrackings.value);
    return Array.from(new Set([single, ...bulk.split(/[\s,;]+/)]
      .map(item => clean(item).toUpperCase())
      .filter(item => item && item !== 'SEM TRACKING')));
  }

  function markDamageTracking(tracking, treatment) {
    const lookup = damageLookupFromTracking(tracking);
    if (!lookup) return { tracking, ok: false };
    const registryItem = registerDamage(tracking, lookup, treatment);
    const existingRows = state.rows.filter(row => trackingKey(value(row, 'tracking')) === trackingKey(tracking));

    if (existingRows.length) {
      existingRows.forEach(row => {
        row.__txfDamage = '1';
        row.__txfDamageCreatedAt = registryItem.createdAt;
        row.__txfTratativa = treatment;
        if (!raw(row, 'cep')) row.cep = lookup.cep;
        if (!raw(row, 'city')) row.city = lookup.city;
        if (!raw(row, 'bairro')) row.bairro = lookup.bairro;
      });
    } else {
      const row = {
        tracking,
        status: 'Hub_Received',
        cep: lookup.cep,
        city: lookup.city,
        bairro: lookup.bairro,
        driver: 'Avaria',
        __file: 'Avaria manual',
        __sheet: 'Avarias',
        __txfDamage: '1',
        __txfDamageCreatedAt: registryItem.createdAt,
        __txfTratativa: treatment
      };
      state.rows.unshift(row);
    }
    return { tracking, ok: true };
  }

  function addDamageEntry() {
    const trackings = parseDamageTrackings();
    const treatment = clean(els.damageTreatment.value) || 'Avaria registrada';

    if (!trackings.length) {
      alert('Informe ao menos uma BR de avaria.');
      els.damageTracking.focus();
      return;
    }

    const results = trackings.map(tracking => markDamageTracking(tracking, treatment));
    const added = results.filter(item => item.ok);
    const missing = results.filter(item => !item.ok);

    if (!added.length) {
      alert('Nenhuma BR foi encontrada na planilha importada. Importe a planilha atualizada ou confira as BRs digitadas.');
      els.damageTracking.focus();
      return;
    }
    ensureRowIds();
    if (!state.importFiles.includes('Avarias manuais')) state.importFiles.push('Avarias manuais');
    if (!state.headers.length) {
      state.headers = ['tracking', 'status', 'cep', 'city', 'bairro', 'driver'];
      state.detectedColumns = { tracking: 'tracking', status: 'status', cep: 'cep', city: 'city', bairro: 'bairro', driver: 'driver' };
      state.columns = { ...state.detectedColumns };
    }
    els.damageForm.reset();
    updateDamagePreview();
    renderAll();
    saveCloudState();
    if (missing.length) {
      alert(`${number(added.length)} avaria(s) adicionada(s). ${number(missing.length)} BR(s) nÃ£o encontrada(s): ${missing.map(item => item.tracking).join(', ')}`);
    }
  }

  function removeDamageEntry(rowId) {
    const row = state.rows.find(item => item.__txfRowId === rowId);
    if (!row || !confirm(`Remover a avaria ${value(row, 'tracking')}?`)) return;
    const key = trackingKey(value(row, 'tracking'));
    delete state.damageRegistry[key];
    state.rows.forEach(item => {
      if (trackingKey(value(item, 'tracking')) !== key) return;
      delete item.__txfDamage;
      delete item.__txfDamageCreatedAt;
      if (item.__file === 'Avaria manual') return;
      delete item.__txfTratativa;
    });
    state.rows = state.rows.filter(item => !(trackingKey(value(item, 'tracking')) === key && item.__file === 'Avaria manual'));
    renderAll();
    saveCloudState();
  }

  function renderDamageView() {
    const rows = damageRows();
    const receivedDamage = rows.filter(row => isReceived(statusOf(row))).length;
    const byCity = new Map();
    rows.forEach(row => bump(byCity, value(row, 'city')));
    const topCity = Array.from(byCity.entries()).sort((a, b) => b[1] - a[1])[0];
    els.damageStats.innerHTML = `
      <span><b>${number(receivedDamage)}</b><small>Avarias em Received</small></span>
      <span><b>${topCity ? html(topCity[0]) : '-'}</b><small>Top cidade</small></span>
      <span><b>${number(rows.filter(row => !cepMap[cepOf(row)]).length)}</b><small>CEPs sem mapa</small></span>
    `;
    els.damageTable.innerHTML = rows.map(row => `
      <tr>
        <td>${html(value(row, 'tracking'))}</td>
        <td>${html(cepOf(row))}</td>
        <td>${html(value(row, 'city'))}</td>
        <td>${html(value(row, 'bairro'))}</td>
        <td>${statusPill(displayStatusOf(row))}</td>
        <td>${html(row.__txfTratativa || '')}</td>
        <td><button class="mini-button danger" data-remove-damage="${html(row.__txfRowId)}">Remover</button></td>
      </tr>
    `).join('') || '<tr><td colspan="7">Nenhuma avaria cadastrada.</td></tr>';
  }

  function routeStatsFor(rows) {
    return rows.reduce((acc, row) => {
      const status = statusOf(row);
      acc.total += 1;
      if (status === 'Delivered') acc.delivered += 1;
      if (status === 'Delivering') acc.delivering += 1;
      if (status === 'SOC_LHTransported') acc.socLH += 1;
      if (status === 'OnHold') acc.hold += 1;
      if (isReceived(status)) acc.received += 1;
      if (isAssigned(status)) acc.assigned += 1;
      return acc;
    }, { total: 0, delivered: 0, received: 0, assigned: 0, delivering: 0, socLH: 0, hold: 0 });
  }

  function routePending(stats) {
    return Math.max(stats.total - stats.delivered, 0);
  }

  function groupedRouteStats(rows, keyFn) {
    const groups = new Map();
    rows.forEach(row => {
      const key = keyFn(row);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });
    return Array.from(groups.entries())
      .map(([name, groupRows]) => ({ name, stats: routeStatsFor(groupRows) }))
      .sort((a, b) => b.stats.total - a.stats.total || a.name.localeCompare(b.name, 'pt-BR'));
  }

  function routeCityDefaults(cityGroups) {
    const defaultCities = ['Medeiros Neto', 'Nova ViÃ§osa', 'Posto da Mata'];
    const available = new Map(cityGroups.map(group => [removeAccents(group.name), group.name]));
    const found = defaultCities.map(city => available.get(removeAccents(city))).filter(Boolean);
    return found.length ? found : cityGroups.slice(0, 1).map(group => group.name);
  }

  function selectedRouteCities(cityGroups) {
    const available = new Set(cityGroups.map(group => group.name));
    let selected = (state.routeCities || []).filter(city => available.has(city));
    if (!selected.length && state.routeCity && available.has(state.routeCity)) selected = [state.routeCity];
    if (!selected.length && !state.routeSelectionTouched) selected = routeCityDefaults(cityGroups);
    state.routeCities = selected;
    state.routeCity = selected[0] || '';
    return selected;
  }

  function setRouteCities(cities, touched = true) {
    state.routeCities = Array.from(new Set(cities.filter(Boolean)));
    state.routeCity = state.routeCities[0] || '';
    state.routeSelectionTouched = touched;
    renderRouteCalculator();
  }

  function bairroRouteGroups(rows) {
    const groups = new Map();
    rows.forEach(row => {
      const city = value(row, 'city');
      const bairro = value(row, 'bairro');
      const key = groupKey([city, bairro]);
      if (!groups.has(key)) groups.set(key, { city, bairro, rows: [] });
      groups.get(key).rows.push(row);
    });
    return Array.from(groups.values())
      .map(group => ({ ...group, stats: routeStatsFor(group.rows) }))
      .sort((a, b) => b.stats.total - a.stats.total || a.city.localeCompare(b.city, 'pt-BR') || a.bairro.localeCompare(b.bairro, 'pt-BR'));
  }

  function renderRouteSummary(stats, selectedCities) {
    const totalLabel = selectedCities.length === 1 ? 'Total da cidade' : 'Total das cidades';
    const cards = [
      [totalLabel, stats.total, 'Pacotes importados do dia'],
      ['Delivered', stats.delivered, `${percent(stats.delivered, stats.total)} finalizado`],
      ['Pendentes', routePending(stats), 'Ainda exigem acompanhamento'],
      ['Received', stats.received, 'No hub ou avaria cadastrada'],
      ['Assigned', stats.assigned, 'AtribuÃ­dos/separaÃ§Ã£o'],
      ['Delivering', stats.delivering, 'Em rota'],
      ['SOC LH', stats.socLH, 'Transportado no line haul'],
      ['OnHold', stats.hold, 'Com tratativa operacional']
    ];
    els.routeSummary.innerHTML = stats.total ? cards.map(([label, qty, note], index) => `
      <article class="route-card route-card-${index + 1}">
        <span>${html(label)}</span>
        <strong>${number(qty)}</strong>
        <small>${html(note)}</small>
      </article>
    `).join('') : `
      <div class="empty-route">
        <strong>Nenhuma rota carregada.</strong>
        <span>Importe a planilha do dia ou selecione uma ou mais cidades.</span>
      </div>
    `;
  }

  function renderRouteCalculator() {
    const rows = state.rows;
    const cityGroups = groupedRouteStats(rows, row => value(row, 'city'));
    const selectedCities = selectedRouteCities(cityGroups);
    const selectedSet = new Set(selectedCities);
    els.routeCityChecklist.innerHTML = cityGroups.length ? cityGroups.map(group => {
      const checked = selectedSet.has(group.name) ? 'checked' : '';
      return `
        <label class="route-city-option">
          <input type="checkbox" data-route-city-check value="${html(group.name)}" ${checked}>
          <span>${html(group.name)}</span>
          <b>${number(group.stats.total)}</b>
        </label>
      `;
    }).join('') : '<p class="muted">Importe a planilha do dia para listar as cidades.</p>';

    const selectedRows = rows.filter(row => selectedSet.has(value(row, 'city')));
    const selectedStats = routeStatsFor(selectedRows);
    renderRouteSummary(selectedStats, selectedCities);

    const bairroGroups = bairroRouteGroups(selectedRows);
    els.routeBairroTable.innerHTML = bairroGroups.length ? bairroGroups.map(group => {
      const stats = group.stats;
      return `
        <tr>
          <td>${html(group.city)} / ${html(group.bairro)}</td>
          <td>${number(stats.total)}</td>
          <td>${number(stats.delivered)}</td>
          <td>${number(stats.received)}</td>
          <td>${number(stats.assigned)}</td>
          <td>${number(stats.delivering)}</td>
          <td>${number(stats.socLH)}</td>
          <td>${number(stats.hold)}</td>
          <td>${number(routePending(stats))}</td>
          <td><button class="mini-button" data-open='${html(JSON.stringify({ kind: 'all', city: group.city, bairro: group.bairro }))}'>Abrir</button></td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="10">Escolha uma ou mais cidades apÃ³s importar a planilha.</td></tr>';

    const selectedCityGroups = cityGroups.filter(group => selectedSet.has(group.name));
    els.routeSelectedCities.innerHTML = selectedCityGroups.length ? `
      <div class="route-selected-head">
        <div>
          <strong>Cidades selecionadas</strong>
          <span>${number(selectedStats.total)} ${plural(selectedStats.total, 'pacote', 'pacotes')} no total</span>
        </div>
        <div class="route-view-toggle" aria-label="Modo de visualizaÃ§Ã£o">
          <button class="mini-button ${state.routeViewMode === 'grid' ? 'active' : ''}" type="button" data-route-view="grid">Lado a lado</button>
          <button class="mini-button ${state.routeViewMode === 'list' ? 'active' : ''}" type="button" data-route-view="list">Um abaixo do outro</button>
        </div>
      </div>
      <div class="route-selected-list ${state.routeViewMode === 'list' ? 'stacked' : ''}">
        ${selectedCityGroups.map(group => `
          <button class="route-selected-city" type="button" data-route-city="${html(group.name)}" title="Remover ${html(group.name)} da rota">
            <span>${html(group.name)}</span>
            <strong>${number(group.stats.total)}</strong>
            <small>${number(routePending(group.stats))} pendentes</small>
          </button>
        `).join('')}
      </div>
    ` : `
      <div class="route-selected-empty">Nenhuma cidade selecionada.</div>
    `;

    els.routeCityTable.innerHTML = cityGroups.length ? cityGroups.map(group => {
      const stats = group.stats;
      const selected = selectedSet.has(group.name);
      return `
        <tr>
          <td>${html(group.name)}</td>
          <td>${number(stats.total)}</td>
          <td>${number(stats.delivered)}</td>
          <td>${number(stats.received)}</td>
          <td>${number(stats.assigned)}</td>
          <td>${number(stats.delivering)}</td>
          <td>${number(stats.socLH)}</td>
          <td>${number(stats.hold)}</td>
          <td>${number(routePending(stats))}</td>
          <td><button class="mini-button" data-route-city="${html(group.name)}">${selected ? 'Remover' : 'Adicionar'}</button></td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="10">Nenhuma cidade carregada.</td></tr>';
  }

  function copyRouteSummary() {
    const selectedSet = new Set(state.routeCities || []);
    const city = state.routeCities.length ? state.routeCities.join(', ') : 'Sem cidade selecionada';
    const rows = state.rows.filter(row => selectedSet.has(value(row, 'city')));
    const stats = routeStatsFor(rows);
    const bairros = bairroRouteGroups(rows).slice(0, 20);
    const text = [
      `ROTA - ${city}`,
      `Total: ${number(stats.total)}`,
      `Delivered: ${number(stats.delivered)}`,
      `Pendentes: ${number(routePending(stats))}`,
      `Received: ${number(stats.received)}`,
      `Assigned: ${number(stats.assigned)}`,
      `Delivering: ${number(stats.delivering)}`,
      `SOC LH: ${number(stats.socLH)}`,
      `OnHold: ${number(stats.hold)}`,
      '',
      'Cidades selecionadas:',
      ...(state.routeCities.length ? state.routeCities.map(item => `- ${item}`) : ['- Nenhuma cidade selecionada']),
      '',
      'Cidade/Bairro:',
      ...(bairros.length ? bairros.map(group => `- ${group.city} / ${group.bairro}: ${number(group.stats.total)} total | ${number(routePending(group.stats))} pendentes`) : ['- Nenhum bairro carregado'])
    ].join('\n');
    navigator.clipboard?.writeText(text);
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
    renderDamageView();
    renderRouteCalculator();
    renderLhControl();
    renderSearch();
    const activeView = document.querySelector('.view.active')?.id;
    els.emptyState.classList.toggle('hidden', stats.total > 0 || ['lh', 'lh-route'].includes(activeView));
    els.lastUpdate.textContent = stats.total ? new Date().toLocaleString('pt-BR') : 'Aguardando importaÃ§Ã£o';
    refreshIcons();
  }

  async function handleFiles(files) {
    if (!files || !files.length) return;
    if (typeof XLSX === 'undefined') {
      alert('A biblioteca XLSX nÃ£o carregou. Abra com internet ativa para importar planilhas.');
      return;
    }
    captureTreatmentRegistryFromRows();

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
    state.routeCities = [];
    state.routeCity = '';
    state.routeSelectionTouched = false;
    ensureRowIds();
    clearFilters();
    state.headers = detectHeaders(allRows);
    state.detectedColumns = detectColumns(allRows);
    state.columns = { ...state.detectedColumns };
    applyDamageRegistryToRows();
    applyTreatmentRegistryToRows();
    renderAll();
    setView('columns');
    await saveCloudState();
  }

  async function handleLhFiles(files) {
    if (!files || !files.length) return;
    if (typeof XLSX === 'undefined') {
      alert('A biblioteca XLSX nÃ£o carregou. Abra com internet ativa para importar a triagem.');
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
    state.lhRows = allRows;
    state.lhColumns = detectColumns(allRows);
    state.lhFiles = Array.from(files).map(file => file.name);
    state.lhFilter = { status: 'all', city: '', search: '' };
    state.lhRouteCities = [];
    state.lhRouteSelectionTouched = false;
    persistLhControl();
    renderLhControl();
    setView('lh');
    await saveLhCloudState();
  }

  function exportLhControl() {
    const rows = lhVisibleRows();
    const header = ['Status', 'BR', 'CEP', 'Cidade', 'Bairro', 'Driver ID', 'Driver', 'Arquivo'];
    const body = rows.map(row => [
      lhStatusOf(row),
      lhValue(row, 'tracking'),
      lhCepOf(row),
      lhValue(row, 'city'),
      lhValue(row, 'bairro'),
      lhValue(row, 'driverId'),
      lhValue(row, 'driver'),
      row.__file || ''
    ]);
    downloadCsv([header, ...body], 'controle-lh.csv');
  }

  function lhRowsByRouteFilter(filter) {
    return lhRelevantRows().filter(row => {
      if (filter.city && lhValue(row, 'city') !== filter.city) return false;
      if (filter.bairro && lhValue(row, 'bairro') !== filter.bairro) return false;
      if (filter.status === 'SOC_LHTransported' && lhStatusOf(row) !== 'SOC_LHTransported') return false;
      if (filter.status === 'Hub_Received' && !isReceived(lhStatusOf(row))) return false;
      return true;
    });
  }

  function openLhDetails(filter, title) {
    state.currentFilter = { kind: 'lh', ...filter };
    state.currentRows = lhRowsByRouteFilter(filter);
    els.modalTitle.textContent = title || 'Detalhes LH';
    els.modalSubtitle.textContent = `${number(state.currentRows.length)} pacotes da triagem LH`;
    els.modalSearch.value = '';
    renderModalRows();
    els.modal.showModal();
    refreshIcons();
  }

  function copyLhRows(rows) {
    const header = ['BR', 'Status', 'CEP', 'Cidade', 'Bairro', 'Driver ID', 'Driver', 'Arquivo'];
    const body = rows.map(row => [
      lhValue(row, 'tracking'),
      lhStatusOf(row),
      lhCepOf(row),
      lhValue(row, 'city'),
      lhValue(row, 'bairro'),
      lhValue(row, 'driverId'),
      lhValue(row, 'driver'),
      row.__file || ''
    ]);
    navigator.clipboard?.writeText([header, ...body].map(line => line.join('\t')).join('\n'));
  }

  function copyLhRouteSummary() {
    const selectedSet = new Set(state.lhRouteCities || []);
    const city = state.lhRouteCities.length ? state.lhRouteCities.join(', ') : 'Sem cidade selecionada';
    const rows = lhRelevantRows().filter(row => selectedSet.has(lhValue(row, 'city')));
    const stats = lhRouteStatsFor(rows);
    const bairros = lhBairroRouteGroups(rows).slice(0, 20);
    const text = [
      `ROTA LH - ${city}`,
      `Total: ${number(stats.total)}`,
      '',
      'Cidades selecionadas:',
      ...(state.lhRouteCities.length ? state.lhRouteCities.map(item => `- ${item}`) : ['- Nenhuma cidade selecionada']),
      '',
      'Cidade/Bairro:',
      ...(bairros.length ? bairros.map(group => `- ${group.city} / ${group.bairro}: ${number(group.stats.total)} pacotes`) : ['- Nenhum bairro carregado'])
    ].join('\n');
    navigator.clipboard?.writeText(text);
  }

  function openDetails(filter, title) {
    state.currentFilter = filter;
    state.currentRows = filteredRows(filter);
    els.modalTitle.textContent = title || 'Detalhes';
    els.modalSubtitle.textContent = `${number(state.currentRows.length)} pacotes encontrados`;
    els.modalSearch.value = '';
    renderModalRows();
    els.modal.showModal();
    refreshIcons();
  }

  function renderModalRows() {
    renderModalHeader();
    const query = low(els.modalSearch.value);
    const rows = state.currentRows.filter(row => !query || low(isLhModal() ? lhSearchText(row) : rowSearchText(row)).includes(query)).slice(0, 1500);
    if (isLhModal()) {
      els.modalRows.innerHTML = rows.map(row => `
        <tr>
          <td>${html(lhValue(row, 'tracking'))}</td>
          <td>${statusPill(lhStatusOf(row))}</td>
          <td>${html(lhCepOf(row))}</td>
          <td>${html(lhValue(row, 'city'))}</td>
          <td>${html(lhValue(row, 'bairro'))}</td>
          <td>${html(lhValue(row, 'driverId'))}</td>
          <td>${html(lhValue(row, 'driver'))}</td>
          <td>${html(row.__file || '')}</td>
        </tr>
      `).join('') || '<tr><td colspan="8">Nada encontrado.</td></tr>';
      return;
    }
    const actionable = isReceivedActionModal();
    els.modalRows.innerHTML = rows.map(row => actionable ? renderReceivedActionRow(row) : `
      <tr>
        <td>${html(value(row, 'tracking'))}</td>
        <td>${statusPill(displayStatusOf(row))}</td>
        <td>${html(cepOf(row))}</td>
        <td>${html(value(row, 'city'))}</td>
        <td>${html(value(row, 'bairro'))}</td>
        <td>${html(value(row, 'driver'))}</td>
        <td>${html(row.__file || '')}</td>
      </tr>
    `).join('') || '<tr><td colspan="8">Nada encontrado.</td></tr>';
  }

  function renderModalHeader() {
    if (isLhModal()) {
      els.modalHeader.innerHTML = '<th>BR</th><th>Status</th><th>CEP</th><th>Cidade</th><th>Bairro</th><th>Driver ID</th><th>Driver</th><th>Arquivo</th>';
      return;
    }
    const lastColumn = isReceivedActionModal() ? 'Tratativa' : 'Arquivo';
    els.modalHeader.innerHTML = `<th>Tracking</th><th>Status</th><th>CEP</th><th>Cidade</th><th>Bairro</th><th>Driver ID</th><th>Driver</th><th>${lastColumn}</th>`;
  }

  function isLhModal() {
    return state.currentFilter?.kind === 'lh';
  }

  function isReceivedActionModal() {
    return state.currentFilter?.kind === 'Hub_Received';
  }

  function renderReceivedActionRow(row) {
    const receivedLabel = isDamageRow(row) ? 'Avaria' : 'Received';
    return `
      <tr>
        <td>${html(value(row, 'tracking'))}</td>
        <td>
          <select class="status-action-select" data-status-row="${html(row.__txfRowId || '')}">
            <option value="Hub_Received" ${row.__txfStatusAction ? '' : 'selected'}>${html(receivedLabel)}</option>
            <option value="Criado AT" ${row.__txfStatusAction === 'Criado AT' ? 'selected' : ''}>Criado AT</option>
          </select>
        </td>
        <td>${html(cepOf(row))}</td>
        <td>${html(value(row, 'city'))}</td>
        <td>${html(value(row, 'bairro'))}</td>
        <td>${html(value(row, 'driverId'))}</td>
        <td>${html(value(row, 'driver'))}</td>
        <td>
          <textarea class="treatment-input" data-treatment-row="${html(row.__txfRowId || '')}" rows="2" placeholder="Descreva a tratativa realizada">${html(row.__txfTratativa || '')}</textarea>
        </td>
      </tr>
    `;
  }

  function updateReceivedAction(rowId, action) {
    const row = state.rows.find(item => item.__txfRowId === rowId);
    if (!row) return;
    if (action === 'Criado AT') {
      row.__txfStatusAction = 'Criado AT';
      row.__txfStatusOverride = 'Delivering';
      if (!row.__txfTratativa) row.__txfTratativa = 'Criado AT';
    } else {
      row.__txfStatusAction = '';
      row.__txfStatusOverride = '';
    }
    rememberTreatment(row);
    renderAll();
    state.currentRows = filteredRows(state.currentFilter || { kind: 'Hub_Received' });
    renderModalRows();
    if (state.rows.length) saveCloudState();
  }

  function updateTreatment(rowId, text) {
    const row = state.rows.find(item => item.__txfRowId === rowId);
    if (!row) return;
    row.__txfTratativa = clean(text);
    const key = trackingKey(value(row, 'tracking'));
    if (row.__txfDamage && state.damageRegistry[key]) {
      state.damageRegistry[key].treatment = row.__txfTratativa;
    }
    rememberTreatment(row);
    renderReceivedMonitor();
    if (row.__txfDamage) renderDamageView();
    scheduleCloudSave();
  }

  function rowSearchText(row) {
    return [
      value(row, 'tracking'),
      statusOf(row),
      cepOf(row),
      value(row, 'city'),
      value(row, 'bairro'),
      value(row, 'driverId'),
      value(row, 'driver'),
      row.__file,
      row.__sheet,
      row.__txfTratativa || '',
      row.__txfStatusAction || ''
    ].join(' ');
  }

  function lhRaw(row, type) {
    const key = state.lhColumns[type];
    return clean((key ? row[key] : '') || row[type] || '');
  }

  function lhCepOf(row) {
    const digits = clean(lhRaw(row, 'cep')).replace(/\D/g, '');
    return digits ? digits.padStart(8, '0').slice(-8) : '';
  }

  function lhValue(row, type) {
    if (type === 'city' || type === 'bairro') {
      const mapped = cepMap[lhCepOf(row)] || {};
      const fallback = type === 'city' ? 'Sem cidade' : 'Sem bairro';
      return lhRaw(row, type) || mapped[type === 'city' ? 'cidade' : 'bairro'] || fallback;
    }
    if (type === 'driver') return lhRaw(row, 'driver') || 'Sem driver';
    if (type === 'driverId') return lhRaw(row, 'driverId') || 'Sem ID';
    const fallbacks = { tracking: 'Sem tracking', status: '(vazio)', cep: 'Sem CEP' };
    return lhRaw(row, type) || fallbacks[type] || '';
  }

  function lhStatusOf(row) {
    return normalizeStatus(lhValue(row, 'status') || row.__sheet || row.__file);
  }

  function isLhControlStatus(status) {
    return status === 'SOC_LHTransported' || isReceived(status);
  }

  function lhRelevantRows() {
    return state.lhRows.filter(row => isLhControlStatus(lhStatusOf(row)));
  }

  function lhSearchText(row) {
    return [
      lhValue(row, 'tracking'),
      lhStatusOf(row),
      lhCepOf(row),
      lhValue(row, 'city'),
      lhValue(row, 'bairro'),
      lhValue(row, 'driverId'),
      lhValue(row, 'driver'),
      row.__file,
      row.__sheet
    ].join(' ');
  }

  function lhVisibleRows() {
    const query = low(state.lhFilter.search);
    const baseRows = state.lhFilter.status === 'other' ? state.lhRows : lhRelevantRows();
    return baseRows.filter(row => {
      const status = lhStatusOf(row);
      if (state.lhFilter.status === 'SOC_LHTransported' && status !== 'SOC_LHTransported') return false;
      if (state.lhFilter.status === 'Hub_Received' && !isReceived(status)) return false;
      if (state.lhFilter.status === 'other' && isLhControlStatus(status)) return false;
      if (state.lhFilter.city && lhValue(row, 'city') !== state.lhFilter.city) return false;
      if (query && !low(lhSearchText(row)).includes(query)) return false;
      return true;
    });
  }

  function lhGroupRows(rows, keyFn) {
    const groups = new Map();
    rows.forEach(row => {
      const key = keyFn(row);
      groups.set(key, (groups.get(key) || 0) + 1);
    });
    return Array.from(groups.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'));
  }

  function lhRouteStatsFor(rows) {
    return rows.reduce((acc, row) => {
      const status = lhStatusOf(row);
      acc.total += 1;
      if (status === 'SOC_LHTransported') acc.socLH += 1;
      if (isReceived(status)) acc.received += 1;
      return acc;
    }, { total: 0, socLH: 0, received: 0 });
  }

  function groupedLhRouteStats(rows, keyFn) {
    const groups = new Map();
    rows.forEach(row => {
      const key = keyFn(row);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });
    return Array.from(groups.entries())
      .map(([name, groupRows]) => ({ name, stats: lhRouteStatsFor(groupRows) }))
      .sort((a, b) => b.stats.total - a.stats.total || a.name.localeCompare(b.name, 'pt-BR'));
  }

  function selectedLhRouteCities(cityGroups) {
    const available = new Set(cityGroups.map(group => group.name));
    let selected = (state.lhRouteCities || []).filter(city => available.has(city));
    if (!selected.length && !state.lhRouteSelectionTouched) selected = routeCityDefaults(cityGroups);
    state.lhRouteCities = selected;
    return selected;
  }

  function setLhRouteCities(cities, touched = true) {
    state.lhRouteCities = Array.from(new Set(cities.filter(Boolean)));
    state.lhRouteSelectionTouched = touched;
    renderLhControl();
  }

  function lhBairroRouteGroups(rows) {
    const groups = new Map();
    rows.forEach(row => {
      const city = lhValue(row, 'city');
      const bairro = lhValue(row, 'bairro');
      const key = groupKey([city, bairro]);
      if (!groups.has(key)) groups.set(key, { city, bairro, rows: [] });
      groups.get(key).rows.push(row);
    });
    return Array.from(groups.values())
      .map(group => ({ ...group, stats: lhRouteStatsFor(group.rows) }))
      .sort((a, b) => b.stats.total - a.stats.total || a.city.localeCompare(b.city, 'pt-BR') || a.bairro.localeCompare(b.bairro, 'pt-BR'));
  }

  function lhStatusData(rows) {
    return {
      total: rows.length,
      soc: rows.filter(row => lhStatusOf(row) === 'SOC_LHTransported').length,
      received: rows.filter(row => isReceived(lhStatusOf(row))).length,
      other: rows.filter(row => !isLhControlStatus(lhStatusOf(row))).length
    };
  }

  function renderLhControl() {
    if (!els.lhTable) return;
    const allRows = state.lhRows;
    const relevant = lhRelevantRows();
    const visible = lhVisibleRows();
    const { total, soc, received, other } = lhStatusData(allRows);
    const cities = lhGroupRows(allRows, row => lhValue(row, 'city'));
    const bairroBaseRows = state.lhFilter.city ? allRows.filter(row => lhValue(row, 'city') === state.lhFilter.city) : allRows;
    const bairros = lhGroupRows(bairroBaseRows, row => `${lhValue(row, 'city')} / ${lhValue(row, 'bairro')}`);
    if (state.lhFilter.city && !cities.some(([city]) => city === state.lhFilter.city)) state.lhFilter.city = '';
    els.lhStatusFilter.value = state.lhFilter.status || 'all';
    fillSelect(els.lhCityFilter, [['', 'Todas']], cities.map(([city]) => [city, city]), state.lhFilter.city);
    els.lhSearch.value = state.lhFilter.search || '';
    els.lhStats.innerHTML = [
      ['Total LH', total, `${number(state.lhFiles.length)} ${plural(state.lhFiles.length, 'arquivo', 'arquivos')} importado${state.lhFiles.length === 1 ? '' : 's'}`, 'total'],
      ['SOC LH', soc, `${percent(soc, total)} da triagem`, 'soc'],
      ['Hub Received', received, `${percent(received, total)} da triagem`, 'received'],
      ['Outros status', other, other ? 'Verificar status fora do padrao' : 'Nenhum status diferente', other ? 'alert' : 'ok']
    ].map(([label, qty, note, tone]) => `
      <button class="lh-kpi lh-kpi-${tone}" type="button" data-lh-kpi="${html(tone)}">
        <b>${number(qty)}</b>
        <small>${html(label)}</small>
        <em>${html(note)}</em>
      </button>
    `).join('');

    renderLhStatusBars(allRows, soc, received, other);
    renderLhRadar(els.lhCityRadar, cities, total, 'Nenhuma cidade carregada.', 'city');
    renderLhRadar(els.lhBairroRadar, bairros, bairroBaseRows.length, 'Nenhum bairro carregado.');
    renderLhRouteCalculator(relevant);

    els.lhTable.innerHTML = visible.map(row => `
      <tr>
        <td>${statusPill(lhStatusOf(row))}</td>
        <td>${html(lhValue(row, 'tracking'))}</td>
        <td>${html(lhCepOf(row))}</td>
        <td>${html(lhValue(row, 'city'))}</td>
        <td>${html(lhValue(row, 'bairro'))}</td>
        <td>${html(lhValue(row, 'driver'))}</td>
        <td>${html(row.__file || '')}</td>
      </tr>
    `).join('') || '<tr><td colspan="7">Importe a planilha da triagem ou ajuste a busca.</td></tr>';
  }

  function renderLhRouteCalculator(rows) {
    const cityGroups = groupedLhRouteStats(rows, row => lhValue(row, 'city'));
    const selectedCities = selectedLhRouteCities(cityGroups);
    const selectedSet = new Set(selectedCities);

    els.lhRouteCityChecklist.innerHTML = cityGroups.length ? cityGroups.map(group => {
      const checked = selectedSet.has(group.name) ? 'checked' : '';
      return `
        <label class="route-city-option">
          <input type="checkbox" data-lh-route-city-check value="${html(group.name)}" ${checked}>
          <span>${html(group.name)}</span>
          <b>${number(group.stats.total)}</b>
        </label>
      `;
    }).join('') : '<p class="muted">Importe a triagem LH para listar as cidades.</p>';

    const selectedRows = rows.filter(row => selectedSet.has(lhValue(row, 'city')));
    const selectedStats = lhRouteStatsFor(selectedRows);
    const selectedBairros = lhBairroRouteGroups(selectedRows);
    const cards = [
      [selectedCities.length === 1 ? 'Total da cidade' : 'Total das cidades', selectedStats.total, 'Base CONTROLE LH'],
      ['Bairros', selectedBairros.length, 'Bairros da rota selecionada']
    ];
    els.lhRouteSummary.innerHTML = selectedStats.total ? cards.map(([label, qty, note], index) => `
      <article class="route-card route-card-${index + 1}">
        <span>${html(label)}</span>
        <strong>${number(qty)}</strong>
        <small>${html(note)}</small>
      </article>
    `).join('') : `
      <div class="empty-route">
        <strong>Nenhuma rota LH selecionada.</strong>
        <span>Importe a triagem e escolha uma ou mais cidades.</span>
      </div>
    `;

    els.lhRouteBairroTable.innerHTML = selectedBairros.length ? selectedBairros.map(group => `
      <tr>
        <td>${html(group.city)} / ${html(group.bairro)}</td>
        <td>${number(group.stats.total)}</td>
        <td><button class="mini-button" data-lh-open='${html(JSON.stringify({ city: group.city, bairro: group.bairro }))}'>Abrir</button></td>
      </tr>
    `).join('') : '<tr><td colspan="3">Escolha uma ou mais cidades da triagem LH.</td></tr>';

    const selectedCityGroups = cityGroups.filter(group => selectedSet.has(group.name));
    els.lhRouteSelectedCities.innerHTML = selectedCityGroups.length ? `
      <div class="route-selected-head">
        <div>
          <strong>Cidades selecionadas</strong>
          <span>${number(selectedStats.total)} ${plural(selectedStats.total, 'pacote', 'pacotes')} no total</span>
        </div>
        <div class="route-view-toggle" aria-label="Modo de visualizaÃƒÂ§ÃƒÂ£o">
          <button class="mini-button ${state.lhRouteViewMode === 'grid' ? 'active' : ''}" type="button" data-lh-route-view="grid">Lado a lado</button>
          <button class="mini-button ${state.lhRouteViewMode === 'list' ? 'active' : ''}" type="button" data-lh-route-view="list">Um abaixo do outro</button>
        </div>
      </div>
      <div class="route-selected-list ${state.lhRouteViewMode === 'list' ? 'stacked' : ''}">
        ${selectedCityGroups.map(group => `
          <button class="route-selected-city" type="button" data-lh-route-city="${html(group.name)}" title="Remover ${html(group.name)} da rota LH">
            <span>${html(group.name)}</span>
            <strong>${number(group.stats.total)}</strong>
            <small>${number(group.stats.total)} pacotes</small>
          </button>
        `).join('')}
      </div>
    ` : '<div class="route-selected-empty">Nenhuma cidade selecionada.</div>';

    els.lhRouteCityTable.innerHTML = cityGroups.length ? cityGroups.map(group => {
      const selected = selectedSet.has(group.name);
      return `
        <tr>
          <td>${html(group.name)}</td>
          <td>${number(group.stats.total)}</td>
          <td><button class="mini-button" data-lh-route-city="${html(group.name)}">${selected ? 'Remover' : 'Adicionar'}</button></td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="3">Nenhuma cidade LH carregada.</td></tr>';
  }

  function renderLhStatusBars(rows, soc, received, other = 0) {
    const total = rows.length || 1;
    const items = [
      ['SOC LH', soc, 'SOC_LHTransported'],
      ['Hub Received', received, 'Hub_Received'],
      ['Outros status', other, 'other']
    ];
    els.lhStatusBars.innerHTML = items.map(([label, qty, filter]) => {
      const width = Math.max((qty / total) * 100, qty ? 6 : 0);
      const tone = filter === 'other' && qty ? ' warning' : '';
      return `<button class="lh-status-line${tone}" type="button" data-lh-status="${html(filter)}">
        <span><strong>${html(label)}</strong><b>${number(qty)}</b></span>
        <i><em style="width:${width}%"></em></i>
      </button>`;
    }).join('') || '<p class="muted">Importe a triagem para gerar o resumo.</p>';
  }

  function renderLhRadar(container, groups, total, emptyText, mode = '') {
    container.innerHTML = groups.slice(0, 10).map(([label, qty]) => {
      const tag = mode === 'city' ? 'button' : 'div';
      const data = mode === 'city' ? ` data-lh-city="${html(label)}" type="button"` : '';
      return `<${tag} class="lh-radar-line"${data}>
        <strong>${html(label)}</strong>
        <b>${number(qty)}</b>
        <small>${percent(qty, total)}</small>
      </${tag}>`;
    }).join('') || `<p class="muted">${html(emptyText)}</p>`;
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
        <span><strong>${html(value(row, 'tracking'))}</strong><span>${html(statusOf(row))} | ${html(cepOf(row))} | ${html(value(row, 'city'))} | ${html(value(row, 'bairro'))} | ${html(value(row, 'driverId'))} | ${html(value(row, 'driver'))}</span></span>
        <b class="severity normal">Abrir</b>
      </button>
    `).join('') || '<p class="muted">Nada encontrado.</p>';
  }

  function copyRows(rows) {
    const includeTreatment = rows.some(row => row.__txfTratativa || row.__txfStatusAction);
    const text = rows.map(row => [
      value(row, 'tracking'),
      statusOf(row),
      cepOf(row),
      value(row, 'city'),
      value(row, 'bairro'),
      value(row, 'driverId'),
      value(row, 'driver'),
      row.__file || '',
      ...(includeTreatment ? [row.__txfStatusAction || '', row.__txfTratativa || ''] : [])
    ].join('\t')).join('\n');
    navigator.clipboard?.writeText(text);
  }

  function downloadPending() {
    const rows = filteredRows({ kind: 'notDelivered' });
    if (state.rows.length) saveCloudState();
    downloadRowsCsv(rows, 'pendentes-txf.csv');
  }

  function exportHistory() {
    const header = ['Data', 'Arquivos', 'Total', 'Delivered', 'Pendentes', 'Received', 'Assigned', 'Delivering', 'SOC LH', 'OnHold', 'SLA'];
    const body = state.history.map(item => [
      new Date(item.date).toLocaleString('pt-BR'),
      item.files.join(' | '),
      item.total,
      item.delivered,
      item.pending,
      item.received,
      item.assigned,
      item.delivering,
      item.socLH || 0,
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
    if (state.rows.length) saveCloudState();
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
    const includeTreatment = rows.some(row => row.__txfTratativa || row.__txfStatusAction);
    const header = ['Tracking', 'Status', 'CEP', 'Cidade', 'Bairro', 'Driver ID', 'Driver', 'Arquivo'].concat(includeTreatment ? ['AÃ§Ã£o', 'Tratativa'] : []);
    const body = rows.map(row => [
      value(row, 'tracking'),
      statusOf(row),
      cepOf(row),
      value(row, 'city'),
      value(row, 'bairro'),
      value(row, 'driverId'),
      value(row, 'driver'),
      row.__file || '',
      ...(includeTreatment ? [row.__txfStatusAction || '', row.__txfTratativa || ''] : [])
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
    els.monitorToggle.addEventListener('click', () => toggleMonitoring());
    els.toolsToggle.addEventListener('click', () => toggleTools());
    els.lhToggle.addEventListener('click', () => toggleLhMenu());

    document.body.addEventListener('click', event => {
      const filterButton = event.target.closest('[data-filter]');
      if (filterButton) {
        openDetails({ kind: filterButton.dataset.filter }, detailTitle(filterButton.dataset.filter));
      }

      const openButton = event.target.closest('[data-open]');
      if (openButton) {
        const filter = JSON.parse(openButton.dataset.open);
        if (filter.tracking) {
          filter.kind = 'all';
          const tracking = filter.tracking;
          state.currentFilter = filter;
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
        state.currentFilter = { kind: 'notDelivered', region };
        state.currentRows = rowsByRegion(region);
        els.modalTitle.textContent = `RegiÃ£o: ${region}`;
        els.modalSubtitle.textContent = `${number(state.currentRows.length)} pendentes encontrados`;
        els.modalSearch.value = '';
        renderModalRows();
        els.modal.showModal();
        refreshIcons();
      }

      const removeDamageButton = event.target.closest('[data-remove-damage]');
      if (removeDamageButton) removeDamageEntry(removeDamageButton.dataset.removeDamage);

      const routeCityButton = event.target.closest('[data-route-city]');
      if (routeCityButton) {
        const city = routeCityButton.dataset.routeCity;
        const selected = new Set(state.routeCities || []);
        if (selected.has(city)) selected.delete(city);
        else selected.add(city);
        setRouteCities(Array.from(selected));
        setView('route');
      }

      const routeViewButton = event.target.closest('[data-route-view]');
      if (routeViewButton) {
        state.routeViewMode = routeViewButton.dataset.routeView === 'list' ? 'list' : 'grid';
        renderRouteCalculator();
      }

      const viewJump = event.target.closest('[data-view-jump]');
      if (viewJump) setView(viewJump.dataset.viewJump);

      const lhStatusButton = event.target.closest('[data-lh-status]');
      if (lhStatusButton) {
        state.lhFilter.status = lhStatusButton.dataset.lhStatus;
        renderLhControl();
      }

      const lhCityButton = event.target.closest('[data-lh-city]');
      if (lhCityButton) {
        state.lhFilter.city = lhCityButton.dataset.lhCity;
        renderLhControl();
      }

      const lhKpiButton = event.target.closest('[data-lh-kpi]');
      if (lhKpiButton) {
        const type = lhKpiButton.dataset.lhKpi;
        if (type === 'soc') state.lhFilter.status = 'SOC_LHTransported';
        else if (type === 'received') state.lhFilter.status = 'Hub_Received';
        else if (type === 'alert') state.lhFilter.status = 'other';
        else state.lhFilter.status = 'all';
        renderLhControl();
      }

      const lhRouteCityButton = event.target.closest('[data-lh-route-city]');
      if (lhRouteCityButton) {
        const city = lhRouteCityButton.dataset.lhRouteCity;
        const selected = new Set(state.lhRouteCities || []);
        if (selected.has(city)) selected.delete(city);
        else selected.add(city);
        setLhRouteCities(Array.from(selected));
      }

      const lhRouteViewButton = event.target.closest('[data-lh-route-view]');
      if (lhRouteViewButton) {
        state.lhRouteViewMode = lhRouteViewButton.dataset.lhRouteView === 'list' ? 'list' : 'grid';
        renderLhControl();
      }

      const lhOpenButton = event.target.closest('[data-lh-open]');
      if (lhOpenButton) {
        const filter = JSON.parse(lhOpenButton.dataset.lhOpen);
        const title = filter.bairro ? `LH: ${filter.city} / ${filter.bairro}` : `LH: ${filter.city || 'Todos'}`;
        openLhDetails(filter, title);
      }

      const sortHeader = event.target.closest('th');
      if (sortHeader) sortTableByHeader(sortHeader);
    });

    document.body.addEventListener('change', event => {
      const statusSelect = event.target.closest('[data-status-row]');
      if (statusSelect) updateReceivedAction(statusSelect.dataset.statusRow, statusSelect.value);

      const routeCheck = event.target.closest('[data-route-city-check]');
      if (routeCheck) {
        const selected = new Set(state.routeCities || []);
        if (routeCheck.checked) selected.add(routeCheck.value);
        else selected.delete(routeCheck.value);
        setRouteCities(Array.from(selected));
      }

      const lhRouteCheck = event.target.closest('[data-lh-route-city-check]');
      if (lhRouteCheck) {
        const selected = new Set(state.lhRouteCities || []);
        if (lhRouteCheck.checked) selected.add(lhRouteCheck.value);
        else selected.delete(lhRouteCheck.value);
        setLhRouteCities(Array.from(selected));
      }
    });

    document.body.addEventListener('input', event => {
      const treatmentInput = event.target.closest('[data-treatment-row]');
      if (treatmentInput) updateTreatment(treatmentInput.dataset.treatmentRow, treatmentInput.value);
    });

    document.body.addEventListener('focusout', event => {
      const treatmentInput = event.target.closest('[data-treatment-row]');
      if (treatmentInput && state.rows.length) saveCloudState();
    });

    els.fileInput.addEventListener('change', event => handleFiles(event.target.files));
    els.lhFileInput.addEventListener('change', event => handleLhFiles(event.target.files));
    els.lhStatusFilter.addEventListener('change', event => {
      state.lhFilter.status = event.target.value;
      renderLhControl();
    });
    els.lhCityFilter.addEventListener('change', event => {
      state.lhFilter.city = event.target.value;
      renderLhControl();
    });
    els.lhSearch.addEventListener('input', event => {
      state.lhFilter.search = event.target.value;
      renderLhControl();
    });
    els.lhExportBtn.addEventListener('click', exportLhControl);
    els.lhClearBtn.addEventListener('click', clearLhControl);
    els.lhRouteDefaultBtn.addEventListener('click', () => {
      const cityGroups = groupedLhRouteStats(lhRelevantRows(), row => lhValue(row, 'city'));
      setLhRouteCities(routeCityDefaults(cityGroups));
    });
    els.lhRouteAllBtn.addEventListener('click', () => {
      const cityGroups = groupedLhRouteStats(lhRelevantRows(), row => lhValue(row, 'city'));
      setLhRouteCities(cityGroups.map(group => group.name));
    });
    els.lhRouteClearBtn.addEventListener('click', () => setLhRouteCities([]));
    els.damageTracking.addEventListener('input', updateDamagePreview);
    els.damageForm.addEventListener('submit', event => {
      event.preventDefault();
      addDamageEntry();
    });
    els.routeDefaultBtn.addEventListener('click', () => {
      const cityGroups = groupedRouteStats(state.rows, row => value(row, 'city'));
      setRouteCities(routeCityDefaults(cityGroups));
    });
    els.routeAllBtn.addEventListener('click', () => {
      const cityGroups = groupedRouteStats(state.rows, row => value(row, 'city'));
      setRouteCities(cityGroups.map(group => group.name));
    });
    els.routeClearBtn.addEventListener('click', () => setRouteCities([]));
    els.receivedCityFilter.addEventListener('change', () => {
      state.receivedMonitor.city = els.receivedCityFilter.value;
      state.receivedMonitor.bairro = '';
      renderReceivedMonitor();
    });
    els.receivedBairroFilter.addEventListener('change', () => {
      state.receivedMonitor.bairro = els.receivedBairroFilter.value;
      renderReceivedMonitor();
    });
    els.receivedSort.addEventListener('change', () => {
      state.receivedMonitor.sort = els.receivedSort.value === 'asc' ? 'asc' : 'desc';
      renderReceivedMonitor();
    });
    els.receivedSearch.addEventListener('input', () => {
      state.receivedMonitor.search = els.receivedSearch.value;
      renderReceivedMonitor();
    });
    els.assignedCityFilter.addEventListener('change', () => {
      state.assignedMonitor.city = els.assignedCityFilter.value;
      state.assignedMonitor.bairro = '';
      renderAssignedMonitor();
    });
    els.assignedBairroFilter.addEventListener('change', () => {
      state.assignedMonitor.bairro = els.assignedBairroFilter.value;
      renderAssignedMonitor();
    });
    els.assignedSort.addEventListener('change', () => {
      state.assignedMonitor.sort = els.assignedSort.value === 'asc' ? 'asc' : 'desc';
      renderAssignedMonitor();
    });
    els.assignedSearch.addEventListener('input', () => {
      state.assignedMonitor.search = els.assignedSearch.value;
      renderAssignedMonitor();
    });
    els.searchInput.addEventListener('input', renderSearch);
    els.modalSearch.addEventListener('input', renderModalRows);
    els.copyRowsBtn.addEventListener('click', () => isLhModal() ? copyLhRows(state.currentRows) : copyRows(state.currentRows));
    els.copySummaryBtn.addEventListener('click', () => navigator.clipboard?.writeText(state.summary || 'Importe os arquivos para gerar o resumo.'));
    els.copyMissionBtn.addEventListener('click', () => navigator.clipboard?.writeText(state.summary || 'Importe os arquivos para gerar a missÃ£o.'));
    els.copyMapBtn.addEventListener('click', () => navigator.clipboard?.writeText(state.mapSummary || 'Importe os arquivos para gerar o mapa operacional.'));
    els.copyRouteBtn.addEventListener('click', copyRouteSummary);
    els.copyLhRouteBtn.addEventListener('click', copyLhRouteSummary);
    els.copyManagerBtn.addEventListener('click', () => navigator.clipboard?.writeText(state.managerText || 'Importe os arquivos para gerar o resumo gerencial.'));
    els.copyActionPlanBtn.addEventListener('click', () => navigator.clipboard?.writeText(state.actionPlanText || 'Importe os arquivos para gerar o plano de aÃ§Ã£o.'));
    els.downloadPendingBtn.addEventListener('click', downloadPending);
    els.saveCloudBtn.addEventListener('click', () => saveCloudState());
    els.loadCloudBtn.addEventListener('click', () => loadCloudState());
    els.exportVisibleBtn.addEventListener('click', exportVisibleRows);
    els.exportIssuesBtn.addEventListener('click', exportIssues);
    els.exportHistoryBtn.addEventListener('click', exportHistory);
    els.clearHistoryBtn.addEventListener('click', () => {
      state.history = [];
      persistHistory();
      renderAll();
    });
    els.applyColumnsBtn.addEventListener('click', async () => {
      els.columnMapper.querySelectorAll('select').forEach(select => {
        state.columns[select.dataset.columnType] = select.value;
      });
      renderAll();
      saveCurrentImport();
      renderHistory();
      renderManager(state.stats);
      await saveCloudState();
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
    els.lhToggle.classList.toggle('active', ['lh', 'lh-route'].includes(id));
    const active = document.querySelector(`.nav-button[data-view="${id}"] span`);
    document.getElementById('viewTitle').textContent = active ? active.textContent : 'Dashboard';
    setToolsOpen(['history', 'search'].includes(id));
    setMonitoringOpen(['received', 'assigned'].includes(id));
    setLhMenuOpen(['lh', 'lh-route'].includes(id));
    if (els.emptyState) els.emptyState.classList.toggle('hidden', (state.stats?.total || 0) > 0 || ['lh', 'lh-route'].includes(id));
  }

  function toggleTools(force) {
    const shouldOpen = typeof force === 'boolean' ? force : !els.toolsMenu.classList.contains('open');
    setToolsOpen(shouldOpen);
  }

  function toggleMonitoring(force) {
    const shouldOpen = typeof force === 'boolean' ? force : !els.monitorMenu.classList.contains('open');
    setMonitoringOpen(shouldOpen);
  }

  function toggleLhMenu(force) {
    const shouldOpen = typeof force === 'boolean' ? force : !els.lhMenu.classList.contains('open');
    setLhMenuOpen(shouldOpen);
  }

  function setToolsOpen(open) {
    els.toolsMenu.classList.toggle('open', open);
    els.toolsToggle.classList.toggle('open', open);
    els.toolsToggle.setAttribute('aria-expanded', String(open));
  }

  function setMonitoringOpen(open) {
    els.monitorMenu.classList.toggle('open', open);
    els.monitorToggle.classList.toggle('open', open);
    els.monitorToggle.setAttribute('aria-expanded', String(open));
  }

  function setLhMenuOpen(open) {
    els.lhMenu.classList.toggle('open', open);
    els.lhToggle.classList.toggle('open', open);
    els.lhToggle.setAttribute('aria-expanded', String(open));
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function init() {
    loadHistory();
    loadLhControl();
    els.cepCount.textContent = number(Object.keys(cepMap).length);
    bindEvents();
    renderAll();
    refreshIcons();
    loadCloudState({ silent: true });
    loadLhCloudState({ silent: true });
  }

  init();
}());
