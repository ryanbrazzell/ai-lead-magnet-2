"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function IclosedRedirectPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Schedule", {
        content_name: "EA Discovery Call",
        content_category: "Call Booking",
      });
    }

    params.set("pixel_fired", "1");
    const redirectUrl = params.toString()
      ? `/thank-you?${params.toString()}`
      : "/thank-you";
    window.location.replace(redirectUrl);
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Redirecting...</h1>
        <p className="mt-2 text-gray-600">
          Taking you to your confirmation page now.
        </p>
      </div>
    </main>
  );
}
