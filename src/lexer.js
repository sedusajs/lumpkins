const moo = require('moo')

const identifier = require('./identifier')

const mainState = {
  escaped_backslash: '\\\\',
  escaped_lt: '\\<',
  escaped_expression_start: '\\{',
  tag: /<[A-Za-z0-9:\-_,]+>/,
  '{': {match: '{', push: 'expression'},
  text: {match: /[^]/u, lineBreaks: true}
}

const mainceptionState = Object.assign({
  escaped_pipe: '\\|',
  '|': {match: '|', pop: true}
}, mainState)

const expressionState = {
  '{': {match: '{', push: 'expression'},
  '}': {match: '}', pop: true},
  decimal_number: /(?:(?:[1-9][0-9]*(?:\.[0-9]*)?)|(?:0?\.[0-9]+)|0\.|0)(?:[eE][+-]?[0-9]+)?/,
  double_quoted_string: /"(?:\\.|[^"\\])*"/,
  single_quoted_string: /'(?:\\.|[^'\\])*'/,
  '+': '+',
  '-': '-',
  '.': '.',
  ',': ',',
  '**': '**',
  '*': '*',
  '/': '/',
  '%': '%',
  '<=': '<=',
  '>=': '>=',
  '<': '<',
  '>': '>',
  '!==': '!==',
  '!=': '!=',
  '===': '===',
  '==': '==',
  '(': '(',
  ')': ')',
  '[': '[',
  ']': ']',
  '!': '!',
  '???': '???',
  '??': '??',
  '?': '?',
  ':': ':',
  '|': {match: '|', push: 'mainception'},
  space: {match: /\s+/, lineBreaks: true},
  identifier: {
    match: identifier,
    keywords: {
      true: 'true',
      false: 'false',
      null: 'null',
      NaN: 'NaN',
      Infinity: 'Infinity',
      if: 'if',
      then: 'then',
      else: 'else',
      this: 'this',
      typeof: 'typeof',
      in: 'in',
      and: 'and',
      or: 'or'
    }}
}

const lexer = moo.states({
  main: mainState,
  expression: expressionState,
  mainception: mainceptionState
})

const proxyLexer = {
  save (...args) {
    return lexer.save(...args)
  },
  formatError (...args) {
    return lexer.formatError(...args)
  },
  reset (...args) {
    this.eof = false
    return lexer.reset(...args)
  },
  next (...args) {
    if (this.eof) {
      return undefined
    }
    const result = lexer.next(...args)
    if (result === undefined) {
      this.eof = true
      const token = {
        type: 'eof',
        value: 'end of input',
        toString () { return this.value },
        offset: lexer.index,
        lineBreaks: this.previousResult ? this.previousResult.lineBreaks : 1,
        line: lexer.line,
        col: lexer.col
      }
      return token
    }
    this.previousResult = result
    return result
  },
  has (tokenType) {
    if (tokenType === 'eof') return true
    return lexer.has(tokenType)
  },
  previousResult: undefined,
  eof: false
}

module.exports = proxyLexer
