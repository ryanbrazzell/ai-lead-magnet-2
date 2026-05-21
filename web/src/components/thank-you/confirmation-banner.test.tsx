import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfirmationBanner } from './confirmation-banner';

describe('ConfirmationBanner', () => {
  it('greets the user by first name', () => {
    render(<ConfirmationBanner firstName="Sam" email="sam@example.com" />);
    expect(screen.getByText(/Congrats Sam/i)).toBeDefined();
  });

  it('tells the user there is one step left', () => {
    render(<ConfirmationBanner firstName="Sam" email="sam@example.com" />);
    expect(screen.getByText(/one step/i)).toBeDefined();
  });

  it('renders without a first name', () => {
    render(<ConfirmationBanner email="sam@example.com" />);
    expect(screen.getByText(/one step/i)).toBeDefined();
  });
});
