import { render, screen, within } from '@testing-library/react';
import App from './App';
import { AppRuntimeProvider } from './runtime/provider';

describe('App', () => {
  it('renders the mocked UI hierarchy with default component state', () => {
    render(
      <AppRuntimeProvider>
        <App />
      </AppRuntimeProvider>,
    );

    expect(screen.getByLabelText(/App shell/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Platform/)).toBeInTheDocument();

    const sidebar = screen.getByLabelText(/^Sidebar$/i);
    expect(within(sidebar).getByText(/Collapsed:/i)).toBeInTheDocument();
    expect(within(sidebar).getByText(/Active panel:/i)).toBeInTheDocument();

    const mainPane = screen.getByLabelText(/^Main pane$/i);
    expect(within(mainPane).getByLabelText(/System state bar/i)).toBeInTheDocument();
    expect(within(mainPane).getByLabelText(/Thread header/i)).toBeInTheDocument();
    expect(within(mainPane).getByLabelText(/Message timeline/i)).toBeInTheDocument();
    expect(within(mainPane).getByLabelText(/Message composer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message input/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Submit message/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/Thread overview drawer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Additional panels/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message details panel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sound notifier/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Overlay manager/i)).toBeInTheDocument();
  });
});
