export const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];

export const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
export const DAYS_SHORT = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];

export const SUBJECT_COLORS = [
  { bg: '#FF6B6B', text: '#fff' }, { bg: '#4ECDC4', text: '#fff' },
  { bg: '#45B7D1', text: '#fff' }, { bg: '#96CEB4', text: '#fff' },
  { bg: '#FFEAA7', text: '#7B6800' }, { bg: '#DDA0DD', text: '#fff' },
  { bg: '#F0A500', text: '#fff' }, { bg: '#6C5CE7', text: '#fff' },
  { bg: '#E84393', text: '#fff' }, { bg: '#00B894', text: '#fff' },
];

export function generateId() { return Math.random().toString(36).substr(2, 9); }

// ฟังก์ชันคำนวณสีตัวอักษรให้ตัดกับสีพื้นหลัง (ดำ/ขาว)
export function getContrastYIQ(hexcolor) {
  let hex = hexcolor.replace("#", "");
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#1a1a3a' : '#ffffff';
}

export const SAMPLE_DATA = [];