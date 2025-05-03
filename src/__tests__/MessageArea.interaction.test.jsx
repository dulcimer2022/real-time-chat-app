import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageArea from '../MessageArea';

describe('MessageArea Interaction', () => {
  const mockProps = {
    rootList: [
      {
        _id: '1',
        username: 'testuser',
        text: 'Test message',
        timestamp: new Date().toISOString(),
        reactions: new Map(),
        replyCount: 0
      }
    ],
    messages: [],
    currentTid: null,
    currentChannel: 'public',
    username: 'testuser',
    hoveredId: null,
    setHoveredId: vi.fn(),
    onSelect: vi.fn(),
    onToggle: vi.fn(),
    onForward: vi.fn(),
    onEdit: vi.fn(),
    messageText: '',
    setMessageText: vi.fn(),
    onSend: vi.fn(e => e.preventDefault()),
    onClearError: vi.fn(),
    inputRef: { current: null }
  };

  test('calls onSend when form is submitted', () => {
    render(<MessageArea {...mockProps} />);
    
    const form = screen.getByRole('button', { name: /Send/i }).closest('form');
    fireEvent.submit(form);
    
    expect(mockProps.onSend).toHaveBeenCalled();
  });
  
  test('calls onSelect when thread is clicked', () => {
    render(<MessageArea {...mockProps} />);
    
    // Find the badge/button that shows thread count
    const threadButton = screen.getByText(/💬/);
    fireEvent.click(threadButton);
    
    expect(mockProps.onSelect).toHaveBeenCalledWith('1');
  });
  
  test('updates input when user types', () => {
    render(<MessageArea {...mockProps} />);
    
    const input = screen.getByPlaceholderText(/Message #public/i);
    fireEvent.change(input, { target: { value: 'New message' } });
    
    expect(mockProps.setMessageText).toHaveBeenCalledWith('New message');
    expect(mockProps.onClearError).toHaveBeenCalled();
  });
});