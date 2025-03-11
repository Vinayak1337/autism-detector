import { render, screen } from '@testing-library/react';
import HomePage from './page';

// Define interfaces for mock component props
interface MockLinkProps {
  href: string;
  children: React.ReactNode;
}

interface MockImageProps {
  src: string;
  alt: string;
}

// Mock the next/link component
jest.mock('next/link', () => {
  return function MockLink({ href, children }: MockLinkProps) {
    return <a href={href}>{children}</a>;
  };
});

// Mock the next/image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt }: MockImageProps) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} />;
  };
});

describe('Home Page', () => {
  it('renders the heading', () => {
    render(<HomePage />);

    const heading = screen.getByRole('heading', { name: /Autism Detection App/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the Get Started button', () => {
    render(<HomePage />);

    const getStartedButton = screen.getByRole('link', { name: /Get Started/i });
    expect(getStartedButton).toBeInTheDocument();
    expect(getStartedButton).toHaveAttribute('href', '/sign-up');
  });

  it('renders the feature cards', () => {
    render(<HomePage />);

    expect(screen.getByText(/Quick Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/Private & Secure/i)).toBeInTheDocument();
    expect(screen.getByText(/Detailed Reports/i)).toBeInTheDocument();
  });
});
