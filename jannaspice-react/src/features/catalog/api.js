import { supabase } from '../../lib/supabase/client.js';
import { getErrorMessage } from '../../lib/supabase/errors.js';
import { packages as fallbackPackages, menuOptions as fallbackMenu } from '../../data/data.js';

function mapPackage(row) {
  return {
    id: Number(row.id),
    type: row.type,
    name: row.name,
    pax: Number(row.pax),
    price: Number(row.price),
    desc: row.desc || row.description || '',
    isActive: row.isActive ?? row.is_active ?? true
  };
}

function mapMenuItem(row) {
  return {
    id: Number(row.id),
    category: row.category,
    name: row.name,
    cat: row.subcategory || row.cat || null,
    img: row.imageUrl || row.image_url || '',
    sortOrder: row.sortOrder ?? row.sort_order ?? 0,
    isActive: row.isActive ?? row.is_active ?? true
  };
}

function groupMenu(items) {
  const grouped = { chicken: [], beefPork: [], fishSeafood: [], veg: [], pasta: [] };
  items.forEach((item) => {
    if (grouped[item.category]) grouped[item.category].push(item);
  });
  return grouped;
}

export function fallbackCatalog() {
  return {
    packages: fallbackPackages.map((p) => ({ ...p, isActive: true })),
    menuItems: Object.entries(fallbackMenu).flatMap(([category, items]) =>
      items.map((item, index) => ({
        id: null,
        category,
        name: item.name,
        cat: item.cat || null,
        img: item.img,
        sortOrder: index + 1,
        isActive: true
      }))
    ),
    menuOptions: fallbackMenu
  };
}

export async function listCatalog({ includeInactive = false } = {}) {
  let pkgQuery = supabase.from('packages').select('*').order('id');
  let menuQuery = supabase.from('menu_items').select('*').order('sort_order').order('id');
  if (!includeInactive) {
    pkgQuery = pkgQuery.eq('is_active', true);
    menuQuery = menuQuery.eq('is_active', true);
  }

  const [pkgRes, menuRes] = await Promise.all([pkgQuery, menuQuery]);
  if (pkgRes.error || menuRes.error) {
    throw new Error(getErrorMessage(pkgRes.error || menuRes.error, 'Could not load catalog.'));
  }

  const packages = (pkgRes.data || []).map(mapPackage);
  const menuItems = (menuRes.data || []).map(mapMenuItem);
  return {
    packages,
    menuItems,
    menuOptions: groupMenu(menuItems)
  };
}

export async function upsertPackage(payload) {
  const { data, error } = await supabase.rpc('upsert_package', {
    p_id: payload.id ?? null,
    p_type: payload.type,
    p_name: payload.name,
    p_pax: Number(payload.pax),
    p_price: Number(payload.price),
    p_description: payload.desc || payload.description || '',
    p_is_active: payload.isActive !== false
  });
  if (error) throw new Error(getErrorMessage(error, 'Could not save package.'));
  return mapPackage(data);
}

export async function upsertMenuItem(payload) {
  const { data, error } = await supabase.rpc('upsert_menu_item', {
    p_id: payload.id ?? null,
    p_category: payload.category,
    p_name: payload.name,
    p_subcategory: payload.cat || payload.subcategory || null,
    p_image_url: payload.img || payload.imageUrl || '',
    p_sort_order: payload.sortOrder ?? 0,
    p_is_active: payload.isActive !== false
  });
  if (error) throw new Error(getErrorMessage(error, 'Could not save menu item.'));
  return mapMenuItem(data);
}
