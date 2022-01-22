const { database } = require('./config')
const Archiver = require('./Archiver.js')
const BookKeeper = require('./BookKeeper')

const bk = new BookKeeper()
const db = new Archiver({ dbName: database.name, options: { errorFunction: err => bk.log('error', err) }})

db.execute(`CREATE TABLE IF NOT EXISTS bans(
    'mask' varchar(128),
    'issuer' varchar(32),
    'issued_at' datetime,
    'expires_at' datetime
);`)

db.execute(`CREATE TABLE IF NOT EXISTS operators(
    'nick' varchar(32),
    'user' varchar(32),
    'host' varchar(64),
    'level' int,
    'overseer' varchar(32),
    'suspended' datetime,
    'created_at' datetime,
    'updated_at' datetime
);`).execute(`CREATE TABLE IF NOT EXISTS lastlogin(
    'nick' varchar(32),
    'user' varchar(32),
    'host' varchar(64),
    'joined_at' datetime,
    'parted_at' datetime,
    'created_at' datetime,
    'updated_at' datetime
);`).execute(`CREATE TABLE IF NOT EXISTS replies(
    'nick' varchar(32),
    'message' text,
    'timestamp' datetime
);`).insert(`INSERT INTO operators (
    nick, user, host, level, overseer, suspended, created_at, updated_at
) VALUES (
    @nick, @user, @host, @level, @overseer, @suspended, @created_at, @updated_at
);`, {
    nick: 'Pisicuta',
    user: 'uid3871632',
    host: 'black.only.slims.you.if.youre.slim',
    level: 500,
    overseer: 'The_One`',
    suspended: null,
    created_at: Date.now(),
    updated_at: Date.now()
}).insert(`INSERT INTO operators (
    nick, user, host, level, overseer, suspended, created_at, updated_at
) VALUES (
    @nick, @user, @host, @level, @overseer, @suspended, @created_at, @updated_at
);`, {
    nick: 'The_One`',
    user: 'Dan',
    host: 'Bdsm.un.altfel.de.preludiu',
    level: 500,
    overseer: 'SYSTEM',
    suspended: null,
    created_at: Date.now(),
    updated_at: Date.now()
})
