import * as util from './util'

export interface ITimeSeriesRecord<Type> {
  timestamp: Date;
  value?: Type;
  quality?: number;
  annotation?: string;
}

export type TimeSeriesDataType = 'NUMBER' | 'TEXT' | 'TIME' | 'COORDINATES'

export interface ITimeSeriesProps<Type> {
  records?: ITimeSeriesRecord<Type>[];
  id?: string | number;
  name?: string;
  units?: string;
  type?: TimeSeriesDataType;
}

export interface ITimeSeriesRecordJson<Type> {
  timestamp: string;
  value?: Type | string | null;
  quality?: number;
  annotation?: string;
}

export interface ITimeSeriesJson<Type> {
  records: ITimeSeriesRecordJson<Type>[];
  id: string | number;
  name?: string;
  units?: string;
  type?: string;
}

export interface ITimeSeries<Type> {
  id: string | number;
  name: string | undefined;
  units: string | undefined;
  type: string | undefined;
  length: number;
  values: (Type | null)[];
  records: ITimeSeriesRecord<Type>[];
  first: ITimeSeriesRecord<Type>;
  last: ITimeSeriesRecord<Type>;
  toJSON(): ITimeSeriesJson<Type>;
  sort(): void;
  clone(): ITimeSeries<Type>;
}

export class TimeSeries<Type> implements ITimeSeries<Type> {
  private _records: ITimeSeriesRecord<Type>[]
  private _id: string | number
  private _name: string | undefined
  private _units: string | undefined
  private _type: TimeSeriesDataType | undefined

  constructor (props?: ITimeSeriesProps<Type>) {
    // clone original data structure
    this._records = this.cloneRecords(props?.records || [])
    this._id = props?.id !== undefined ? props.id : util.generateRandomId()
    this._name = props?.name
    this._units = props?.units
    this._type = props?.type
  }

  // PROPERTIES
  get id (): string | number {
    return this._id
  }

  set id (val: string | number) {
    this._id = val
  }

  get name (): string | undefined {
    return this._name
  }

  set name (val: string | undefined) {
    this._name = val
  }

  get units (): string | undefined {
    return this._units
  }

  set units (val: string | undefined) {
    this._units = val
  }

  get type (): TimeSeriesDataType | undefined {
    return this._type
  }

  set type (val: TimeSeriesDataType | undefined) {
    this._type = val
  }

  get length (): number {
    // number of records in series
    return this._records.length
  }

  get first (): ITimeSeriesRecord<Type> {
    return this._records[0] || null
  }

  get last (): ITimeSeriesRecord<Type> {
    return this._records[this.length - 1] || null
  }

  get records (): ITimeSeriesRecord<Type>[] {
    return this._records
  }

  get timestamps (): Date[] {
    return this._records.map((record) => record.timestamp)
  }

  get values (): (Type | null)[] {
    return this._records.map((record) => record.value).filter(attr => attr !== undefined) as Type[]
  }

  get qualities (): (number | null)[] {
    return this._records.map((record) => record.quality).filter(attr => attr !== undefined) as number[]
  }

  get annotations (): (string | null)[] {
    return this._records.map((record) => record.annotation).filter(attr => attr !== undefined) as string[]
  }

  // METHODS
  public toJSON (): ITimeSeriesJson<Type> {
    return {
      id: this._id,
      ...(this._name ? { name: this._name } : null),
      ...(this._units ? { units: this._units } : null),
      ...(this._type ? { type: this._type } : null),
      records: this._records.map(record => this.recordToJSON(record))
    }
  }

  public insert (records: ITimeSeriesRecord<Type> | ITimeSeriesRecord<Type>[]): TimeSeries<Type> {
    if (!Array.isArray(records)) { records = [records] }
    this._records.push(...records)
    return this
  }

  public sort (): TimeSeries<Type> {
    this._records.sort((a: ITimeSeriesRecord<Type>, b: ITimeSeriesRecord<Type>) => a.timestamp.getTime() - b.timestamp.getTime())
    return this
  }

  public clone (): TimeSeries<Type> {
    return new TimeSeries<Type>({ id: this._id, records: this._records })
  }

  private recordToJSON (record: ITimeSeriesRecord<Type>): ITimeSeriesRecordJson<Type> {
    const { value, quality, annotation } = record
    const jsonValue = this.valueToJSON(value)
    return {
      timestamp: record.timestamp.toISOString(),
      ...(jsonValue !== undefined ? { value: jsonValue } : null),
      ...(quality !== undefined ? { quality } : null),
      ...(annotation !== undefined ? { annotation } : null)
    }
  }

  private valueToJSON (value: Type | undefined): Type | undefined | string | null {
    if ((value == null || (!this.type))) { return value }
    if (this.type === 'TIME') {
      return (value as unknown as Date).toISOString?.() || 'invalid date'
    }
    return value
  }

  private cloneRecords (records: ITimeSeriesRecord<Type>[]): ITimeSeriesRecord<Type>[] {
    return records.map(record => util.deepCopy(record))
  }
}
