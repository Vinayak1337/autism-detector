import { render, screen, fireEvent } from '@testing-library/react';
import AboutPage from './page';

// Define types for mock components
interface MockLinkProps {
  href: string;
  children: React.ReactNode;
}

interface MockImageProps {
  src: string;
  alt: string;
  onError?: () => void;
}

// Mock the next/link component
jest.mock('next/link', () => {
  return function MockLink({ href, children }: MockLinkProps) {
    return <a href={href}>{children}</a>;
  };
});

// Mock the next/image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onError }: MockImageProps) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} onError={onError} data-testid="mock-image" />;
  };
});

describe('About Page', () => {
  it('renders content correctly', () => {
    render(<AboutPage />);

    expect(screen.getByText('About Autism Detection')).toBeInTheDocument();
    expect(screen.getByText('The Science Behind Eye Movement')).toBeInTheDocument();
    expect(
      screen.getByText(/Research has shown that individuals with autism/i)
    ).toBeInTheDocument();
  });

  it('has working navigation links', () => {
    render(<AboutPage />);

    const backLink = screen.getByRole('link', { name: /Back to Home/i });
    expect(backLink).toHaveAttribute('href', '/');

    const getStartedLink = screen.getByRole('link', { name: /Get Started/i });
    expect(getStartedLink).toHaveAttribute('href', '/sign-up');
  });

  it('displays a fallback message when the image fails to load', () => {
    render(<AboutPage />);

    // Find the image and simulate an error
    const mockImage = screen.getByTestId('mock-image');
    fireEvent.error(mockImage);

    // Check for the fallback text
    expect(screen.getByText('Eye tracking visualization image')).toBeInTheDocument();
  });
});
