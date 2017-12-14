class Interpolation {
  constructor () {
    this.items = []
  }

  static text (text) {
    return {type: 'text', output: text}
  }

  static tag (tag) {
    return {type: 'tag', output: tag}
  }

  static expression (expression) {
    return {type: 'expression', output: expression}
  }

  lastItem () {
    const items = this.items
    if (items.length === 0) {
      return undefined
    }
    return items[items.length - 1]
  }

  lastItemType () {
    const lastItem = this.lastItem()
    if (lastItem) {
      return lastItem.type
    }
    return undefined
  }

  add (item) {
    if (item.type === 'text' && this.lastItemType() === 'text') {
      this.lastItem().output += item.output
    } else {
      this.items.push(item)
    }
    return this
  }

  join () {
    return this.items.map(({type, output}) => {
      if (type === 'text') {
        return JSON.stringify(output)
      }
      return `String(${output})`
    }).join(' + ')
  }
}

const emitter = {
  emitTag (tag, info = {}) {
    const tagValue = String(tag).substr(1, String(tag).length - 2)
    return `(runtime.resolveTag(${JSON.stringify(tagValue)}, ${JSON.stringify(info)}))`
  },

  emitExpression (expression) {
    return `(${expression})`
  },

  emitExponentative (op1, op2) {
    return `((${op1}) ** (${op2}))`
  },

  emitUnaryMinus (expression) {
    return `(-(${expression}))`
  },

  emitUnaryPlus (expression) {
    return `(+(${expression}))`
  },

  emitNegation (expression) {
    return `(!(${expression}))`
  },

  emitGetType (expression) {
    return `(runtime.getType(${expression}))`
  },

  emitPropertyGet (object, propertyName, throws = true) {
    return `(runtime.propertyGet(${object}, ${JSON.stringify(propertyName)}, ${String(throws)}))`
  },

  emitPropertyGetDynamic (object, propertyNameExpr, throws = true) {
    return `(runtime.propertyGet(${object}, ${propertyNameExpr}, ${String(throws)}))`
  },

  emitConditional (condition, ifTrue, ifFalse) {
    return `((${condition}) ? (${ifTrue}) : (${ifFalse}))`
  },

  emitGlobalPropertyGet (propertyName, info = {}) {
    return `(runtime.globalPropertyGet(${JSON.stringify(propertyName)}, ${JSON.stringify(info)}))`
  },

  emitString (string) {
    return `(${string})`
  },

  emitNull () {
    return '(null)'
  },

  emitTrue () {
    return '(true)'
  },

  emitFalse () {
    return '(false)'
  },

  emitNaN () {
    return '(NaN)'
  },

  emitInfinity () {
    return '(Infinity)'
  },

  emitVoid () {
    return '(void 0)'
  },

  emitDecimal (number, info = {}) {
    this.tryParseDecimal(number, info)
    return `(${String(number)})`
  },

  tryParseDecimal (number, info = {}) {
    try {
      return parseFloat(number)
    } catch (e) {
      e.info = info
      throw e
    }
  },

  Interpolation
}

module.exports = emitter
