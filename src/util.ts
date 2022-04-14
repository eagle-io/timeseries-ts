export function generateRandomId () : string {
  return Math.random().toString(36).slice(2)
}

export function deepCopy<Type> (instance : Type) : Type {
  if (instance == null) {
    return instance
  }

  // handle Dates
  if (instance instanceof Date) {
    return new Date(instance.getTime()) as any
  }

  // handle Array types
  if (instance instanceof Array) {
    const cloneArr = [] as any[]
    (instance as any[]).forEach((value) => { cloneArr.push(value) })
    // for nested objects
    return cloneArr.map((value: any) => deepCopy<any>(value)) as any
  }

  // handle Objects
  if (instance instanceof Object) {
    const copyInstance = { ...(instance as { [key: string]: any }) } as { [key: string]: any }
    for (const attr in instance) {
      if (Object.prototype.hasOwnProperty.call(instance, attr)) {
        copyInstance[attr] = deepCopy<any>(instance[attr])
      }
    }

    return copyInstance as Type
  }

  // handling primitive data types
  return instance
}
