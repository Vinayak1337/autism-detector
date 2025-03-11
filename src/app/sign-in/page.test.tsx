import { render, screen } from '@testing-library/react';
import SignInPage from './page';

// Mock the next/link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock the Clerk SignIn component
jest.mock('@clerk/nextjs', () => {
  const MockSignIn = () => <div data-testid="clerk-sign-in">Clerk Sign In Component</div>;
  MockSignIn.displayName = 'MockSignIn';

  return {
    SignIn: MockSignIn,
  };
});

describe('Sign In Page', () => {
  it('renders the sign in heading', () => {
    render(<SignInPage />);

    const heading = screen.getByRole('heading', { name: /Sign In/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the welcome message', () => {
    render(<SignInPage />);

    expect(
      screen.getByText(/Welcome back! Sign in to continue with your assessment./i)
    ).toBeInTheDocument();
  });

  it('renders the Clerk SignIn component', () => {
    render(<SignInPage />);

    expect(screen.getByTestId('clerk-sign-in')).toBeInTheDocument();
  });

  it('renders the sign up link', () => {
    render(<SignInPage />);

    const signUpLink = screen.getByRole('link', { name: /Sign up/i });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute('href', '/sign-up');
  });
});
