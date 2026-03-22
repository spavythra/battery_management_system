import { filterRows, sortRows, paginateRows, convertType } from './helpers'

describe('helpers utility functions', () => {
  const rows = [
    { id: 'B-20', location: 'Tampere Hub', stateOfCharge: 40, connected: true },
    { id: 'A-10', location: 'Nokia Site', stateOfCharge: 85, connected: false },
    { id: 'C-30', location: 'Espoo Site', stateOfCharge: 15, connected: true },
  ]

  test('filterRows filters by string case-insensitively', () => {
    const result = filterRows(rows, { location: 'tampere' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('B-20')
  })

  test('filterRows filters by number and boolean', () => {
    const byCharge = filterRows(rows, { stateOfCharge: '85' })
    const byConnection = filterRows(rows, { connected: 'true' })

    expect(byCharge).toHaveLength(1)
    expect(byCharge[0].id).toBe('A-10')
    expect(byConnection).toHaveLength(2)
  })

  test('sortRows sorts ascending and descending by id', () => {
    const asc = sortRows(rows, { order: 'asc', orderBy: 'id' })
    const desc = sortRows(rows, { order: 'desc', orderBy: 'id' })

    expect(asc.map((row) => row.id)).toEqual(['A-10', 'B-20', 'C-30'])
    expect(desc.map((row) => row.id)).toEqual(['C-30', 'B-20', 'A-10'])
  })

  test('paginateRows returns expected page slice', () => {
    const page2 = paginateRows(rows, 2, 2)
    expect(page2).toHaveLength(1)
    expect(page2[0].id).toBe('C-30')
  })

  test('convertType normalizes booleans and numbers', () => {
    expect(convertType(42)).toBe('42')
    expect(convertType(true)).toBe('1')
    expect(convertType(false)).toBe('-1')
  })
})
