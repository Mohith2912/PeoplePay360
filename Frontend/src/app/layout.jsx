import "./globals.css";

export const metadata = {
  title: "PeoplePay360 - Integrated HR & Payroll Operations",
  description:
    "End-to-end workforce operations connecting employee records, contracts, attendance, leave, salary rules, payruns, and payslips.",
};

export const viewport = {
  themeColor: "#050914",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#050914] text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
