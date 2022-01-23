const Archiver = require('./Archiver')
const BookKeeper = require('./BookKeeper')
const { config, database } = require('./config')

const users = {}
const bk = new BookKeeper()
const db = new Archiver({ dbName: database.name, options: { errorFunction: err => bk.log('error', err) }})

for (let channel of config.channels)
    users[channel] = []

class User {
    constructor({ nick, user, host, access = '' }) {
        this.nick = nick
        if (user) this.user = user
        if (host) this.host = host
        this.access = ['', '%', '@', '&', '~'].indexOf(access) * 100

        this.checkOperatorStatus(host)

        return this
    }

    update({ nick, user, host, access, channels }) {
        if (nick) this.nick = nick
        if (user) this.user = user
        if (host) {
            this.host = host
            this.checkOperatorStatus(host)
        }

        return this
    }

    plus(mode, by, channel) {
        if (mode == 'v') return

        const issuer = users[channel].find(u => u.nick === by)

        if ('hoaq'.includes(mode)) {
            const newAccess = ('hoaq'.indexOf(mode) + 1) * 100

            // Check if the issuer is an operator and if it has a higher level the the issued
            if (this.isOperator && newAccess < this.access) {
                if (!issuer.isOperator || issuer.suspended) return
                if (this.access >= issuer.access) return
            }
            
            this.access = newAccess
        }
    }

    minus({ mode, by, channel, nick, host, channels }) {
        if (mode == 'v') return

        const issuer = users[channel].find(u => u.nick === by)

        if ('hoaq'.includes(mode)) {
            const sign = channels.find(c => c.endsWith(channel))[0],
                  newAccess = '+#'.includes(sign) ? 0 : ('%@&~'.indexOf(sign) + 1) * 100

            // Check if the issuer is an operator and if it has a higher level the the issued
            if (this.isOperator && newAccess < this.access) {
                if (!issuer.isOperator || issuer.suspended) return
                if (this.access >= issuer.access) return
            }

            this.access = newAccess
        }
    }

    checkOperatorStatus(host) {
        if (!host) return

        // Check in the database to see if this user has an access level
        const record = db.select('SELECT * FROM operators WHERE host = ?', [this.host])

        if (!record) return

        this.access = Math.max(this.access, +record.level)
        this.isOperator = true
        this.overseer = record.overseer
        this.suspended = record.suspended
    }

    resolve(initialObject) {
        this[initialObject.method](initialObject)
    }

    static find(nick) {
        return users.find(u => u.nick.toLowerCase() == nick.toLowerCase())
    }
}

module.exports = {
    User,
    users
}
