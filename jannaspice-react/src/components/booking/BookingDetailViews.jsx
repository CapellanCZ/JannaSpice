export const MENU_COURSES = [
  { key: 'chicken', label: 'Chicken', icon: 'fa-drumstick-bite' },
  { key: 'beefPork', label: 'Pork / Beef', icon: 'fa-bacon' },
  { key: 'fishSeafood', label: 'Fish / Seafood', icon: 'fa-fish' },
  { key: 'veg', label: 'Vegetable', icon: 'fa-leaf' },
  { key: 'pasta', label: 'Pasta', icon: 'fa-utensils' }
];

export const PAYMENT_LABEL = {
  fee: '20% reservation fee',
  down: '30% downpayment',
  bal: '50% balance'
};

export function formatDueAt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = String(timeStr).split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}

export function dishImage(menuOptions, category, name) {
  if (!name) return '';
  const list = menuOptions?.[category] || [];
  const match = list.find((item) => item.name.toLowerCase() === String(name).toLowerCase());
  return match?.img || '';
}

export function menuCoursesFor(res, menuOptions) {
  if (res.package?.type === 'rental' || !res.menu) return [];
  return MENU_COURSES.map((course) => ({
    ...course,
    name: res.menu[course.key],
    img: dishImage(menuOptions, course.key, res.menu[course.key])
  })).filter((course) => course.name);
}

export function InfoTile({ icon, label, value, wide = false, href }) {
  const inner = (
    <>
      <div className="w-9 h-9 rounded-full bg-white text-spice-500 flex items-center justify-center shrink-0 border border-sand-200">
        <i className={`fa-solid ${icon} text-sm`}></i>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-bold text-spice-900/45">{label}</p>
        <p className="text-sm font-semibold text-spice-900 leading-snug mt-0.5 break-words">{value || '—'}</p>
      </div>
    </>
  );
  const cls = `flex items-start gap-3 rounded-xl bg-sand-50 border border-sand-200 p-3 ${wide ? 'sm:col-span-2' : ''}`;
  if (href) {
    return <a href={href} className={`${cls} hover:border-spice-300 hover:bg-spice-50/40`}>{inner}</a>;
  }
  return <div className={cls}>{inner}</div>;
}

export function EventDetailsGrid({ res }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {res.eventType ? <InfoTile icon="fa-gift" label="Occasion" value={res.eventType} /> : null}
      <InfoTile icon="fa-calendar-day" label="Date" value={formatDate(res.date)} />
      <InfoTile icon="fa-clock" label="Start time" value={formatTime(res.startTime)} />
      <InfoTile icon="fa-users" label="Guests" value={`${res.package?.pax || '—'} pax`} />
      <InfoTile icon="fa-location-dot" label="Venue" value={res.venue} wide />
      <InfoTile icon="fa-palette" label="Theme / motif" value={res.theme || 'Not set'} />
      <InfoTile icon="fa-seedling" label="Centerpiece" value={res.centerpiece || 'Artificial Flowers'} />
      <InfoTile
        icon="fa-font"
        label="Styro name / standee"
        value={res.styroAvail ? (res.styroName || 'Yes (no name given)') : 'Not availed'}
        wide
      />
    </div>
  );
}

