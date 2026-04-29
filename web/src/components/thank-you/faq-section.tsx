"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What's the difference between a VA and an EA?",
    answer:
      "VAs handle tasks you assign. EAs own outcomes. Our EAs are trained to think like operators, so they anticipate what needs to happen instead of waiting for instructions.",
  },
  {
    question: "How is this different from Upwork or hiring myself?",
    answer:
      "When you hire yourself, you're also training, managing, and fixing mistakes yourself. We handle vetting, training, and ongoing support so you are not rebuilding the role from scratch.",
  },
  {
    question: "I've tried VAs before and they didn't work out.",
    answer:
      "That is exactly why we exist. Most assistants fail because they lack systems and support. Our client success team oversees the relationship daily and helps expand your EA's scope over time.",
  },
  {
    question: "What if it doesn't work out?",
    answer:
      "Nobody gets to week 4 without being successful or we refund you. No contracts, cancel anytime, and our daily oversight means problems get solved before they grow.",
  },
  {
    question: "How long until I see results?",
    answer:
      "Most founders are delegating real work within the first week. By week 4, your EA owns email, calendar, and recurring processes so you can focus on what actually grows the business.",
  },
];

export function FAQSection() {
  return (
    <section className="bg-[var(--color-surface)] px-5 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Common questions
          </p>
          <h3 className="text-3xl font-semibold tracking-[-0.03em] text-primary md:text-4xl">
            Common Questions
          </h3>
        </div>

        <Accordion type="single" defaultValue="faq-0">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.question} value={`faq-${index}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
