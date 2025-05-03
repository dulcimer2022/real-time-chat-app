import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Status from '../Status';
import { MESSAGES } from '../constants';

describe('Status Component', () => {
  test('displays the correct error message', () => {
    render(<Status error="auth-missing" />);
    expect(screen.getByText(MESSAGES['auth-missing'])).toBeInTheDocument();
  });
  
  test('displays default message for unknown errors', () => {
    render(<Status error="unknown-error" />);
    expect(screen.getByText(MESSAGES.default)).toBeInTheDocument();
  });
  
  test('applies success class for success messages', () => {
    render(<Status error="registration-success" />);
    
    // Get the status element itself, not the text node
    const statusElement = screen.getByText(MESSAGES['registration-success']).closest('.status');
    expect(statusElement).toBeInTheDocument();
    expect(statusElement).toHaveClass('success');
  });
});