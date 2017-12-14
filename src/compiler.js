const {Parser, Grammar} = require('nearley')

const {Program} = require('./program')

const compiledGrammar = require('./grammar')
const grammar = Grammar.fromCompiled(compiledGrammar)

class Compiler {
  constructor (input) {
    if (typeof input !== 'string' && typeof input !== 'undefined') {
      throw new TypeError('input must be either a string or omitted.')
    }
    this.parser = new Parser(grammar)
    this.finished = false
    if (typeof input === 'string') {
      this.feed(input)
    }
  }

  feed (input) {
    if (this.finished) throw new Error('finish() has been called on this Compiler instance')
    if (typeof input !== 'string') {
      throw new TypeError('input must be a string')
    }
    this.parser.feed(input)
    return this
  }

  finish (input) {
    if (this.finished) return

    if (typeof input === 'string') {
      this.feed(input)
    } else if (typeof input !== 'undefined') {
      throw new TypeError('input must be either a string or omitted.')
    }

    this.finished = true
    this.parser.finish()

    if (this.parser.results.length === 0) {
      throw new Error('Unexpected end of input')
    } else if (this.parser.results.length > 1) {
      throw new Error(`You've encountered a bug in the parser. There are ${this.parser.results.length} possible parsings when there should be only 1 `)
    } else if (this.parser.results.length === 1) {
      return new Program(this.parser.results[0])
    } else {
      throw new Error('The parser returned unexpected results')
    }
  }
}

module.exports = {
  Compiler
}
