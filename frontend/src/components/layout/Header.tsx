import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, BookOpen, GraduationCap, ChevronDown, Sparkles, Calculator, Plane, FileText, Shield, Sun, Moon, Compass } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { profileApi } from '../../api/profile';
import { countries } from '../../data/countries';
import Button from '../ui/Button';
import { NotificationBell } from '../notifications';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch user profile to get nationality
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    enabled: isAuthenticated,
    retry: false,
  });

  // Determine country slug and name from nationality
  const countryData = profile?.nationality
    ? countries.find(c =>
      c.name.toLowerCase() === profile.nationality!.toLowerCase() ||
      c.slug.toLowerCase() === profile.nationality!.toLowerCase()
    )
    : null;

  const countrySlug = countryData?.slug;
  const countryName = countryData?.name;
  const countryFlag = countryData?.flag;

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  const toolsDropdownAuth = [
    { name: 'Survival Guides', href: '/tools/survival-guides', icon: <Compass className="w-4 h-4" /> },
    { name: 'Cost of Living', href: '/costofliving', icon: <Calculator className="w-4 h-4" /> },
    { name: 'German Grade Calculator', href: '/german-grade-calculator', icon: <GraduationCap className="w-4 h-4" /> },
    { name: 'Visa Guide', href: '/visa-guide', icon: <Plane className="w-4 h-4" /> },
    { name: 'SOP Generator', href: '/tools/sop-generator', icon: <Sparkles className="w-4 h-4" /> },
    { name: 'CV Generator', href: '/tools/cv-generator', icon: <FileText className="w-4 h-4" /> },
  ];

  // The UI from the screenshot for guests is cleaner, using specific names
  const toolsDropdownGuest = [
    { name: 'Survival Guides', href: '/tools/survival-guides', icon: <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
    { name: 'Grade Calculator', href: '/german-grade-calculator', icon: <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
    { name: 'Cost of Living', href: '/costofliving', icon: <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
    { name: 'Visa Guide', href: '/visa-guide', icon: <Plane className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
    { name: 'SOP Generator', href: '/tools/sop-generator', icon: <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
    { name: 'CV Generator', href: '/tools/cv-generator', icon: <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
  ];

  const toolsDropdown = isAuthenticated ? toolsDropdownAuth : toolsDropdownGuest;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', auth: true },
    { name: 'Universities', href: '/universities' },
    { name: 'Programs', href: '/programs' },
    { name: 'Scholarships', href: '/scholarships' },
    { name: 'AI Recommendations', href: '/recommendations', auth: true, highlight: true },
    { name: 'Community', href: '/community' },
    { name: 'Applications', href: '/applications', auth: true },
    { name: 'Tools', href: '#', isDropdown: true },
  ];

  const isActive = (path: string) => location.pathname.toLowerCase() === path.toLowerCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-surface-900/95 backdrop-blur-lg border-b border-surface-100 dark:border-surface-800 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-surface-900 dark:text-white hidden sm:block">
              Uni<span className="text-primary-600">Advisor</span>
            </span>
          </Link>

          {/* Desktop Navigation - Centered with overflow protection */}
          <nav className="hidden lg:flex items-center justify-center flex-1 min-w-0 mx-2">
            <div className="flex items-center bg-surface-50/80 dark:bg-surface-800/80 rounded-xl p-1 max-w-full">
              {navigation.map((item) => {
                if (item.auth && !isAuthenticated) return null;
                const isHighlight = item.highlight;

                // Handle Tools dropdown separately
                if (item.isDropdown) {
                  const isToolsActive = toolsDropdown.some(t => location.pathname.toLowerCase() === t.href.toLowerCase());
                  return (
                    <div
                      key={item.name}
                      className="relative shrink-0"
                      onMouseEnter={() => setIsToolsOpen(true)}
                      onMouseLeave={() => setIsToolsOpen(false)}
                    >
                      <button
                        className={clsx(
                          'px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 flex items-center gap-1 whitespace-nowrap',
                          isToolsActive
                            ? 'bg-white dark:bg-surface-700 text-primary-700 dark:text-primary-400 shadow-sm'
                            : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-surface-700/60'
                        )}
                      >
                        {item.name}
                        <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform', isToolsOpen && 'rotate-180')} />
                      </button>

                      {isToolsOpen && (
                        <div className="absolute top-full left-0 pt-2 w-48 z-50">
                          <div className="bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-surface-100 dark:border-surface-700 py-2 animate-slide-down">
                            {toolsDropdown.map((tool) => (
                              <Link
                                key={tool.name}
                                to={tool.href}
                                className={clsx(
                                  'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                                  location.pathname.toLowerCase() === tool.href.toLowerCase()
                                    ? 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 font-medium'
                                    : 'text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700'
                                )}
                              >
                                {tool.icon}
                                {tool.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={clsx(
                      'px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 flex items-center gap-1 whitespace-nowrap',
                      isActive(item.href)
                        ? isHighlight
                          ? 'bg-gradient-to-r from-primary-600 to-blue-500 text-white shadow-md shadow-primary-500/30'
                          : 'bg-white dark:bg-surface-700 text-primary-700 dark:text-primary-400 shadow-sm'
                        : isHighlight
                          ? 'bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/30 dark:to-blue-900/30 text-primary-700 dark:text-primary-400 hover:from-primary-100 hover:to-blue-100'
                          : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-surface-700/60'
                    )}
                  >
                    {isHighlight && <Sparkles className="w-3.5 h-3.5" />}
                    {item.name}
                  </Link>
                );
              })}

              {/* Dynamic Country Tab */}
              {isAuthenticated && countrySlug && (
                <Link
                  to={`/study-in-germany/from/${countrySlug}`}
                  className={clsx(
                    'px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 flex items-center gap-1 whitespace-nowrap',
                    isActive(`/study-in-germany/from/${countrySlug}`)
                      ? 'bg-white dark:bg-surface-700 text-primary-700 dark:text-primary-400 shadow-sm'
                      : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-surface-700/60'
                  )}
                >
                  <span className="text-base leading-none">{countryFlag}</span>
                  From {countryName}
                </Link>
              )}
            </div>
          </nav>

          {/* Right side - ensure it never gets pushed off screen */}
          <div className="flex items-center gap-2 shrink-0">
            {isAuthenticated ? (
              <>
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-600 dark:text-surface-400"
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Notification Bell */}
                <NotificationBell />

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center p-1.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                  </button>

                  {isProfileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsProfileOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-surface-800 shadow-lg border border-surface-100 dark:border-surface-700 py-2 z-20 animate-slide-down"
                        style={{ right: 0, minWidth: '14rem', maxWidth: 'calc(100vw - 2rem)' }}
                      >
                        <div className="px-4 py-2 border-b border-surface-100 dark:border-surface-700">
                          <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{user?.full_name || user?.username}</p>
                          <p className="text-xs text-surface-500 dark:text-surface-400 truncate">{user?.email}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            to="/dashboard"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                          >
                            <BookOpen className="w-4 h-4" />
                            Dashboard
                          </Link>
                          <Link
                            to="/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                          >
                            <User className="w-4 h-4" />
                            My Profile
                          </Link>
                          <Link
                            to="/vault"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                          >
                            <Shield className="w-4 h-4" />
                            Vault
                          </Link>
                          {user?.role === 'admin' && (
                            <Link
                              to="/admin"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700"
                            >
                              <Settings className="w-4 h-4" />
                              Admin Panel
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-surface-100 dark:border-surface-700 pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                {/* Theme Toggle for guests */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-600 dark:text-surface-400"
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button onClick={() => navigate('/register')}>
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-700 dark:text-surface-300"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-surface-100 dark:border-surface-700 animate-slide-down bg-white dark:bg-surface-900">
            <nav className="flex flex-col gap-1">
              {navigation.map((item) => {
                if (item.auth && !isAuthenticated) return null;
                const isHighlight = item.highlight;

                // Handle Tools dropdown for mobile - show as an interactive accordion or clean section
                if (item.isDropdown) {
                  return (
                    <div key={item.name} className="flex flex-col gap-1 mt-1 mb-2">
                      <button
                        onClick={() => setIsToolsOpen(!isToolsOpen)}
                        className="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-surface-800"
                      >
                        <div className="flex items-center gap-2">
                          {item.name}
                        </div>
                        <ChevronDown className={clsx('w-4 h-4 transition-transform text-surface-400', isToolsOpen && 'rotate-180')} />
                      </button>

                      {isToolsOpen && (
                        <div className="flex flex-col gap-2 pl-2 mt-1 py-1 animate-fadeIn">
                          {toolsDropdown.map((tool) => (
                            <Link
                              key={tool.name}
                              to={tool.href}
                              onClick={() => { setIsMenuOpen(false); setIsToolsOpen(false); }}
                              className={clsx(
                                'px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-3',
                                isAuthenticated
                                  ? location.pathname.toLowerCase() === tool.href.toLowerCase()
                                    ? 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                                    : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-surface-800'
                                  : 'bg-primary-50/50 dark:bg-surface-800/50 text-surface-700 dark:text-surface-300 hover:bg-primary-50 hover:text-primary-700'
                              )}
                            >
                              <div className={clsx("flex items-center justify-center rounded-lg", isAuthenticated ? "" : "w-8 h-8 bg-white dark:bg-surface-700 shadow-sm")}>
                                {tool.icon}
                              </div>
                              {tool.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={clsx(
                      'px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2',
                      isActive(item.href)
                        ? isHighlight
                          ? 'bg-gradient-to-r from-primary-600 to-blue-500 text-white shadow-md'
                          : 'bg-primary-50 text-primary-700'
                        : isHighlight
                          ? 'bg-gradient-to-r from-primary-50 to-blue-50 text-primary-700'
                          : 'text-surface-600 hover:text-surface-900 hover:bg-surface-50'
                    )}
                  >
                    {isHighlight && <Sparkles className="w-4 h-4" />}
                    {item.name}
                  </Link>
                );
              })}

              {/* Mobile Dynamic Country Tab */}
              {isAuthenticated && countrySlug && (
                <Link
                  to={`/study-in-germany/from/${countrySlug}`}
                  onClick={() => setIsMenuOpen(false)}
                  className={clsx(
                    'px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2',
                    isActive(`/study-in-germany/from/${countrySlug}`)
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                      : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-surface-800'
                  )}
                >
                  <span className="text-lg leading-none">{countryFlag}</span>
                  From {countryName}
                </Link>
              )}

              {!isAuthenticated && (
                <div className="flex flex-col gap-2 pt-4 border-t border-surface-100 dark:border-surface-700 mt-4">
                  <Button variant="ghost" onClick={() => { navigate('/login'); setIsMenuOpen(false); }}>
                    Sign In
                  </Button>
                  <Button onClick={() => { navigate('/register'); setIsMenuOpen(false); }}>
                    Get Started
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}