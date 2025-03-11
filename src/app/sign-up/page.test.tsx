import { render, screen } from '@testing-library/react';
import SignUpPage from './page';

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

// Mock SignUp component
jest.mock('@clerk/nextjs', () => ({
  SignUp: function MockSignUp() {
    return <div data-testid="sign-up-component">Sign Up Component</div>;
  },
}));

describe('Sign Up Page', () => {
  it('renders the create account heading', () => {
    render(<SignUpPage />);

    const heading = screen.getByRole('heading', { name: /Create an Account/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the sign up message', () => {
    render(<SignUpPage />);

    expect(
      screen.getByText(/Sign up to access assessment tools and personalized reports./i)
    ).toBeInTheDocument();
  });

  it('renders the Clerk SignUp component', () => {
    render(<SignUpPage />);

    expect(screen.getByTestId('sign-up-component')).toBeInTheDocument();
  });

  it('renders the sign in link', () => {
    render(<SignUpPage />);

    const signInLink = screen.getByRole('link', { name: /Sign in/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', '/sign-in');
  });
});
