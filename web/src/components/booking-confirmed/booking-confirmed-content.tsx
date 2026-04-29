"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ConfirmationShell } from "./confirmation-shell";

export function BookingConfirmedContent() {
  const searchParams = useSearchParams();
  const firstName = searchParams.get("first_name") || searchParams.get("firstName") || "";
  const email = searchParams.get("email") || "";
  const phone = React.useState(() =>
    typeof window === "undefined"
      ? ""
      : localStorage.getItem("assistantlaunch_phone") || ""
  )[0];

  React.useEffect(() => {
    const storedEmail = localStorage.getItem("assistantlaunch_email") || "";
    const storedLeadId = localStorage.getItem("assistantlaunch_leadId") || "";
    const leadEmail = email || storedEmail;

    const updateCloseCRM = async () => {
      try {
        if (storedLeadId || leadEmail) {
          await fetch("/api/close/mark-call-booked", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              leadId: storedLeadId,
              email: leadEmail,
            }),
          });
        }
      } catch (err) {
        console.error("Failed to update Close CRM:", err);
      }
    };

    updateCloseCRM();

    localStorage.removeItem("assistantlaunch_leadId");
    localStorage.removeItem("assistantlaunch_email");
    localStorage.removeItem("assistantlaunch_phone");
    localStorage.removeItem("assistantlaunch_fbc");
    localStorage.removeItem("assistantlaunch_fbp");
  }, [email]);

  return (
    <ConfirmationShell
      firstName={firstName}
      email={email}
      phone={phone}
      title="One More Step"
    />
  );
}
