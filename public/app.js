const API_URL = '/api';

async function init() {
  await Promise.all([fetchPhases(), fetchVendors()]);
}

async function fetchPhases() {
  try {
    const res = await fetch(`${API_URL}/phases`);
    const phases = await res.json();
    renderSummary(phases);
    renderPhases(phases);
    populatePhaseSelect(phases);
  } catch (err) {
    console.error('Greška pri učitavanju faza:', err);
  }
}

async function fetchVendors() {
  try {
    const res = await fetch(`${API_URL}/vendors`);
    const vendors = await res.json();
    const select = document.getElementById('expense-vendor');
    select.innerHTML = '<option value="">Bez dobavljača</option>';
    vendors.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = `${v.name} ${v.contact ? '(' + v.contact + ')' : ''}`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Greška pri učitavanju dobavljača:', err);
  }
}

function renderSummary(phases) {
  const totalBudget = phases.reduce((acc, p) => acc + (p.budget || 0), 0);
  const totalSpent = phases.reduce((acc, p) => acc + (p.totalSpent || 0), 0);

  document.getElementById('stat-total-budget').textContent = `€${totalBudget.toLocaleString()}`;
  document.getElementById('stat-total-spent').textContent = `€${totalSpent.toLocaleString()}`;
  document.getElementById('phase-count').textContent = `${phases.length} faza`;
}

function renderPhases(phases) {
  const list = document.getElementById('phases-list');
  list.innerHTML = '';

  if (phases.length === 0) {
    list.innerHTML = '<div class="text-slate-400 bg-white p-6 rounded-2xl text-center border border-slate-200">Nema evidentiranih faza.</div>';
    return;
  }

  phases.forEach(phase => {
    const percent = phase.budget > 0 ? Math.min(Math.round((phase.totalSpent / phase.budget) * 100), 100) : 0;
    const isOverBudget = phase.totalSpent > phase.budget;

    const statusClasses = {
      PLANIRANO: 'bg-slate-100 text-slate-600 border-slate-200',
      U_TOKU: 'bg-amber-50 text-amber-700 border-amber-200',
      ZAVRSENO: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };

    const card = document.createElement('div');
    card.className = 'bg-white p-5 rounded-2xl shadow-sm border border-slate-200 transition hover:border-slate-300';
    card.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-semibold text-slate-400">#${phase.orderIndex}</span>
            <select onchange="updatePhaseStatus(${phase.id}, this.value)" class="text-xs font-semibold px-2 py-0.5 rounded border ${statusClasses[phase.status] || statusClasses.PLANIRANO} cursor-pointer outline-none">
              <option value="PLANIRANO" ${phase.status === 'PLANIRANO' ? 'selected' : ''}>PLANIRANO</option>
              <option value="U_TOKU" ${phase.status === 'U_TOKU' ? 'selected' : ''}>U TOKU</option>
              <option value="ZAVRSENO" ${phase.status === 'ZAVRSENO' ? 'selected' : ''}>ZAVRŠENO</option>
            </select>
          </div>
          <h3 class="text-base font-bold text-slate-900">${phase.title}</h3>
        </div>
        <div class="text-left sm:text-right">
          <span class="text-base font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-900'}">
            €${phase.totalSpent.toLocaleString()}
          </span>
          <span class="text-xs text-slate-400 block">od €${phase.budget.toLocaleString()}</span>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
        <div class="h-2 rounded-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}" style="width: ${percent}%"></div>
      </div>

      <!-- Lista troškova -->
      ${phase.expenses && phase.expenses.length > 0 ? `
        <div class="mt-4 pt-3 border-t border-slate-100 space-y-2">
          ${phase.expenses.map(e => `
            <div class="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-slate-50">
              <div class="flex items-center gap-2">
                <span class="text-slate-800 font-medium">${e.title}</span>
                ${e.invoiceUrl ? `<a href="${e.invoiceUrl}" target="_blank" class="text-blue-600 hover:underline flex items-center gap-0.5">📎 račun</a>` : ''}
              </div>
              <div class="flex items-center gap-3">
                <span class="font-bold text-slate-800">€${e.amount.toLocaleString()}</span>
                <button onclick="deleteExpenseItem(${e.id})" class="text-slate-400 hover:text-rose-600 transition" title="Obriši trošak">
                  ✕
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : '<div class="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-400 italic">Nema zabeleženih troškova za ovu fazu.</div>'}
    `;
    list.appendChild(card);
  });
}

function populatePhaseSelect(phases) {
  const select = document.getElementById('expense-phase');
  const currentVal = select.value;
  select.innerHTML = '<option value="" disabled selected>Izaberite fazu...</option>';
  phases.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.orderIndex}. ${p.title}`;
    select.appendChild(opt);
  });
  if (currentVal) select.value = currentVal;
}

// Izmena statusa faze
window.updatePhaseStatus = async (phaseId, newStatus) => {
  try {
    const res = await fetch(`${API_URL}/phases/${phaseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) fetchPhases();
  } catch (err) {
    console.error('Greška pri izmeni statusa:', err);
  }
};

// Brisanje troška
window.deleteExpenseItem = async (expenseId) => {
  if (!confirm('Da li ste sigurni da želite da obrišete ovaj trošak?')) return;
  try {
    const res = await fetch(`${API_URL}/expenses/${expenseId}`, {
      method: 'DELETE'
    });
    if (res.ok) fetchPhases();
  } catch (err) {
    console.error('Greška pri brisanju:', err);
  }
};

// Slanje forme za unos troška (podržava fajl)
document.getElementById('expense-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append('phaseId', document.getElementById('expense-phase').value);
  formData.append('title', document.getElementById('expense-title').value);
  formData.append('amount', document.getElementById('expense-amount').value);

  const vendorId = document.getElementById('expense-vendor').value;
  if (vendorId) formData.append('vendorId', vendorId);

  const fileInput = document.getElementById('expense-file');
  if (fileInput.files.length > 0) {
    formData.append('invoice', fileInput.files[0]);
  }

  try {
    const res = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      document.getElementById('expense-title').value = '';
      document.getElementById('expense-amount').value = '';
      fileInput.value = '';
      fetchPhases();
    }
  } catch (err) {
    console.error('Greška pri čuvanju troška:', err);
  }
});

// Slanje forme za dobavljača
document.getElementById('vendor-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('vendor-name').value;
  const contact = document.getElementById('vendor-contact').value;

  try {
    const res = await fetch(`${API_URL}/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, contact })
    });

    if (res.ok) {
      document.getElementById('vendor-name').value = '';
      document.getElementById('vendor-contact').value = '';
      fetchVendors();
    }
  } catch (err) {
    console.error('Greška pri kreiranju dobavljača:', err);
  }
});

// Registracija PWA Service Workera
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('PWA Service Worker registrovan:', reg.scope))
      .catch((err) => console.error('Greška pri registraciji SW:', err));
  });
}

document.addEventListener('DOMContentLoaded', init);