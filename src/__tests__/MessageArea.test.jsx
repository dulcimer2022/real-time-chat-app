import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageArea from '../MessageArea';

describe('MessageArea Component', () => {
  const mockProps = {
    rootList: [
      {
        _id: '1',
        username: 'testuser',
        text: 'Hello world',
        timestamp: new Date().toISOString(),
        reactions: new Map(),
        replyCount: 2
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
    onSend: vi.fn(),
    onClearError: vi.fn(),
    inputRef: { current: null }
  };

  test('renders the channel view when currentTid is null', () => {
    render(<MessageArea {...mockProps} />);
    
    expect(screen.getByText('#public')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Message #public/i)).toBeInTheDocument();
  });

  test('renders the message input form', () => {
    render(<MessageArea {...mockProps} />);
    
    expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Message #public/i)).toBeInTheDocument();
  });

  test('renders thread view when currentTid is provided', () => {
    const threadProps = {
      ...mockProps,
      currentTid: '123',
      rootList: [],
      messages: [
        {
          _id: '123',
          username: 'testuser',
          text: 'Thread root message',
          timestamp: new Date().toISOString(),
          reactions: new Map()
        },
        {
          _id: '456',
          username: 'otheruser',
          text: 'Reply message',
          timestamp: new Date().toISOString(),
          reactions: new Map()
        }
      ]
    };
    
    render(<MessageArea {...threadProps} />);
    
    expect(screen.getByText('Thread')).toBeInTheDocument();
    expect(screen.getByText('Thread root message')).toBeInTheDocument();
    expect(screen.getByText('Reply message')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Message thread/i)).toBeInTheDocument();
  });
});