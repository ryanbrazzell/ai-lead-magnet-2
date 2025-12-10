/**
 * SocialProofSection Component
 * Navy section with testimonial cards
 * Matches lead-magnet-reference.html exactly
 */

"use client";

const testimonials = [
  // First video as requested: UwRgUWERxG0
  {
    type: 'video',
    id: 'UwRgUWERxG0',
    name: "Founder Testimonial",
    title: "CEO's Time Management Breakthrough",
  },
  {
    type: 'text',
    text: "My company has grown and is thriving, thanks to the support and amazingness of Anne. She allows me to be in my zone of genius.",
    name: "Keri Ford",
    title: "Founder, The 1% Woman Coach",
    initials: "KF",
  },
  {
    type: 'video',
    id: 'HaWelasucoc',
    name: "Founder Testimonial",
    title: "Success Story",
  },
  {
    type: 'text',
    text: "Just a couple of weeks into it and Aileen is making a massive difference to my workday. Managing to get so much more done!",
    name: "David Horner",
    title: "CFO, Auckland Flying School",
    initials: "DH",
  },
  {
    type: 'video',
    id: 'mihr9kJ57gI',
    name: "Founder Testimonial",
    title: "Time Freedom Story",
  },
  {
    type: 'text',
    text: "I honestly couldn't imagine my life without Maria. Her level of excellence is always on point.",
    name: "Jake Kauffman",
    title: "Founder, JKC",
    initials: "JK",
  },
  {
    type: 'video',
    id: 'DVZfF43-56Q',
    name: "Founder Testimonial",
    title: "Business Growth Story",
  },
  {
    type: 'text',
    text: "She really cares. She made some great SOP's which we didn't even ask her to!",
    name: "Mitch Swersky",
    title: "Co-founder, NSBA Group",
    initials: "MS",
  },
  {
    type: 'video',
    id: '1ZOZpGxpE5w',
    name: "Founder Testimonial",
    title: "Success Story",
  },
  {
    type: 'video',
    id: 'KcIeDkeTC68',
    name: "Founder Testimonial",
    title: "EA Impact Story",
  },
  {
    type: 'video',
    id: 'GMDKJsER37Q',
    name: "Founder Testimonial",
    title: "Founder Testimonial",
  },
  {
    type: 'video',
    id: 'KRruN3ojW-4',
    name: "Founder Testimonial",
    title: "Founder Testimonial",
  },
  {
    type: 'video',
    id: 'WzCb8ow2g3w',
    name: "Founder Testimonial",
    title: "Founder Testimonial",
  },
];

export function SocialProofSection() {
  return (
    <section
      style={{
        background: '#0f172a',
        padding: '48px 0',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
              display: 'inline-block',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              padding: '8px 16px',
              borderRadius: '50px',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '16px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            ✓ 1,300+ Founders Helped
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif',
              fontSize: 'clamp(24px, 6vw, 32px)',
              color: 'white',
            }}
          >
            They got their time back and scaled their business. You can too.
          </h2>
        </div>

        {/* Testimonials Grid - Mixed Text and Video */}
        <div
          className="testimonials-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
          }}
        >
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              style={{
                background: '#1e293b',
                borderRadius: '12px',
                padding: testimonial.type === 'video' ? '0' : '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
              }}
            >
              {testimonial.type === 'video' ? (
                <div
                  style={{
                    position: 'relative',
                    paddingBottom: '56.25%', // 16:9 aspect ratio
                    height: 0,
                    overflow: 'hidden',
                  }}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${testimonial.id}?modestbranding=1&rel=0&showinfo=0`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`${testimonial.name} Testimonial`}
                  />
                </div>
              ) : (
                <>
                  <p
                    className="testimonial-text"
                    style={{
                      fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                      color: '#e2e8f0',
                      fontSize: '15px',
                      fontStyle: 'italic',
                      marginBottom: '16px',
                    }}
                  >
                    &quot;{testimonial.text}&quot;
                  </p>
                  <div
                    className="testimonial-author"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      className="testimonial-avatar"
                      style={{
                        fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        color: '#0f172a',
                        fontSize: '14px',
                      }}
                    >
                      {testimonial.initials}
                    </div>
                    <div>
                      <div
                        className="testimonial-name"
                        style={{
                          fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '14px',
                        }}
                      >
                        {testimonial.name}
                      </div>
                      <div
                        className="testimonial-title"
                        style={{
                          fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
                          color: '#94a3b8',
                          fontSize: '12px',
                        }}
                      >
                        {testimonial.title}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 600px) {
          .testimonials-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
