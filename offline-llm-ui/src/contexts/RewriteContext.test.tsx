import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { RewriteProvider } from './RewriteContext';
import { RewriteWindow } from '../components/RewriteWindow/RewriteWindow';
import RewriteInput from '../components/RewriteInput/RewriteInput';

vi.mock('../api', () => ({
  redraftText: vi.fn(() => Promise.reject(new Error('fail'))),
}));

test('shows error message when redraftText fails', async () => {
  render(
    <RewriteProvider>
      <RewriteWindow />
      <RewriteInput />
    </RewriteProvider>
  );

  await userEvent.type(screen.getByPlaceholderText(/paste text/i), 'hello');
  await userEvent.keyboard('{enter}');

  await screen.findByText('Error');
  expect(screen.getByText('fail')).toBeInTheDocument();
});
