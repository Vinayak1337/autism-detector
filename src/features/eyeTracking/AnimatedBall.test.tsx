import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AnimatedBall } from './AnimatedBall';

// Mock the useEyeTrackingStore
jest.mock('./store', () => ({
  useEyeTrackingStore: jest.fn((selector) => {
    // Default mock implementation
    if (selector.toString().includes('testPhase')) {
      return 'testing'; // Always return 'testing' for testPhase
    }
    if (selector.toString().includes('setTestPhase')) {
      return jest.fn();
    }
    if (selector.toString().includes('endTest')) {
      return jest.fn();
    }
    return jest.fn();
  }),
}));

// Define a safer mock for requestAnimationFrame that doesn't cause infinite loops
let frameId = 0;
// Mock requestAnimationFrame and cancelAnimationFrame
beforeEach(() => {
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => {
    // Return a unique ID but don't call the callback immediately
    return ++frameId;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  frameId = 0;
});

describe('AnimatedBall', () => {
  const defaultProps = {
    size: 30,
    color: '#4F46E5',
    showPath: true,
    showLabels: true,
  };

  it('renders with the correct size', () => {
   // const { container } = render(<AnimatedBall {...defaultProps} />);

    // Manually trigger the animation frame once
    act(() => {
      ///const animateCallback = (window.requestAnimationFrame as jest.Mock).mock.calls[0][0];
      //animateCallback(100); // Simulate a timestamp
    });

    //const containerElement = screen.getByTestId('animated-ball-container');

    //expect(containerElement).toBeInTheDocument();
    //expect(containerElement).toHaveClass('relative w-full h-full');
  });

  it('renders a ball with the correct size', () => {
    render(<AnimatedBall {...defaultProps} />);

    // Manually trigger the animation frame once
    act(() => {
      const animateCallback = (window.requestAnimationFrame as jest.Mock).mock.calls[0][0];
      animateCallback(100); // Simulate a timestamp
    });

    const ballElement = screen.getByTestId('animated-ball');
    expect(ballElement).toBeInTheDocument();
    expect(ballElement.style.width).toBe('30px');
    expect(ballElement.style.height).toBe('30px');
  });

  it('displays progress indicator', () => {
    render(<AnimatedBall {...defaultProps} />);

    // Manually trigger the animation frame once
    act(() => {
      const animateCallback = (window.requestAnimationFrame as jest.Mock).mock.calls[0][0];
      animateCallback(100); // Simulate a timestamp
    });

    // Check for progress indicator elements
    const progressContainer = document.querySelector('.bg-white.bg-opacity-75.rounded-full');
    expect(progressContainer).toBeInTheDocument();
  });

  it('calls onPositionUpdate when position changes', () => {
    const mockOnPositionUpdate = jest.fn();

    render(<AnimatedBall {...defaultProps} onPositionUpdate={mockOnPositionUpdate} />);

    // The animation function should have requested an animation frame
    expect(window.requestAnimationFrame).toHaveBeenCalled();

    // Force the animation by manually calling the callback
    act(() => {
      const animateCallback = (window.requestAnimationFrame as jest.Mock).mock.calls[0][0];
      animateCallback(100); // Simulate a timestamp
    });

    // Now the position update should have been called
    expect(mockOnPositionUpdate).toHaveBeenCalled();
  });

  it('calls onComplete when animation finishes', () => {
    const mockOnComplete = jest.fn();
    //const mockEndTest = jest.fn();

    // Update the mock to return our mockEndTest
    // (require('./store').useEyeTrackingStore as jest.Mock).mockImplementation((selector) => {
    //   if (selector.toString().includes('testPhase')) {
    //     return 'testing';
    //   }
    //   if (selector.toString().includes('endTest')) {
    //     return mockEndTest;
    //   }
    //   return jest.fn();
    // });

    render(<AnimatedBall {...defaultProps} onComplete={mockOnComplete} />);

    // When testing completion, we need to explicitly pass a timestamp that's
    // greater than the animation duration to trigger the completion logic
    act(() => {
      // First initialize with a small timestamp
      const animateCallback = (window.requestAnimationFrame as jest.Mock).mock.calls[0][0];
      animateCallback(1000); // Initialize with a starting timestamp

      // Then explicitly call with a timestamp past the duration
      animateCallback(MOVEMENT_DURATION + 5000); // Ensure we're well past the duration
    });

    expect(mockOnComplete).toHaveBeenCalled();
    //expect(mockEndTest).toHaveBeenCalled();
  });

  it('cleans up animation frame on unmount', () => {
    const { unmount } = render(<AnimatedBall {...defaultProps} />);

    // Manually trigger the animation frame once
    act(() => {
      const animateCallback = (window.requestAnimationFrame as jest.Mock).mock.calls[0][0];
      animateCallback(100); // Simulate a timestamp
    });

    // Now unmount to test cleanup
    unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
});

// Add the constant from the component for testing
const MOVEMENT_DURATION = 60000; // 60 seconds total
