import { describe, test, expect } from '@jest/globals'
import { TimeSeries } from '../src'

const NOW = new Date(Math.round(new Date().getTime() / 1000) * 1000)
const ONE_MINUTE_AGO = new Date(NOW.getTime() - (60 * 1000))

const NUMBER_RECORDS = [
  { timestamp: ONE_MINUTE_AGO, value: 1, quality: 192, annotation: 'comment' },
  { timestamp: NOW, value: 2 }
]

describe('properties', () => {
  test('get and set id', () => {
    const timeseries = new TimeSeries({ id: 'series_1' })
    expect(timeseries.id).toEqual('series_1')
    timeseries.id = 999
    expect(timeseries.id).toEqual(999)
  })

  test('get and set name', () => {
    const timeseries = new TimeSeries({ name: 'Series 1' })
    expect(timeseries.name).toEqual('Series 1')
    timeseries.name = 'Series 999'
    expect(timeseries.name).toEqual('Series 999')
  })

  test('get and set units', () => {
    const timeseries = new TimeSeries({ units: 'm/s' })
    expect(timeseries.units).toEqual('m/s')
    timeseries.units = 'm3/s'
    expect(timeseries.units).toEqual('m3/s')
  })

  test('get and set type', () => {
    const timeseries = new TimeSeries({ type: 'NUMBER' })
    expect(timeseries.type).toEqual('NUMBER')
    timeseries.type = 'TEXT'
    expect(timeseries.type).toEqual('TEXT')
  })

  test('get records', () => {
    const timeseries = new TimeSeries({ records: NUMBER_RECORDS })
    expect(timeseries.records.length).toEqual(NUMBER_RECORDS.length)
  })

  test('check length', () => {
    const timeseries = new TimeSeries({ records: NUMBER_RECORDS })
    expect(timeseries.length).toEqual(NUMBER_RECORDS.length)
  })

  test('get start record', () => {
    // console.log(timeseries.first())
    const timeseries = new TimeSeries({ records: NUMBER_RECORDS })
    expect(timeseries.first).toMatchObject(NUMBER_RECORDS[0])
  })

  test('get end record', () => {
    // console.log(timeseries.last())
    const timeseries = new TimeSeries({ records: NUMBER_RECORDS })
    expect(timeseries.last).toMatchObject(NUMBER_RECORDS[NUMBER_RECORDS.length - 1])
  })

  test('get timestamps', () => {
    // console.log(timeseries.last())
    const timeseries = new TimeSeries({ records: NUMBER_RECORDS })
    expect(timeseries.timestamps).toEqual([ONE_MINUTE_AGO, NOW])
  })

  test('get values', () => {
    // console.log(timeseries.last())
    const timeseries = new TimeSeries({ records: NUMBER_RECORDS })
    expect(timeseries.values).toEqual([1, 2])
  })

  test('get qualities', () => {
    // console.log(timeseries.last())
    const timeseries = new TimeSeries({ records: NUMBER_RECORDS })
    expect(timeseries.qualities).toEqual([192])
  })

  test('get annotations', () => {
    // console.log(timeseries.last())
    const timeseries = new TimeSeries({ records: NUMBER_RECORDS })
    expect(timeseries.annotations).toEqual(['comment'])
  })
})

describe('methods', () => {
  test('get JSON', () => {
    const timeseries = new TimeSeries({ id: 'series_1', name: 'Series 1', units: 'm/s', type: 'NUMBER', records: NUMBER_RECORDS })
    expect(JSON.stringify(timeseries.toJSON())).toEqual(JSON.stringify({
      id: 'series_1',
      name: 'Series 1',
      units: 'm/s',
      type: 'NUMBER',
      records: [
        { timestamp: NUMBER_RECORDS[0].timestamp.toISOString(), value: 1, quality: 192, annotation: 'comment' },
        {
          timestamp: NUMBER_RECORDS[1].timestamp.toISOString(),
          value: 2
        }
      ]
    }))
  })

  test('insert single record', () => {
    const timeseries = new TimeSeries({ records: NUMBER_RECORDS })
    timeseries.insert({ timestamp: NOW, value: 3 })
    expect(timeseries.length).toEqual(3)
  })

  test('insert multiple records', () => {
    const timeseries = new TimeSeries({ records: NUMBER_RECORDS })
    timeseries.insert([{ timestamp: NOW, value: 3 }, { timestamp: NOW, value: 4 }])
    expect(timeseries.length).toEqual(4)
  })

  test('sort', () => {
    const timeseries = new TimeSeries({
      records: [
        { timestamp: NOW, value: 2 },
        { timestamp: ONE_MINUTE_AGO, value: 1 }
      ]
    })
    expect(timeseries.sort().timestamps).toEqual([ONE_MINUTE_AGO, NOW])
  })

  test('clone timeseries', () => {
    // console.log(timeseries.last())
    const timeseries = new TimeSeries({ records: NUMBER_RECORDS })
    const cloned = timeseries.clone()
    expect(timeseries).toEqual(cloned)
    // add a record and ensure they are now different
    cloned.insert({ timestamp: NOW, value: 3 })
    expect(timeseries).not.toEqual(cloned)
  })

  test('deep clone timeseries with complex values', () => {
    const timeseries = new TimeSeries({ records: [{ timestamp: ONE_MINUTE_AGO, value: [1, 2] }, { timestamp: NOW, value: [3, 4] }] })
    const cloned = timeseries.clone()
    expect(timeseries).toEqual(cloned)
    // change a value within the cloned series and ensure it does not change the original
    const a = cloned.last
    // @ts-ignore
    a.value[1] = 5
    expect(timeseries.values).toEqual([[1, 2], [3, 4]])
  })
})

describe('data types', () => {
  test('NUMBER', () => {
    const timeseries = new TimeSeries({ type: 'NUMBER', id: 'series_1', records: [{ timestamp: NOW, value: 1.23 }] })
    expect(JSON.stringify(timeseries.toJSON())).toEqual(JSON.stringify({
      id: 'series_1',
      type: 'NUMBER',
      records: [
        {
          timestamp: NOW.toISOString(),
          value: 1.23
        }
      ]
    }))
  })

  test('TEXT', () => {
    const timeseries = new TimeSeries({ type: 'TEXT', id: 'series_1', records: [{ timestamp: NOW, value: 'Test value' }] })
    expect(JSON.stringify(timeseries.toJSON())).toEqual(JSON.stringify({
      id: 'series_1',
      type: 'TEXT',
      records: [
        {
          timestamp: NOW.toISOString(),
          value: 'Test value'
        }
      ]
    }))
  })

  test('TIME', () => {
    const timeseries = new TimeSeries({ type: 'TIME', id: 'series_1', records: [{ timestamp: NOW, value: NOW }] })
    expect(JSON.stringify(timeseries.toJSON())).toEqual(JSON.stringify({
      id: 'series_1',
      type: 'TIME',
      records: [
        {
          timestamp: NOW.toISOString(),
          value: NOW.toISOString()
        }
      ]
    }))
  })

  test('COORDINATES', () => {
    const timeseries = new TimeSeries({ type: 'COORDINATES', id: 'series_1', records: [{ timestamp: NOW, value: [123, 456] }] })
    expect(JSON.stringify(timeseries.toJSON())).toEqual(JSON.stringify({
      id: 'series_1',
      type: 'COORDINATES',
      records: [
        {
          timestamp: NOW.toISOString(),
          value: [123, 456]
        }
      ]
    }))
  })
})
