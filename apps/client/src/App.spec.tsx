import { render, screen, within } from '@testing-library/react';
import App from './App';
import { AppRuntimeProvider } from './runtime/provider';

describe('App', () => {
  it('renders the production UI with core components', () => {
    render(
      <AppRuntimeProvider>
        <App />
      </AppRuntimeProvider>,
    );

    expect(screen.getByLabelText(/App shell/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Platform/)).toBeInTheDocument();

    const sidebar = screen.getByLabelText(/^Sidebar$/i);
    expect(within(sidebar).getByText(/Threads/i)).toBeInTheDocument();
    expect(within(sidebar).getByText(/Actors/i)).toBeInTheDocument();
    expect(within(sidebar).getByText(/Files/i)).toBeInTheDocument();
    expect(within(sidebar).getByText(/Settings/i)).toBeInTheDocument();

    const mainPane = screen.getByLabelText(/^Main pane$/i);
    expect(within(mainPane).getByText(/ok/i)).toBeInTheDocument();
    expect(within(mainPane).getByText(/Seeded Thread/i)).toBeInTheDocument();
    expect(within(mainPane).getByLabelText(/Message timeline/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message input/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Send message/i)).toBeInTheDocument();
  });
});
