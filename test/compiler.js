const test = require('ava')
const compiler = require('../src/compiler')

const validSyntax = [
  "I'm Fuzzy Lumpkins!",
  '',
  '0',
  ' ',
  '🍔'
]

test('module should export an object', t => {
  t.is(typeof compiler, 'object')
})

test('module export should contain the Compiler constructor', t => {
  t.is(typeof compiler.Compiler, 'function')
})

test('constructor should accept an omitted input parameter', t => {
  t.notThrows(() => new compiler.Compiler())
  t.notThrows(() => new compiler.Compiler(undefined))
})

function constructorAccepts (t, input) {
  t.notThrows(() => new compiler.Compiler(input))
}

constructorAccepts.title =
  (providedTitle, input) => `constructor should accept a string input parameter (${input})`

for (const str of validSyntax) {
  test(constructorAccepts, str)
}

function constructorThrows (t, input) {
  t.throws(() => new compiler.Compiler(input))
}

constructorThrows.title =
  (providedTitle, input, stringValue) => `constructor should throw on a(n) ${typeof input} input (${stringValue || String(input)})`

test(constructorThrows, true)
test(constructorThrows, false)
test(constructorThrows, 0)
test(constructorThrows, 1)
test(constructorThrows, {}, '{}')
test(constructorThrows, [], '[]')
test(constructorThrows, ["I'm Fuzzy Lumpkins"], `["I'm Fuzzy Lumpkins"]`)
test(constructorThrows, function () {})
test(constructorThrows, null)
test(constructorThrows, Symbol('fuzzy'))
test(constructorThrows, new String("I'm Fuzzy Lumpkins"), `new String("I'm Fuzzy Lumpkins")`) // eslint-disable-line no-new-wrappers

test('constructor should set the `finished` property to false', t => {
  t.false((new compiler.Compiler()).finished)
})

function feedAccepts (t, input) {
  t.notThrows(() => (new compiler.Compiler()).feed(input))
}

feedAccepts.title =
  (providedTitle, input) => `feed() should accept a string input parameter (${input})`

for (const str of validSyntax) {
  test(feedAccepts, str)
}

function feedThrows (t, input) {
  t.throws(() => (new compiler.Compiler()).feed(input))
}

feedThrows.title =
  (providedTitle, input, stringValue) => `feed() should throw on a(n) ${typeof input} input (${stringValue || String(input)})`

test(feedThrows, void 0)
test(feedThrows, true)
test(feedThrows, false)
test(feedThrows, 0)
test(feedThrows, 1)
test(feedThrows, {}, '{}')
test(feedThrows, [], '[]')
test(feedThrows, ["I'm Fuzzy Lumpkins"], `["I'm Fuzzy Lumpkins"]`)
test(feedThrows, function () {})
test(feedThrows, null)
test(feedThrows, Symbol('fuzzy'))
test(feedThrows, new String("I'm Fuzzy Lumpkins"), `new String("I'm Fuzzy Lumpkins")`) // eslint-disable-line no-new-wrappers

test('feed() should return the Compiler instance', t => {
  const instance = new compiler.Compiler()
  t.is(instance.feed(validSyntax[0]), instance)
})
