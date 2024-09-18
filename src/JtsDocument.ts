import { TimeSeries, ITimeSeries, ITimeSeriesRecord, TimeSeriesDataType } from './TimeSeries'
import * as util from './util'

interface IJtsDocumentHeaderColumn {
  id: string | number;
  name?: string;
  units?: string;
  dataType?: string;
}

interface IJtsDocumentHeader {
  startTime: string | null;
  endTime: string | null;
  recordCount: number;
  columns: {
    [key: string]: IJtsDocumentHeaderColumn;
  }
}

interface IJtsDocumentDataColumn {
  v?: unknown;
  q?: number;
  a?: string;
}

interface IJtsDocumentData {
  ts: string;
  f: {
    [key: string]: IJtsDocumentDataColumn;
  }
}

export interface IJtsDocument {
  docType: string;
  subType?: string;
  version: string;
  header?: IJtsDocumentHeader;
  data: IJtsDocumentData[];
}

export interface IJtsDocumentProps {
  series?: ITimeSeries<unknown>[];
  version?: number;
}

export class JtsDocument {
  private readonly _version: number
  private _series: ITimeSeries<unknown>[]

  constructor (props?: IJtsDocumentProps) {
    this._version = 1
    this._series = props?.series || []
  }

  // PROPERTIES
  get version (): number {
    return this._version
  }

  get series (): ITimeSeries<unknown>[] {
    return this._series
  }

  // STATIC METHODS
  public static from (json: string | object): JtsDocument | null {
    // Construct JtsDocument from JSON
    json = util.deepCopy(json)
    if (typeof json === 'string') {
      json = JSON.parse(json || '{}')
    } else if (typeof json !== 'object') return null
    // validate document type and required fields
    const validationError = this.validateJSON(json as IJtsDocument)
    if (validationError) { throw new Error(`Invalid JTS Document JSON: ${validationError}`) }
    return this.parse(json as IJtsDocument)
  }

  private static parse (jts: IJtsDocument): JtsDocument {
    // method to validate json conforms to JTS Document spec
    const columnSeries: { [key: string]: TimeSeries<unknown> } = {}

    // build series from header columns
    for (const columnIndex in jts.header?.columns) {
      const column = jts.header?.columns[columnIndex]
      if (column == null) { continue }
      const { id, name, dataType } = column
      columnSeries[columnIndex] = new TimeSeries({ id, name, type: (dataType || 'NUMBER') as TimeSeriesDataType })
    }

    // add records to corresponding series
    (jts.data || []).forEach((record) => {
      const timestamp = new Date(record.ts)
      if (isNaN(timestamp.valueOf())) return
      if (!Object.keys(record.f || {}).length) return
      for (const columnIndex in record.f) {
        // ensure column series exists or add it (may not have been included in header)
        if (!columnSeries[columnIndex]) {
          columnSeries[columnIndex] = new TimeSeries()
        }
        const seriesRecord = this.getTimeSeriesRecordFromDataColumn({ timestamp, dataColumn: record.f[columnIndex], type: columnSeries[columnIndex].type })
        columnSeries[columnIndex].insert(seriesRecord)
      }
    })
    const version = Number(jts.version) | 1
    return new JtsDocument({ version, series: Object.values(columnSeries) })
  }

  private static getTimeSeriesRecordFromDataColumn (props: { timestamp: Date, dataColumn: IJtsDocumentDataColumn, type?: string}): ITimeSeriesRecord<unknown> {
    const record: ITimeSeriesRecord<unknown> = { timestamp: props.timestamp, quality: props.dataColumn.q, annotation: props.dataColumn.a }
    record.value = ((v, type) => {
      if (v == null) { return v }
      switch (type) {
        case 'NUMBER': return Number(v)
        case 'TEXT': return String(v)
        case 'TIME': return (v as {$time: string})?.$time ? (new Date((v as {$time: string}).$time)) : null
        case 'COORDINATES': return (v as { $coords: number[] })?.$coords ? (v as { $coords: number[] }).$coords : null
        default: return v
      }
    })(props.dataColumn.v, props.type)
    return record
  }

