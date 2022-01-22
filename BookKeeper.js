const chalk = require('chalk')

const formats = {
    entity: chalk.blueBright,
    info: chalk.blue,
    join: chalk.green,
    part: chalk.yellow,
    quit: chalk.rgb(255, 136, 0),
    reason: chalk.white,
    invite: chalk.hex('#BA03FC'),
    kick: chalk.hex('#FC3503')
}
const messages = {
    join: 'has joined channel',
    part: 'has parted channel',
    quit: 'quit with reason:',
    invite: {
        by: 'Bot was invited by',
        channel: 'on channel'
    },
    kick: {
        by: 'was kicked by',
        channel: 'from channel',
        reason: 'with reason'
    }
}
const prefixes = {
    info: '❕',
    join: '👉',
    part: '👈',
    quit: '🍁',
    invite: '❤️',
    kick: '👠'
}

class BookKeeper {
    constructor() {}

    log(action, rest) {
        return `    ${prefixes[action]} ${this[action](rest)}`
    }

    info({ nick, action }) {
        return `${formats.entity(nick)} ${formats.info(action)}`
    }

    join({ channel, nick }) {
        return `${formats.entity(nick)} ${formats.join(messages.join)} ${formats.entity(channel)}`
    }

    part({ channel, nick }) {
        return `${formats.entity(nick)} ${formats.part(messages.part)} ${formats.entity(channel)}`
    }

    quit({ nick, reason }) {
        return `${formats.entity(nick)} ${formats.quit(messages.quit)} ${formats.reason(reason)}`
    }

    invite({ inviter, channel }) {
        return `${formats.invite(messages.invite.by)} ${formats.entity(inviter)} ${formats.invite(messages.invite.channel)} ${formats.entity(channel)}`
    }

    kick({ channel, nick, by, reason }) {
        return `${formats.entity(nick)} ${formats.kick(messages.kick.by)} ${formats.entity(by)} ${formats.kick(messages.kick.channel)} ${formats.entity(channel)} ${formats.kick(messages.kick.reason)} ${formats.reason(reason)}`
    }

    error(message) {
        console.log(chalk.redBright(`🔺 ${message}`))
    }
}

module.exports = BookKeeper
