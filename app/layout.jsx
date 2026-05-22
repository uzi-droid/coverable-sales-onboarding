import "./globals.css";

export const metadata = {
  title: "Coverable Sales Command",
  description: "Sales onboarding, CRM, and competition for Coverable reps"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
