import { render, screen } from '@testing-library/react';
import SignInPage from './page';

// Define interfaces for mock component props
interface MockLinkProps {
  href: string;
  children: React.ReactNode;
}

// Mock the next/link component
jest.mock('next/link', () => {
  return function MockLink({ href, children }: MockLinkProps) {
    return <a href={href}>{children}</a>;
  };
});

// Mock SignIn component
jest.mock('@clerk/nextjs', () => ({
  SignIn: function MockSignIn() {
    return <div data-testid="sign-in-component">Sign In Component</div>;
  },
}));

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

    expect(screen.getByTestId('sign-in-component')).toBeInTheDocument();
  });

  it('renders the sign up link', () => {
    render(<SignInPage />);

    const signUpLink = screen.getByRole('link', { name: /Sign up/i });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute('href', '/sign-up');
  });
});
