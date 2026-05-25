/* ═══════════════════════════════════════════════════════
   FLO — Personal Finance Tracker  |  script.js
   Clean, modular, well-commented JavaScript
   No frameworks. Uses localStorage for persistence.
═══════════════════════════════════════════════════════ */

/* ─── Constants & Config ──────────────────────────── */

const CATEGORIES = ['Food','Transport','Shopping','Bills','Rent','Entertainment','Health','Education','Other'];
const CAT_EMOJI  = { Food:'🍔', Transport:'🚌', Shopping:'🛍', Bills:'💡', Rent:'🏠', Entertainment:'🎭', Health:'💊', Education:'📚', Other:'📦', Income:'💰' };
const CAT_COLORS = ['#f0a500','#34d399','#60a5fa','#f87171','#a78bfa','#fb923c','#38bdf8','#f472b6','#94a3b8'];

/* ─── State ───────────────────────────────────────── */

let transactions = [];   // Array of transaction objects
let savingsGoals = [];   // Array of savings goal objects
let budget       = 0;   // Monthly budget limit
let editId       = null; // ID of transaction being edited
let editSavId    = null; // ID of savings goal being edited
let txnType      = 'income'; // Current modal type selection

// Chart instances (stored so we can destroy/recreate)
let chartBar  = null;
let chartPie  = null;
let chartLine = null;

/* ─── LocalStorage Helpers ────────────────────────── */

/**
 * Load all persisted data from localStorage.
 */
function loadFromStorage() {
  try {
    transactions = JSON.parse(localStorage.getItem('flo_txns'))    || [];
    savingsGoals = JSON.parse(localStorage.getItem('flo_savings')) || [];
    budget       = parseFloat(localStorage.getItem('flo_budget'))  || 0;
  } catch(e) {
    console.error('Storage parse error:', e);
    transactions = []; savingsGoals = []; budget = 0;
  }
}

/** Persist transactions array. */
function saveTxnsToStorage()    { localStorage.setItem('flo_txns',    JSON.stringify(transactions)); }
/** Persist savings goals array. */
function saveSavingsToStorage() { localStorage.setItem('flo_savings', JSON.stringify(savingsGoals)); }
/** Persist budget value. */
function saveBudgetToStorage()  { localStorage.setItem('flo_budget',  budget); }

/* ─── Sample Data ─────────────────────────────────── */

/**
 * Seeds the app with realistic sample transactions for demo purposes.
 * Only runs if no transactions exist in storage.
 */
function seedSampleData() {
  if (transactions.length > 0) return;

  const today = new Date();
  const ym = (offset=0) => {
    const d = new Date(today); d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0,10);
  };

  transactions = [
    // Income
    { id: uid(), type:'income',  amount:4500, desc:'Monthly Salary',         category:'Income', date: ym(0)  },
    { id: uid(), type:'income',  amount:800,  desc:'Freelance Project',       category:'Income', date: ym(8)  },
    { id: uid(), type:'income',  amount:4500, desc:'Monthly Salary',         category:'Income', date: ym(32) },
    { id: uid(), type:'income',  amount:250,  desc:'Stock Dividends',         category:'Income', date: ym(15) },
    // Expenses
    { id: uid(), type:'expense', amount:950,  desc:'Apartment Rent',          category:'Rent',          date: ym(1)  },
    { id: uid(), type:'expense', amount:120,  desc:'Electricity & Internet',   category:'Bills',         date: ym(3)  },
    { id: uid(), type:'expense', amount:85,   desc:'Weekly Groceries',        category:'Food',          date: ym(2)  },
    { id: uid(), type:'expense', amount:45,   desc:'Restaurant Dinner',        category:'Food',          date: ym(4)  },
    { id: uid(), type:'expense', amount:30,   desc:'Taxi Rides',               category:'Transport',     date: ym(3)  },
    { id: uid(), type:'expense', amount:200,  desc:'New Sneakers',             category:'Shopping',      date: ym(6)  },
    { id: uid(), type:'expense', amount:15,   desc:'Netflix Subscription',     category:'Entertainment', date: ym(5)  },
    { id: uid(), type:'expense', amount:60,   desc:'Gym Membership',           category:'Health',        date: ym(7)  },
    { id: uid(), type:'expense', amount:180,  desc:'Online Course',            category:'Education',     date: ym(10) },
    { id: uid(), type:'expense', amount:55,   desc:'Coffee & Snacks',          category:'Food',          date: ym(9)  },
    { id: uid(), type:'expense', amount:35,   desc:'Bus Pass',                 category:'Transport',     date: ym(12) },
    { id: uid(), type:'expense', amount:75,   desc:'Doctor Visit',             category:'Health',        date: ym(14) },
    { id: uid(), type:'expense', amount:110,  desc:'Clothing',                 category:'Shopping',      date: ym(20) },
    { id: uid(), type:'expense', amount:950,  desc:'Apartment Rent',           category:'Rent',          date: ym(33) },
    { id: uid(), type:'expense', amount:90,   desc:'Utility Bills',            category:'Bills',         date: ym(35) },
    { id: uid(), type:'expense', amount:65,   desc:'Groceries',                category:'Food',          date: ym(38) },
  ];

  savingsGoals = [
    { id: uid(), name:'Emergency Fund',  target:10000, current:3200, date: futureDate(180) },
    { id: uid(), name:'Bali Vacation',   target:2500,  current:900,  date: futureDate(90)  },
    { id: uid(), name:'New Laptop',      target:1500,  current:1100, date: futureDate(45)  },
  ];

  budget = 2500;

  saveTxnsToStorage();
  saveSavingsToStorage();
  saveBudgetToStorage();
}

