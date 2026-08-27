import { Link } from 'react-router-dom';
import { Heart, Mail } from 'lucide-react';
import Logo from '../common/Logo';

const linkGroups: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: 'Explore',
    links: [
      { label: 'Programs', to: '/programs' },
      { label: 'Universities', to: '/universities' },
      { label: 'Scholarships', to: '/scholarships' },
      { label: 'Cost of Living', to: '/cost-of-living' },
    ],
  },
  {
    title: 'Free Tools',
    links: [
      { label: 'SOP Generator', to: '/tools/sop-generator' },
      { label: 'CV Generator', to: '/tools/cv-generator' },
      { label: 'Grade Calculator', to: '/german-grade-calculator' },
      { label: 'Visa Guide', to: '/visa-guide' },
      { label: 'Survival Guides', to: '/tools/survival-guides' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Community', to: '/community' },
      { label: 'Privacy Policy', to: '/privacy-policy' },
      { label: 'Terms of Service', to: '/terms-of-service' },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface-50 dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2">
            <Logo to="/" idSuffix="footer" markClassName="w-10 h-10 rounded-xl" wordmarkClassName="text-xl" />
            <p className="mt-4 text-sm leading-relaxed text-surface-600 dark:text-surface-400 max-w-xs">
              Your AI advisor for studying in Germany — program matching, applications, documents
              and visa guidance in one place.
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 px-3 py-1.5 text-xs font-semibold text-primary-700 dark:text-primary-300">
              <Heart className="w-3.5 h-3.5" />
              100% free — no card, no trial, no paywall
            </span>
          </div>

          {/* Links */}
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">{group.title}</h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-surface-500 dark:text-surface-500">
            © {year} CampusConsult. Built for international students.
          </p>
          <a
            href="mailto:hello@campusconsult.app"
            className="inline-flex items-center gap-2 text-sm text-surface-500 dark:text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <Mail className="w-4 h-4" />
            hello@campusconsult.app
          </a>
        </div>
      </div>
    </footer>
  );
}
