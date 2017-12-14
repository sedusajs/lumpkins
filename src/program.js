class Program {
  constructor (script) {
    this.script = script
  }

  execute () {
    return (new Function(`return ${this.script}`))() // eslint-disable-line no-new-func
  }
}

module.exports = {
  Program
}
