const { User } = require('./User')

class InBetween {
    pending = []

    constructor() {}

    add({ initialObject, callback }) {
        this.pending.push({ initialObject, callback })
    }

    resolve(whois) {
        if (!this.pending.length) return

        const entity = this.pending[0]

        entity.initialObject.whois = whois

        // An user was passed
        if (entity.callback instanceof User)
            entity.callback.resolve(entity.initialObject)

        // Remove the pending instruction
        this.pending.shift()
    }
}

module.exports = InBetween
