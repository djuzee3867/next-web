export const metadata = {
  title: 'ตารางเรียน',
  description: 'จัดตารางเรียน',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📅</text></svg>",
  },
};

export default function ScheduleLayout({ children }) {
  return <section>{children}</section>;
}