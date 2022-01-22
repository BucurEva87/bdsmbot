const { DateTime } = require('luxon')
const commands = require('./commands')
const InBetween = require('./InBetween')
const error_messages = require('./error_messages')

// Create the InBetween instance (singleton)
const inbetween = new InBetween()

class Command {
    constructor({ command, channel, user, params, client }) {
        // Resolve aliases
        command = this.getAlias(command)

        if (!command)
            throw new Error(`notice ${error_messages.NO_COMMAND}`)

        this.reference = commands[command]

        // If the operator is suspended
        if (user.suspended) {
            const diff = DateTime.fromMillis(Number(user.suspended)).diff(DateTime.now()),
                  diffInMinutes = Math.floor(diff / 60000)
            throw new Error(`public ${user.nick}, ${error_messages.OP_SUSPENDED} ${timeFormat.format(diffInMinutes, 'minute')}`)
        }

        // User access level is too low
        if (user.access < this.reference.level)
            throw new Error(`notice ${error_messages.NOT_AUTHORIZED}`)

        // Command is not enabled or not allowed in the channel
        if (!this.reference.enabled || !this.reference.channels.includes(channel)) 
            throw new Error(`notice ${error_messages.UNAVAILABLE_COMMAND}`)

        if (command == 'ajutor') {
            const subcommand = this.getAlias(params.subcommand)

            if (!subcommand)
                throw new Error(`notice ${error_messages.INFO_NO_COMMAND}`)

            if (user.access < commands[subcommand].level)
                throw new Error(`notice ${error_messages.INFO_NOT_AUTHORIZED}`)
        }

        // Everything is fine - let's continue :D
        this.command = command
        this.channel = channel
        this.user = user
        this.params = params
        this.timestamp = Date.now()
        this.client = client

        // Should this command be executed now or queued?
        if (this.reference.queue) {
            inbetween.add({
                initialObject: {},
                callback: this
            })

            this.client.whois()
        }

        this[command](params)
    }

    say({ reply }) {
        if (!reply) return

        this.client.say(channel, reply)
    }

    out(mask, timeInMinutes) {

    }

    getAlias(command) {
        if (command in commands)
            return command
        
        for (let c of commands)
            if (c.aliases?.split('|').includes(command))
                return c
        
        return null
    }
}
