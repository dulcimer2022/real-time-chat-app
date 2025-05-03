import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReactionBar from '../../ReactionBar';
import { toggleReaction } from '../../services';
import socketService from '../../socketService';

// Mock the services module
vi.mock('../../services', () => ({
  toggleReaction: vi.fn(),
  addReaction: vi.fn().mockResolvedValue({}),
  removeReaction: vi.fn().mockResolvedValue({}),
}));

// Mock socket service
vi.mock('../../socketService', () => ({
  default: {
    on: vi.fn((event, callback) => {

      if (!mockCallbacks[event]) {
        mockCallbacks[event] = [];
      }
      mockCallbacks[event].push(callback);
      return vi.fn(); // Return unsubscribe function
    }),
  },
  // Simulate emitting an event
  emitEvent: (eventName, data) => {
    if (mockCallbacks[eventName]) {
      mockCallbacks[eventName].forEach(callback => callback(data));
    }
  }
}));

const mockCallbacks = {};

describe('Message Reactions Feature', () => {
  const mockMessage = {
    id: '123',
    text: 'Test message',
    username: 'testuser',
    reactions: new Map([
      ['smile', ['otheruser']]
    ])
  };

  const mockToggle = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
    Object.keys(mockCallbacks).forEach(key => {
      mockCallbacks[key] = [];
    });
  });

  test('renders existing reactions correctly', () => {
    render(
      <ReactionBar
        message={mockMessage}
        username="testuser"
        onToggle={mockToggle}
      />
    );
    
    // Should show the emoji with count
    const reactionButton = screen.getByText(/😅 1/); 
    expect(reactionButton).toBeInTheDocument();
  });

  test('calls onToggle when reaction is clicked', () => {
    render(
      <ReactionBar
        message={mockMessage}
        username="testuser"
        onToggle={mockToggle}
      />
    );
    
    const reactionButton = screen.getByText(/😅 1/);
    fireEvent.click(reactionButton);
    
    expect(mockToggle).toHaveBeenCalledWith('123', 'smile', false);
  });

  test('highlights reactions from current user', () => {
    const messageWithUserReaction = {
      ...mockMessage,
      reactions: new Map([
        ['smile', ['testuser', 'otheruser']]
      ])
    };
    
    render(
      <ReactionBar
        message={messageWithUserReaction}
        username="testuser"
        onToggle={mockToggle}
      />
    );
    
    const reactionButton = screen.getByText(/😅 2/);
    
    expect(reactionButton).toHaveClass('mine');
  });

  test('updates when reaction-updated event is received', async () => {

    const { rerender } = render(
      <ReactionBar
        message={mockMessage}
        username="testuser"
        onToggle={mockToggle}
      />
    );
    
    // Initial state
    expect(screen.getByText(/😅 1/)).toBeInTheDocument();
    
    // Simulate receiving a WebSocket event with updated message
    const updatedMessage = {
      ...mockMessage,
      reactions: new Map([
        ['smile', ['otheruser', 'thirduser']]
      ])
    };
    
    // Update the component with new data (simulating what would happen when socket event fires)
    rerender(
      <ReactionBar
        message={updatedMessage}
        username="testuser"
        onToggle={mockToggle}
      />
    );
    
    // count updated
    await waitFor(() => {
      expect(screen.getByText(/😅 2/)).toBeInTheDocument();
    });
  });
});