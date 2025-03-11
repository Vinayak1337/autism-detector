import { render, screen } from '@testing-library/react';
import DashboardPage from './page';

// Mock the next/link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock the Clerk useUser hook
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isLoaded: true,
    user: {
      firstName: 'Test',
      lastName: 'User',
    },
  }),
}));

describe('Dashboard Page', () => {
  it('renders the welcome message with user name', () => {
    render(<DashboardPage />);

    expect(screen.getByText(/Welcome, Test/i)).toBeInTheDocument();
  });

  it('renders the Start New Test button', () => {
    render(<DashboardPage />);

    const startTestButton = screen.getByRole('link', { name: /Start New Test/i });
    expect(startTestButton).toBeInTheDocument();
    expect(startTestButton).toHaveAttribute('href', '/dashboard/new-test');
  });

  it('renders the View Reports button', () => {
    render(<DashboardPage />);

    const viewReportsButton = screen.getByRole('link', { name: /View Reports/i });
    expect(viewReportsButton).toBeInTheDocument();
    expect(viewReportsButton).toHaveAttribute('href', '/dashboard/reports');
  });

  it('renders the Recent Activity section', () => {
    render(<DashboardPage />);

    expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument();
    expect(screen.getByText(/You haven't completed any assessments yet./i)).toBeInTheDocument();
  });
});
