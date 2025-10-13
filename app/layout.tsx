export const metadata = {
  title: "Restaurant Booking Manager",
  description: "Prototype UI for restaurant booking management",
};

import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
