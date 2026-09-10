export function BrandMark({ icon = 'fa-utensils', size = 'md', className = '' }) {
  const dim = size === 'sm' ? 'w-9 h-9 text-sm' : 'w-10 h-10 text-base';
  return (
    <div className={`bg-spice-500 text-white ${dim} rounded-full flex items-center justify-center shadow-md shrink-0 ${className}`}>
      <i className={`fa-solid ${icon}`}></i>
    </div>
  );
}

export function AppHeader({ icon, title, subtitle, children, onBrandClick, wide = false }) {
  const brandClass = 'flex items-center gap-3 min-w-0 text-left rounded-xl';
  const brand = (
    <>
      <BrandMark icon={icon} />
      <div className="min-w-0">
        <h1 className="font-serif font-bold text-[17px] leading-none text-spice-900 truncate">{title}</h1>
        {subtitle ? <p className="text-[11px] text-spice-900/50 mt-1 truncate">{subtitle}</p> : null}
      </div>
    </>
  );

  return (
    <header className="app-header">
      <div className={`app-header-inner ${wide ? '!max-w-none' : ''}`}>
        {onBrandClick ? (
          <button type="button" onClick={onBrandClick} className={`${brandClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spice-400`}>
            {brand}
          </button>
        ) : (
          <div className={brandClass}>{brand}</div>
        )}
        <div className="flex items-center justify-end gap-2 sm:gap-3 min-w-0 flex-1">{children}</div>
      </div>
    </header>
  );
}

export function IconButton({ onClick, label, icon = 'fa-xmark', className = '', variant = 'default' }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={`icon-btn ${variant === 'inverse' ? 'icon-btn-on-dark' : ''} ${className}`}>
      <i className={`fa-solid ${icon}`}></i>
    </button>
  );
}

const STATUS_LABEL = {
  Pending: 'Pending',
  Approved: 'Reserved',
  Reserved: 'Reserved',
  DownpaymentVerified: '50% Paid',
  FullyPaid: 'Fully Paid',
  Cancelled: 'Cancelled'
};

export function StatusBadge({ status }) {
  const tone = {
    Pending: 'badge-pending',
    Approved: 'badge-reserved',
    Reserved: 'badge-reserved',
    DownpaymentVerified: 'badge-down',
    FullyPaid: 'badge-paid',
    Cancelled: 'badge-cancelled'
  }[status] || 'badge-pending';

  return <span className={`status-badge ${tone}`}>{STATUS_LABEL[status] || status}</span>;
}

export function Banner({ tone = 'info', icon, children }) {
  return (
    <div className={`ui-banner ui-banner-${tone}`}>
      {icon ? <i className={`fa-solid ${icon} mt-0.5 shrink-0`}></i> : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <div>
      {label ? <label className="field-label">{label}</label> : null}
      {children}
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}

export function EmptyState({ icon = 'fa-regular fa-folder-open', title, body, action }) {
  return (
    <div className="empty-state flex flex-col items-center">
      <i className={`${icon} text-4xl text-spice-900/20 mb-3`}></i>
      {title ? <h3 className="text-lg font-serif font-bold text-spice-900 mb-1">{title}</h3> : null}
      {body ? <p className="text-sm text-spice-900/60 max-w-sm">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ModalHeader({ id, title, subtitle, onClose, align = 'left' }) {
  return (
    <div className={`ui-dialog-head ${align === 'center' ? 'text-center pr-6' : ''}`}>
      <h3 id={id} className="font-serif font-bold text-xl text-spice-900">{title}</h3>
      {subtitle ? <p className="text-sm text-spice-900/60 mt-1">{subtitle}</p> : null}
      {onClose ? <IconButton onClick={onClose} label="Close" className="dialog-close" /> : null}
    </div>
  );
}

export function ModalShell({ open, onClose, size = 'md', labelledBy, closeOnOverlay = true, children, className = '', layer = 'overlay', flush = false }) {
  if (!open) return null;
  const maxW = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-3xl' }[size] || 'max-w-md';

  return (
    <div
      className={`ui-overlay ${layer === 'alert' ? 'ui-overlay-alert' : ''}`}
      onClick={closeOnOverlay ? onClose : undefined}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`ui-dialog ${flush ? 'ui-dialog-flush' : ''} ${maxW} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
