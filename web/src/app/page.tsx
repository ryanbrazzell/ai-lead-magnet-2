/**
 * Root Page - Main Form Multi-Step Progressive Disclosure
 */

import { PageLayout } from '@/components/layout/page-layout';
import { HeroSection } from '@/components/layout/hero-section';
import { FormLayout } from '@/components/layout/form-layout';
import { MultiStepForm } from '@/components/form/multi-step-form';
import { VideoTestimonials } from '@/components/social-proof/video-testimonials';
import { BonusStack } from '@/components/bonus-stack';

export default function Home() {
  return (
    <PageLayout logo="/assistant-launch-logo.png" logoHref="https://www.assistantlaunch.com">
      {/* Persistent Hero Section with product mockup image */}
      <HeroSection
        headline={
          <>
            <span className="block">Founders Only:</span>
            <span className="block">Personalized Executive Assistant Time Freedom Report</span>
          </>
        }
        subheadline={
          <>
            Discover how to buy back over 520 hours of your time in 30 seconds.
            <span className="block mt-1" style={{ color: '#10b981', fontWeight: 700 }}>
              $99 Value — Now Free
            </span>
          </>
        }
        imageSrc="/product-mockup.webp"
        imageAlt="EA Time Freedom Report product mockup showing three screens: EA Workflow & Efficiency Hub dashboard, Executive Assistant Roadmap & Task List, and Client Onboarding Automation"
      />

      {/* Form Layout with Multi-Step Form */}
      <FormLayout
        speedPromise="Get Your Roadmap in Less than 30 Seconds"
        socialCount="Requested by over 35,000 Business Owners"
      >
        <MultiStepForm />
      </FormLayout>

      {/* Bonus Stack */}
      <BonusStack />

      {/* Video Testimonials Section */}
      <VideoTestimonials />
    </PageLayout>
  );
}
