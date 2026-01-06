import { render, screen, within } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the mocked UI hierarchy with default component state', () => {
    render(<App />);

    expect(screen.getByText(/AI Platform/)).toBeInTheDocument();
    expect(screen.getByText(/Layout: split/i)).toBeInTheDocument();

    const sidebar = screen.getByLabelText(/Sidebar shell/i);
    expect(within(sidebar).getByText(/Collapsed: No/i)).toBeInTheDocument();
    const threadList = screen.getByLabelText(/Thread list/i);
    expect(threadList).toBeInTheDocument();
    expect(within(threadList).getByText(/Project Alpha/)).toBeInTheDocument();
    expect(within(threadList).getByText(/Runtime Notes/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Actor panel/i)).toBeInTheDocument();
    expect(screen.getByText(/design.md/)).toBeInTheDocument();

    const mainPane = screen.getByLabelText(/^Main pane$/i);
    expect(within(mainPane).getByLabelText(/System state bar/i)).toBeInTheDocument();
    expect(screen.getByText(/Status: ok/i)).toBeInTheDocument();
    expect(within(mainPane).getByLabelText(/Thread header/i)).toBeInTheDocument();
    expect(within(mainPane).getByLabelText(/Message timeline/i)).toBeInTheDocument();
    expect(screen.getByText(/Mocked message content/)).toBeInTheDocument();
    expect(screen.getByText(/Acknowledged receipt/)).toBeInTheDocument();

    const composer = screen.getByLabelText(/Message composer/i);
    expect(within(composer).getByText(/CommandPalette/i)).toBeInTheDocument();
    expect(screen.getByText(/Active: none/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/Thread overview drawer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Additional panels/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message details panel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sound notifier/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Overlay manager/i)).toBeInTheDocument();
  });
});
