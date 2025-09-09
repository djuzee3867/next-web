// src/app/layout.js
export const metadata = {
  title: 'My QR Generator',   // ← ตรงนี้แก้ชื่อได้เลย
  description: 'Generate and customize QR codes easily',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
