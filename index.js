const irc = require('irc')
const c = require('irc-colors')
const Color = require('./Color')
const Logger = require('./Logger')
const Archiver = require('./Archiver')
const InBetween = require('./InBetween')
const { User, users } = require('./User')
const BookKeeper = require('./BookKeeper')

const { 
    server, 
    botName, 
    logFileName,
    autoLeaveApropo,
    stripColors, 
    autoJoinOnInvite,
    config,
    database,
    commandPrefix
} = require('./config')

// Create the IRC Client instance (singleton)
const client = new irc.Client(server, botName, config)
// Create the BookKeeper instance (singleton)
const bk = new BookKeeper()
// Create the Logger instance (singleton)
const logger = new Logger(logFileName)
// Create the InBetween instance (singleton)
const inbetween = new InBetween()
// Create the Archiver instance (singleton)
const db = new Archiver({ dbName: database.name, options: { errorFunction: err => bk.log('error', err) }})
// Create the Color instance (singleton)
const color = new Color()

// Set up the bindings within the IRC Client instance

const bindings = [onRegister, onMessage, onNotice, onInvite, onKick, onJoin, onPart, onNames, onNick, onWhois, onPlusMode, onMinusMode, onQuit, onError, onRaw]
for (const [i, event] of 'registred|message|notice|invite|kick|join|part|names|nick|whois|+mode|-mode|quit|error|raw'.split('|').entries())
    client.addListener(event, bindings[i])

function onRegister(message) {
    console.log(bk.log('info', { nick: botName, action: 'Registered on the server' }))

    // if (config.autoConnect)
    //     for (let channel of config.config.channels)
    //         client.join(channel)
}

function onMessage(nick, text, message) {
    
}

function onNotice(nick, to, text, message) {
    if (nick !== 'Pisicuta') return

    const parts = text.split(' ')

    // TODO: Remove this part (just for testing)
    if (/^list/i.test(text)) {
        if (parts.length == 1) console.log(users)
        else console.log(users[parts.pop()])
    }
    else if (/^modes/i.test(text)) {
        client.send(`MODE ${parts.pop()}`)
    }
}

function onInvite(channel, from, message) {
    console.log(bk.log('invite', { nick: from, channel }))
}

function onKick(channel, nick, by, reason, message) {
    nickIsGone(channel, nick)
    console.log(bk.log('kick', { channel, nick, by, reason }))
    // fazan.quitEvent(nick, messages.PLAYER_KICKBAN, [
    //     {
    //         term: nick,
    //         function: color.system
    //     },
    //     {
    //         term: 'KICK',
    //         function: function(string) {
    //             return this.getFormattedString(this.getColoredString(string, 'lightred'), 'bold')
    //         }
    //     }
    // ])
}

function onJoin(channel, nick, message) {
    if (nick == botName) {
        console.log(bk.log('info', { nick: botName, action: `Has joined channel ${channel}`}))

        if (channel == '#Apropo' && autoLeaveApropo)
            client.part('#Apropo', 'Onwards and onwards')
    }
    else {
        if (!users[channel]) return

        users[channel].push(new User({ nick }))

        inbetween.add({
            initialObject: { method: 'update' },
            callback: users[channel][users[channel].length-1]
        })

        client.whois(nick)

        // users[channel]?.push(new User({ nick }).update({ user: message.user, host: message.host }))
        console.log(bk.log('join', { nick, channel }))
    }
}

function onPart(channel, nick, reason, message) {
    if (nick == botName) {
        console.log(bk.log('info', { nick: botName, action: `Has parted channel ${channel}` }))

        if (Object.keys(users).includes(channel))
            delete users[channel]
    }
    else {
        nickIsGone(channel, nick)
        console.log(bk.log('part', { nick, channel }))
    }
}

function onNames(channel, nicks) {
    if (!users[channel]) return

    for (let nick in nicks) {
        users[channel].push(new User({ nick, access: nicks[nick] }))

        inbetween.add({
            initialObject: { method: 'update' },
            callback: users[channel][users[channel].length-1]
        })
    
        client.whois(nick)
    }
}

function onNick(oldNick, newNick, channels, message) {
    for (let channel of channels) {
        const index = users[channel]?.findIndex(u => u.nick == oldNick)

        if (index === undefined) return

        if (index !== -1)
            users[channel][index].update({ nick: newNick, user: message.user, host: message.host })
    }
}

function onWhois(info) {
    inbetween.resolve(info)
}

function onPlusMode(channel, by, mode, argument, message) {
    if (!users[channel]) return

    // User mode
    if (argument)
        users[channel].find(u => u.nick == argument).plus(mode, by, channel)
}

function onMinusMode(channel, by, mode, argument, message) {
    if (!users[channel]) return

    // User mode
    if (argument) {
        inbetween.add({
            initialObject: {
                method: 'minus',
                mode, 
                by,
                channel
            },
            callback: users[channel].find(u => u.nick == argument)
        })

        client.whois(argument)
    }
}

function onQuit(nick, reason, channels, message) {
    for (let channel of channels)
        if (users[channel])
            nickIsGone(channel, nick)
    console.log(bk.log('quit', { nick, reason }))
}

function onError(message) {
    logger.log(`IRC ERROR: ${JSON.stringify(message)}`)
}

function onRaw(message) {
    // console.log(message)
}

function nickIsGone(channel, nick) {
    const index = users[channel]?.findIndex(u => u.nick == nick)

    if (index === undefined) return

    if (index !== -1)
        users[channel].splice(index, 1)
}

if (!String.prototype.format) {
    String.prototype.format = function(args, context) {
        return this.replace(/{(\d+)}/g, function (match, number) {
            if (typeof args[number] == 'undefined') return match
            if (args[number].function === undefined) return args[number].term
            return args[number].function.call(context, args[number].term)
        })
    }
}

// const handler = {
//     set: function(obj, prop, value) {
//         console.log('setting prop: ', prop, ' to ', value)
//         obj[prop] = value
//         return true
//     }
// }

// const fazan = new Proxy(new Fazan(client), handler)
