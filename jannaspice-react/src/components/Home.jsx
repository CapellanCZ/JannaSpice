import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { MarketingFooter, MarketingHeader, useMarketingNav } from './marketing/SiteChrome.jsx';
import StoriesSection from './marketing/StoriesSection.jsx';

export default function Home() {
  const { currentUser, switchAppView, openAuthModal, handleLogout, requireAuth,
          getMinDateString, customAlert, checkDateAvailability, packages, openProfileModal } = useApp();
  const { goTab } = useMarketingNav();

  const rental = packages.find((p) => p.type === 'rental');
  const promos = packages.filter((p) => p.type === 'promo').sort((a, b) => a.pax - b.pax);
  const promoLabels = ['Intimate', 'Standard', 'Grand'];
  const [heroDate, setHeroDate] = useState('');
  const [heroService, setHeroService] = useState('Promo Package');
  const [feedback, setFeedback] = useState(null);
  const [navActive, setNavActive] = useState('home');

  useEffect(() => {
    const onSection = (e) => {
      if (e.detail?.tab) setNavActive(e.detail.tab);
    };
    window.addEventListener('marketing-section', onSection);
    return () => window.removeEventListener('marketing-section', onSection);
  }, []);

  function startBookingFlow(presetPackageId = null) {
    requireAuth(() => {
      switchAppView('booking');
      window.dispatchEvent(new CustomEvent('start-booking', { detail: { presetPackageId } }));
    });
  }

  async function quickCheckAvailability(e) {
    e.preventDefault();
    if (!heroDate) return;
    try {
      const result = await checkDateAvailability(heroDate);
      if (!result.available) {
        setFeedback({ ok: false, msg: result.reason || 'This date is fully booked. JannaSpice only takes 2 events per day. Please pick another day.' });
        return;
      }
      setFeedback({ ok: true, msg: result.reason || `This date is open — ${result.remaining} of 2 spots left.` });
      const preselectedId = heroService === 'Equipment Rental' ? 1 : 2;
      setTimeout(() => startBookingFlow(preselectedId), 800);
    } catch (err) {
      customAlert(err.message, 'Notice', 'error');
    }
  }

  return (
    <div className="bg-sand-50 flex flex-col min-h-[100dvh]">
      <MarketingHeader active={navActive}>
        {currentUser ? (
          <>
            <span className="hidden lg:inline text-sm font-medium text-spice-900/70">Hi, {(currentUser.name || 'there').split(' ')[0]}</span>
            <button type="button" onClick={() => switchAppView('client-dashboard')} className="btn-ghost btn-sm hidden lg:inline-flex">My bookings</button>
            <button type="button" onClick={openProfileModal} className="btn-ghost btn-sm hidden lg:inline-flex">Profile</button>
            <button type="button" onClick={handleLogout} className="icon-btn" aria-label="Sign out"><i className="fa-solid fa-right-from-bracket"></i></button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => openAuthModal('login')} className="btn-ghost btn-sm hidden sm:inline-flex">Log in</button>
            <button type="button" onClick={() => openAuthModal('signup')} className="btn-primary btn-sm">Sign up</button>
          </>
        )}
      </MarketingHeader>

      <section id="hero" className="relative pt-12 pb-16 lg:pt-16 lg:pb-24 overflow-hidden px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10 space-y-5 text-center lg:text-left">
            <div className="inline-block bg-spice-100 text-spice-700 font-medium text-sm px-4 py-1.5 rounded-full"><i className="fa-solid fa-location-dot mr-1"></i> Dasmariñas, Cavite</div>
            <h1 className="text-4xl lg:text-6xl font-serif font-bold text-spice-900 leading-[1.15]">Food catering, tables, chairs, and <span className="text-spice-500 italic">party needs.</span></h1>
            <p className="text-base lg:text-lg text-spice-900/70 max-w-lg mx-auto lg:mx-0 leading-relaxed">Equipment rental or a full promo package. We handle setup, waiters, and the menu so your event stays on budget.</p>
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button onClick={() => startBookingFlow()} className="btn-primary w-full sm:w-auto">Start booking</button>
              <a href="#packages" className="btn-secondary w-full sm:w-auto">View packages</a>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-4 h-[400px] lg:h-[500px]">
            <div className="img-card shadow-soft h-full"><img src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80" alt="Catering Setup" className="w-full h-full object-cover" /></div>
            <div className="grid grid-rows-2 gap-4 h-full">
              <div className="img-card shadow-soft h-full"><img src="https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80" alt="Equipment" className="w-full h-full object-cover" /></div>
              <div className="img-card shadow-soft h-full"><img src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80" alt="Menu" className="w-full h-full object-cover object-top" /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 relative z-20 -mt-10 lg:-mt-16 mb-20 w-full">
        <div className="bg-white rounded-2xl shadow-soft p-6 lg:p-8 border border-sand-200">
          <form onSubmit={quickCheckAvailability} className="flex flex-col md:flex-row items-end justify-between gap-4">
            <div className="w-full md:w-[35%]">
              <label className="field-label">When is your event?</label>
              <div className="relative">
                <i className="fa-regular fa-calendar absolute left-4 top-1/2 -translate-y-1/2 text-spice-400 pointer-events-none z-10 text-base"></i>
                <input
                  type="date"
                  value={heroDate}
                  min={getMinDateString()}
                  onChange={(e) => setHeroDate(e.target.value)}
                  className="input-modern !pl-12 pr-4 w-full"
                  required
                />
              </div>
            </div>
            <div className="w-full md:w-[35%]">
              <label className="field-label">What service do you need?</label>
              <div className="relative">
                <i className="fa-solid fa-bell-concierge absolute left-4 top-1/2 -translate-y-1/2 text-spice-400 pointer-events-none z-10 text-base"></i>
                <select
                  value={heroService}
                  onChange={(e) => setHeroService(e.target.value)}
                  className="input-modern !pl-12 w-full"
                >
                  <option value="Promo Package">Full Promo Package</option>
                  <option value="Equipment Rental">Equipment Rental Only</option>
                </select>
              </div>
            </div>
            <div className="w-full md:w-[25%]">
              <button type="submit" className="w-full btn-primary">Check date</button>
            </div>
          </form>
          {feedback && (
            <div className={`mt-4 ui-banner ${feedback.ok ? 'ui-banner-success' : 'ui-banner-danger'} justify-center text-sm`}>
              <i className={`fa-solid ${feedback.ok ? 'fa-circle-check' : 'fa-calendar-xmark'}`}></i> {feedback.msg}
            </div>
          )}
        </div>
      </section>

      <section id="packages" className="py-24 bg-white relative w-full scroll-mt-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-spice-500 font-semibold tracking-wider uppercase text-sm mb-2 block">Our Services</span>
            <h2 className="text-4xl lg:text-5xl font-serif font-bold text-spice-900">JannaSpice Pricing</h2>
            <p className="text-spice-900/60 mt-4 max-w-2xl mx-auto">Choose between renting our beautiful equipment or let us handle everything with our comprehensive Promo Packages.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
            <div className="bg-sand-50 rounded-2xl p-8 border border-sand-200 flex flex-col hover:shadow-soft transition-shadow lg:col-span-1">
              <h3 className="font-serif text-2xl font-bold text-spice-900 mb-1">{rental?.name || 'Equipment Rental'}</h3>
              <div className="flex items-end gap-1 mb-6 border-b border-sand-200 pb-6">
                <span className="text-3xl text-spice-500 font-bold">₱{(rental?.price || 10000).toLocaleString()}</span>
                <span className="text-spice-900/60 text-sm mb-1">/ {rental?.pax || 50} pax</span>
              </div>
              <p className="text-sm font-bold text-spice-900 mb-2">Ideal for DIY parties.</p>
              <p className="text-xs text-spice-900/70 mb-6 flex-grow">{rental?.desc || 'You bring the food, we provide the complete setup: monoblock chairs w/ covers, tables w/ cloth & runner, centerpieces, complete utensils, roll top chaffing dishes, buffet lamp, skirted buffet, gift/cake/souvenir tables, and basic balloon setup & backdrop.'}</p>
              <button onClick={() => startBookingFlow(rental?.id || 1)} className="w-full btn-secondary">Select Rental</button>
            </div>

            <div className="bg-spice-900 rounded-2xl p-8 shadow-float lg:col-span-3 flex flex-col">
              <div className="text-center mb-8 border-b border-spice-800 pb-6">
                <h3 className="font-serif text-3xl font-bold text-white mb-2">The Promo Package</h3>
                <p className="text-spice-100/70 text-sm">Includes Complete Basic Setup, Standard Catering Equipment, Uniformed Waiters, and Food (3 Mains, 1 Veg, 1 Pasta, Rice, Dessert, Juice & Water). Free Styro Name & Standee use!</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow mb-8">
                {promos.map((pkg, index) => (
                  <div key={pkg.id} className="rounded-2xl p-6 border border-white/20 text-center hover:bg-white/5 transition-colors relative">
                    {index === 1 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-spice-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">Popular</div>}
                    <span className="block text-spice-300 font-bold uppercase tracking-wider text-xs mb-2">{promoLabels[index] || 'Promo'}</span>
                    <div className="text-4xl text-white font-bold mb-1">{pkg.pax} Pax</div>
                    <div className="text-spice-400 font-bold text-xl mb-6">₱{pkg.price.toLocaleString()}</div>
                    <button onClick={() => startBookingFlow(pkg.id)} className="w-full btn-primary btn-sm">Book {pkg.pax} pax</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <StoriesSection
        onBook={() => startBookingFlow()}
        onViewPackages={() => goTab('packages')}
      />

      <MarketingFooter />
    </div>
  );
}
