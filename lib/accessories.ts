export const accessoryCategories = ['أطواق', 'أقراط', 'خواتم', 'أساور', 'خلاخل'] as const;

export const accessoryCategorySlugs: Record<string, string> = {
  'أطواق': 'atawq',
  'أقراط': 'aqrat',
  'خواتم': 'khwatim',
  'أساور': 'asawer',
  'خلاخل': 'khalakhel',
};

export function accessoryCategorySlug(value?: string | null) {
  return accessoryCategorySlugs[normalizeAccessoryCategory(value)] || encodeURIComponent(normalizeAccessoryCategory(value).toLowerCase().replace(/\s+/g, '-'));
}

export function accessoryCategoryFromSlug(slug: string) {
  return Object.entries(accessoryCategorySlugs).find(([, value]) => value === slug)?.[0] || normalizeAccessoryCategory(decodeURIComponent(slug));
}

export function normalizeAccessoryCategory(value?: string | null) {
  const category = (value || '').trim();
  const aliases: Record<string, string> = {
    'طواق': 'أطواق',
    necklaces: 'أطواق',
    necklace: 'أطواق',
    earrings: 'أقراط',
    earring: 'أقراط',
    rings: 'خواتم',
    ring: 'خواتم',
    bracelets: 'أساور',
    bracelet: 'أساور',
    anklets: 'خلاخل',
    anklet: 'خلاخل',
  };
  return aliases[category.toLowerCase()] || category;
}
