const fs = require('fs')
const { EOL } = require('os')
const { DateTime } = require('luxon')

class Logger {
    constructor(logFileName) {
        this.stream = fs.createWriteStream(logFileName, { flags: 'a' })
    }

    log(data) {
        this.stream.write(`(${data.author}) [${DateTime.now().toHTTP()}]: ${data.action}${EOL}`)
    }
}

module.exports = Logger
