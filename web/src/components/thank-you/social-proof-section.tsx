"use client";

import { Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    text: "I haven't touched my inbox in 3 weeks. Anne handles it all - I just get the highlights that actually matter.",
    name: "Keri Ford",
    title: "Founder, The 1% Woman Coach",
    initials: "KF",
  },
  {
    text: "Went from 7 days a week grinding to focused work hours. Aileen runs my entire schedule - I just show up where I'm needed.",
    name: "David Horner",
    title: "CFO, Auckland Flying School",
    initials: "DH",
  },
  {
    text: "Took a 2-week vacation without touching my laptop. Maria kept everything running - clients didn't even notice I was gone.",
    name: "Jake Kauffman",
    title: "Founder, JKC",
    initials: "JK",
  },
  {
    text: "She proactively built SOPs we didn't even ask for. Now my team runs itself - I'm finally working ON the business, not IN it.",
    name: "Mitch Swersky",
    title: "Co-founder, NSBA Group",
    initials: "MS",
  },
];

interface SocialProofSectionProps {
  onCTAClick?: () => void;
}

export function SocialProofSection({ onCTAClick }: SocialProofSectionProps) {
  return (
    <section className="bg-primary px-5 py-16 text-dark-text">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[rgba(232,244,243,0.7)]">
            Proof
          </p>
          <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
            What working with Assistant Launch actually looks like
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.name}
              className="rounded-[24px] border border-white/10 bg-white/8 p-6 backdrop-blur-sm"
            >
              <Quote className="mb-4 h-8 w-8 text-[var(--color-accent)]/50" />
              <p className="mb-6 leading-relaxed text-[rgba(250,250,247,0.84)]">
                &ldquo;{testimonial.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 border-t border-white/10 pt-4">
                <Avatar>
                  <AvatarFallback>{testimonial.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                  <p className="text-xs text-[rgba(250,250,247,0.62)]">{testimonial.title}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {onCTAClick && (
          <div className="mt-10 text-center">
            <Button onClick={onCTAClick} className="rounded-full px-8">
              Book Your EA Delegation Roadmap Call
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
