import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import BatteryDetail from './BatteryDetail'
import { fetchBatteryById } from './api'

jest.mock('./api', () => ({
  fetchBatteryById: jest.fn(),
}))

jest.mock('./Graph', () => function GraphMock() {
  return <div data-testid='graph-placeholder'>Graph</div>
})

jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid='line-chart-placeholder'>Line Chart</div>,
  Bar: () => <div data-testid='bar-chart-placeholder'>Bar Chart</div>,
}))

describe('BatteryDetail', () => {
  test('renders telemetry and diagnostics sections for a battery', async () => {
    fetchBatteryById.mockResolvedValue({
      id: 'A-1001',
      location: 'Warehouse',
      voltage: 36,
      capacity: 50,
      stateOfCharge: 72,
      stateOfHealth: 89,
      connectionStatus: 1,
      recentIssues: [1, 2],
      lastConnectionTime: '2022-07-02T11:12:33.083Z',
      measurements: [
        { timestamp: '2022-07-02T10:12:33.083Z', stateOfCharge: 70 },
        { timestamp: '2022-07-02T11:12:33.083Z', stateOfCharge: 72 },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/battery/A-1001']}>
        <Route path='/battery/:id'>
          <BatteryDetail />
        </Route>
      </MemoryRouter>
    )

    expect(await screen.findByText(/Battery A-1001/i)).toBeInTheDocument()
    expect(screen.getByText(/Live diagnostics/i)).toBeInTheDocument()
    expect(screen.getByText(/Health Diagnostics Over The Years/i)).toBeInTheDocument()
    expect(screen.getByText(/Issue Pattern Diagnostics/i)).toBeInTheDocument()
    expect(fetchBatteryById).toHaveBeenCalledWith('A-1001')
  })

  test('renders error state when battery fetch fails', async () => {
    fetchBatteryById.mockRejectedValue(new Error('Not found'))

    render(
      <MemoryRouter initialEntries={['/battery/UNKNOWN']}>
        <Route path='/battery/:id'>
          <BatteryDetail />
        </Route>
      </MemoryRouter>
    )

    expect(await screen.findByText(/Battery telemetry is currently unavailable/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to dashboard/i })).toBeInTheDocument()
  })
})
