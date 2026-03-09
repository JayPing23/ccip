import Header from '@/shared/components/Header';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('@/modules/auth/components/LogoutButton', () => ({
  __esModule: true,
  default: () => <button type="button">Sign out</button>,
}));

describe('Header', () => {
  it('renders nothing when no user is available', () => {
    const { container } = render(<Header />);

    expect(container.firstChild).toBeNull();
  });

  it('renders navigation and admin links once mounted', async () => {
    render(
      <Header
        user={{
          id: 'user-1',
          email: 'user@example.edu',
          display_name: 'Campus User',
          avatar_url: 'https://example.edu/avatar.png',
        }}
        showAdminLinks
      />
    );

    expect(await screen.findByText('CCIP')).toBeTruthy();
    expect(screen.getByText('Feed')).toBeTruthy();
    expect(screen.getByText('Manage Posts')).toBeTruthy();
    expect(screen.getByText('New Post')).toBeTruthy();
    expect(screen.getByText('Campus User')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Campus User' })).toBeTruthy();
  });
});