  private static validateJSON (jts: IJtsDocument): string | null {
    // method to validate json conforms to JTS Document spec
    if (typeof jts !== 'object') { return 'object required' }
    if (jts.docType !== 'jts') { return 'invalid docType' }
    if (jts.version && Number(jts.version) !== 1) { return 'version 1.0 expected' }
    return null
  }

  // private static isValid (jts: IJtsDocument): boolean {
  //   const errorMessage = this.validateJSON(jts)
  //   return !errorMessage
  // }

  // METHODS
  public addSeries (series: ITimeSeries<unknown> | ITimeSeries<unknown>[]): JtsDocument {
    if (!Array.isArray(series)) { series = [series] }
    this._series.push(...series)
    return this
  }

  public getSeries (seriesId: string | number): ITimeSeries<unknown> | undefined {
    return this.getSeriesById(seriesId)
  }

  public clone (): JtsDocument {
    // clone JTS Document and its series
    return new JtsDocument({
      version: this._version,
      series: this._series.map(series => series.clone())
    })
  }

  public toJSON (): IJtsDocument {
    return this.build()
  }

  public toString (): string {
    return JSON.stringify(this.toJSON())
  }

  private build (): IJtsDocument {
    const data = this.getData()
    return {
      docType: 'jts',
      subType: 'TIMESERIES',
      version: this._version.toFixed(1),
      header: this.getHeader(data),
      data
    }
  }

  private getData (): IJtsDocumentData[] {
    const _this = this
    const recordMap: {[key: string]: IJtsDocumentData } = {}
    this._series.forEach(function (series, seriesIndex) {
      series.records.forEach(function (record) {
        if (record.value === undefined && record.annotation === undefined && record.quality === undefined) return
        const key = record.timestamp.valueOf()
        if (!recordMap[key]) {
          recordMap[key] = { ts: record.timestamp.toISOString(), f: {} }
        }
        recordMap[key].f[seriesIndex] = _this.getDataColumnFromRecord({ record, type: series.type })
      })
    })
    const recordMapKeys = Object.keys(recordMap).sort((a: string, b: string) => Number(a) - Number(b))
    return recordMapKeys.map(key => recordMap[key])
  }

  private getHeader (data: IJtsDocumentData[] = []): IJtsDocumentHeader {
    return {
      startTime: data[0]?.ts || null,
      endTime: data[data.length - 1]?.ts || null,
      recordCount: data.length,
      columns: this.getHeaderColumns()
    }
  }

  private getHeaderColumns (): any {
    const columns: { [key: string]: IJtsDocumentHeaderColumn } = {}
    this._series.forEach(function (series, seriesIndex) {
      columns[seriesIndex] = {
        id: series.id,
        ...(series.name !== undefined ? { name: series.name } : null),
        ...(series.type !== undefined ? { dataType: series.type } : null),
        ...(series.units !== undefined ? { units: series.units } : null)
      }
    })
    return columns
  }

  private getDataColumnFromRecord (props: { record: ITimeSeriesRecord<unknown>, type?: string}): IJtsDocumentDataColumn {
    const { value, quality, annotation } = props.record
    const v = ((v, type) => {
      if (v == null) { return v }
      switch (type) {
        case 'NUMBER': return Number(v)
        case 'TEXT': return String(v)
        case 'TIME': return { $time: (v as Date).toISOString?.() || 'invalid date' }
        case 'COORDINATES': return { $coords: ((v as Array<number>).length === 2 ? v : []) }
        default: return v
      }
    })(value, props.type)

    return {
      ...(v !== undefined ? { v } : null),
      ...(quality !== undefined ? { q: quality } : null),
      ...(annotation !== undefined ? { a: annotation } : null)
    }
  }

  private getSeriesById (seriesId: string | number): ITimeSeries<unknown> | undefined {
    return this._series.find(series => series.id === seriesId)
  }
}
