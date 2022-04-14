import { describe, test, expect } from '@jest/globals'
import { TimeSeries, JtsDocument } from '../src'

const NOW = new Date(Math.round(new Date().getTime() / 1000) * 1000)
const ONE_MINUTE_AGO = new Date(NOW.getTime() - (60 * 1000))

const NUMBER_RECORDS = [
  { timestamp: ONE_MINUTE_AGO, value: 1, quality: 192, annotation: 'comment' },
  { timestamp: NOW, value: null }
]

const TEXT_RECORDS = [
  { timestamp: ONE_MINUTE_AGO, value: 'Test value', quality: 192, annotation: 'comment' },
  { timestamp: NOW, value: null }
]

const TIME_RECORDS = [
  { timestamp: ONE_MINUTE_AGO, value: ONE_MINUTE_AGO, quality: 192, annotation: 'comment' },
  { timestamp: NOW, value: null }
]

const COORDINATES_RECORDS = [
  { timestamp: ONE_MINUTE_AGO, value: [100, 200], quality: 192, annotation: 'comment' },
  { timestamp: NOW, value: null }
]

describe('properties', () => {
  test('get version', () => {
    const jtsDocument = new JtsDocument()
    expect(jtsDocument.version).toEqual(1)
  })

  test('get series', () => {
    const jtsDocument = new JtsDocument({ series: [new TimeSeries({ id: 'series_1', records: NUMBER_RECORDS })] })
    expect(jtsDocument.series.length).toEqual(1)
  })
})

describe('methods', () => {
  test('add single series', () => {
    const jtsDocument = new JtsDocument()
    jtsDocument.addSeries(new TimeSeries({ id: 'series_1', records: NUMBER_RECORDS }))
    expect(jtsDocument.series.length).toEqual(1)
  })

  test('add multiple series', () => {
    const jtsDocument = new JtsDocument()
    jtsDocument.addSeries([new TimeSeries({ id: 'series_1', records: NUMBER_RECORDS }), new TimeSeries({ id: 'series_2', records: NUMBER_RECORDS })])
    expect(jtsDocument.series.length).toEqual(2)
  })

  test('get series by id', () => {
    const jtsDocument = new JtsDocument()
    jtsDocument.addSeries([new TimeSeries({ id: 'series_1', records: NUMBER_RECORDS }), new TimeSeries({ id: 'series_2', records: NUMBER_RECORDS })])
    expect(jtsDocument.getSeries('series_1')?.length).toEqual(NUMBER_RECORDS.length)
  })

  test('clone jts document and series', () => {
    // console.log(timeseries.last())
    const timeseries = new TimeSeries({ records: NUMBER_RECORDS })
    const jtsDocument = new JtsDocument({ series: [timeseries] })
    const jtsDocumentCloned = jtsDocument.clone()
    expect(jtsDocument).toEqual(jtsDocumentCloned)
    // add a record to timeseries associate with original jts document and ensure they are now different
    timeseries.insert({ timestamp: NOW, value: 3 })
    expect(jtsDocument).not.toEqual(jtsDocumentCloned)
  })

  test('get JSON and toString', () => {
    const timeseries1 = new TimeSeries({ id: 'series_1', name: 'Series 1', type: 'NUMBER', units: 'm/s', records: NUMBER_RECORDS })
    const timeseries2 = new TimeSeries({ id: 'series_2', name: 'Series 2', type: 'TEXT', records: TEXT_RECORDS })
    const jtsDocument = new JtsDocument({ series: [timeseries1, timeseries2] })
    const jts = jtsDocument.toJSON()
    expect(jts).toMatchObject({ docType: 'jts', version: '1.0' })
    expect(jtsDocument.toString()).toEqual(JSON.stringify(jts))
  })
})

describe('static methods', () => {
  test('construct from JSON', () => {
    expect(() => JtsDocument.from('')).toThrow()
    const jtsDocument = new JtsDocument()
    jtsDocument.addSeries(new TimeSeries({ type: 'NUMBER', records: NUMBER_RECORDS }))
    jtsDocument.addSeries(new TimeSeries({ type: 'TEXT', records: TEXT_RECORDS }))
    jtsDocument.addSeries(new TimeSeries({ type: 'TIME', records: TIME_RECORDS }))
    jtsDocument.addSeries(new TimeSeries({ type: 'COORDINATES', records: COORDINATES_RECORDS }))
    const jtsDocument2 = JtsDocument.from(jtsDocument.toJSON()) || new JtsDocument()
    expect(jtsDocument).toEqual(jtsDocument2)
    expect(jtsDocument.toString()).toEqual(jtsDocument2.toString())
  })
})

