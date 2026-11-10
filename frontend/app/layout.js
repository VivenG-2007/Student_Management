import './globals.css';

export const metadata = {
  title: 'Student & Attendance Management System',
  description: 'Role-based Student and Attendance Management Portal built with Next.js and Spring Boot',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

