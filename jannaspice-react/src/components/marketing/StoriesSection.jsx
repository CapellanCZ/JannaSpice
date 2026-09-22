import { TESTIMONIALS, TESTIMONIAL_STATS } from '../../features/testimonials/index.js';

function StarRating({ rating, size = 'sm' }) {
  const cls = size === 'lg' ? 'text-base gap-1' : 'text-xs gap-0.5';
  return (
    <div className={`inline-flex items-center ${cls}`} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <i
          key={i}
          className={`fa-solid fa-star ${i < rating ? 'text-spice-500' : 'text-sand-300'}`}
        />
      ))}
    </div>
  );
}

function ReviewerMeta({ item, light = false }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <img
        src={item.avatar}
        alt=""
        className="w-11 h-11 rounded-full object-cover border border-sand-200 shrink-0"
      />
      <div className="min-w-0">
        <p className={`font-semibold truncate ${light ? 'text-white' : 'text-spice-900'}`}>{item.name}</p>
        <p className={`text-xs truncate ${light ? 'text-white/65' : 'text-spice-900/50'}`}>
          {item.event} · {item.location}
        </p>
      </div>
    </div>
  );
}

export default function StoriesSection({ onBook, onViewPackages }) {
  const featured = TESTIMONIALS.find((t) => t.featured) || TESTIMONIALS[0];
  const rest = TESTIMONIALS.filter((t) => t.id !== featured.id);

  return (
    <section id="stories" className="relative py-20 lg:py-24 bg-sand-50 scroll-mt-28 w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(216,107,73,0.08),_transparent_55%)]" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
        <div className="text-center mb-12 lg:mb-14 max-w-2xl mx-auto">
          <span className="text-spice-500 font-semibold tracking-wider uppercase text-sm mb-2 block">
            Client stories
          </span>
          <h2 className="text-4xl lg:text-5xl font-serif font-bold text-spice-900 leading-[1.15]">
            Real events. Real tables. <span className="text-spice-500 italic">Real praise.</span>
          </h2>
          <p className="text-spice-900/60 mt-4 leading-relaxed">
            From debuts to garden weddings across Cavite — here&apos;s what hosts say after JannaSpice shows up.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-10">
          <div className="inline-flex items-center gap-2.5 rounded-2xl border border-sand-200 bg-white px-4 py-3 shadow-soft">
            <StarRating rating={5} size="lg" />
            <div>
              <p className="font-serif text-xl font-bold text-spice-900 leading-none">{TESTIMONIAL_STATS.averageRating}</p>
              <p className="text-[11px] text-spice-900/45 mt-0.5">Average rating</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-sand-200 bg-white px-4 py-3 shadow-soft">
            <span className="font-serif text-xl font-bold text-spice-500">{TESTIMONIAL_STATS.eventsServed}</span>
            <span className="text-xs text-spice-900/50 leading-snug">Events<br />served</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-sand-200 bg-white px-4 py-3 shadow-soft">
            <span className="font-serif text-xl font-bold text-spice-900">{TESTIMONIAL_STATS.reviewCount}</span>
            <span className="text-xs text-spice-900/50 leading-snug">Featured<br />reviews</span>
          </div>
        </div>

        <article className="grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden rounded-[1.5rem] border border-sand-200 bg-white shadow-soft">
          <div className="relative min-h-[260px] lg:min-h-[400px]">
            <img
              src={featured.photo}
              alt={`${featured.event} by JannaSpice`}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12 bg-spice-900 text-white">
            <StarRating rating={featured.rating} size="lg" />
            <blockquote className="mt-5 font-serif text-2xl sm:text-[1.65rem] leading-snug font-medium">
              &ldquo;{featured.quote}&rdquo;
            </blockquote>
            <div className="mt-8 pt-6 border-t border-white/15">
              <ReviewerMeta item={featured} light />
            </div>
          </div>
        </article>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {rest.map((item) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-soft hover:shadow-float transition-shadow duration-300"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={item.photo}
                  alt={item.event}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute top-3 left-3 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 shadow-sm">
                  <StarRating rating={item.rating} />
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-spice-900/75 leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
                <div className="mt-5 pt-4 border-t border-sand-100">
                  <ReviewerMeta item={item} />
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-[1.5rem] border border-spice-200 bg-white px-6 py-10 sm:px-10 sm:py-12 text-center shadow-soft">
          <h3 className="font-serif text-3xl sm:text-4xl font-bold text-spice-900">
            Ready for your own story?
          </h3>
          <p className="mt-3 text-spice-900/60 max-w-lg mx-auto">
            Check a date, pick a package, and let Jhoanna&apos;s team take care of the rest.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" onClick={onBook} className="btn-primary">
              Start booking
            </button>
            <button type="button" onClick={onViewPackages} className="btn-secondary">
              View packages
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