describe('data types', () => {
  test('NUMBER', () => {
    const timeseries1 = new TimeSeries({ id: 'series_1', name: 'Series 1', type: 'NUMBER', records: [{ timestamp: ONE_MINUTE_AGO, value: '1.23', quality: 192, annotation: 'comment' }] })
    const jtsDocument = new JtsDocument({ series: [timeseries1] })
    const jts = jtsDocument.toJSON()
    expect(JSON.stringify(jts)).toEqual(JSON.stringify({
      docType: 'jts',
      subType: 'TIMESERIES',
      version: '1.0',
      header: {
        startTime: ONE_MINUTE_AGO.toISOString(),
        endTime: ONE_MINUTE_AGO.toISOString(),
        recordCount: 1,
        columns: {
          0: {
            id: 'series_1',
            name: 'Series 1',
            dataType: 'NUMBER'
          }
        }
      },
      data: [
        {
          ts: ONE_MINUTE_AGO.toISOString(),
          f: {
            0: {
              v: 1.23,
              q: 192,
              a: 'comment'
            }
          }
        }
      ]
    }))
  })

  test('TEXT', () => {
    const timeseries1 = new TimeSeries({ id: 'series_1', name: 'Series 1', type: 'TEXT', records: [{ timestamp: ONE_MINUTE_AGO, value: 1.23, quality: 192, annotation: 'comment' }] })
    const jtsDocument = new JtsDocument({ series: [timeseries1] })
    const jts = jtsDocument.toJSON()
    expect(JSON.stringify(jts)).toEqual(JSON.stringify({
      docType: 'jts',
      subType: 'TIMESERIES',
      version: '1.0',
      header: {
        startTime: ONE_MINUTE_AGO.toISOString(),
        endTime: ONE_MINUTE_AGO.toISOString(),
        recordCount: 1,
        columns: {
          0: {
            id: 'series_1',
            name: 'Series 1',
            dataType: 'TEXT'
          }
        }
      },
      data: [
        {
          ts: ONE_MINUTE_AGO.toISOString(),
          f: {
            0: {
              v: '1.23',
              q: 192,
              a: 'comment'
            }
          }
        }
      ]
    }))
  })

  test('TIME', () => {
    const timeseries1 = new TimeSeries({ id: 'series_1', name: 'Series 1', type: 'TIME', records: TIME_RECORDS })
    const jtsDocument = new JtsDocument({ series: [timeseries1] })
    const jts = jtsDocument.toJSON()
    expect(JSON.stringify(jts)).toEqual(JSON.stringify({
      docType: 'jts',
      subType: 'TIMESERIES',
      version: '1.0',
      header: {
        startTime: ONE_MINUTE_AGO.toISOString(),
        endTime: NOW.toISOString(),
        recordCount: 2,
        columns: {
          0: {
            id: 'series_1',
            name: 'Series 1',
            dataType: 'TIME'
          }
        }
      },
      data: [
        {
          ts: ONE_MINUTE_AGO.toISOString(),
          f: {
            0: {
              v: {
                $time: ONE_MINUTE_AGO.toISOString()
              },
              q: 192,
              a: 'comment'
            }
          }
        },
        {
          ts: NOW.toISOString(),
          f: {
            0: {
              v: null
            }
          }
        }
      ]
    }))
  })

  test('COORDINATES', () => {
    const timeseries1 = new TimeSeries({ id: 'series_1', name: 'Series 1', type: 'COORDINATES', records: COORDINATES_RECORDS })
    const jtsDocument = new JtsDocument({ series: [timeseries1] })
    const jts = jtsDocument.toJSON()
    expect(JSON.stringify(jts)).toEqual(JSON.stringify({
      docType: 'jts',
      subType: 'TIMESERIES',
      version: '1.0',
      header: {
        startTime: ONE_MINUTE_AGO.toISOString(),
        endTime: NOW.toISOString(),
        recordCount: 2,
        columns: {
          0: {
            id: 'series_1',
            name: 'Series 1',
            dataType: 'COORDINATES'
          }
        }
      },
      data: [
        {
          ts: ONE_MINUTE_AGO.toISOString(),
          f: {
            0: {
              v: {
                $coords: [100, 200]
              },
              q: 192,
              a: 'comment'
            }
          }
        },
        {
          ts: NOW.toISOString(),
          f: {
            0: {
              v: null
            }
          }
        }
      ]
    }))
  })
})