export function PackageMenuSection({ res, menuOptions }) {
  const courses = menuCoursesFor(res, menuOptions);
  return (
    <section>
      <div className="flex items-end justify-between gap-3 mb-3">
        <h4 className="font-serif font-bold text-lg text-spice-900">Package & menu</h4>
        <p className="text-sm font-semibold text-spice-500 text-right">{res.package?.name}</p>
      </div>
      {res.package?.type === 'rental' ? (
        <div className="rounded-2xl border border-sand-200 bg-sand-50 p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-sand-200 text-spice-500 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-chair"></i>
          </div>
          <div>
            <p className="font-semibold text-spice-900">Equipment rental</p>
            <p className="text-sm text-spice-900/60 mt-0.5">Tables, chairs, and setup only. No food is included.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {courses.map((course) => (
              <article key={course.key} className="rounded-2xl border border-sand-200 overflow-hidden bg-white">
                <div className="h-24 bg-sand-100 overflow-hidden">
                  {course.img ? (
                    <img src={course.img} alt={course.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-spice-400">
                      <i className={`fa-solid ${course.icon}`}></i>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-spice-900/45">{course.label}</p>
                  <p className="text-xs font-semibold text-spice-900 leading-snug mt-0.5">{course.name}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="text-xs text-spice-900/55 mt-3 flex items-center gap-2">
            <i className="fa-solid fa-utensils text-spice-400"></i>
            Also included: {res.menu?.staples || 'Rice, dessert, juice, mineral water'}
          </p>
        </>
      )}
    </section>
  );
}

export function PayStep({ label, amount, paid }) {
  return (
    <div className={`rounded-xl border p-3 text-center ${paid ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-sand-200'}`}>
      <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center text-sm font-bold ${paid ? 'bg-emerald-500 text-white' : 'bg-sand-100 text-spice-900/50'}`}>
        {paid ? <i className="fa-solid fa-check text-xs"></i> : '₱'}
      </div>
      <p className="text-[10px] uppercase tracking-wider font-bold text-spice-900/50">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${paid ? 'text-emerald-700' : 'text-spice-900'}`}>
        {paid ? 'Paid' : `₱${amount.toLocaleString()}`}
      </p>
    </div>
  );
}

export function PaymentInstructions({ account }) {
  if (!account) return null;

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(account.number);
    } catch {
      /* ignore clipboard errors */
    }
  };

  return (
    <div className="rounded-2xl border border-spice-200 bg-spice-50/60 px-4 py-3.5">
      <p className="text-[10px] uppercase tracking-wider font-bold text-spice-900/45 mb-2">
        Send payment via {account.method}
      </p>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-lg font-bold tracking-wide text-spice-900">{account.displayNumber}</p>
          <p className="text-sm text-spice-900/70 mt-0.5">{account.accountName}</p>
        </div>
        <button
          type="button"
          onClick={copyNumber}
          className="shrink-0 btn-secondary btn-sm !px-3"
          title="Copy number"
          aria-label="Copy GCash number"
        >
          <i className="fa-regular fa-copy"></i>
        </button>
      </div>
      <p className="text-xs text-spice-900/50 mt-2.5">
        Send the exact amount, then upload your screenshot below for verification.
      </p>
    </div>
  );
}

export function PaymentOverview({ price, fee, down, bal, payments }) {
  const paidSteps = [payments.fee, payments.down, payments.bal].filter(Boolean).length;
  const paidTotal = (payments.fee ? fee : 0) + (payments.down ? down : 0) + (payments.bal ? bal : 0);
  const outstanding = price - paidTotal;
  return (
    <section>
      <div className="flex items-end justify-between gap-3 mb-3">
        <h4 className="font-serif font-bold text-lg text-spice-900">Payment</h4>
        <p className="font-serif text-2xl font-bold text-spice-500 leading-none">₱{price.toLocaleString()}</p>
      </div>
      <div className="h-1.5 rounded-full bg-sand-200 overflow-hidden mb-3">
        <div className="h-full bg-spice-500 rounded-full" style={{ width: `${(paidSteps / 3) * 100}%` }}></div>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        <PayStep label="20% Fee" amount={fee} paid={!!payments.fee} />
        <PayStep label="30% Down" amount={down} paid={!!payments.down} />
        <PayStep label="50% Bal" amount={bal} paid={!!payments.bal} />
      </div>
      {outstanding > 0 && (
        <p className="mt-3 text-sm flex justify-between">
          <span className="text-spice-900/50">Outstanding</span>
          <span className="font-semibold text-spice-900">₱{outstanding.toLocaleString()}</span>
        </p>
      )}
    </section>
  );
}
