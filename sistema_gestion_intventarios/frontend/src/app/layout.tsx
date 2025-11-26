import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Inventory Management System',
  description: 'Modern inventory management application'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        {/* Background decorative elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 -right-4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
        </div>
        
        <Navbar />
        
        <main className="flex-1 relative w-full flex flex-col items-center">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="mt-auto w-full border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-gray-600">
              © {new Date().getFullYear()} Inventory Management System. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
