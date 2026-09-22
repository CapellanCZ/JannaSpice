import { useApp } from '../../context/AppContext.jsx';
import { AppHeader } from '../ui/index.jsx';

export const MARKETING_TABS = [
  { id: 'home', label: 'Home' },
  { id: 'packages', label: 'Packages' },
  { id: 'stories', label: 'Stories' },
  { id: 'contact', label: 'Contact' }
];

function scrollToId(id) {
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function useMarketingNav() {
  const { switchAppView, view } = useApp();

  function sectionIdFor(tabId) {
    if (tabId === 'packages') return 'packages';
    if (tabId === 'stories') return 'stories';
    if (tabId === 'contact') return 'contact';
    return null;
  }

  function goTab(tabId) {
    window.dispatchEvent(new CustomEvent('marketing-section', { detail: { tab: tabId } }));

    if (tabId === 'home') {
      switchAppView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const sectionId = sectionIdFor(tabId);
    if (!sectionId) return;

    if (view !== 'home') {
      switchAppView('home');
      window.setTimeout(() => scrollToId(sectionId), 80);
      return;
    }

    scrollToId(sectionId);
  }

  return { goTab };
}

export function MarketingNav({ active = 'home' }) {
  const { goTab } = useMarketingNav();

  return (
    <nav className="marketing-nav" aria-label="Site">
      {MARKETING_TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => goTab(tab.id)}
            className={`marketing-nav-tab ${isActive ? 'is-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export function MarketingHeader({ active = 'home', children }) {
  const { goTab } = useMarketingNav();

  return (
    <>
      <AppHeader
        icon="fa-utensils"
        title="JannaSpice"
        subtitle="Cuisine"
        onBrandClick={() => goTab('home')}
        center={<MarketingNav active={active} />}
      >
        {children}
      </AppHeader>
      <div className="lg:hidden border-b border-sand-200 bg-white/95 backdrop-blur-md sticky top-16 z-[39]">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <MarketingNav active={active} />
        </div>
      </div>
    </>
  );
}

export function MarketingFooter() {
  const { goTab } = useMarketingNav();

  return (
    <footer id="contact" className="bg-spice-900 text-white py-16 border-t border-spice-900 mt-auto w-full scroll-mt-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
        <div>
          <button type="button" onClick={() => goTab('home')} className="text-2xl font-serif font-bold text-white block mb-2 mx-auto md:mx-0">
            JannaSpice Cuisine
          </button>
          <p className="text-spice-100/60 text-sm font-light">Food catering, rent tables, chairs, and party needs.</p>
          <div className="mt-5 flex flex-wrap gap-3 justify-center md:justify-start">
            {MARKETING_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => goTab(tab.id)}
                className="text-xs font-medium text-spice-100/70 hover:text-white transition-colors"
              >
                {tab.label}
              </button>
            ))}
          </div>
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
  );
}
