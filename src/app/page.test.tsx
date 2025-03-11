import { render, screen } from '@testing-library/react';
import Home from './page';

// Mock the next/link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock the next/image component
jest.mock('next/image', () => {
  const MockImage = ({ src, alt, ...props }: { src: string; alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  };
  MockImage.displayName = 'MockImage';

  return {
    __esModule: true,
    default: MockImage,
  };
});

describe('Home Page', () => {
  it('renders the heading', () => {
    render(<Home />);

    const heading = screen.getByRole('heading', { name: /Autism Detection App/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the Get Started button', () => {
    render(<Home />);

    const getStartedButton = screen.getByRole('link', { name: /Get Started/i });
    expect(getStartedButton).toBeInTheDocument();
    expect(getStartedButton).toHaveAttribute('href', '/sign-up');
  });

  it('renders the feature cards', () => {
    render(<Home />);

    expect(screen.getByText(/Quick Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/Private & Secure/i)).toBeInTheDocument();
    expect(screen.getByText(/Detailed Reports/i)).toBeInTheDocument();
  });
});
