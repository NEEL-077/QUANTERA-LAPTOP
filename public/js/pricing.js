/**
 * pricing.js — Quantéra Apple-style Pricing System
 * ──────────────────────────────────────────────────
 * Three modules:
 *   1. StorageCards  — iPhone-style price selection
 *   2. Configurator  — MacBook-style dynamic builder (calls POST /api/pricing/calculate)
 *   3. Subscriptions — Apple One-style tier toggle
 *
 * Animation technique: opacity + translateY, never layout shifts.
 * All transitions use CSS custom properties (--ease-apple / dur tokens).
 */

'use strict';

/* ═══════════════════════════════════════════════════════════
   ❶  STORAGE / PRICE SELECTION CARDS
   ═══════════════════════════════════════════════════════════ */

const StorageCards = (() => {
  // ── Data model
  const options = [
    {
      id: 's256',
      label: '256GB',
      sub: 'Great for everyday tasks and light creative work.',
      price: 79900,
      monthly: 6658,
      months: 12,
    },
    {
      id: 's512',
      label: '512GB',
      sub: 'Ideal for photographers, developers, and multitaskers.',
      price: 99900,
      monthly: 8325,
      months: 12,
    },
    {
      id: 's1tb',
      label: '1TB',
      sub: 'Built for video editors and large project workflows.',
      price: 119900,
      monthly: 9992,
      months: 12,
    },
    {
      id: 's2tb',
      label: '2TB',
      sub: 'Maximum headroom for the most demanding pros.',
      price: 149900,
      monthly: 12492,
      months: 12,
    },
  ];

  let activeId = options[0].id;

  const fmtPrice   = (p) => `₹${p.toLocaleString('en-IN')}`;
  const fmtMonthly = (p, m) => `or ₹${p.toLocaleString('en-IN')}/mo.\nfor ${m} mo.`;

  function selectCard(id) {
    if (id === activeId) return;
    activeId = id;

    // Toggle active class + ARIA on all cards
    document.querySelectorAll('.storage-card').forEach(card => {
      const isActive = card.dataset.id === id;
      card.classList.toggle('active', isActive);
      card.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function init() {
    const list = document.getElementById('storageList');
    if (!list) return;

    /*
      Apple card anatomy (horizontal flex):
      [radio-dot]  [left: label + subtext]          [right: From price / monthly]
    */
    list.innerHTML = options.map(o => `
      <div
        class="storage-card${o.id === activeId ? ' active' : ''}"
        data-id="${o.id}"
        role="radio"
        aria-pressed="${o.id === activeId}"
        tabindex="0"
        aria-label="${o.label} — ${fmtPrice(o.price)}"
      >
        <!-- Animated radio dot — CSS spring scales inner dot on .active -->
        <span class="storage-radio-dot" aria-hidden="true"></span>

        <!-- Left: name + descriptor, same as Apple's "14-inch¹ / Available with…" -->
        <div class="storage-card-left">
          <div class="storage-label">${o.label}</div>
          <div class="storage-subtext">${o.sub}</div>
        </div>

        <!-- Right: price block, right-aligned like Apple Store -->
        <div class="storage-card-right">
          <div class="storage-price-from">From ${fmtPrice(o.price)}</div>
          <div class="storage-price-monthly">or ${fmtMonthly(o.monthly, o.months).replace('\n', '<br>')}</div>
        </div>
      </div>
    `).join('');

    // ── Click handler
    list.addEventListener('click', e => {
      const card = e.target.closest('.storage-card');
      if (card) selectCard(card.dataset.id);
    });

    // ── Full keyboard nav (Enter/Space selects, arrows move focus)
    list.addEventListener('keydown', e => {
      const card = e.target.closest('.storage-card');
      if (!card) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectCard(card.dataset.id);
      }

      const cards = [...list.querySelectorAll('.storage-card')];
      const idx = cards.indexOf(card);
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        cards[(idx + 1) % cards.length]?.focus();
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        cards[(idx - 1 + cards.length) % cards.length]?.focus();
      }
    });
  }

  return { init };
})();



/* ═══════════════════════════════════════════════════════════
   ❷  PRODUCT CONFIGURATOR
   — Calls POST /api/pricing/calculate for real-time pricing
   ═══════════════════════════════════════════════════════════ */

const Configurator = (() => {
  // ── State object — single source of truth
  const state = {
    storage:   '256gb',
    ram:       '16gb',
    processor: 'm3',
  };

  // ── Option definitions
  const groups = [
    {
      key: 'storage',
      label: 'Storage',
      options: [
        { id: '256gb',  label: '256GB SSD', addPrice: 0     },
        { id: '512gb',  label: '512GB SSD', addPrice: 10000 },
        { id: '1tb',    label: '1TB SSD',   addPrice: 20000 },
        { id: '2tb',    label: '2TB SSD',   addPrice: 40000 },
      ],
    },
    {
      key: 'ram',
      label: 'Memory',
      options: [
        { id: '8gb',  label: '8GB',  addPrice: 0     },
        { id: '16gb', label: '16GB', addPrice: 8000  },
        { id: '24gb', label: '24GB', addPrice: 16000 },
        { id: '36gb', label: '36GB', addPrice: 32000 },
      ],
    },
    {
      key: 'processor',
      label: 'Processor',
      options: [
        { id: 'm2',      label: 'Quantum M2',      addPrice: 0     },
        { id: 'm3',      label: 'Quantum M3',      addPrice: 15000 },
        { id: 'm3-pro',  label: 'Quantum M3 Pro',  addPrice: 40000 },
        { id: 'm3-ultra',label: 'Quantum M3 Ultra',addPrice: 80000 },
      ],
    },
  ];

  const fmt = (p) => `₹${p.toLocaleString('en-IN')}`;

  /** Animate total price the same slide-up way */
  function animateTotal(el, newText) {
    el.classList.add('animating-out');
    setTimeout(() => {
      el.textContent = newText;
      el.classList.remove('animating-out');
    }, 160);
  }

  /** Set API dot to loading / resolved */
  function setApiStatus(loading) {
    const dot = document.querySelector('.api-dot');
    const txt = document.querySelector('.api-status-text');
    if (!dot) return;
    if (loading) {
      dot.classList.add('loading');
      if (txt) txt.textContent = 'Fetching price…';
    } else {
      dot.classList.remove('loading');
      if (txt) txt.textContent = 'Live pricing';
    }
  }

  /** Debounce API calls — avoid spamming on rapid clicks */
  let debounceTimer = null;
  function debouncedFetch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchPrice, 300);
  }

  async function fetchPrice() {
    setApiStatus(true);
    try {
      const res = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      // Animate total
      const totalEl = document.getElementById('configuratorTotal');
      if (totalEl) animateTotal(totalEl, fmt(data.total));

      // Update breakdown lines
      updateBreakdown(data.breakdown);
    } catch {
      // Fallback: local calculation if server unavailable
      const total = localCalculate();
      const totalEl = document.getElementById('configuratorTotal');
      if (totalEl) animateTotal(totalEl, fmt(total));
    } finally {
      setApiStatus(false);
    }
  }

  /** Local fallback calculation (mirrors server logic) */
  function localCalculate() {
    const BASE = 119900;
    let total = BASE;
    groups.forEach(g => {
      const opt = g.options.find(o => o.id === state[g.key]);
      if (opt) total += opt.addPrice;
    });
    return total;
  }

  function updateBreakdown(breakdown) {
    if (!breakdown) return;
    Object.entries(breakdown).forEach(([key, val]) => {
      const el = document.getElementById(`breakdown-${key}`);
      if (el) el.textContent = val === 0 ? 'Included' : `+${fmt(val)}`;
    });
  }

  function selectOption(groupKey, optionId) {
    if (state[groupKey] === optionId) return;
    state[groupKey] = optionId;

    // Update chips UI
    document.querySelectorAll(`[data-group="${groupKey}"]`).forEach(chip => {
      const isActive = chip.dataset.option === optionId;
      chip.classList.toggle('active', isActive);
      chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    // Fetch updated price from backend (debounced)
    debouncedFetch();
  }

  function buildGroupHTML(group) {
    const chipsHTML = group.options.map(opt => `
      <button
        class="option-chip${state[group.key] === opt.id ? ' active' : ''}"
        data-group="${group.key}"
        data-option="${opt.id}"
        role="radio"
        aria-pressed="${state[group.key] === opt.id}"
      >
        ${opt.label}
        ${opt.addPrice > 0 ? `<span class="option-add-price">+${fmt(opt.addPrice)}</span>` : ''}
      </button>
    `).join('');

    return `
      <div class="option-group" role="radiogroup" aria-label="${group.label} selection">
        <div class="option-group-label">${group.label}</div>
        <div class="option-row">${chipsHTML}</div>
      </div>
    `;
  }

  function buildBreakdownHTML() {
    return groups.map(g => {
      const opt = g.options.find(o => o.id === state[g.key]);
      const val = opt ? opt.addPrice : 0;
      return `
        <div class="price-summary-line">
          <span>${g.label}</span>
          <span id="breakdown-${g.key}">${val === 0 ? 'Included' : `+${fmt(val)}`}</span>
        </div>
      `;
    }).join('');
  }

  function init() {
    const optionsContainer = document.getElementById('configuratorOptions');
    const summaryBreakdown = document.getElementById('configuratorBreakdown');
    if (!optionsContainer) return;

    // Build option groups
    optionsContainer.innerHTML = groups.map(buildGroupHTML).join('');

    // Build breakdown
    if (summaryBreakdown) summaryBreakdown.innerHTML = buildBreakdownHTML();

    // Set initial total
    const totalEl = document.getElementById('configuratorTotal');
    if (totalEl) totalEl.textContent = fmt(localCalculate());

    // ── Delegated click on chips
    optionsContainer.addEventListener('click', e => {
      const chip = e.target.closest('.option-chip');
      if (chip) selectOption(chip.dataset.group, chip.dataset.option);
    });

    // ── Keyboard support for chips
    optionsContainer.addEventListener('keydown', e => {
      const chip = e.target.closest('.option-chip');
      if (!chip) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectOption(chip.dataset.group, chip.dataset.option);
      }
    });

    // Initial price fetch
    fetchPrice();
  }

  return { init };
})();