/** Returns a date N days in the future as YYYY-MM-DD. */
function futureDate(days) {
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.toISOString().slice(0,10);
}

/* ─── Utilities ───────────────────────────────────── */

/** Generates a short unique ID. */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Formats a number as $1,234.56 */
function fmt(n) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
}

/** Returns YYYY-MM for a given date string. */
function yearMonth(dateStr) { return dateStr.slice(0,7); }

/** Returns short month label like "Jan 25". */
function shortMonth(ym) {
  const [y,m] = ym.split('-');
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return names[parseInt(m)-1] + ' ' + y.slice(2);
}

/** Formats a date string to "May 9, 2025". */
function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

/** Current YYYY-MM. */
function currentYM() { return new Date().toISOString().slice(0,7); }

/** Current YYYY-MM-DD. */
function todayStr() { return new Date().toISOString().slice(0,10); }

/* ─── Navigation ──────────────────────────────────── */

/**
 * Switches active page and updates sidebar highlighting.
 * @param {string} page - page key (dashboard|transactions|charts|budget|savings)
 */
function navigate(page) {
  // Hide all pages, deactivate all nav items
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show target page
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector(`.nav-item[data-page="${page}"]`).classList.add('active');

  // Close mobile sidebar
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('backdrop').classList.remove('open');
  }

  // Refresh charts when analytics is opened (canvas needs visible parent)
  if (page === 'charts') renderCharts();
  if (page === 'budget') renderBudgetPage();
  if (page === 'savings') renderSavings();
}

/* ─── Sidebar Toggle (Mobile) ─────────────────────── */

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('backdrop').classList.toggle('open');
}

/* ─── Theme Toggle ────────────────────────────────── */

function toggleTheme() {
  const html  = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('flo_theme', isDark ? 'light' : 'dark');

  // Update button labels
  document.getElementById('themeLabel').textContent = isDark ? 'Dark Mode' : 'Light Mode';

  // Swap icon to moon/sun
  const sunPath = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  const moonPath = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
  const icon = isDark ? moonPath : sunPath;
  document.getElementById('themeIcon').innerHTML = icon;
  document.getElementById('themeIconMobile').innerHTML = icon;

  // Rebuild charts with new colors
  if (document.getElementById('page-charts').classList.contains('active')) {
    renderCharts();
  }
}

function loadTheme() {
  const saved = localStorage.getItem('flo_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  if (saved === 'light') {
    document.getElementById('themeLabel').textContent = 'Dark Mode';
    const moonPath = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
    document.getElementById('themeIcon').innerHTML = moonPath;
    document.getElementById('themeIconMobile').innerHTML = moonPath;
  }
}

