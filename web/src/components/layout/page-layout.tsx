/**
 * PageLayout Component
 *
 * Task Group 5: PageLayout Component for Shared Layout Components
 *
 * A wrapper component that composes Header, main content area, and Footer
 * to provide consistent page structure across all form variants and pages.
 * Matches the acquisition.com/Hormozi conversion funnel aesthetic.
 *
 * Features:
 * - Composes Header + main content area + Footer
 * - White background on main content area (default)
 * - Flexbox column layout for proper stacking
 * - Min-height screen for viewport fill
 * - Optional props to hide Header or Footer
 * - Consistent max-width container (1280px) with horizontal padding
 *
 * @see /boundless-os/specs/2025-12-01-shared-layout/spec.md
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Header, type HeaderProps } from './header';
import { Footer, type FooterProps } from './footer';

export interface PageLayoutProps {
  /**
   * Page content to render in the main content area
   */
  children: React.ReactNode;

  /**
   * Whether to show the Header component (default: true)
   */
  showHeader?: boolean;

  /**
   * Whether to show the Footer component (default: true)
   */
  showFooter?: boolean;

  /**
   * Logo content passed to Header - can be React node or image src string
   */
  logo?: HeaderProps['logo'];

  /**
   * Optional href to make the logo clickable in Header
   */
  logoHref?: string;

  /**
   * Legal disclaimer text passed to Footer
   */
  footerDisclaimer?: FooterProps['disclaimer'];

  /**
   * Additional className to merge with wrapper styles
   */
  className?: string;
}

/**
 * PageLayout - Full page layout wrapper
 *
 * Composes Header, main content, and Footer into a consistent
 * page structure. Uses flexbox column layout to ensure the footer
 * stays at the bottom of the viewport even with minimal content.
 *
 * @example
 * // Default with all sections visible
 * <PageLayout>
 *   <HeroSection headline="Welcome" />
 *   <FormLayout>...</FormLayout>
 * </PageLayout>
 *
 * @example
 * // With custom logo and footer disclaimer
 * <PageLayout
 *   logo="/images/logo.png"
 *   logoHref="/"
 *   footerDisclaimer="Custom legal text here."
 * >
 *   <main content />
 * </PageLayout>
 *
 * @example
 * // Hide header for special pages
 * <PageLayout showHeader={false}>
 *   <SpecialContent />
 * </PageLayout>
 */
export function PageLayout({
  children,
  showHeader = true,
  showFooter = true,
  logo,
  logoHref,
  footerDisclaimer,
  className,
}: PageLayoutProps) {
  return (
    <div
      className={cn(
        'flex flex-col',
        'min-h-screen',
        className
      )}
    >
      {showHeader && <Header logo={logo} href={logoHref} />}

      <main
        className={cn(
          'flex-1',
          'bg-[radial-gradient(circle_at_top,rgba(43,122,120,0.08),transparent_32%),var(--color-bg)]',
          'py-4 md:py-12'
        )}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {showFooter && <Footer disclaimer={footerDisclaimer} />}
    </div>
  );
}

PageLayout.displayName = 'PageLayout';
