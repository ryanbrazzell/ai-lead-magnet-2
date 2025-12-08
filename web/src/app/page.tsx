/**
 * Root Page - Main Form Multi-Step Progressive Disclosure
 */

import { PageLayout } from '@/components/layout/page-layout';
import { HeroSection } from '@/components/layout/hero-section';
import { FormLayout } from '@/components/layout/form-layout';
import { MultiStepForm } from '@/components/form/multi-step-form';
import { VideoTestimonials } from '@/components/social-proof/video-testimonials';

export default function Home() {
  return (
    <PageLayout logo="/assistant-launch-logo.png" logoHref="https://www.assistantlaunch.com">
      {/* Persistent Hero Section with product mockup image */}
      <HeroSection
        headline={
          <>
            If you don&apos;t have an executive assistant, <strong>you ARE the executive assistant.</strong>
          </>
        }
        subheadline="Get your free personalized EA Time Freedom Report in under 30 seconds."
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

      {/* Video Testimonials Section */}
      <VideoTestimonials />
    </PageLayout>
  );
}