/* ─── Dashboard Rendering ─────────────────────────── */

/**
 * Main dashboard refresh — updates all KPI cards,
 * monthly summary strip, recent list, and insights.
 */
function renderDashboard() {
  // ── Greeting
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('dashGreeting').textContent = `${greet} — here's your financial snapshot.`;

  // ── KPI totals
  const totalIncome  = transactions.filter(t => t.type==='income').reduce((s,t) => s+t.amount, 0);
  const totalExpense = transactions.filter(t => t.type==='expense').reduce((s,t) => s+t.amount, 0);
  const balance      = totalIncome - totalExpense;

  document.getElementById('kpiBalance').textContent  = fmt(balance);
  document.getElementById('kpiIncome').textContent   = fmt(totalIncome);
  document.getElementById('kpiExpenses').textContent = fmt(totalExpense);
  document.getElementById('kpiBalanceSub').textContent = balance >= 0 ? '↑ Positive balance' : '↓ Negative balance';

  // ── Budget KPI
  const cym       = currentYM();
  const thisMonthExpense = transactions
    .filter(t => t.type==='expense' && yearMonth(t.date)===cym)
    .reduce((s,t) => s+t.amount, 0);

  if (budget > 0) {
    const pct = Math.min((thisMonthExpense / budget) * 100, 100);
    document.getElementById('kpiBudgetPct').textContent = Math.round(pct) + '%';
    const bar = document.getElementById('kpiBudgetBar');
    bar.style.width = pct + '%';
    bar.className = 'mini-bar-fill' + (pct >= 100 ? ' danger' : pct >= 80 ? ' warn' : '');
  } else {
    document.getElementById('kpiBudgetPct').textContent = '—';
    document.getElementById('kpiBudgetBar').style.width = '0%';
  }

  // ── Monthly summary strip (last 6 months)
  renderMonthlySummary();

  // ── Recent transactions (last 6)
  renderRecent();

  // ── Smart insights
  renderInsights(thisMonthExpense, totalExpense, totalIncome);
}

/**
 * Renders the scrollable monthly summary chips.
 */
function renderMonthlySummary() {
  const cym = currentYM();
  // Build last 6 months array
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0,7));
  }

  const html = months.map(ym => {
    const exp = transactions.filter(t => t.type==='expense' && yearMonth(t.date)===ym).reduce((s,t) => s+t.amount, 0);
    const inc = transactions.filter(t => t.type==='income'  && yearMonth(t.date)===ym).reduce((s,t) => s+t.amount, 0);
    const isCurrent = ym === cym;
    return `
      <div class="month-chip ${isCurrent ? 'is-current' : ''}">
        <div class="month-chip-name">${shortMonth(ym)}</div>
        <div class="month-chip-amount">${fmt(exp)}</div>
        <div class="month-chip-sub">spent · ${fmt(inc)} earned</div>
      </div>`;
  }).join('');

  document.getElementById('monthScroll').innerHTML = html;
}

/**
 * Renders up to 6 most recent transactions in the dashboard widget.
 */
function renderRecent() {
  const sorted = [...transactions].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 6);
  if (!sorted.length) {
    document.getElementById('recentList').innerHTML = '<div class="empty" style="padding:24px"><div class="empty-icon">◎</div><p>No transactions yet</p></div>';
    return;
  }
  document.getElementById('recentList').innerHTML = sorted.map(t => `
    <div class="recent-item">
      <div class="r-icon">${CAT_EMOJI[t.category] || '📦'}</div>
      <div class="r-info">
        <div class="r-desc">${escHtml(t.desc)}</div>
        <div class="r-meta">${fmtDate(t.date)} · ${t.category}</div>
      </div>
      <div class="r-amount ${t.type}">${t.type==='income' ? '+' : '−'}${fmt(t.amount)}</div>
    </div>
  `).join('');
}

/**
 * Generates and renders smart financial insights.
 */
