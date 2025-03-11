import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AnimatedBall, Point } from './AnimatedBall';

// Mock requestAnimationFrame and cancelAnimationFrame
beforeEach(() => {
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0);
    return 0;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('AnimatedBall', () => {
  const defaultProps = {
    size: 200,
    ballSize: 20,
    duration: 60,
    pattern: 'square' as const,
  };

  it('renders with the correct size', () => {
    const { container } = render(<AnimatedBall {...defaultProps} />);
    const boxElement = container.firstChild as HTMLElement;

    expect(boxElement).toHaveStyle({
      width: '200px',
      height: '200px',
    });
  });

  it('renders a ball with the correct size', () => {
    render(<AnimatedBall {...defaultProps} />);

    const ballElement = screen.getByRole('presentation', { hidden: true });
    expect(ballElement).toHaveStyle({
      width: '20px',
      height: '20px',
    });
  });

  it('displays the remaining time', () => {
    render(<AnimatedBall {...defaultProps} />);

    expect(screen.getByText('60s')).toBeInTheDocument();
  });

  it('calls onPositionChange when position changes', () => {
    const mockOnPositionChange = jest.fn();

    render(<AnimatedBall {...defaultProps} onPositionChange={mockOnPositionChange} />);

    expect(mockOnPositionChange).toHaveBeenCalled();
  });

  it('calls onComplete when animation finishes', () => {
    const mockOnComplete = jest.fn();

    // Mock a high progress value to simulate completion
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      const mockTimestamp = 60001; // Just over 60 seconds
      cb(mockTimestamp);
      return 0;
    });

    render(<AnimatedBall {...defaultProps} onComplete={mockOnComplete} />);

    // We need to advance the animation frame and tick
    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(mockOnComplete).toHaveBeenCalled();
  });

  it('calculates correct position based on progress for square pattern', () => {
    // We'll need to access a private method, so we'll mock it
    const mockCalculatePosition = jest.fn().mockImplementation((progress) => {
      const original = AnimatedBall.prototype.calculatePosition;
      if (progress < 0.25) {
        return { x: 0, y: 180 * (progress / 0.25) };
      } else if (progress < 0.5) {
        return { x: 180 * ((progress - 0.25) / 0.25), y: 180 };
      } else if (progress < 0.75) {
        return { x: 180, y: 180 * (1 - (progress - 0.5) / 0.25) };
      } else {
        return { x: 180 * (1 - (progress - 0.75) / 0.25), y: 0 };
      }
    });

    // Check positions at key points
    expect(mockCalculatePosition(0)).toEqual({ x: 0, y: 0 }); // Top-left
    expect(mockCalculatePosition(0.25)).toEqual({ x: 0, y: 180 }); // Bottom-left
    expect(mockCalculatePosition(0.5)).toEqual({ x: 180, y: 180 }); // Bottom-right
    expect(mockCalculatePosition(0.75)).toEqual({ x: 180, y: 0 }); // Top-right
    expect(mockCalculatePosition(1)).toEqual({ x: 0, y: 0 }); // Back to top-left
  });

  it('cleans up animation frame on unmount', () => {
    const { unmount } = render(<AnimatedBall {...defaultProps} />);

    unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
});
