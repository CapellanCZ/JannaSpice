import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { rentalInclusions, menuCategoryMeta } from '../data/data.js';
import { PAYMENT_ACCOUNT } from '../features/payments/index.js';
import { AppHeader, Banner } from './ui/index.jsx';

const STEP_LABELS = ['Details', 'Package', 'Menu Setup', 'Submit'];

const emptyForm = {
  eventTitle: '', eventType: '', eventTypeCustom: '', date: '', time: '15:00',
  venue: '', theme: '', centerpiece: 'Artificial Flowers', styroAvail: false, styroName: '',
  clientName: '', clientPhone: '', clientEmail: '', hearAboutUs: ''
};

const HEAR_ABOUT_OPTIONS = ['Facebook', 'TikTok', 'Zumba Community', 'Previous Customer', 'Friend/Family Referral', 'Other'];

export default function BookingWizard() {
  const { switchAppView, requireAuth, currentUser, reservationsQueue, createReservation,
          submitChangeRequest, openSuccessModal, customAlert, CONFIG, getMinDateString, checkDateAvailability,
          packages, menuOptions } = useApp();

  const defaultPackageId = packages.find((p) => p.type === 'promo')?.id || packages[0]?.id;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [selectedPackageId, setSelectedPackageId] = useState(defaultPackageId);
  const [selectedMenu, setSelectedMenu] = useState({ chicken: '', beefPork: '', fishSeafood: '', veg: '', pasta: '' });
  const [editingReservationId, setEditingReservationId] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [dateNote, setDateNote] = useState(null);

  const minDate = getMinDateString();
  const pkg = packages.find(p => p.id === selectedPackageId);
  const isRental = pkg?.type === 'rental';

  useEffect(() => {
    if (currentUser) {
      setForm(f => ({ ...f, clientName: f.clientName || currentUser.name, clientEmail: f.clientEmail || currentUser.email, clientPhone: f.clientPhone || currentUser.phone || '' }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (!packages.some((p) => p.id === selectedPackageId) && packages[0]) {
      setSelectedPackageId(packages.find((p) => p.type === 'promo')?.id || packages[0].id);
    }
  }, [packages, selectedPackageId]);

  useEffect(() => {
    function onStart(e) {
      resetWizard();
      const presetId = e.detail?.presetPackageId;
      if (presetId) setSelectedPackageId(presetId);
      setStep(presetId ? 2 : 1);
    }
    function onEdit(e) {
      const resId = e.detail?.resId;
      const res = reservationsQueue.find(r => r.id === resId);
      if (!res) return;
      setEditingReservationId(resId);
      setForm({
        eventTitle: res.eventTitle,
        eventType: ['Wedding', 'Birthday', 'Corporate'].includes(res.eventType) ? res.eventType : 'Other',
        eventTypeCustom: ['Wedding', 'Birthday', 'Corporate'].includes(res.eventType) ? '' : res.eventType,
        date: res.date, time: res.startTime, venue: res.venue,
        theme: res.theme !== 'N/A' ? res.theme : '', centerpiece: res.centerpiece || 'Artificial Flowers',
        styroAvail: res.styroAvail, styroName: res.styroAvail ? res.styroName : '',
        clientName: res.name, clientPhone: res.phone, clientEmail: res.email
      });
      setSelectedPackageId(res.package.id);
      if (res.menu) setSelectedMenu({ chicken: res.menu.chicken, beefPork: res.menu.beefPork, fishSeafood: res.menu.fishSeafood, veg: res.menu.veg, pasta: res.menu.pasta });
      setStep(1);
    }
    window.addEventListener('start-booking', onStart);
    window.addEventListener('edit-reservation', onEdit);
    return () => {
      window.removeEventListener('start-booking', onStart);
      window.removeEventListener('edit-reservation', onEdit);
    };
  }, [reservationsQueue]);

  useEffect(() => {
    if (!form.date) {
      setDateNote(null);
      return undefined;
    }
    let cancelled = false;
    checkDateAvailability(form.date, editingReservationId)
      .then((result) => {
        if (cancelled) return;
        setDateNote({
          ok: !!result.available,
          msg: result.reason || (result.available
            ? `This date is open — ${result.remaining} of 2 spots left.`
            : 'This date is fully booked. JannaSpice only takes 2 events per day. Please pick another day.')
        });
      })
      .catch(() => {
        if (!cancelled) setDateNote(null);
      });
    return () => { cancelled = true; };
  }, [form.date, editingReservationId, checkDateAvailability]);

  function resetWizard() {
    setForm(emptyForm);
    setSelectedPackageId(packages.find((p) => p.type === 'promo')?.id || packages[0]?.id);
    setSelectedMenu({ chicken: '', beefPork: '', fishSeafood: '', veg: '', pasta: '' });
    setEditingReservationId(null);
    setErrors({});
    setDateNote(null);
  }

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  function validateStep1() {
    const errs = {};
    if (!form.eventTitle.trim()) errs.eventTitle = 'Please provide an event title.';
    if (!form.eventType) errs.eventType = 'Please select or specify an occasion.';
    if (form.eventType === 'Other' && !form.eventTypeCustom.trim()) errs.eventType = 'Please select or specify an occasion.';
    if (!form.date || new Date(form.date) < new Date(minDate)) errs.date = 'Valid date required (must have lead time).';
    if (!form.venue.trim()) errs.venue = 'Venue is required.';
    setErrors(e => ({ ...e, ...errs, __clear: undefined }));
    return Object.keys(errs).length === 0;
  }

  function validateMenu() {
    if (isRental) return true;
    const ok = selectedMenu.chicken && selectedMenu.beefPork && selectedMenu.fishSeafood && selectedMenu.veg && selectedMenu.pasta;
    return !!ok;
  }

  function goToStep(target) {
    if (dateNote && !dateNote.ok) {
      customAlert(dateNote.msg, 'That date is full', 'info');
      return;
    }
    if (target > 1 && !validateStep1()) {
      customAlert('Please complete all required Event Logistics fields properly.', 'Missing Details', 'error');
      return;
    }
    if (target > 3 && !validateMenu()) {
      customAlert('Please select all 5 dishes from the visual menu cards for your Promo Package.', 'Menu Incomplete', 'error');
      return;
    }
    setStep(target);
    window.scrollTo(0, 0);
  }

  const quote = useMemo(() => {
    if (!pkg) return null;
    const total = pkg.price;
    const fee = Math.round(total * CONFIG.reservationFeePct);
    const down = Math.round(total * CONFIG.downpaymentPct);
    const bal = total - fee - down;
    return { total, fee, down, bal };
  }, [pkg, CONFIG]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!currentUser) { requireAuth(() => {}); return; }
    if (!form.eventTitle.trim() || !form.venue.trim()) { customAlert('Event title and venue are strictly required.'); return; }
    if (new Date(form.date) < new Date(minDate)) { customAlert(`Lead time of ${CONFIG.prepLeadTimeDays} days required.`); return; }

    setSubmitting(true);
    try {
      const availability = await checkDateAvailability(form.date, editingReservationId);
      if (!availability.available) {
        customAlert(
          availability.reason || 'This date is fully booked. JannaSpice only takes 2 events per day so every celebration gets our full attention. Please pick another day.',
          'That date is full',
          'info'
        );
        return;
      }

      const menu = !isRental ? { ...selectedMenu, staples: 'Rice, Dessert, Juice, Mineral Water' } : null;
      const evtType = form.eventType === 'Other' ? (form.eventTypeCustom.trim() || 'Custom') : form.eventType;

      const payload = {
        name: form.clientName.trim(), phone: form.clientPhone.trim(), email: form.clientEmail.trim(),
        eventTitle: form.eventTitle.trim(), eventType: evtType, date: form.date, startTime: form.time,
        venue: form.venue.trim(), theme: form.theme.trim() || 'N/A', centerpiece: form.centerpiece,
        styroAvail: form.styroAvail, styroName: form.styroAvail ? form.styroName.trim() : 'N/A',
        package: pkg, menu, selfReportedSource: form.hearAboutUs || null
      };

      if (editingReservationId) {
        await submitChangeRequest(editingReservationId, payload);
      } else {
        await createReservation(payload);
      }

      openSuccessModal('Request submitted successfully!<br>We will review your updated details and message you shortly.');
      resetWizard();
    } catch {
      // AppContext already shows the error alert
    } finally {
      setSubmitting(false);
    }
  }

  function selectDish(catKey, dishName) {
    setSelectedMenu(m => ({ ...m, [catKey]: dishName }));
  }

  return (
    <div className="bg-sand-50 flex flex-col min-h-[100dvh]">
      <AppHeader icon="fa-calendar-check" title="Booking" subtitle={editingReservationId ? 'Request changes' : 'Secure your date'} onBrandClick={() => switchAppView(currentUser ? 'client-dashboard' : 'home')}>
        <button type="button" onClick={() => switchAppView(currentUser ? 'client-dashboard' : 'home')} className="btn-secondary btn-sm">Cancel</button>
      </AppHeader>

      <section className="py-12 flex-grow">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          {/* Progress */}
          <div className="mb-12 max-w-2xl mx-auto">
            <div className="flex items-start">
              {STEP_LABELS.map((label, idx) => {
                const i = idx + 1;
                const done = i < step;
                const active = i === step;
                let iconClass = 'relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ';
                let labelClass = 'text-xs mt-2 text-center ';
                let content = i;
                if (done) {
                  iconClass += 'bg-spice-500 text-white shadow-sm';
                  content = <i className="fa-solid fa-check text-sm"></i>;
                  labelClass += 'font-bold text-spice-900';
                } else if (active) {
                  iconClass += 'bg-spice-500 text-white shadow-md';
                  labelClass += 'font-bold text-spice-900';
                } else {
                  iconClass += 'bg-sand-200 text-spice-900/40';
                  labelClass += 'font-medium text-spice-900/40';
                }
                const lineDone = i <= step;
                return (
                  <div key={label} className="flex-1 flex flex-col items-center relative min-w-0">
                    {idx > 0 && (
                      <div
                        className={`absolute top-5 right-1/2 left-[-50%] h-[3px] rounded-full ${lineDone ? 'bg-spice-500' : 'bg-sand-200'}`}
                        aria-hidden="true"
                      />
                    )}
                    <div className={iconClass}>{content}</div>
                    <span className={labelClass}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="surface-card p-6 lg:p-10">
            <form onSubmit={handleSubmit} noValidate>
              {step === 1 && (
                <div>
                  <h3 className="text-2xl font-serif font-bold text-spice-900 mb-6 border-b border-sand-200 pb-4">Event Logistics & Design</h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="field-label">Event Title</label>
                        <input type="text" value={form.eventTitle} onChange={e => set('eventTitle', e.target.value)} placeholder="e.g., Mia's 18th Birthday" className={`input-modern ${errors.eventTitle ? 'input-error' : ''}`} required />
                        {errors.eventTitle && <p className="field-error">{errors.eventTitle}</p>}
                      </div>
                      <div>
                        <label className="field-label">Occasion</label>
                        <select value={form.eventType} onChange={e => set('eventType', e.target.value)} className={`input-modern ${errors.eventType ? 'input-error' : ''}`} required>
                          <option value="">-- Select Occasion --</option>
                          <option value="Wedding">Wedding Reception</option>
                          <option value="Birthday">Birthday / Debut</option>
                          <option value="Corporate">Corporate / Blessing</option>
                          <option value="Other">Other (Specify)</option>
                        </select>
                        {form.eventType === 'Other' && (
                          <input type="text" value={form.eventTypeCustom} onChange={e => set('eventTypeCustom', e.target.value)} className="input-modern mt-2" placeholder="Please specify occasion" />
                        )}
                        {errors.eventType && <p className="field-error">{errors.eventType}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="field-label">Date</label>
                        <input type="date" value={form.date} min={minDate} onChange={e => set('date', e.target.value)} className={`input-modern ${errors.date ? 'input-error' : ''}`} required />
                        <p className="text-xs text-spice-900/45 mt-1.5">We host up to 2 events per day.</p>
                        {dateNote && (
                          <p className={`text-xs mt-1 ${dateNote.ok ? 'text-emerald-700' : 'text-spice-500'}`}>{dateNote.msg}</p>
                        )}
                        {errors.date && <p className="field-error">{errors.date}</p>}
                      </div>
                      <div>
                        <label className="field-label">Start Time</label>
                        <input type="time" value={form.time} onChange={e => set('time', e.target.value)} className="input-modern" required />
                      </div>
                    </div>
                    <div>
                      <label className="field-label">Venue Address (or specific area)</label>
                      <input type="text" value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="Where will the event be held?" className={`input-modern ${errors.venue ? 'input-error' : ''}`} required />
                      {errors.venue && <p className="field-error">{errors.venue}</p>}
                    </div>
                    <div>
                      <label className="field-label">How did you hear about JannaSpice?</label>
                      <select value={form.hearAboutUs} onChange={e => set('hearAboutUs', e.target.value)} className="input-modern">
                        <option value="">-- Select (optional) --</option>
                        {HEAR_ABOUT_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    <div className="pt-4 border-t border-sand-200">
                      <h4 className="text-md font-serif font-bold text-spice-900 mb-4">Event Styling & Theme Preferences</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <label className="field-label">Event Theme / Color Motif</label>
                          <input type="text" value={form.theme} onChange={e => set('theme', e.target.value)} placeholder="e.g., Rustic Boho, Dusty Rose & Gold" className="input-modern" />
                        </div>
                        <div>
                          <label className="field-label">Table Centerpiece Choice</label>
                          <select value={form.centerpiece} onChange={e => set('centerpiece', e.target.value)} className="input-modern">
                            <option value="Artificial Flowers">Artificial Flowers</option>
                            <option value="Balloon Centerpieces">Balloon Centerpieces</option>
                          </select>
                        </div>
                      </div>
                      <div className="bg-sand-50 p-4 rounded-2xl border border-sand-200 space-y-3">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" id="styro-avail" checked={form.styroAvail} onChange={e => set('styroAvail', e.target.checked)} className="w-4 h-4 accent-spice-500 rounded cursor-pointer" />
                          <label htmlFor="styro-avail" className="text-sm font-bold text-spice-900 cursor-pointer">Avail Styro Name & Standee</label>
                        </div>
                        {form.styroAvail && (
                          <div className="pl-7">
                            <label className="field-label">Name / Text to be used on Styro Standee</label>
                            <input type="text" value={form.styroName} onChange={e => set('styroName', e.target.value)} placeholder="e.g., Happy 18th Mia" className="input-modern" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-10 flex justify-end">
                    <button type="button" onClick={() => goToStep(2)} className="btn-primary">Next: Choose Package <i className="fa-solid fa-arrow-right text-sm"></i></button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3 className="text-2xl font-serif font-bold text-spice-900 mb-6 border-b border-sand-200 pb-4">Select a Package</h3>
                  <div className="space-y-4">
                    {packages.map(p => {
                      const checked = p.id === selectedPackageId;
                      return (
                        <label key={p.id} className="block relative group cursor-pointer">
                          <input type="radio" name="package-option" value={p.id} checked={checked} onChange={() => setSelectedPackageId(p.id)} className="peer absolute opacity-0" />
                          <div className={`p-5 rounded-2xl border-2 bg-white transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-spice-300 ${checked ? 'border-spice-500 bg-spice-50' : 'border-sand-200'}`}>
                            <div>
                              <h4 className="font-bold text-spice-900 text-lg">{p.name}</h4>
                              <p className="text-sm text-spice-900/60 mt-1">{p.desc}</p>
                            </div>
                            <div className="text-left md:text-right shrink-0">
                              <span className="block font-bold text-spice-500 text-xl">₱{p.price.toLocaleString()}</span>
                            </div>
                          </div>
                          {checked && (
                            <div className="absolute top-1/2 right-6 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-spice-500 bg-spice-500 flex items-center justify-center">
                              <i className="fa-solid fa-check text-white text-xs"></i>
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-10 flex justify-between">
                    <button type="button" onClick={() => goToStep(1)} className="btn-secondary">Back</button>
                    <button type="button" onClick={() => goToStep(3)} className="btn-primary">Next: Menu</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h3 className="text-2xl font-serif font-bold text-spice-900 mb-2 border-b border-sand-200 pb-4">Menu Selection & Visual Preview</h3>

                  {isRental ? (
                    <div className="bg-spice-50 rounded-2xl p-6 border border-spice-200">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-spice-500 text-white rounded-full flex items-center justify-center text-xl"><i className="fa-solid fa-chair"></i></div>
                        <div>
                          <h4 className="font-bold text-spice-900 text-lg">Equipment Rental Selected</h4>
                          <p className="text-sm text-spice-900/70">No food catering included. You will provide your own food.</p>
                        </div>
                      </div>
                      <h5 className="text-xs font-bold text-spice-900 uppercase tracking-wider mb-2">Inclusions:</h5>
                      <ul className="text-sm text-spice-900/70 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 list-disc pl-4">
                        {rentalInclusions.map(i => <li key={i}>{i}</li>)}
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <Banner tone="success" icon="fa-circle-check">
                        <span className="font-semibold">Automatically included:</span> Plain rice, dessert, juice, and mineral water. Select your 5 main courses below.
                      </Banner>

                      <div className="space-y-6">
                        {menuCategoryMeta.map(cat => (
                          <div key={cat.key} className="space-y-3">
                            <h4 className="text-md font-serif font-bold text-spice-900">{cat.label}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
                              { (menuOptions[cat.key] || []).map(item => {
                                const selected = selectedMenu[cat.key] === item.name;
                                return (
                                  <div key={item.name} onClick={() => selectDish(cat.key, item.name)}
                                    className={`menu-card cursor-pointer bg-white rounded-2xl border-2 overflow-hidden transition-all flex flex-col group relative ${selected ? 'border-spice-500 bg-spice-50' : 'border-sand-200 hover:border-spice-400'}`}>
                                    <div className="h-28 overflow-hidden bg-sand-100 relative">
                                      <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    <div className="p-3 flex flex-col justify-between flex-grow">
                                      <span className="text-xs font-bold text-spice-900">{item.name}</span>
                                      <span className={`text-[10px] font-semibold mt-1 ${selected ? 'text-green-600 font-bold' : 'text-spice-500'}`}>{selected ? 'Selected ✓' : 'Select'}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-10 flex justify-between">
                    <button type="button" onClick={() => goToStep(2)} className="btn-secondary">Back</button>
                    <button type="button" onClick={() => goToStep(4)} className="btn-primary">Review</button>
                  </div>
                </div>
              )}

              {step === 4 && quote && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-spice-900 mb-6">Client Contact</h3>
                      <div className="space-y-6">
                        <div>
                          <label className="field-label">Full Name</label>
                          <input type="text" value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Juan Dela Cruz" className="input-modern" required />
                        </div>
                        <div>
                          <label className="field-label">Mobile Number</label>
                          <input type="tel" value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)} pattern="^(09|\+639)\d{9}$" maxLength={13} placeholder="09XX XXX XXXX" className="input-modern" required title="Valid 11-digit PH mobile required" />
                        </div>
                        <div>
                          <label className="field-label">Email Address</label>
                          <input type="email" value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} placeholder="juan@example.com" className="input-modern" required />
                        </div>
                      </div>
                    </div>
                    <div className="bg-sand-50 rounded-2xl p-6 border border-sand-200 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-spice-900 text-lg mb-4 border-b border-sand-200 pb-4">Booking Summary</h4>
                        <div className="space-y-2 text-sm text-spice-900 mb-4">
                          <div className="flex justify-between"><span className="text-spice-900/70">Selected Package:</span><span className="font-bold text-right">{pkg.name}</span></div>
                          <div className="flex justify-between"><span className="text-spice-900/70">Guest Count:</span><span className="font-bold text-right">{pkg.pax} Pax</span></div>
                        </div>
                      </div>
                      <div className="border-t border-sand-200 pt-4">
                        <div className="flex justify-between items-end mb-4"><span className="text-sm font-bold text-spice-900">Total Price</span><span className="font-serif text-3xl font-bold text-spice-500">₱{quote.total.toLocaleString()}</span></div>
                        <div className="grid grid-cols-3 gap-2 text-center bg-white rounded-xl border border-sand-200 p-3">
                          <div><p className="text-[10px] uppercase font-bold text-spice-900/50">Res. Fee (20%)</p><p className="font-bold text-spice-900 text-sm">₱{quote.fee.toLocaleString()}</p></div>
                          <div><p className="text-[10px] uppercase font-bold text-spice-900/50">Down (30%)</p><p className="font-bold text-spice-900 text-sm">₱{quote.down.toLocaleString()}</p></div>
                          <div><p className="text-[10px] uppercase font-bold text-spice-900/50">Balance (50%)</p><p className="font-bold text-spice-900 text-sm">₱{quote.bal.toLocaleString()}</p></div>
                        </div>
                        <p className="text-xs text-spice-900/50 mt-3 text-center">*After owner approval, pay via {PAYMENT_ACCOUNT.method} to <span className="font-semibold text-spice-900/70">{PAYMENT_ACCOUNT.displayNumber} ({PAYMENT_ACCOUNT.accountName})</span>, then upload your 20% fee proof in My Bookings within 48 hours.</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-10 flex justify-between">
                    <button type="button" onClick={() => goToStep(3)} className="btn-secondary">Back</button>
                    <button type="submit" disabled={submitting} className="btn-primary px-8 relative">
                      <span className={`flex items-center gap-1 ${submitting ? 'opacity-0' : ''}`}>Confirm Booking <i className="fa-solid fa-paper-plane text-sm ml-1"></i></span>
                      {submitting && (
                        <svg className="spinner absolute top-1/2 left-1/2 -mt-[10px] -ml-[10px]" viewBox="0 0 50 50"><circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