function renderInsights(thisMonthExpense, totalExpense, totalIncome) {
  const insights = [];
  const cym = currentYM();

  // Insight 1 — top category this month
  const catTotals = {};
  transactions.filter(t => t.type==='expense' && yearMonth(t.date)===cym)
    .forEach(t => { catTotals[t.category] = (catTotals[t.category]||0) + t.amount; });
  const topCat = Object.entries(catTotals).sort((a,b)=>b[1]-a[1])[0];
  if (topCat) {
    insights.push(`${CAT_EMOJI[topCat[0]]} Your biggest spend this month is <strong>${topCat[0]}</strong> at <strong>${fmt(topCat[1])}</strong>.`);
  }

  // Insight 2 — savings rate
  if (totalIncome > 0) {
    const savings = totalIncome - totalExpense;
    const rate = ((savings / totalIncome) * 100).toFixed(1);
    const msg = savings >= 0
      ? `💚 You've saved <strong>${rate}%</strong> of your total income. ${rate > 20 ? 'Great job!' : 'Try to aim for 20%+.'}`
      : `⚠️ You've spent <strong>${fmt(Math.abs(savings))}</strong> more than you've earned. Time to cut back!`;
    insights.push(msg);
  }

  // Insight 3 — budget warning
  if (budget > 0) {
    const remaining = budget - thisMonthExpense;
    if (remaining < 0) {
      insights.push(`🚨 You've <strong>exceeded</strong> your monthly budget by <strong>${fmt(Math.abs(remaining))}</strong>.`);
    } else if (remaining < budget * 0.2) {
      insights.push(`⚡ Only <strong>${fmt(remaining)}</strong> left in your budget for this month — spend carefully!`);
    } else {
      insights.push(`✅ <strong>${fmt(remaining)}</strong> remaining in your budget for this month.`);
    }
  }

  // Insight 4 — transaction count
  const txnCount = transactions.filter(t => yearMonth(t.date)===cym).length;
  if (txnCount > 0) insights.push(`📋 You've recorded <strong>${txnCount}</strong> transaction${txnCount>1?'s':''} this month.`);

  document.getElementById('insightsList').innerHTML = insights.length
    ? insights.map(i => `<div class="insight-item">${i}</div>`).join('')
    : '<div class="empty" style="padding:16px;color:var(--text3)">Add transactions to see insights.</div>';
}

/* ─── Transaction Modal ───────────────────────────── */

/** Opens the add-transaction modal. */
function openTxnModal(id = null) {
  editId = id;
  const modal  = document.getElementById('txnOverlay');
  const today  = todayStr();

  if (id) {
    // Edit mode — prefill
    const txn = transactions.find(t => t.id === id);
    if (!txn) return;
    document.getElementById('txnModalTitle').textContent = 'Edit Transaction';
    setTxnType(txn.type);
    document.getElementById('txnAmount').value = txn.amount;
    document.getElementById('txnDesc').value   = txn.desc;
    document.getElementById('txnCat').value    = txn.category === 'Income' ? 'Other' : txn.category;
    document.getElementById('txnDate').value   = txn.date;
  } else {
    // Add mode — reset
    document.getElementById('txnModalTitle').textContent = 'Add Transaction';
    setTxnType('income');
    document.getElementById('txnAmount').value = '';
    document.getElementById('txnDesc').value   = '';
    document.getElementById('txnCat').value    = 'Food';
    document.getElementById('txnDate').value   = today;
  }

  modal.classList.add('open');
  setTimeout(() => document.getElementById('txnAmount').focus(), 100);
}

/** Closes the transaction modal. */
function closeTxnModal() {
  document.getElementById('txnOverlay').classList.remove('open');
  editId = null;
}

/**
 * Sets the transaction type in the modal.
 * @param {'income'|'expense'} type
 */
function setTxnType(type) {
  txnType = type;
  document.getElementById('pillIncome').classList.toggle('active', type==='income');
  document.getElementById('pillExpense').classList.toggle('active', type==='expense');
  // Hide category for income (it's automatically "Income")
  document.getElementById('catGroup').style.display = type==='income' ? 'none' : 'block';
}

/**
 * Validates and saves the transaction from the modal form.
 */
