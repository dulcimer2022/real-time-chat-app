import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';

// Mock the services module
vi.mock('../services', () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

// Import the mocked functions
import { login, register } from '../services';

describe('Login Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <Login onLogin={() => {}} setError={() => {}} />
      </BrowserRouter>
    );
    
    // Use getByRole to be more specific
    expect(screen.getByRole('heading', { name: /Register/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Username:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
  });

  test('switches between login and register modes', () => {
    render(
      <BrowserRouter>
        <Login onLogin={() => {}} setError={() => {}} />
      </BrowserRouter>
    );
    
    // register mode
    expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
    
    // Find the Login button 
    const loginButton = screen.getByRole('button', { name: /Login/i });
    fireEvent.click(loginButton);
    
    // Now in login mode - the main button should change
    expect(screen.getByRole('button', { name: /Login/i, type: 'submit' })).toBeInTheDocument();
  });

  test('calls register function on form submission in register mode', async () => {
    register.mockResolvedValueOnce({});
    
    render(
      <BrowserRouter>
        <Login onLogin={() => {}} setError={() => {}} />
      </BrowserRouter>
    );
    
    // Fill the form
    const usernameInput = screen.getByLabelText(/Username:/i);
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    
    // Submit the form
    const registerButton = screen.getByRole('button', { name: /Register/i, type: 'submit' });
    fireEvent.click(registerButton);
    
    await waitFor(() => {
      expect(register).toHaveBeenCalledWith('testuser');
    });
  });

  test('calls login function on form submission in login mode', async () => {
    login.mockResolvedValueOnce({});
    const onLoginMock = vi.fn();
    
    render(
      <BrowserRouter>
        <Login onLogin={onLoginMock} setError={() => {}} />
      </BrowserRouter>
    );
    
    // Switch to login mode first
    const switchToLoginButton = screen.getByRole('button', { name: /Login/i });
    fireEvent.click(switchToLoginButton);
    
    // Fill the form
    const usernameInput = screen.getByLabelText(/Username:/i);
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    
    // Submit the form - now we need to find the submit button
    const loginSubmitButton = screen.getByRole('button', { name: /Login/i, type: 'submit' });
    fireEvent.click(loginSubmitButton);
    
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('testuser');
      expect(onLoginMock).toHaveBeenCalledWith('testuser');
    });
  });

  test('displays error message when login fails', async () => {
    // Mock the login function to reject with an error
    login.mockRejectedValueOnce({ error: 'user-not-registered' });
    
    render(
      <BrowserRouter>
        <Login onLogin={() => {}} setError={() => {}} />
      </BrowserRouter>
    );
    
    // Switch to login mode
    const switchToLoginButton = screen.getByRole('button', { name: /Login/i });
    fireEvent.click(switchToLoginButton);
    
    // Fill and submit the form
    fireEvent.change(screen.getByLabelText(/Username:/i), { target: { value: 'testuser' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i, type: 'submit' }));
    
    // Check that the error message appears in the component
    await waitFor(() => {
      const errorElement = screen.getByText('No such user. Please register first.');
      expect(errorElement).toBeInTheDocument();
    });
  });

  test('validates username is not empty', async () => {
    // Mock register to see if it gets called
    register.mockImplementationOnce(() => {
      throw new Error('Should not be called with empty username');
    });
    
    render(
      <BrowserRouter>
        <Login onLogin={() => {}} setError={() => {}} />
      </BrowserRouter>
    );
    
    // Try to submit with empty username
    const registerButton = screen.getByRole('button', { name: /Register/i, type: 'submit' });
    fireEvent.click(registerButton);
    
    // We need to check what actually happens in your component with an empty username
    // For example, if it displays an error message:
    await waitFor(() => {
      const errorElement = screen.getByText('Please enter a username');
      expect(errorElement).toBeInTheDocument();
    });
  });
});