import { useState, useMemo } from 'react'
import { sortRows, filterRows, paginateRows } from './helpers'
import { Pagination } from './Pagination'
import { Link } from 'react-router-dom';

const statusMap = {
  1: 'Online',
  2: 'Pending',
  3: 'Offline',
}

const formatStatus = (statusId) => statusMap[statusId] || 'Offline'

export const Table = ({ columns, rows, loading, error }) => {
  const [activePage, setActivePage] = useState(1)
  const [filters, setFilters] = useState({})
  const [sort, setSort] = useState({ order: 'asc', orderBy: 'id' })
  const rowsPerPage = 20

  const filteredRows = useMemo(() => filterRows(rows, filters), [rows, filters])
  const sortedRows = useMemo(() => sortRows(filteredRows, sort), [filteredRows, sort])
  const calculatedRows = paginateRows(sortedRows, activePage, rowsPerPage)

  const count = filteredRows.length
  const totalPages = Math.ceil(count / rowsPerPage)

  const handleSearch = (value, accessor) => {
    setActivePage(1)

    if (value) {
      setFilters((prevFilters) => ({
        ...prevFilters,
        [accessor]: value,
      }))
    } else {
      setFilters((prevFilters) => {
        const updatedFilters = { ...prevFilters }
        delete updatedFilters[accessor]

        return updatedFilters
      })
    }
  }

  const handleSort = (accessor) => {
    setActivePage(1)
    setSort((prevSort) => ({
      order: prevSort.order === 'asc' && prevSort.orderBy === accessor ? 'desc' : 'asc',
      orderBy: accessor,
    }))
  }

  const clearAll = () => {
    setSort({ order: 'asc', orderBy: 'id' })
    setActivePage(1)
    setFilters({})
  }

  const metrics = useMemo(() => {
    const total = rows.length
    const online = rows.filter((row) => row.connectionStatus === 1).length
    const healthyChargeSamples = rows.filter((row) => typeof row.stateOfCharge === 'number')
    const avgCharge = healthyChargeSamples.length
      ? Math.round(
          healthyChargeSamples.reduce((acc, row) => acc + row.stateOfCharge, 0) /
            healthyChargeSamples.length
        )
      : 0
    const critical = rows.filter((row) => typeof row.stateOfCharge === 'number' && row.stateOfCharge < 15).length

    return { total, online, avgCharge, critical }
  }, [rows])

  const sortIcon = (accessor) => {
    if (accessor !== sort.orderBy) {
      return <i className="fas fa-sort" aria-hidden="true"></i>
    }

    return sort.order === 'asc' ? (
      <i className="fas fa-sort-up" aria-hidden="true"></i>
    ) : (
      <i className="fas fa-sort-down" aria-hidden="true"></i>
    )
  }

  return (
    <div className='dashboard-container'>
      <div className='dashboard-hero'>
        <p className='eyebrow'> Monitoring Deck</p>
        <h1>FleetPulse Battery Intelligence</h1>
        <p>
          Live status and operational confidence insights for your battery fleet, empowering proactive maintenance and optimized performance.
        </p>
      </div>

      <div className='kpi-grid'>
        <article className='kpi-card'>
          <p>Total assets</p>
          <h2>{metrics.total}</h2>
        </article>
        <article className='kpi-card'>
          <p>Online now</p>
          <h2>{metrics.online}</h2>
        </article>
        <article className='kpi-card'>
          <p>Average charge</p>
          <h2>{metrics.avgCharge}%</h2>
        </article>
        <article className='kpi-card'>
          <p>Critical under 15%</p>
          <h2>{metrics.critical}</h2>
        </article>
      </div>

      <div className='controls-panel'>
        <div className='search-bar'>
        <input
        key={`id-search`}
        type="search"
        placeholder='Search by battery ID'
        value={filters["id"]}
        onChange={(event) => handleSearch(event.target.value, "id")}/>
        <input
          key='location-search'
          type='search'
          placeholder='Search by location'
          value={filters.location || ''}
          onChange={(event) => handleSearch(event.target.value, 'location')}
        />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className='clear-btn' onClick={clearAll}>Clear filters</button>
        <Link className='clear-btn' to='/showcase'>Chart showcase</Link>
      </div>
     </div>

      {loading ? <p className='feedback'>Loading fleet telemetry...</p> : null}
      {error ? <p className='feedback error'>{error}</p> : null}

      <div className='table-wrap'>
      <table className='fleet-table'>
        <thead>
          <tr>
            {columns.map((column) => {
              return (
                <th key={column.accessor}>
                  <span>{column.label}</span>
                  <button className='sort-btn' onClick={() => handleSort(column.accessor)}>
                    {sortIcon(column.accessor)}
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {calculatedRows.map((row) => {
            return (
              <tr key={row.id}>
                <td>
                  <Link className='battery-link' to={`/battery/${row.id}`}>
                    {row.id}
                  </Link>
                </td>
                <td>{row.location || 'N/A'}</td>
                <td>{typeof row.stateOfCharge === 'number' ? `${row.stateOfCharge}%` : 'N/A'}</td>
                <td>
                  <span className={`status-chip status-${formatStatus(row.connectionStatus).toLowerCase()}`}>
                    {formatStatus(row.connectionStatus)}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>

      {count > 0 ? (
        <Pagination
          activePage={activePage}
          count={count}
          rowsPerPage={rowsPerPage}
          totalPages={totalPages}
          setActivePage={setActivePage}
        />
      ) : (
        <p>No data found</p>
      )}


    </div>
  )
}