function saveTxn() {
  const amount = parseFloat(document.getElementById('txnAmount').value);
  const desc   = document.getElementById('txnDesc').value.trim();
  const cat    = txnType === 'income' ? 'Income' : document.getElementById('txnCat').value;
  const date   = document.getElementById('txnDate').value;

  // Validation
  if (!amount || amount <= 0) { showToast('Please enter a valid amount.', 'err'); return; }
  if (!desc)                  { showToast('Please enter a description.',   'err'); return; }
  if (!date)                  { showToast('Please select a date.',          'err'); return; }

  if (editId) {
    // Update existing
    const idx = transactions.findIndex(t => t.id === editId);
    if (idx !== -1) {
      transactions[idx] = { ...transactions[idx], type:txnType, amount, desc, category:cat, date };
    }
    showToast('Transaction updated.', 'ok');
  } else {
    // Add new
    transactions.unshift({ id:uid(), type:txnType, amount, desc, category:cat, date });
    showToast('Transaction added!', 'ok');
  }

  saveTxnsToStorage();
  closeTxnModal();
  refreshAll();
}

/**
 * Deletes a transaction by ID after confirmation.
 * @param {string} id
 */
function deleteTxn(id) {
  if (!confirm('Delete this transaction?')) return;
  transactions = transactions.filter(t => t.id !== id);
  saveTxnsToStorage();
  refreshAll();
  showToast('Transaction deleted.', 'info');
}

/* ─── Transaction Table ───────────────────────────── */

/**
 * Renders the filtered, searched transactions table.
 */
