import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { fetchBatteries, fetchBatteryById } from './Components/api';

jest.mock('./Components/api', () => ({
  fetchBatteries: jest.fn(),
  fetchBatteryById: jest.fn(),
}));

jest.mock('./Components/Graph', () => function GraphMock() {
  return <div data-testid="graph-placeholder">Graph</div>;
});

jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart-placeholder">Line Chart</div>,
  Bar: () => <div data-testid="bar-chart-placeholder">Bar Chart</div>,
}));

const MOCK_LIST = [
  {
    id: 'A-1001',
    location: 'Warehouse',
    stateOfCharge: 72,
    connectionStatus: 1,
    recentIssues: [],
  },
];

const MOCK_DETAIL = {
  id: 'A-1001',
  location: 'Warehouse',
  voltage: 36,
  capacity: 50,
  stateOfCharge: 72,
  stateOfHealth: 89,
  connectionStatus: 1,
  recentIssues: [1],
  lastConnectionTime: '2022-07-02T11:12:33.083Z',
  measurements: [
    { timestamp: '2022-07-02T10:12:33.083Z', stateOfCharge: 71 },
    { timestamp: '2022-07-02T11:12:33.083Z', stateOfCharge: 72 },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  fetchBatteries.mockResolvedValue(MOCK_LIST);
  fetchBatteryById.mockResolvedValue(MOCK_DETAIL);
});

test('renders dashboard heading', async () => {
  render(<App />);
  const heading = await screen.findByText(/FleetPulse Battery Intelligence/i);
  expect(heading).toBeInTheDocument();
});

test('opens battery detail when clicking a battery link', async () => {
  render(<App />);

  const batteryLink = await screen.findByRole('link', { name: 'A-1001' });
  userEvent.click(batteryLink);

  expect(await screen.findByText(/Battery A-1001/i)).toBeInTheDocument();
  expect(fetchBatteryById).toHaveBeenCalledWith('A-1001');
});
