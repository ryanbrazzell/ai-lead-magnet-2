"use client";

import * as React from "react";
import { Play, Quote, Users } from "lucide-react";

const featuredVideo = { id: "UwRgUWERxG0", title: "Founder Testimonial" };

const videos = [
  { id: "1ZOZpGxpE5w", title: "Founder Success Story" },
  { id: "dYhmB_ULiAg", title: "Quick Win" },
  { id: "mihr9kJ57gI", title: "Time Freedom" },
  { id: "DVZfF43-56Q", title: "Business Growth" },
  { id: "KcIeDkeTC68", title: "EA Impact Story" },
  { id: "GMDKJsER37Q", title: "Founder Testimonial" },
];

const testimonials = [
  {
    name: "Keri Ford",
    title: "Founder, The 1% Woman Coach",
    initials: "KF",
    quote:
      "I haven't touched my inbox in 3 weeks. Anne handles it all - I just get the highlights that actually matter.",
  },
  {
    name: "David Horner",
    title: "CFO, Auckland Flying School",
    initials: "DH",
    quote:
      "Went from 7 days a week grinding to focused work hours. Aileen runs my entire schedule - I just show up where I'm needed.",
  },
  {
    name: "Jake Kauffman",
    title: "Founder, JKC",
    initials: "JK",
    quote:
      "Took a 2-week vacation without touching my laptop. Maria kept everything running - clients didn't even notice I was gone.",
  },
  {
    name: "Mitch Swersky",
    title: "Co-founder, NSBA Group",
    initials: "MS",
    quote:
      "She proactively built SOPs we didn't even ask for. Now my team runs itself - I'm finally working ON the business, not IN it.",
  },
];

function VideoCard({ videoId, title }: { videoId: string; title: string }) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  return (
    <div className="group relative overflow-hidden rounded-[20px] border border-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(26,24,22,0.08)]">
      <div className="relative pb-[56.25%]">
        {isPlaying ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 flex h-full w-full items-center justify-center"
            aria-label={`Play ${title}`}
          >
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,24,22,0.18),rgba(26,24,22,0.38))]" />
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg transition-transform duration-300 group-hover:scale-105">
              <Play className="ml-1 h-6 w-6 text-[var(--color-accent)]" fill="currentColor" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

function TestimonialCard({ name, title, initials, quote }: (typeof testimonials)[0]) {
  return (
    <div className="rounded-[20px] border border-border bg-white p-6 shadow-sm">
      <Quote className="mb-4 h-8 w-8 text-[var(--color-accent)]/30" />
      <p className="mb-6 leading-relaxed text-[color:var(--color-secondary)]">{quote}</p>
      <div className="flex items-center gap-3 border-t border-border pt-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-[var(--color-dark-text)]">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">{name}</p>
          <p className="text-xs text-[color:var(--color-muted)]">{title}</p>
        </div>
      </div>
    </div>
  );
}

export function VideoTestimonials() {
  return (
    <section className="bg-[linear-gradient(180deg,rgba(43,122,120,0.06),transparent_30%),var(--color-bg)] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-light)] px-4 py-2 text-sm font-medium text-[var(--color-accent)]">
            <Users className="h-4 w-4" />
            1,300+ Founders Helped
          </div>
          <h2 className="mb-4 text-3xl font-semibold tracking-[-0.03em] text-primary md:text-4xl">
            Over 1,300 Founders Have Gotten 18+ Hours Back Every Week
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[color:var(--color-secondary)]">
            See how they stopped doing $15/hour tasks and started focusing on what actually grows their business.
          </p>
        </div>

        <div className="mx-auto mb-8 max-w-3xl">
          <VideoCard videoId={featuredVideo.id} title={featuredVideo.title} />
        </div>

        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <VideoCard key={video.id} videoId={video.id} title={video.title} />
          ))}
        </div>

        <div className="mb-10 text-center">
          <h3 className="text-2xl font-semibold tracking-[-0.02em] text-primary md:text-3xl">
            What Our Clients Say
          </h3>
        </div>

        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} {...testimonial} />
          ))}
        </div>

        <div className="mx-auto max-w-4xl rounded-[28px] border border-dark-border bg-dark-bg p-8 text-dark-text md:p-12">
          <div className="flex flex-col items-center gap-8 md:flex-row">
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-3xl font-semibold">
              RB
            </div>
            <div className="text-center md:text-left">
              <h3 className="mb-4 text-xl font-semibold text-white">From Our Founder</h3>
              <p className="mb-4 leading-relaxed text-dark-text/86">
                &ldquo;I built Assistant Launch 6 years ago as a founder, frustrated just like you with the pain of scaling and burnout from working on things in the business I didn&apos;t enjoy and wasn&apos;t good at. Today, we&apos;ve paired more founders and EAs than anywhere in the world and give them the most simple tools and systems to actually be successful in working with an EA at the highest level.&rdquo;
              </p>
              <p className="font-semibold text-white">- Ryan Brazzell, Founder</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
