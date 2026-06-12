export const getPastelTextColor = (hex: string) => {
  const map: Record<string, { light: string; dark: string }> = {
    '#e2e8f0': { light: '#475569', dark: '#cbd5e1' },
    '#fee2e2': { light: '#b91c1c', dark: '#fca5a5' },
    '#ffedd5': { light: '#c2410c', dark: '#fdba74' },
    '#fef3c7': { light: '#b45309', dark: '#fde047' },
    '#d1fae5': { light: '#047857', dark: '#6ee7b7' },
    '#dbeafe': { light: '#1d4ed8', dark: '#93c5fd' },
    '#f3e8ff': { light: '#6d28d9', dark: '#c084fc' },
    '#fce7f3': { light: '#be185d', dark: '#fbcfe8' }
  };
  const normalized = hex.toLowerCase();
  return map[normalized] || { light: '#374151', dark: '#d1d5db' };
};

export const getFieldColors = (baseColor: string) => {
  const map: Record<string, { bgLight: string; bgDark: string; textLight: string; textDark: string }> = {
    '#a2d2ff': { bgLight: '#a2d2ff25', bgDark: '#a2d2ff20', textLight: '#0055b3', textDark: '#a2d2ff' },
    '#bde0fe': { bgLight: '#bde0fe25', bgDark: '#bde0fe20', textLight: '#004488', textDark: '#bde0fe' },
    '#ffafcc': { bgLight: '#ffafcc25', bgDark: '#ffafcc20', textLight: '#c2185b', textDark: '#ffafcc' },
    '#cdb4db': { bgLight: '#cdb4db25', bgDark: '#cdb4db20', textLight: '#5e35b1', textDark: '#cdb4db' },
    '#ffc8dd': { bgLight: '#ffc8dd25', bgDark: '#ffc8dd20', textLight: '#ad1457', textDark: '#ffc8dd' },
    '#d8f3dc': { bgLight: '#d8f3dc25', bgDark: '#d8f3dc20', textLight: '#1b5e20', textDark: '#d8f3dc' },
    '#fcf6bd': { bgLight: '#fcf6bd35', bgDark: '#fcf6bd20', textLight: '#854d00', textDark: '#fcee3c' },
    '#ffdac1': { bgLight: '#ffdac125', bgDark: '#ffdac120', textLight: '#c2410c', textDark: '#ffdac1' },
  };
  const normalized = baseColor.toLowerCase();
  return map[normalized] || { bgLight: '#e2e8f0', bgDark: '#334155', textLight: '#475569', textDark: '#94a3b8' };
};
