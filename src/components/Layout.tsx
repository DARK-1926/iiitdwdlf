import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 animate-fadein rounded-xl shadow-lg mt-4 mb-4 bg-white/80 dark:bg-gray-900/80">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
