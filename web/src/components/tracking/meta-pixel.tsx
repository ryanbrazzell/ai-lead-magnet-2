'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function MetaPixel() {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize Facebook Pixel
    if (typeof window !== 'undefined' && !(window as any).fbq) {
      const f = window as any;
      const b = document;
      const e = 'script';
      const v = 'https://connect.facebook.net/en_US/fbevents.js';
      let n: any;
      let t: any;
      let s: any;
      
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);

      (window as any).fbq('init', '985637426985663');
    }
  }, []);

  useEffect(() => {
    // Track page views on route change
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView');
    }
  }, [pathname]);

  return (
    <>
      {/* Fallback noscript image */}
      <noscript>
        <img 
          height="1" 
          width="1" 
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=985637426985663&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
    </>
  );
}

