/**
 * Design Token Showcase Component
 *
 * A test component that demonstrates all design tokens are accessible
 * through the defined utility classes. Used for visual verification
 * during development and testing.
 */

import React from 'react';

export function DesignTokenShowcase() {
  return (
    <div className="p-8 space-y-8 max-w-form mx-auto">
      <h1 className="text-question">EA Time Freedom Report Design System</h1>

      {/* Color Tokens */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Color Tokens</h2>

        <div className="grid grid-cols-3 gap-4">
          {/* Primary - Purple */}
          <div className="space-y-2">
            <div
              className="bg-primary h-16 rounded-input flex items-center justify-center"
              data-testid="bg-primary"
            >
              <span className="text-white">bg-primary</span>
            </div>
            <p className="text-primary text-sm" data-testid="text-primary">
              text-primary (#6F00FF)
            </p>
          </div>

          {/* Progress - Yellow */}
          <div className="space-y-2">
            <div
              className="bg-progress h-16 rounded-input flex items-center justify-center"
              data-testid="bg-progress"
            >
              <span className="text-black">bg-progress</span>
            </div>
            <p className="text-sm">progress (#FFFC8C)</p>
          </div>

          {/* Progress Disabled */}
          <div className="space-y-2">
            <div
              className="bg-progress-disabled h-16 rounded-input flex items-center justify-center"
              data-testid="bg-progress-disabled"
            >
              <span className="text-black">bg-progress-disabled</span>
            </div>
            <p className="text-sm">progress-disabled (#F9E57F)</p>
          </div>

          {/* Input Background */}
          <div className="space-y-2">
            <div
              className="bg-input-bg h-16 rounded-input flex items-center justify-center border"
              data-testid="bg-input-bg"
            >
              <span className="text-black">bg-input-bg</span>
            </div>
            <p className="text-sm">input-bg (#F5F8FA)</p>
          </div>

          {/* Input Focus */}
          <div className="space-y-2">
            <div
              className="bg-input-focus h-16 rounded-input flex items-center justify-center border"
              data-testid="bg-input-focus"
            >
              <span className="text-black">bg-input-focus</span>
            </div>
            <p className="text-sm">input-focus (#ECF0F3)</p>
          </div>

          {/* Navy */}
          <div className="space-y-2">
            <div
              className="bg-navy h-16 rounded-input flex items-center justify-center"
              data-testid="bg-navy"
            >
              <span className="text-white">bg-navy</span>
            </div>
            <p className="text-navy text-sm" data-testid="text-navy">
              text-navy (#1A1A2E)
            </p>
          </div>
        </div>
      </section>

      {/* Border Radius Tokens */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Border Radius Tokens</h2>

        <div className="flex gap-8 items-center">
          {/* Pill - 50px */}
          <div
            className="bg-primary text-white px-8 py-4 rounded-pill"
            data-testid="rounded-pill"
          >
            rounded-pill (50px)
          </div>

          {/* Input - 5px */}
          <div
            className="bg-input-bg border px-8 py-4 rounded-input"
            data-testid="rounded-input"
          >
            rounded-input (5px)
          </div>
        </div>
      </section>

      {/* Font Size Tokens */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Font Size Tokens</h2>

        <div className="space-y-4">
          <p className="text-question" data-testid="text-question">
            text-question (32px, bold)
          </p>
          <p className="text-button-size" data-testid="text-button-size">
            text-button-size (24px, bold)
          </p>
          <p className="text-input-size" data-testid="text-input-size">
            text-input-size (20px)
          </p>
          <p className="text-previous" data-testid="text-previous">
            text-previous (18px)
          </p>
          <p className="text-body-size" data-testid="text-body-size">
            text-body-size (16px)
          </p>
        </div>
      </section>

      {/* Spacing Tokens */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Spacing Tokens</h2>

        <div className="space-y-4">
          {/* Button dimensions */}
          <div
            className="bg-primary text-white h-button w-button rounded-pill flex items-center justify-center text-button-size font-bold uppercase"
            data-testid="button-dimensions"
          >
            LET'S START
          </div>
          <p className="text-sm">
            h-button (84px) x w-button (408px)
          </p>

          {/* Form max width */}
          <div
            className="bg-gray-100 p-4 max-w-form"
            data-testid="max-w-form"
          >
            <p className="text-sm">max-w-form (650px)</p>
          </div>
        </div>
      </section>

      {/* Transition Tokens */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Transition Tokens</h2>

        <div className="flex gap-4">
          <button
            className="bg-primary text-white px-6 py-3 rounded-pill transition-button hover:translate-y-[-2px] hover:shadow-lg"
            data-testid="transition-button"
          >
            Button (200ms ease-out)
          </button>

          <input
            type="text"
            placeholder="Input (150ms ease-in-out)"
            className="bg-input-bg focus:bg-input-focus rounded-input px-4 py-2 transition-input border outline-none"
            data-testid="transition-input"
          />
        </div>
      </section>

      {/* Color Psychology Journey Demo */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Color Psychology Journey</h2>

        <div className="space-y-4">
          {/* Step 0 - Purple */}
          <div className="flex items-center gap-4">
            <span className="text-sm w-24">Step 0:</span>
            <button className="bg-primary text-white h-button w-button rounded-pill text-button-size font-bold uppercase">
              LET'S START
            </button>
          </div>

          {/* Steps 1-2 - Yellow */}
          <div className="flex items-center gap-4">
            <span className="text-sm w-24">Steps 1-2:</span>
            <button className="bg-progress text-black h-button w-button rounded-pill text-button-size font-bold uppercase">
              CONTINUE
            </button>
          </div>

          {/* Step 3+ - Purple */}
          <div className="flex items-center gap-4">
            <span className="text-sm w-24">Step 3+:</span>
            <button className="bg-primary text-white h-button w-button rounded-pill text-button-size font-bold uppercase">
              GET MY ROADMAP
            </button>
          </div>

          {/* Disabled state */}
          <div className="flex items-center gap-4">
            <span className="text-sm w-24">Disabled:</span>
            <button
              className="bg-progress-disabled text-black h-button w-button rounded-pill text-button-size font-bold uppercase cursor-not-allowed"
              disabled
            >
              CONTINUE
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DesignTokenShowcase;
