import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { menuCategoryMeta } from '../../data/data.js';
import { Field, ModalHeader, ModalShell } from '../ui/index.jsx';

export default function CatalogModal() {
  const { catalogModal, closeCatalogModal, packages, menuItems, savePackage, saveMenuItem } = useApp();
  const [tab, setTab] = useState('packages');
  const [pkgDrafts, setPkgDrafts] = useState({});
  const [newDish, setNewDish] = useState({ category: 'chicken', name: '', img: '', cat: '' });

  const grouped = useMemo(() => {
    const map = { chicken: [], beefPork: [], fishSeafood: [], veg: [], pasta: [] };
    (menuItems || []).forEach((item) => {
      if (map[item.category]) map[item.category].push(item);
    });
    return map;
  }, [menuItems]);

  if (!catalogModal.open) return null;

  function draftFor(pkg) {
    return pkgDrafts[pkg.id] || {
      name: pkg.name,
      pax: pkg.pax,
      price: pkg.price,
      desc: pkg.desc,
      isActive: pkg.isActive !== false
    };
  }

  async function savePkg(pkg) {
    const draft = draftFor(pkg);
    await savePackage({
      id: pkg.id,
      type: pkg.type,
      name: draft.name,
      pax: Number(draft.pax),
      price: Number(draft.price),
      desc: draft.desc,
      isActive: draft.isActive
    });
  }

  return (
    <ModalShell open onClose={closeCatalogModal} size="xl" labelledBy="catalog-title" flush>
      <ModalHeader id="catalog-title" title="Catalog & prices" subtitle="Update package prices and menu dishes shown on the site." onClose={closeCatalogModal} />
      <div className="px-6 pt-4 flex gap-1 bg-sand-50 border-b border-sand-200">
        <button type="button" onClick={() => setTab('packages')} className={`ui-tab mb-3 ${tab === 'packages' ? 'ui-tab-active' : 'ui-tab-idle'}`}>Packages</button>
        <button type="button" onClick={() => setTab('menu')} className={`ui-tab mb-3 ${tab === 'menu' ? 'ui-tab-active' : 'ui-tab-idle'}`}>Menu dishes</button>
      </div>
      <div className="p-6 overflow-y-auto space-y-4">
        {tab === 'packages' && packages.map((pkg) => {
          const draft = draftFor(pkg);
          return (
            <div key={pkg.id} className="surface-card p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-spice-500">{pkg.type}</span>
                <label className="text-xs font-medium flex items-center gap-2">
                  <input type="checkbox" checked={draft.isActive} onChange={(e) => setPkgDrafts((d) => ({ ...d, [pkg.id]: { ...draft, isActive: e.target.checked } }))} />
                  Active
                </label>
              </div>
              <Field label="Name">
                <input className="input-modern" value={draft.name} onChange={(e) => setPkgDrafts((d) => ({ ...d, [pkg.id]: { ...draft, name: e.target.value } }))} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pax">
                  <input type="number" min="1" className="input-modern" value={draft.pax} onChange={(e) => setPkgDrafts((d) => ({ ...d, [pkg.id]: { ...draft, pax: e.target.value } }))} />
                </Field>
                <Field label="Price">
                  <input type="number" min="0" className="input-modern" value={draft.price} onChange={(e) => setPkgDrafts((d) => ({ ...d, [pkg.id]: { ...draft, price: e.target.value } }))} />
                </Field>
              </div>
              <Field label="Description">
                <textarea className="input-modern min-h-[72px]" value={draft.desc} onChange={(e) => setPkgDrafts((d) => ({ ...d, [pkg.id]: { ...draft, desc: e.target.value } }))} />
              </Field>
              <button type="button" onClick={() => savePkg(pkg)} className="btn-primary btn-sm">Save package</button>
            </div>
          );
        })}

        {tab === 'menu' && (
          <>
            <div className="border border-dashed border-sand-300 rounded-2xl p-4 space-y-3">
              <h4 className="font-semibold text-sm text-spice-900">Add dish</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Category">
                  <select className="input-modern" value={newDish.category} onChange={(e) => setNewDish((d) => ({ ...d, category: e.target.value }))}>
                    {menuCategoryMeta.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </Field>
                <Field label="Dish name">
                  <input className="input-modern" placeholder="Dish name" value={newDish.name} onChange={(e) => setNewDish((d) => ({ ...d, name: e.target.value }))} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Image URL">
                    <input className="input-modern" placeholder="https://" value={newDish.img} onChange={(e) => setNewDish((d) => ({ ...d, img: e.target.value }))} />
                  </Field>
                </div>
              </div>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={async () => {
                  if (!newDish.name.trim()) return;
                  await saveMenuItem({ ...newDish, isActive: true, sortOrder: 99 });
                  setNewDish({ category: newDish.category, name: '', img: '', cat: '' });
                }}
              >
                Add dish
              </button>
            </div>
            {menuCategoryMeta.map((cat) => (
              <div key={cat.key} className="space-y-2">
                <h4 className="text-sm font-semibold text-spice-900">{cat.label}</h4>
                {(grouped[cat.key] || []).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 surface-card p-3">
                    <img src={item.img} alt="" className="w-12 h-12 rounded-lg object-cover bg-sand-100" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-spice-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-spice-900/50 truncate">{item.img}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveMenuItem({ ...item, isActive: !item.isActive })}
                      className={`btn-sm ${item.isActive ? 'btn-secondary' : 'btn-ghost'}`}
                    >
                      {item.isActive ? 'Active' : 'Hidden'}
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </ModalShell>
  );
}