function renderTransactions() {
  const search  = document.getElementById('searchInput').value.toLowerCase();
  const catFil  = document.getElementById('filterCat').value;
  const typeFil = document.getElementById('filterType').value;

  let list = transactions.filter(t => {
    const matchSearch = !search || t.desc.toLowerCase().includes(search) || t.category.toLowerCase().includes(search);
    const matchCat    = !catFil  || t.category === catFil;
    const matchType   = !typeFil || t.type === typeFil;
    return matchSearch && matchCat && matchType;
  });

  // Sort newest first
  list.sort((a,b) => b.date.localeCompare(a.date));

  const tbody = document.getElementById('txnBody');
  const empty = document.getElementById('txnEmpty');

  if (!list.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = list.map(t => `
    <tr>
      <td class="td-date">${fmtDate(t.date)}</td>
      <td class="td-desc">${escHtml(t.desc)}</td>
      <td><span class="cat-pill">${CAT_EMOJI[t.category] || '📦'} ${t.category}</span></td>
      <td><span class="type-pill-badge ${t.type}">${t.type}</span></td>
      <td class="text-right"><span class="td-amount ${t.type}">${t.type==='income' ? '+' : '−'}${fmt(t.amount)}</span></td>
      <td class="text-right">
        <div class="act-btns">
          <button class="act-btn" onclick="openTxnModal('${t.id}')">Edit</button>
          <button class="act-btn del" onclick="deleteTxn('${t.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ─── Charts ──────────────────────────────────────── */

/**
 * Determines the chart color scheme based on current theme.
 */
function chartTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    grid:   isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
    tick:   isDark ? '#8b92a8' : '#5a6480',
    bg:     isDark ? '#13161e' : '#ffffff',
  };
}

/**
 * Builds and renders all three charts (bar, pie, line).
 * Destroys existing chart instances first to prevent canvas re-use errors.
 */
function renderCharts() {
  const th = chartTheme();

  // ── Bar Chart: Monthly Income vs Expenses
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0,7));
  }
  const incomeData  = months.map(ym => transactions.filter(t=>t.type==='income'  && yearMonth(t.date)===ym).reduce((s,t)=>s+t.amount,0));
  const expenseData = months.map(ym => transactions.filter(t=>t.type==='expense' && yearMonth(t.date)===ym).reduce((s,t)=>s+t.amount,0));

  if (chartBar) chartBar.destroy();
  chartBar = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: months.map(shortMonth),
      datasets: [
        { label:'Income',   data:incomeData,  backgroundColor:'rgba(52,211,153,0.75)', borderRadius:6, borderSkipped:false },
        { label:'Expenses', data:expenseData, backgroundColor:'rgba(248,113,113,0.75)', borderRadius:6, borderSkipped:false },
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:true,
      plugins: { legend:{ labels:{ color:th.tick, font:{family:'DM Sans'} } } },
      scales: {
        x: { ticks:{color:th.tick}, grid:{color:th.grid} },
        y: { ticks:{color:th.tick, callback:v=>'$'+v.toLocaleString()}, grid:{color:th.grid} }
      }
    }
  });

  // ── Pie Chart: Spending by Category
  const catTotals = {};
  transactions.filter(t=>t.type==='expense').forEach(t => {
    catTotals[t.category] = (catTotals[t.category]||0) + t.amount;
  });
  const pieLabels = Object.keys(catTotals);
  const pieData   = Object.values(catTotals);

  if (chartPie) chartPie.destroy();
  chartPie = new Chart(document.getElementById('pieChart'), {
    type: 'doughnut',
    data: {
      labels: pieLabels,
      datasets:[{ data:pieData, backgroundColor:CAT_COLORS, borderWidth:2, borderColor:th.bg, hoverOffset:8 }]
    },
    options: {
      responsive:true, maintainAspectRatio:true,
      cutout: '62%',
      plugins: {
        legend:{ position:'bottom', labels:{ color:th.tick, padding:14, font:{family:'DM Sans', size:12} } },
        tooltip:{ callbacks:{ label: ctx => ` ${ctx.label}: $${ctx.parsed.toLocaleString()}` } }
      }
    }
  });

  // ── Line Chart: Daily spending last 30 days
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    days.push(d.toISOString().slice(0,10));
  }
  const lineData = days.map(day =>
    transactions.filter(t=>t.type==='expense' && t.date===day).reduce((s,t)=>s+t.amount, 0)
  );

  if (chartLine) chartLine.destroy();
  chartLine = new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
      labels: days.map(d => { const dt=new Date(d+'T00:00:00'); return (dt.getDate()===1||dt.getDay()===0) ? `${dt.getMonth()+1}/${dt.getDate()}` : ''; }),
      datasets:[{
        label:'Daily Spend',
        data: lineData,
        borderColor:'#f0a500',
        backgroundColor:'rgba(240,165,0,0.10)',
        pointBackgroundColor:'#f0a500',
        pointRadius: lineData.map(v => v>0 ? 4 : 0),
        tension:0.4, fill:true,
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:true,
      plugins:{ legend:{ labels:{ color:th.tick, font:{family:'DM Sans'} } } },
      scales:{
        x:{ ticks:{color:th.tick, maxRotation:0}, grid:{color:th.grid} },
        y:{ ticks:{color:th.tick, callback:v=>'$'+v}, grid:{color:th.grid}, beginAtZero:true }
      }
    }
  });
}

/* ─── Budget ──────────────────────────────────────── */

/** Saves the budget input and refreshes the budget page. */
function saveBudget() {
  const val = parseFloat(document.getElementById('budgetInput').value);
  if (!val || val <= 0) { showToast('Enter a valid budget amount.', 'err'); return; }
  budget = val;
  saveBudgetToStorage();
  showToast(`Budget set to ${fmt(budget)}/month.`, 'ok');
  renderBudgetPage();
  renderDashboard();
}

/**
 * Renders the budget page — status box + per-category breakdown.
 */
function renderBudgetPage() {
  // Pre-fill input
  if (budget > 0) document.getElementById('budgetInput').value = budget;

  const cym       = currentYM();
  const monthExp  = transactions.filter(t => t.type==='expense' && yearMonth(t.date)===cym).reduce((s,t)=>s+t.amount, 0);
  const remaining = budget - monthExp;
  const statusBox = document.getElementById('budgetStatusBox');

  if (budget > 0) {
    const pct = ((monthExp/budget)*100).toFixed(1);
    let cls = 'ok', msg = '';

    if (remaining < 0) {
      cls = 'danger';
      msg = `🚨 Over budget! You've spent <strong>${fmt(monthExp)}</strong> of your <strong>${fmt(budget)}</strong> budget — that's <strong>${Math.abs(remaining).toFixed(0)}%</strong> over. Consider reviewing your spending.`;
    } else if (remaining < budget * 0.2) {
      cls = 'warn';
      msg = `⚡ Almost there — <strong>${fmt(monthExp)}</strong> spent (${pct}%) of <strong>${fmt(budget)}</strong>. Only <strong>${fmt(remaining)}</strong> left for this month.`;
    } else {
      msg = `✅ On track — <strong>${fmt(monthExp)}</strong> spent (${pct}%) of your <strong>${fmt(budget)}</strong> budget. <strong>${fmt(remaining)}</strong> remaining.`;
    }

    statusBox.className = `budget-status-box ${cls}`;
    statusBox.innerHTML = msg;
    statusBox.style.display = 'block';
  } else {
    statusBox.style.display = 'none';
  }

  // Category breakdown
  const catTotals = {};
  CATEGORIES.forEach(c => catTotals[c] = 0);
  transactions.filter(t => t.type==='expense' && yearMonth(t.date)===cym)
    .forEach(t => { if (catTotals[t.category] !== undefined) catTotals[t.category] += t.amount; });

  const catsHtml = CATEGORIES
    .filter(c => catTotals[c] > 0)
    .sort((a,b) => catTotals[b] - catTotals[a])
    .map(c => {
      const spent = catTotals[c];
      const pct   = budget > 0 ? Math.min((spent / budget) * 100, 100) : 50;
      const fillCls = pct >= 100 ? 'high' : pct >= 60 ? 'mid' : '';
      return `
        <div class="bcat-card">
          <div class="bcat-head">
            <span class="bcat-name">${CAT_EMOJI[c]} ${c}</span>
            <span class="bcat-spent">${fmt(spent)}</span>
          </div>
          <div class="bcat-track"><div class="bcat-fill ${fillCls}" style="width:${pct}%"></div></div>
          <div class="bcat-pct">${budget>0 ? pct.toFixed(1)+'% of budget' : 'No budget set'}</div>
        </div>`;
    }).join('');

  document.getElementById('budgetCats').innerHTML = catsHtml ||
    '<p style="color:var(--text3);font-size:0.87rem">No expenses recorded this month.</p>';
}

/* ─── Savings ─────────────────────────────────────── */

/** Opens savings modal (add or edit). */
function openSavingsModal(id = null) {
  editSavId = id;
  document.getElementById('savingsModalTitle').textContent = id ? 'Edit Goal' : 'New Savings Goal';

  if (id) {
    const g = savingsGoals.find(g => g.id === id);
    if (!g) return;
    document.getElementById('sName').value    = g.name;
    document.getElementById('sTarget').value  = g.target;
    document.getElementById('sCurrent').value = g.current;
    document.getElementById('sDate').value    = g.date;
  } else {
    document.getElementById('sName').value    = '';
    document.getElementById('sTarget').value  = '';
    document.getElementById('sCurrent').value = '';
    document.getElementById('sDate').value    = '';
  }

  document.getElementById('savingsOverlay').classList.add('open');
  setTimeout(() => document.getElementById('sName').focus(), 100);
}

/** Closes savings modal. */
function closeSavingsModal() {
  document.getElementById('savingsOverlay').classList.remove('open');
  editSavId = null;
}

/** Saves a savings goal. */
function saveSavingsGoal() {
  const name    = document.getElementById('sName').value.trim();
  const target  = parseFloat(document.getElementById('sTarget').value);
  const current = parseFloat(document.getElementById('sCurrent').value) || 0;
  const date    = document.getElementById('sDate').value;

  if (!name)            { showToast('Please enter a goal name.',      'err'); return; }
  if (!target || target <= 0) { showToast('Enter a valid target amount.', 'err'); return; }

  if (editSavId) {
    const idx = savingsGoals.findIndex(g => g.id === editSavId);
    if (idx !== -1) savingsGoals[idx] = { ...savingsGoals[idx], name, target, current, date };
    showToast('Goal updated!', 'ok');
  } else {
    savingsGoals.push({ id:uid(), name, target, current, date });
    showToast('Savings goal added!', 'ok');
  }

  saveSavingsToStorage();
  closeSavingsModal();
  renderSavings();
}

/** Deletes a savings goal. */
function deleteSavingsGoal(id) {
  if (!confirm('Delete this savings goal?')) return;
  savingsGoals = savingsGoals.filter(g => g.id !== id);
  saveSavingsToStorage();
  renderSavings();
  showToast('Goal deleted.', 'info');
}

/**
 * Renders the savings goals grid.
 */
function renderSavings() {
  const grid  = document.getElementById('savingsGrid');
  const empty = document.getElementById('savingsEmpty');

  if (!savingsGoals.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = savingsGoals.map(g => {
    const pct        = Math.min((g.current / g.target) * 100, 100).toFixed(1);
    const remaining  = Math.max(g.target - g.current, 0);
    const dateLabel  = g.date ? `Target: ${fmtDate(g.date)}` : 'No target date';
    return `
      <div class="savings-card">
        <div class="sc-head">
          <div class="sc-name">${escHtml(g.name)}</div>
          <button class="sc-del" onclick="deleteSavingsGoal('${g.id}')" title="Delete">✕</button>
        </div>
        <div class="sc-amounts">
          <div class="sc-current">${fmt(g.current)}</div>
          <div class="sc-target-wrap">
            <div class="sc-target-label">Target</div>
            <div class="sc-target">${fmt(g.target)}</div>
          </div>
        </div>
        <div class="sc-bar-track"><div class="sc-bar-fill" style="width:${pct}%"></div></div>
        <div class="sc-meta">
          <span class="sc-pct">${pct}% complete</span>
          <span>${remaining > 0 ? fmt(remaining)+' to go' : '🎉 Goal reached!'}</span>
        </div>
        <div class="sc-meta" style="margin-top:6px">
          <span class="sc-date">${dateLabel}</span>
          <button class="act-btn" style="padding:3px 10px;font-size:0.73rem" onclick="openSavingsModal('${g.id}')">Edit</button>
        </div>
      </div>`;
  }).join('');
}

/* ─── CSV Export ──────────────────────────────────── */

/**
 * Exports all transactions as a downloadable CSV file.
 */
function exportCSV() {
  if (!transactions.length) { showToast('No transactions to export.', 'err'); return; }

  const headers = ['Date','Description','Category','Type','Amount'];
  const rows    = transactions
    .sort((a,b) => b.date.localeCompare(a.date))
    .map(t => [t.date, `"${t.desc.replace(/"/g,'""')}"`, t.category, t.type, t.amount.toFixed(2)]);

  const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `flo-transactions-${todayStr()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported successfully!', 'ok');
}

/* ─── Modal Overlay Close ─────────────────────────── */

/**
 * Closes a modal if the backdrop itself was clicked.
 * @param {MouseEvent} e
 * @param {string} overlayId
 */
function closeOnOverlay(e, overlayId) {
  if (e.target.id === overlayId) {
    if (overlayId === 'txnOverlay')     closeTxnModal();
    if (overlayId === 'savingsOverlay') closeSavingsModal();
  }
}

/* ─── Toast Notifications ─────────────────────────── */

let toastTimer = null;

/**
 * Shows a toast notification.
 * @param {string} msg  - Message text
 * @param {'ok'|'err'|'info'} type - Visual style
 */
function showToast(msg, type = 'ok') {
  const el = document.getElementById('toast');
  el.textContent  = msg;
  el.className    = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('show'); }, 3000);
}

/* ─── Security: HTML Escaping ─────────────────────── */

/** Escapes user-input strings to prevent XSS. */
function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

/* ─── Global Refresh ──────────────────────────────── */

/**
 * Re-renders all visible UI components.
 * Called after any data mutation.
 */
function refreshAll() {
  renderDashboard();
  renderTransactions();
  if (document.getElementById('page-charts').classList.contains('active'))  renderCharts();
  if (document.getElementById('page-budget').classList.contains('active'))  renderBudgetPage();
  if (document.getElementById('page-savings').classList.contains('active')) renderSavings();
}

/* ─── Keyboard Shortcuts ──────────────────────────── */

document.addEventListener('keydown', e => {
  // Escape closes any open modal
  if (e.key === 'Escape') {
    closeTxnModal();
    closeSavingsModal();
  }
  // Ctrl/Cmd+N opens add transaction modal
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    openTxnModal();
  }
});

/* ─── Initialisation ──────────────────────────────── */

/**
 * Application entry point.
 * Runs once the DOM is ready.
 */
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  loadFromStorage();
  seedSampleData();
  refreshAll();
});
