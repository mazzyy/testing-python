import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  showFooter?: boolean;
}

export default function Layout({ showFooter = true }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 transition-colors duration-200">
      <Header />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
