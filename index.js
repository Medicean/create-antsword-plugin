const UI = require('./libs/ui');
const CORE = require('./libs/core');

class Plugin {
  constructor(opt) {
      new UI(opt)
      .onCreate((argv) => {
        return new CORE(argv);
      })
  }
}

module.exports = Plugin;
