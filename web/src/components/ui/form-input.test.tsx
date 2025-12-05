/**
 * FormInput Component Tests
 *
 * These 6 tests validate the FormInput component functionality per Task 3.1:
 * 1. Test text input renders with correct styling (#F5F8FA background, 5px radius)
 * 2. Test focus state transitions background to #ECF0F3
 * 3. Test phone variant has 70px left padding for country prefix
 * 4. Test error state shows red border and error message
 * 5. Test placeholder text is uppercase
 * 6. Test select variant renders with dropdown arrow icon
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormInput } from "./form-input";

describe("FormInput Component", () => {
  /**
   * Test 1: Text input renders with correct styling (#F5F8FA background, 5px radius)
   *
   * Validates that the FormInput component applies the correct design system
   * tokens for background color and border radius.
   */
  it("renders text input with correct styling (#F5F8FA background, 5px radius)", () => {
    render(<FormInput type="text" placeholder="Test input" data-testid="form-input" />);

    const input = screen.getByTestId("form-input");

    // Verify the input exists and has the correct type
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "text");

    // Verify design system classes are applied
    expect(input).toHaveClass("bg-input-bg");
    expect(input).toHaveClass("rounded-input");
    expect(input).toHaveClass("text-input-size");
    expect(input).toHaveClass("p-[13px]");
  });

  /**
   * Test 2: Focus state transitions background to #ECF0F3
   *
   * Validates that the FormInput has the correct focus classes applied
   * for background color transition.
   */
  it("has focus state that transitions background to #ECF0F3", () => {
    render(<FormInput type="text" placeholder="Test input" data-testid="form-input" />);

    const input = screen.getByTestId("form-input");

    // Verify focus classes are present for the transition
    expect(input).toHaveClass("focus:bg-input-focus");
    expect(input).toHaveClass("transition-colors");
    expect(input).toHaveClass("duration-[150ms]");
    expect(input).toHaveClass("ease-in-out");

    // Simulate focus event
    fireEvent.focus(input);

    // Input should remain in document (focus doesn't break it)
    expect(input).toBeInTheDocument();
  });

  /**
   * Test 3: Phone variant has 70px left padding for country prefix
   *
   * Validates that the tel type input has additional left padding
   * to accommodate country flag/prefix display.
   */
  it("phone variant has 70px left padding for country prefix", () => {
    render(<FormInput type="tel" placeholder="Phone number" data-testid="phone-input" />);

    const input = screen.getByTestId("phone-input");

    // Verify phone-specific left padding class
    expect(input).toHaveClass("pl-[70px]");

    // Verify it still has base styles
    expect(input).toHaveClass("bg-input-bg");
    expect(input).toHaveClass("rounded-input");

    // Verify correct input type
    expect(input).toHaveAttribute("type", "tel");
  });

  /**
   * Test 4: Error state shows red border and error message
   *
   * Validates that the FormInput displays error styling and
   * an error message when an error prop is provided.
   */
  it("error state shows red border and error message", () => {
    const errorMessage = "Please complete this required field.";

    render(
      <FormInput
        type="text"
        placeholder="Test input"
        error={errorMessage}
        id="test-input"
        data-testid="error-input"
      />
    );

    const input = screen.getByTestId("error-input");

    // Verify error border class is applied
    expect(input).toHaveClass("border-red-500");
    expect(input).toHaveClass("border-2");

    // Verify error message is displayed
    const errorText = screen.getByRole("alert");
    expect(errorText).toBeInTheDocument();
    expect(errorText).toHaveTextContent(errorMessage);
    expect(errorText).toHaveClass("text-red-500");
    expect(errorText).toHaveClass("text-sm");
    expect(errorText).toHaveClass("mt-1");

    // Verify aria-invalid is set
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  /**
   * Test 5: Placeholder text is uppercase
   *
   * Validates that the placeholder text is styled to be uppercase
   * via the placeholder:uppercase class.
   */
  it("placeholder text is uppercase", () => {
    render(
      <FormInput
        type="text"
        placeholder="first name"
        data-testid="placeholder-input"
      />
    );

    const input = screen.getByTestId("placeholder-input");

    // Verify placeholder styling classes
    expect(input).toHaveClass("placeholder:uppercase");
    expect(input).toHaveClass("placeholder:text-gray-400");

    // Verify placeholder value is converted to uppercase in the attribute
    expect(input).toHaveAttribute("placeholder", "FIRST NAME");
  });

  /**
   * Test 6: Select variant renders with dropdown arrow icon
   *
   * Validates that the select type input renders using the Select
   * component with a dropdown arrow (ChevronDown icon).
   */
  it("select variant renders with dropdown arrow icon", () => {
    const options = [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2" },
    ];

    render(
      <FormInput
        type="select"
        placeholder="Select an option"
        options={options}
        data-testid="select-input"
      />
    );

    // Find the select trigger button
    const selectTrigger = screen.getByRole("combobox");
    expect(selectTrigger).toBeInTheDocument();

    // Verify the select has design system styling classes
    expect(selectTrigger).toHaveClass("bg-input-bg");
    expect(selectTrigger).toHaveClass("rounded-input");

    // Verify dropdown arrow icon exists (ChevronDown from lucide-react)
    // The icon is rendered as an SVG inside the trigger
    const chevronIcon = selectTrigger.querySelector("svg");
    expect(chevronIcon).toBeInTheDocument();

    // Verify placeholder text is displayed (uppercase)
    expect(selectTrigger).toHaveTextContent("SELECT AN OPTION");
  });
});
