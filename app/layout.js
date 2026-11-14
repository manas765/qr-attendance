import "./globals.css";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({ subsets: ["latin"], variable: "--font" });

export const metadata = {
  title: "QR Attendance",
  description: "Secure, rotating-QR attendance for classrooms",
};
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#f6f5f1" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} data-theme="light" suppressHydrationWarning>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}