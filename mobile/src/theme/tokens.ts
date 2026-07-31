export const colors = {
  // Arka plan gradienti — Mavi'den türetilmiş koyu tonlar
  bg1: '#171F3D',
  bg2: '#262F59', // Kurumsal Mavi
  bg3: '#10142A',

  // Birincil vurgu (CTA, aktif sekme, linkler)
  accent: '#12A7CD',      // Turkuaz
  accentSoft: '#5CC3E0',  // Turkuaz'ın açık türevi (gradient buton için)

  // Durum rengi üçlüsü (rozetler)
  pending: '#B99C71',   // Gold
  submitted: '#12A7CD', // Turkuaz
  overdue: '#EF7F1A',   // Turuncu

  // Nötr
  navy: '#262F59',
  gray: '#727271',

  ink: '#F5F3FA',
  inkDim: 'rgba(245,243,250,0.65)',
  glassBg: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.14)',
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 18,
  xl: 20,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const fonts = {
  // AvertaStd (logo font) yerine geçici — Poppins
  headingBold: 'Poppins_700Bold',
  headingSemibold: 'Poppins_600SemiBold',
  // Causten (yardımcı font) yerine geçici — Manrope
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemibold: 'Manrope_600SemiBold',
} as const;
