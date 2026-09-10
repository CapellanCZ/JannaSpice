import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function Home() {
  const { currentUser, switchAppView, openAuthModal, handleLogout, requireAuth,
          getMinDateString, customAlert, checkDateAvailability } = useApp();

  const [heroDate, setHeroDate] = useState('');
  const [heroService, setHeroService] = useState('Promo Package');
  const [feedback, setFeedback] = useState(null); // {ok, msg}

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
        setFeedback({ ok: false, msg: result.reason || 'Date is fully booked or unavailable.' });
        return;
      }
      setFeedback({ ok: true, msg: `Date is available! (${result.remaining} slot(s) left)` });
      const preselectedId = heroService === 'Equipment Rental' ? 1 : 2;
      setTimeout(() => startBookingFlow(preselectedId), 800);
    } catch (err) {
      customAlert(err.message, 'Notice', 'error');
    }
  }

  return (
    <div className="bg-sand-50 flex flex-col min-h-screen">
      <header className="fixed w-full top-0 z-40 bg-sand-50/90 backdrop-blur-md border-b border-sand-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <a href="#" onClick={(e) => { e.preventDefault(); switchAppView('home'); }} className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-spice-500 rounded-lg">
              <div className="bg-spice-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md"><i className="fa-solid fa-utensils"></i></div>
              <div className="flex flex-col">
                <span className="text-2xl font-serif font-bold text-spice-900 leading-none">JannaSpice</span>
                <span className="text-xs font-medium text-spice-500 uppercase tracking-widest">Cuisine</span>
              </div>
            </a>
            <nav className="hidden lg:flex space-x-8 text-sm font-medium text-spice-900">
              <a href="#services" className="hover:text-spice-500 transition-colors">Our Services</a>
              <a href="#packages" className="hover:text-spice-500 transition-colors">Packages & Promos</a>
            </nav>
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <>
                  <button onClick={() => switchAppView('client-dashboard')} className="text-sm font-bold text-spice-900 hover:text-spice-500 transition-colors hidden md:block">My Dashboard</button>
                  <div className="text-sm font-bold text-spice-900 hidden md:block border-l border-sand-200 pl-4 ml-2">Hi, {(currentUser.name || 'there').split(' ')[0]}</div>
                  <button onClick={handleLogout} className="text-spice-500 hover:text-spice-600 text-sm font-bold ml-2" title="Logout"><i className="fa-solid fa-right-from-bracket"></i></button>
                </>
              ) : (
                <>
                  <button onClick={() => openAuthModal('login')} className="text-sm font-medium text-spice-900 hover:text-spice-500 transition-colors hidden md:block">Log In</button>
                  <button onClick={() => openAuthModal('signup')} className="btn-primary py-2 px-5 text-sm ml-2">Sign Up</button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <section id="hero" className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10 space-y-6 text-center lg:text-left">
            <div className="inline-block bg-spice-100 text-spice-600 font-medium text-sm px-4 py-1.5 rounded-full mb-2"><i className="fa-solid fa-location-dot mr-1"></i> Blk 4 Lot 4 Chester Place Subd, Dasmariñas</div>
            <h1 className="text-5xl lg:text-7xl font-serif font-bold text-spice-900 leading-tight">Food catering, rent tables, chairs & <span className="text-spice-500 italic">party needs.</span></h1>
            <p className="text-lg text-spice-900/70 max-w-lg mx-auto lg:mx-0 font-light leading-relaxed">From simple equipment rentals to our full-service Promo Packages, JannaSpice Cuisine ensures your event is beautiful, affordable, and delicious.</p>
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button onClick={() => startBookingFlow()} className="btn-primary w-full sm:w-auto">Start Your Booking</button>
              <a href="#packages" className="btn-secondary w-full sm:w-auto">View Promo Packages</a>
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
              <label className="block text-sm font-medium text-spice-900 mb-2">When is your event?</label>
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
              <label className="block text-sm font-medium text-spice-900 mb-2">What service do you need?</label>
              <div className="relative">
                <i className="fa-solid fa-bell-concierge absolute left-4 top-1/2 -translate-y-1/2 text-spice-400 pointer-events-none z-10 text-base"></i>
                <select 
                  value={heroService} 
                  onChange={(e) => setHeroService(e.target.value)} 
                  className="input-modern !pl-12 pr-10 w-full appearance-none"
                >
                  <option value="Promo Package">Full Promo Package</option>
                  <option value="Equipment Rental">Equipment Rental Only</option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-spice-400 pointer-events-none text-xs"></i>
              </div>
            </div>
            <div className="w-full md:w-[25%]">
              <button type="submit" className="w-full btn-primary py-3.5">Check Date</button>
            </div>
          </form>
          {feedback && (
            <div className={`mt-4 text-center p-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${feedback.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <i className={`fa-solid ${feedback.ok ? 'fa-circle-check' : 'fa-calendar-xmark'}`}></i> {feedback.msg}
            </div>
          )}
        </div>
      </section>

      <section id="packages" className="py-24 bg-white relative w-full">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-spice-500 font-semibold tracking-wider uppercase text-sm mb-2 block">Our Services</span>
            <h2 className="text-4xl lg:text-5xl font-serif font-bold text-spice-900">JannaSpice Pricing</h2>
            <p className="text-spice-900/60 mt-4 max-w-2xl mx-auto">Choose between renting our beautiful equipment or let us handle everything with our comprehensive Promo Packages.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
            <div className="bg-sand-50 rounded-3xl p-8 border border-sand-200 flex flex-col hover:shadow-soft transition-shadow lg:col-span-1">
              <h3 className="font-serif text-2xl font-bold text-spice-900 mb-1">Equipment Rental</h3>
              <div className="flex items-end gap-1 mb-6 border-b border-sand-200 pb-6">
                <span className="text-3xl text-spice-500 font-bold">₱10,000</span>
                <span className="text-spice-900/60 text-sm mb-1">/ 50 pax</span>
              </div>
              <p className="text-sm font-bold text-spice-900 mb-2">Ideal for DIY parties.</p>
              <p className="text-xs text-spice-900/70 mb-6 flex-grow">You bring the food, we provide the complete setup: monoblock chairs w/ covers, tables w/ cloth & runner, centerpieces, complete utensils, roll top chaffing dishes, buffet lamp, skirted buffet, gift/cake/souvenir tables, and basic balloon setup & backdrop.</p>
              <button onClick={() => startBookingFlow(1)} className="w-full btn-secondary">Select Rental</button>
            </div>

            <div className="bg-spice-900 rounded-3xl p-8 shadow-float lg:col-span-3 flex flex-col">
              <div className="text-center mb-8 border-b border-spice-800 pb-6">
                <h3 className="font-serif text-3xl font-bold text-white mb-2">The Promo Package</h3>
                <p className="text-spice-100/70 text-sm">Includes Complete Basic Setup, Standard Catering Equipment, Uniformed Waiters, and Food (3 Mains, 1 Veg, 1 Pasta, Rice, Dessert, Juice & Water). Free Styro Name & Standee use!</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow mb-8">
                <div className="rounded-2xl p-6 border border-white/20 text-center hover:bg-white/5 transition-colors">
                  <span className="block text-spice-300 font-bold uppercase tracking-wider text-xs mb-2">Intimate</span>
                  <div className="text-4xl text-white font-bold mb-1">50 Pax</div>
                  <div className="text-spice-400 font-bold text-xl mb-6">₱30,000</div>
                  <button onClick={() => startBookingFlow(2)} className="w-full btn-primary bg-spice-500 hover:bg-spice-400 border-none py-2 text-sm">Book 50 Pax</button>
                </div>
                <div className="rounded-2xl p-6 border border-white/20 text-center hover:bg-white/5 transition-colors relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-spice-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">Popular</div>
                  <span className="block text-spice-300 font-bold uppercase tracking-wider text-xs mb-2 mt-2">Standard</span>
                  <div className="text-4xl text-white font-bold mb-1">75 Pax</div>
                  <div className="text-spice-400 font-bold text-xl mb-6">₱38,000</div>
                  <button onClick={() => startBookingFlow(3)} className="w-full btn-primary bg-spice-500 hover:bg-spice-400 border-none py-2 text-sm">Book 75 Pax</button>
                </div>
                <div className="rounded-2xl p-6 border border-white/20 text-center hover:bg-white/5 transition-colors">
                  <span className="block text-spice-300 font-bold uppercase tracking-wider text-xs mb-2">Grand</span>
                  <div className="text-4xl text-white font-bold mb-1">100 Pax</div>
                  <div className="text-spice-400 font-bold text-xl mb-6">₱46,000</div>
                  <button onClick={() => startBookingFlow(4)} className="w-full btn-primary bg-spice-500 hover:bg-spice-400 border-none py-2 text-sm">Book 100 Pax</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-spice-900 text-white py-16 border-t border-spice-900 mt-auto w-full">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div>
            <span className="text-2xl font-serif font-bold text-white block mb-2">JannaSpice Cuisine</span>
            <p className="text-spice-100/60 text-sm font-light">Food catering, rent tables, chairs, and party needs.</p>
          </div>
          <div>
            <h4 className="font-bold text-spice-400 mb-4 uppercase tracking-wider text-sm">Inquiries: Jhoanna</h4>
            <ul className="space-y-2 text-sm text-spice-100/80 font-light">
              <li><i className="fa-solid fa-phone w-5"></i> 0966 687 8302 / 0992 637 0100</li>
              <li><i className="fa-brands fa-facebook w-5"></i> Janna Spice Cuisine Catering Services</li>
              <li><i className="fa-solid fa-location-dot w-5"></i> Blk 4 Lot 4 Chester Place Subd, Dasma</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-spice-400 mb-4 uppercase tracking-wider text-sm">System Details</h4>
            <p className="text-sm text-spice-100/80 font-light leading-relaxed">CuiZin Mobile Management System<br />Developed by: SECA Team</p>
          </div>
        </div>
      </footer>
    </div>
  );
}