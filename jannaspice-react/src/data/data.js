export const CONFIG = { maxEventsPerDay: 2, reservationFeePct: 0.20, downpaymentPct: 0.30, prepLeadTimeDays: 7 };

export const packages = [
  { id: 1, type: 'rental', name: 'Equipment Rental Only', pax: 50, price: 10000, desc: 'Includes tables, chairs, basic backdrop, and complete catering equipment. Food NOT included.' },
  { id: 2, type: 'promo', name: 'Promo Package (50 Pax)', pax: 50, price: 30000, desc: 'Complete basic setup, equipment, waiters, and full menu for 50 guests.' },
  { id: 3, type: 'promo', name: 'Promo Package (75 Pax)', pax: 75, price: 38000, desc: 'Complete basic setup, equipment, waiters, and full menu for 75 guests.' },
  { id: 4, type: 'promo', name: 'Promo Package (100 Pax)', pax: 100, price: 46000, desc: 'Complete basic setup, equipment, waiters, and full menu for 100 guests.' }
];

export const rentalInclusions = [
  "Monoblocks chair with cover", "Ribbon", "Tables with cloth", "Table runner or topper",
  "Table napkin", "Table number", "Center pcs (artificial flowers)", "Utensils complete set",
  "Roll top chaffing dish", "Buffet lamp", "Skirted buffet with center pcs", "Gift table",
  "Souvenir stand", "Cake table", "Balloon set up"
];

export const menuOptions = {
  chicken: [
    { name: 'Fried chicken', img: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=400&q=80' },
    { name: 'Breaded chicken fillet', img: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=400&q=80' },
    { name: 'Cordon bleu', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80' },
    { name: 'Chicken caldereta', img: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=400&q=80' },
    { name: 'Afritada', img: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&q=80' },
    { name: 'Chicken pastel', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
    { name: 'Chicken lollipop', img: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=400&q=80' },
    { name: 'Hawaiian chicken', img: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=400&q=80' },
    { name: 'Chicken teriyaki', img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80' }
  ],
  beefPork: [
    { name: 'Beef with mushroom', cat: 'Beef', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80' },
    { name: 'Beef broccoli', cat: 'Beef', img: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=400&q=80' },
    { name: 'Caldereta (Beef/Pork)', cat: 'Beef/Pork', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80' },
    { name: 'Kare kare', cat: 'Beef', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80' },
    { name: 'Roast beef', cat: 'Beef', img: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=400&q=80' },
    { name: 'Breaded porkchop', cat: 'Pork', img: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=400&q=80' },
    { name: 'Hamonado', cat: 'Pork', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80' },
    { name: 'Lechon kawali', cat: 'Pork', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80' },
    { name: 'Special sisig', cat: 'Pork', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80' }
  ],
  fishSeafood: [
    { name: 'Breaded fish fillet', cat: 'Fish', img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80' },
    { name: 'Sweet & sour fillet', cat: 'Fish', img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80' },
    { name: 'Relyenong bangus', cat: 'Fish', img: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=400&q=80' },
    { name: 'Prawns in garlic', cat: 'Seafood', img: 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=800&q=80' },
    { name: 'Tempura', cat: 'Seafood', img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80' },
    { name: 'Calamares', cat: 'Seafood', img: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=400&q=80' }
  ],
  veg: [
    { name: 'Creamy mix vegetable', img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80' },
    { name: 'Chopsuey', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80' },
    { name: 'Vegetable tempura', img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80' },
    { name: 'Garden salad with dressing', img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80' }
  ],
  pasta: [
    { name: 'Spaghetti', img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400&q=80' },
    { name: 'Carbonara', img: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=400&q=80' },
    { name: 'Baked Macaroni', img: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=400&q=80' }
  ]
};

export const menuCategoryMeta = [
  { key: 'chicken', label: '1. Chicken Dish' },
  { key: 'beefPork', label: '2. Pork or Beef Dish' },
  { key: 'fishSeafood', label: '3. Fish or Seafood Dish' },
  { key: 'veg', label: '4. Vegetable Dish' },
  { key: 'pasta', label: '5. Pasta Dish' }
];
