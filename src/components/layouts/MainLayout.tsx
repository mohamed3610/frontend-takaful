import React from 'react';
import BackgroundPattern from '../chat/BackgroundPattern';
import Header from '../Header';
import Footer from '../Footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Organized Tailwind class groups
  const containerClasses = [
    "min-h-screen relative overflow-x-hidden flex flex-col",
    "bg-[linear-gradient(135deg,var(--deep)_0%,var(--navy)_100%)]",
    "text-[var(--text-dark)]"
  ].join(" ");

  const contentAreaClasses = [
    "flex-1 flex items-center justify-center w-full min-h-0",
    "max-w-none sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl",
    "mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4 md:py-6",
    "relative z-10"
  ].join(" ");

  return (
    <div className={containerClasses}>
      <BackgroundPattern />

      <div className="flex-shrink-0 relative z-10">
        <Header />
      </div>

      <div className={contentAreaClasses}>
        <div className="w-full h-full flex items-center justify-center">
          {children}
        </div>
      </div>

      <div className="flex-shrink-0 relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;