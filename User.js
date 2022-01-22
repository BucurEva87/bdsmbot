const Archiver = require('./Archiver')
const BookKeeper = require('./BookKeeper')
const { config, database } = require('./config')

const users = {}
const bk = new BookKeeper()
const db = new Archiver({ dbName: database.name, options: { errorFunction: err => bk.log('error', err) }})

for (let channel of config.channels)
    users[channel] = []

class User {
    constructor({ nick, access }) {
        this.nick = nick
        if (access)
            this.access = Math.max(['', '%', '@', '&', '~'].indexOf(access), 0) * 100
        else
            this.access = 0

        return this
    }

    update({ nick, access, user, host, whois }) {
        if (!this.nick) this.nick = nick || whois?.nick
        if (!this.user) this.user = user || whois?.user
        if (!this.host) this.host = host || whois?.host

        // console.log(nick, access, user, host, whois)

        if (access || access === '') {
            // Check in the database to see if this user has an access level
            const record = db.select('SELECT * FROM operators WHERE host = ?', [this.host])

            if (record) {
                this.isOperator = true
                this.suspended = record.suspended
            }
            
            const storedAccess = record?.level || 0

            if (!Number.isNaN(Number(access))) 
                this.access = Math.max(Number(access), storedAccess)
            else
                this.access = Math.max(Math.max(['', '%', '@', '&', '~'].indexOf(access), 0) * 100, storedAccess)

            if (record?.suspended) this.access = 0

            console.log(this.nick, this.access)
        }

        return this
    }

    plus(mode) {
        if (mode == 'v') return

        if ('hoaq'.includes(mode)) {
            const newAccess = '%@&~'['hoaq'.indexOf(mode)]

            if (('%@&~'.indexOf(newAccess) + 1) * 100 > this.access)
                this.update({ access: '%@&~'['hoaq'.indexOf(mode)] })
            return
        }
    }

    minus({ args, whois }) {
        if (args.mode == 'v') return

        if ('hoaq'.includes(args.mode)) {
            var sign = whois.channels.find(c => c.endsWith(args.channel))[0]

            this.update({ access: '+#'.includes(sign) ? '' : sign })
            return
        }
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
