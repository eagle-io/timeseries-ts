# Time Series

[![npm version](https://badge.fury.io/js/@eagle-io%2Ftimeseries.svg)](https://badge.fury.io/js/@eagle-io%2Ftimeseries)
[![npm](https://img.shields.io/npm/l/@eagle-io/timeseries.svg?style=flat-square)](https://github.com/eagle-io/timeseries/blob/master/LICENSE)

> Time Series data construction, manipulation and serialisation.

## Installation

Install for use in NodeJS

```shell
npm install @eagle-io/timeseries
```

Import or require module
```js
// ESM import
import { TimeSeries, JtsDocument } from '@eagle-io/timeseries'

// CommonJS 
const { TimeSeries, JtsDocument } = require('@eagle-io/timeseries')
```

## Usage
```js
// Create Time Series
const timeseries = new TimeSeries({
    type: 'NUMBER',
    records: [
        {
            timestamp: new Date(),
            value: 10,
            quality: 192,
            annotation: 'example comment'
        },
        { 
            timestamp: new Date('2022-04-13T00:00:00.000Z'),
            value: 20
        }
    ]
})

// Add record(s)
timeseries.insert({ timestamp: new Date('2022-04-14T00:00:00.000Z'), value: 30 })

// Output in JSON Time Series document format
const jtsDocument = new JtsDocument({ series: [timeseries] })
jtsDocument.toJSON()
````

## TimeSeries
`TimeSeries` is a class for constructing and manipulating a single dataset.

```js
const timeseries = new TimeSeries({
    type: 'NUMBER',
    id: 'series_1',
    name: 'My Series',
    units: 'm/s',
    records: [
        {
            timestamp: new Date(),
            value: 1.23,
            quality: 0,
            annotation: 'example comment'
        }
    ]
})
```
### Options
Optionally provide configuration used for certain output formats such as JTS Document. 
- `type`: data type of record **value** attribute. `NUMBER | TEXT | TIME | COORDINATES`
- `id`: string or number to uniquely identify the series to use instead of the automatically assigned id.
- `name`: string
- `units`: string
- `records`: array of data records
  
Alternatively set later:
```js
timeseries.type = 'NUMBER'
timeseries.id = 'Series_1'
timeseries.name = 'My Series'
timeseries.units = 'm/s'
```

### Record attributes
Records require a timestamp and at least one attribute: value, quality or annotation
- `timestamp`: date object. Strings must be converted as required. e.g.`new Date('2022-03-29T00:00:00.000Z')`
- `value` *(optional)*:  number, string, date, array, null
- `quality` *(optional)*: number (quality code) associated with value
- `annotation` (optional): string description or comment related to the record

### Methods


```js
// Output as JSON
timeseries.toJSON()

// Insert single record
timeseries.insert({timestamp: new Date(), value: 30})

// Insert multiple records
timeseries.insert([{timestamp: new Date('2022-03-28T03:45:59.000Z'), value: 30}, {timestamp: new Date(), value: 40}])

// Sort records in ascending chronological order
timeseries.sort()

// Clone timeseries
const timeseriesCopy = timeseries.clone()
````

### Properties


```js
// Record count
timeseries.length

// First record
timeseries.first

// Last record
timeseries.last

// Array of timestamps
timeseries.timestamps // [Date, Date]

// Array of values
timeseries.values // [10, 20]

// Array of qualities
timeseries.qualities // [192]

// Array of annotations
timeseries.annotations // ['example comment']
````



## JTS Document

`JtsDocument` is a class for outputting `TimeSeries` in 
[JSON Time Series](https://docs.eagle.io/en/latest/reference/historic/jts.html) document format.


```js
// Create a JTS Document from one or more timeseries
const jtsDocument = new JtsDocument({ series: [timeseries1, timeseries2] })
// Output series in JTS Document format
jtsDocument.toJSON()
```

### Options

- `series`: array of `TimeSeries` to include in JTS Document

### Methods
```js
// Output as formatted JSON
jtsDocument.toJSON()

// Output as stringified JSON
jtsDocument.toString()

// Add single series
jtsDocument.addSeries(timeseries1)

// Add multiple series
jtsDocument.addSeries([timeseries1, timeseries2])

// Get series by id
jtsDocument.getSeries('series_2') // timeseries2

// Clone document (also clones series)
jtsDocument.clone()

// Create a new jtsDocument from JSON
const jtsDocument = JtsDocument.from('{"docType": "jts", ...}')
````

### Properties
```js
// Get JTS specification version number
jtsDocument.version // 1

// Get array of timeseries
jtsDocument.series // [timeseries1, timeseries2]
```

## License
[MIT](https://github.com/eagle-io/timeseries/blob/master/LICENSE)