/* ═══════════════════════════════════════════════════════════
   ❸  SUBSCRIPTION TIERS
   — Monthly / Yearly billing toggle with animated price change
   ═══════════════════════════════════════════════════════════ */

const Subscriptions = (() => {
  let isYearly = false;
  let selectedPlan = 'pro';

  const plans = [
    {
      id: 'basic',
      title: 'Basic',
      description: 'Great for individuals getting started.',
      monthlyPrice: 499,
      yearlyPrice:  399,  // per month billed annually
      yearlySaving: '₹1,200 /yr',
      features: [
        { text: '1 Device',           included: true  },
        { text: '5GB Cloud Storage',  included: true  },
        { text: 'Standard Support',   included: true  },
        { text: 'AI Diagnostics',     included: false },
        { text: 'Priority Service',   included: false },
      ],
    },
    {
      id: 'pro',
      title: 'Pro',
      description: 'Perfect for power users and creators.',
      monthlyPrice: 999,
      yearlyPrice:  799,
      yearlySaving: '₹2,400 /yr',
      recommended: true,
      features: [
        { text: '3 Devices',          included: true },
        { text: '100GB Cloud Storage',included: true },
        { text: 'Priority Support',   included: true },
        { text: 'AI Diagnostics',     included: true },
        { text: '24/7 Chat',          included: false },
      ],
    },
    {
      id: 'ultra',
      title: 'Ultra',
      description: 'For teams that need everything.',
      monthlyPrice: 1999,
      yearlyPrice:  1599,
      yearlySaving: '₹4,800 /yr',
      features: [
        { text: 'Unlimited Devices',  included: true },
        { text: '2TB Cloud Storage',  included: true },
        { text: '24/7 Priority Line', included: true },
        { text: 'AI Diagnostics',     included: true },
        { text: 'Dedicated Manager',  included: true },
      ],
    },
    {
      id: 'enterprise',
      title: 'Enterprise',
      description: 'Custom plans for large organisations.',
      monthlyPrice: null, // custom
      yearlyPrice:  null,
      features: [
        { text: 'Custom Devices',     included: true },
        { text: 'Unlimited Storage',  included: true },
        { text: 'SLA Guarantee',      included: true },
        { text: 'Dedicated Account',  included: true },
        { text: 'API Access',         included: true },
      ],
    },
  ];

  const fmt = (p) => p != null ? `₹${p.toLocaleString('en-IN')}` : 'Custom';

  /** Animate price numbers when billing period changes */
  function animatePrices(newYearly) {
    document.querySelectorAll('.plan-price').forEach(el => {
      const planId = el.closest('.plan-card')?.dataset.plan;
      const plan = plans.find(p => p.id === planId);
      if (!plan) return;

      // Phase-out
      el.classList.add('animating-out');
      setTimeout(() => {
        // Swap value
        const price = newYearly ? plan.yearlyPrice : plan.monthlyPrice;
        el.textContent = price != null ? price.toLocaleString('en-IN') : 'Custom';
        el.classList.remove('animating-out');
      }, 150);
    });

    // Show / hide yearly saving badges
    document.querySelectorAll('.plan-saving').forEach(el => {
      el.classList.toggle('visible', newYearly);
    });
  }

  function selectPlan(planId) {
    selectedPlan = planId;
    document.querySelectorAll('.plan-card').forEach(card => {
      const isSelected = card.dataset.plan === planId;
      card.classList.toggle('selected', isSelected);
      card.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
  }

  function buildPlanCard(plan) {
    const isSelected = plan.id === selectedPlan;
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    const featuresHTML = plan.features.map(f => `
      <li class="plan-feature-item">
        <span class="feature-icon ${f.included ? 'included' : ''}" aria-hidden="true">
          ${f.included
            ? `<svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l2.5 3L9 1" stroke="#30d158" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
               </svg>`
            : `<svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1 1l6 6M7 1L1 7" stroke="#aeaeb2" stroke-width="1.5" stroke-linecap="round"/>
               </svg>`
          }
        </span>
        <span style="color:${f.included ? 'var(--text-secondary)' : 'var(--text-tertiary)'}">${f.text}</span>
      </li>
    `).join('');

    const priceHTML = price != null
      ? `<span class="plan-currency">₹</span>
         <span class="plan-price">${price.toLocaleString('en-IN')}</span>
         <span class="plan-period">/mo</span>`
      : `<span class="plan-price" style="font-size:28px">Custom</span>`;

    return `
      <div
        class="plan-card${isSelected ? ' selected' : ''}"
        data-plan="${plan.id}"
        role="radio"
        aria-pressed="${isSelected}"
        tabindex="0"
        aria-label="${plan.title} plan — ${price != null ? fmt(plan.monthlyPrice) + ' per month' : 'custom pricing'}"
      >
        ${plan.recommended ? '<span class="plan-badge">Most Popular</span>' : ''}
        <div class="plan-tier">Plan</div>
        <div class="plan-title">${plan.title}</div>
        <div class="plan-description">${plan.description}</div>

        <div class="plan-price-wrap">${priceHTML}</div>
        <div class="plan-saving${isYearly ? ' visible' : ''}">
          ${plan.yearlySaving ? `Save ${plan.yearlySaving}` : ''}
        </div>

        <ul class="plan-features" aria-label="Features">
          ${featuresHTML}
        </ul>

        <button class="plan-cta${plan.recommended ? ' primary' : ''}">
          ${plan.id === 'enterprise' ? 'Contact Sales' : 'Get Started'}
        </button>
      </div>
    `;
  }

  function init() {
    const plansGrid = document.getElementById('plansGrid');
    const toggle = document.getElementById('billingToggle');
    const monthLabel = document.getElementById('billingMonthly');
    const yearLabel = document.getElementById('billingYearly');

    if (!plansGrid) return;

    // Render cards
    plansGrid.innerHTML = plans.map(buildPlanCard).join('');

    // ── Billing toggle
    toggle?.addEventListener('change', () => {
      isYearly = toggle.checked;
      animatePrices(isYearly);
      monthLabel?.classList.toggle('active', !isYearly);
      yearLabel?.classList.toggle('active', isYearly);
    });

    // ── Plan selection (delegated)
    plansGrid.addEventListener('click', e => {
      // Don't re-trigger on CTA button clicks — handle those separately
      const card = e.target.closest('.plan-card');
      if (card && !e.target.closest('.plan-cta')) {
        selectPlan(card.dataset.plan);
      }
    });

    // ── CTA button clicks
    plansGrid.addEventListener('click', e => {
      const cta = e.target.closest('.plan-cta');
      if (!cta) return;
      const card = cta.closest('.plan-card');
      if (card) selectPlan(card.dataset.plan);
    });

    // ── Keyboard navigation
    plansGrid.addEventListener('keydown', e => {
      const card = e.target.closest('.plan-card');
      if (!card) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectPlan(card.dataset.plan);
      }
      const cards = [...plansGrid.querySelectorAll('.plan-card')];
      const idx = cards.indexOf(card);
      if (e.key === 'ArrowRight') { e.preventDefault(); cards[(idx + 1) % cards.length]?.focus(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); cards[(idx - 1 + cards.length) % cards.length]?.focus(); }
    });
  }

  return { init };
})();


/* ─── Bootstrap all modules on DOMContentLoaded ─────────────── */
document.addEventListener('DOMContentLoaded', () => {
  StorageCards.init();
  Configurator.init();
  Subscriptions.init();
});
