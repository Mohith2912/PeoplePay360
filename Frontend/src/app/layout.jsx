import "./globals.css";

export const metadata = {
  title: "PeoplePay360 - Integrated HR & Payroll Operations",
  description:
    "End-to-end workforce operations connecting employee records, contracts, attendance, leave, salary rules, payruns, and payslips.",
};

export const viewport = {
  themeColor: "#f4f7fb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
