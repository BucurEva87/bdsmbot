const Archiver = require('./Archiver.js')
const { DateTime } = require('luxon')

process.on('message', dbName => {
    const archiver = new Archiver(dbName)

    let now = DateTime.now().toMillis()

    const result = archiver.select(
        'SELECT * FROM bans WHERE expires_at NOT NULL AND expires_at <= ?', [now], true
    )
    archiver.delete('DELETE FROM bans WHERE expires_at NOT NULL AND expires_at <= ?', [now])

    archiver.close()

    process.send(result.map(i => i.mask))
})
