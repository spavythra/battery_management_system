import './App.css';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import BatteryDetail from './Components/BatteryDetail';
import ShowcaseCharts from './Components/ShowcaseCharts';
import { useState, useEffect } from 'react';
import { Table } from './Components/Table'
import React from 'react'
import { fetchBatteries } from './Components/api';

function App() {

  const columns = [
    { accessor: 'id', label: 'ID' },
    { accessor: 'location', label: 'Location' },
    { accessor: 'stateOfCharge', label: 'Charge (%)' },
    { accessor: 'connectionStatus', label: '	Connection Status' },
  ]

  const [batteryList, setBatteryList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadBatteries = async () => {
      try {
        setLoading(true)
        const batteries = await fetchBatteries()
        if (isMounted) {
          setBatteryList(batteries)
          setError('')
        }
      } catch (requestError) {
        if (isMounted) {
          setError('Unable to load battery fleet data right now.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadBatteries()

    return () => {
      isMounted = false
    }
  }, []);

  return (
    <div className="app-shell">
      <Router>
        <Switch>
          <Route exact path="/">
            <Table rows={batteryList} columns={columns} loading={loading} error={error} />
          </Route>

          <Route path="/battery/:id">
            <BatteryDetail />
          </Route>

          <Route path="/showcase">
            <ShowcaseCharts />
          </Route>
        </Switch>
      </Router>
    </div>
  )
}

export default App
