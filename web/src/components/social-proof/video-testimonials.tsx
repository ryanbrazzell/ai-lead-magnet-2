/**
 * VideoTestimonials Component
 * Modern ShadCN-styled videos and testimonials section
 */

"use client";

import * as React from 'react';
import { Play, Quote, Users } from 'lucide-react';

// Featured video displayed prominently at top
const featuredVideo = { id: 'UwRgUWERxG0', title: 'Founder Testimonial' };

// Remaining videos in grid below
const videos = [
  { id: '1ZOZpGxpE5w', title: 'Founder Success Story' },
  { id: 'dYhmB_ULiAg', title: 'Quick Win' },
  { id: 'mihr9kJ57gI', title: 'Time Freedom' },
  { id: 'DVZfF43-56Q', title: 'Business Growth' },
  { id: 'KcIeDkeTC68', title: 'EA Impact Story' },
  { id: 'GMDKJsER37Q', title: 'Founder Testimonial' },
  { id: 'WzCb8ow2g3w', title: 'Founder Testimonial' },
  { id: 'KRruN3ojW-4', title: 'Founder Testimonial' },
];

const testimonials = [
  {
    name: 'Keri Ford',
    title: 'Founder, The 1% Woman Coach',
    initials: 'KF',
    quote: "My company has grown, and is thriving, thanks to the support and amazingness of Anne. I really don't know what I would do without her. She allows me to be in my zone of genius to create the vision, team, and servitude that I have always dreamed of.",
  },
  {
    name: 'David Horner',
    title: 'CFO, Auckland Flying School',
    initials: 'DH',
    quote: "Just a couple of weeks into it and Aileen is making a massive difference to my workday. Managing to get so much more done!",
  },
  {
    name: 'Jake Kauffman',
    title: 'Founder, JKC',
    initials: 'JK',
    quote: "I honestly couldn't imagine my life without Maria. Her level of excellence is always on point.",
  },
  {
    name: 'Mitch Swersky',
    title: 'Co-founder, NSBA Group',
    initials: 'MS',
    quote: "She really cares. She made some great SOP's which we didn't even ask her to!",
  },
];

function VideoCard({ videoId, title }: { videoId: string; title: string }) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
      <div className="relative pb-[56.25%] bg-gray-900">
        {isPlaying ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer"
            aria-label={`Play ${title}`}
          >
            {/* Thumbnail */}
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                // Fallback to hqdefault if maxres not available
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              }}
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
            {/* Play button */}
            <div className="relative z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Play className="w-6 h-6 text-primary ml-1" fill="currentColor" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

function TestimonialCard({ name, title, initials, quote }: typeof testimonials[0]) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300">
      <Quote className="w-8 h-8 text-primary/20 mb-4" />
      <p className="text-gray-700 leading-relaxed mb-6">
        {quote}
      </p>
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-violet-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{name}</p>
          <p className="text-gray-500 text-xs">{title}</p>
        </div>
      </div>
    </div>
  );
}

export function VideoTestimonials() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            1,300+ Founders Helped
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-serif">
            Over 1,300 Founders Have Gotten 18+ Hours Back Every Week
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            See how they stopped doing $15/hour tasks and started focusing on what actually grows their business
          </p>
        </div>

        {/* Featured Video - Full Width */}
        <div className="max-w-3xl mx-auto mb-8">
          <VideoCard videoId={featuredVideo.id} title={featuredVideo.title} />
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {videos.map((video) => (
            <VideoCard key={video.id} videoId={video.id} title={video.title} />
          ))}
        </div>

        {/* Testimonials Header */}
        <div className="text-center mb-10">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
            What Our Clients Say
          </h3>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} {...testimonial} />
          ))}
        </div>

        {/* Founder Message */}
        <div className="bg-gradient-to-br from-primary to-violet-700 text-white rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold">RB</span>
              </div>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-4">From Our Founder</h3>
              <p className="text-white/90 leading-relaxed mb-4">
                "I built Assistant Launch 6 years ago as a founder, frustrated just like you with the pain of scaling and burnout from working on things in the business I didn't enjoy and wasn't good at. Today, we've paired more founders and EAs than anywhere in the world and give them the most simple tools and systems to actually be successful in working with an EA at the highest level."
              </p>
              <p className="font-semibold">— Ryan Brazzell, Founder</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
