const vremea = require('./vremea')
const { DateTime } = require('luxon')
const Archiver = require('./Archiver')
const horoscop = require('./horoscop')
const { channel, databaseName } = require('./config')
const { commands, errors } = require('./commandsErrors')
const timeFormat = new Intl.RelativeTimeFormat('ro', {
    localeMatcher: 'lookup',
    numeric: 'auto',
    style: 'long'
})

const archiver = new Archiver(databaseName)
const pending = []
var pendingType = null

class Command {
    constructor({ command, user, params, client, whois }) {
        // Check if this command exists, is available and the user has rights to issue it.
        if (!(command in commands)) throw new Error(`notice ${errors.NO_COMMAND}`)
        this.reference = commands[command]
        if (user.isOperator && user.level === 0) {
            const diff = DateTime.fromMillis(Number(user.suspended)).diff(DateTime.now()),
                  diffInMinutes = Math.floor(diff / 60000)
            throw new Error(`public ${user.nick}, ${errors.OP_SUSPENDED} ${timeFormat.format(diffInMinutes, 'minute')}`)
        }
        if (user.level < this.reference.level) throw new Error(`notice ${errors.NOT_AUTHORIZED}`)
        if (!this.reference.enabled) throw new Error(`notice ${errors.UNAVAILABLE_COMMAND}`)
        if (command == 'ajutor' && !(params[0] in commands)) throw new Error(`notice ${errors.INFO_NO_COMMAND}`)
        if (command == 'ajutor' && user.level < commands[params[0]].level) throw new Error(`notice ${errors.INFO_NOT_AUTHORIZED}`)

        // Everything is fine - let's continue! :D
        this.command = command
        this.user = user
        this.timestamp = Date.now()
        this.whois = whois

        this.client = client

        // Does this command require params?
        if (!'listall|manual'.includes(command) && (params === undefined || typeof params[0] === 'undefined')) return
        // Does this command require a whois?
        if ('b|p|gag|v|h|o'.includes(command) && !this.whois)
            this.pendingAdd(command, params)
        else
            this[command](...params)
    }

    pendingAdd(command, params) {
        pending.push({
            command,
            user: this.user,
            params,
            client: this.client,
            valid: true
        })
        pendingType = 'b|p|gag'.includes(command) ? 'restriction' : 'right'
        console.log('Command was scheduled!')
        this.client.whois(params[0])
    }

    say(reply) {
        this.client.say(channel, Array.isArray(reply) ? reply.join(' ') : reply)
    }

    out(mask, timeInMinutes) {
        // Set the ban on the mask
        this.client.send('MODE', channel, '+b', this.whois ? `*!${this.whois.user}@${this.whois.host}` : `${mask}*!*@*`)

        // Store the ban in the database for further deletion
        let expiration = timeInMinutes === null ? null : DateTime.now().plus({minutes: timeInMinutes}).toMillis()
        archiver.insert(`INSERT INTO bans (
            mask, issuer, issued_at, expires_at
        ) VALUES (
            @mask, @issuer, @issued_at, @expires_at
        );`, {
            mask: this.whois ? `*!${this.whois.user}@${this.whois.host}` : `${mask}*!*@*`,
            issuer: this.user.nick,
            issued_at: this.timestamp,
            expires_at: expiration
        })
    }

    k(mask, reason) {
        if (mask.match(/!|@/)) return

        console.log(reason)

        this.client.send('KICK', channel, mask, reason ? reason : 'Requested')
    }

    b(mask, timeInMinutes = 120, ...reason) {
        console.log(mask, timeInMinutes, reason)
        if (timeInMinutes !== null && Number.isNaN(Number(timeInMinutes))) {
            reason = [timeInMinutes, ...reason]
            timeInMinutes = 120
        }
        this.out(mask, timeInMinutes)
        this.k(this.whois.nick, reason.length ? reason.join(' ') : 'Invata sa respecti regulamentul canalului!')
    }

    gag(mask, timeInMinutes = 10) {
        this.out(mask, timeInMinutes)
        this.say(`Utilizatorul ${mask} a fost redus la tacere pentru o durata de ${composeTime(timeInMinutes)}.`)
    }

    n(mask, ...reason) {
        this.out(mask, null)
        this.k(mask, reason.length ? reason.join(' ') : 'Schimba-ti nickul si poti reveni in canal')
    }

    p(mask, ...reason) {
        this.out(mask, null)
        this.k(this.whois.nick, reason.length ? reason.join(' ') : 'Din acest moment nu mai ai ce sa cauti aici!')
        this.say(`Utilizatorul ${mask} a fost exclus permanent din canal.`)
    }

    ub(mask) {
        var bans

        if (mask === '*!*@*') {
            if (this.user.level < 400) {
                bans = archiver.select(`SELECT * FROM bans WHERE expires_at != ?`, [null], true) 
            } else {
                bans = archiver.select(`SELECT * FROM bans`, [], true)
            }
        } else {
            bans = [archiver.select(`SELECT * FROM bans WHERE mask = ?`, [mask])]

            if (this.user.level < 400 && bans.expires_at === null) {
                this.client.notice(this.user.nick, 'Adresa pe care vrei sa o deblochezi a fost blocata permanent de catre un administrator.')
                bans = []
            }
        }

        bans.forEach(item => {
            this.client.send('MODE', channel, '-b', item.mask)
            archiver.delete(`DELETE FROM bans WHERE mask = ?`, [item.mask])
        })
    }

    v(mask) {
        if (mask.match('/!|@/')) return
        const plus = this.getSign(channel, '+')
        this.client.send('MODE', channel, plus ? '-v' : '+v', this.whois.nick)
    }

    h(mask) {
        if (mask.match('/!|@/')) return
        const plus = this.getSign(channel, '%')
        this.client.send('MODE', channel, plus ? '-h' : '+h', this.whois.nick)
    }

    o(mask) {
        if (mask.match('/!|@/')) return
        const plus = this.getSign(channel, '@')
        this.client.send('MODE', channel, plus ? '-o' : '+o', this.whois.nick)
    }

    getSign(channel, sign) {
        return this.whois.channels.find(i => i.match(new RegExp(`${channel}$`, 'i'))).includes(sign)
    }

    async horoscop(zodie) {
        const response = await horoscop(zodie)
        const [text, data] = response

        if (data === null) {
            this.client.notice(this.user.nick, text)
            return
        }

        this.say(text)
        this.say(data)
    }

    async vremea(city, country, state) {
        const response = await vremea(city, country, state)
        this.say(response)
    }

    ajutor(command) {
        this.client.notice(this.user.nick, commands[command].help)
    }

    seen(mask) {
        if (!mask) return

        const entry = archiver.select('SELECT * FROM lastlogin WHERE nick = ? COLLATE NOCASE', [mask])

        console.log(entry)

        if (!entry) {
            this.client.notice(this.user.nick, `Nu am nicio informatie despre utilizatorul cu masca ${mask}`)
            return
        }

        const format = { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' },
              reply = archiver.select(`SELECT * FROM replies WHERE nick = ? COLLATE NOCASE`, [entry.nick])

        if (!entry.joined_at) {
            this.client.notice(this.user.nick, `L-am vazut ultima oara pe utilizatorul ${mask} in data de ${new Date(entry.parted_at).toLocaleString(format)}`)
            if (reply) this.client.notice(this.user.nick, `Ultima replica pe care a spus-o a fost: ${reply.message}`)
            return
        }
        if (!entry.parted_at || entry.parted_at < entry.joined_at) {
            this.client.notice(this.user.nick, `Utilizatorul ${mask} se afla pe canal. S-a conectat la data de ${new Date(entry.joined_at).toLocaleString(format)}`)
            return
        }
        const diff = DateTime.fromMillis(entry.joined_at).diff(entry.parted_at),
              diffInMinutes = Math.floor(diff.toMillis() / 60000)

        console.log(diffInMinutes)
        this.client.notice(this.user.nick, `L-am vazut ultima oara pe utilizatorul ${mask} in data de ${new Date(entry.parted_at).toLocaleString(format)}, dupa ce a stat online o perioada de ${composeTime(diffInMinutes)}`)
        if (reply) this.client.notice(this.user.nick, `Ultima replica pe care spus-o a fost: ${reply.message}`)
        
    }

    add(mask, level) {
        if (!mask.match(/!|@/)) {
            this.client.notice(this.user.nick, 'ATENTIE! Nu incerca sa adaugi un operator dupa nick! Pentru a preveni problemele de securitate foloseste o masca de tipul nick!user@host')
            return
        }
        if (![100, 200, 300, 400].includes(Number(level))) {
            this.client.notice(this.user.nick, `ATENTIE! Folosesti un nivel de acces nepotrivit (${level})! Nivelele de acces sunt: half-operator (%) - 100 | operator (@) - 200 | admin (%) - 300 | owner (~) - 400`)
            return
        }
        archiver.insert(`INSERT INTO operators (
            nick, user, host, level, overseer, suspended, created_at, updated_at
        ) VALUES (
            @nick, @user, @host, @level, @overseer, @suspended, @created_at, @updated_at
        );`, {
            nick: mask.match(/^(.+?)!/)[1],
            user: mask.match(/!(.+?)@/)[1],
            host: mask.match(/@(.+)$/)[1],
            level: Number(level),
            overseer: this.user.nick,
            suspended: null,
            created_at: Date.now(),
            updated_at: Date.now()
        })

        this.client.notice(this.user.nick, `Operatorul ${mask} a fost adaugat in baza de date cu un nivel de acces ${level}!`)
    }

    remove(mask) {
        if (!mask.match(/@/)) {
            this.client.notice(this.user.nick, 'ATENTIE! Pentru a inlatura un operator trebuie sa folosesti o masca speciala care sa contina hostul de tipul *!*@host')
            return
        }
        const host = mask.match(/@(.+)$/)[1],
              result = archiver.select('SELECT * FROM operators WHERE host = ? COLLATE NOCASE', [host])

        if (!result) {
            this.client.notice(this.user.nick, `Nu exista niciun operator in baza de date cu hostul @${host}`)
            return
        }

        archiver.delete('DELETE FROM operators WHERE host = ?', [result.host])

        this.client.notice(this.user.nick, `Operatorul ${result.nick} avand hostul ${result.host} a fost indepartat din baza de date!`)
    }

    modify(mask, level) {
        if (!mask.match(/@/)) {
            this.client.notice(this.user.nick, 'ATENTIE! Pentru a modifica nivelul de acces al unui operator trebuie sa folosesti o masca speciala care sa contina hostul de tipul *!*@host')
            return
        }
        const host = mask.match(/@(.+)$/)[1],
              result = archiver.select('SELECT * FROM operators WHERE host = ? COLLATE NOCASE', [host])

        if (!result) {
            this.client.notice(this.user.nick, `Nu exista niciun operator in baza de date cu hostul @${host}`)
            return
        }
        if (![100, 200, 300, 400].includes(Number(level))) {
            this.client.notice(this.user.nick, `ATENTIE! Folosesti un nivel de acces nepotrivit (${level})! Nivelele de acces sunt: half-operator (%) - 100 | operator (@) - 200 | admin (%) - 300 | owner (~) - 400`)
            return
        }
        if (Number(level) === Number(result.level)) {
            this.client.notice(this.user.nick, `Nivelul de acces pe care vrei sa il oferi operatorului ${result.nick} (${level}) deja ii apartine.`)
            return
        }

        archiver.update('UPDATE operators SET level = ?, updated_at = ? WHERE host = ?', [Number(level), Date.now(), result.host])

        this.client.notice(this.user.nick, `Nivelul de acces al operatorului ${result.nick} a fost modificat cu succes de la ${result.level} la ${level}!`)
    }

    listall() {
        const format = { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        [...archiver.select('SELECT * FROM operators', [], true)].forEach(o => {
            this.client.notice(this.user.nick, `${o.nick} (*!${o.user}@${o.host}) Nivel: ${o.level} | Adaugat de: ${o.overseer} | Suspendat: ${o.suspended ? 'da' : 'nu'} | Data adaugarii: ${new Date(o.created_at).toLocaleString(format)} | Ultima modificare: ${new Date(o.updated_at).toLocaleString(format)}`)
        })
    }

    suspend(mask, timeInDays = 1) {
        if (!mask.match(/@/)) {
            this.client.notice(this.user.nick, 'ATENTIE! Pentru a suspenda accesul unui operator trebuie sa folosesti o masca speciala care sa contina hostul de tipul *!*@host')
            return
        }
        if (Number.isNaN(timeInDays)) {
            this.client.notice(this.user.nick, 'ATENTIE! Pentru a suspenda accesul unui operator trebuie sa adaugi ca argument un parametru de timp in zile.')
            return
        }
        const host = mask.match(/@(.+)$/)[1],
              result = archiver.select('SELECT * FROM operators WHERE host = ? COLLATE NOCASE', [host])

        if (!result) {
            this.client.notice(this.user.nick, `Nu exista niciun operator in baza de date cu hostul @${host}`)
            return
        }
        if (result.level >= this.user.level) {
            this.client.notice(this.user.nick, `Nu poti suspenda un operator cu un nivel de acces (${result.level}) mai mare decat sau egal cu al tau (${this.user.level})`)
            return
        }

        archiver.update('UPDATE operators SET suspended = ?, updated_at = ? WHERE host = ?', [DateTime.now().plus({ days: Number(timeInDays) }).toMillis(), Date.now(), result.host])

        this.client.notice(this.user.nick, `Accesul operatorului ${result.nick} a fost suspendat cu succes pe o perioada de ${Number(timeInDays)} zile!`)
    }

    unsuspend(mask) {
        if (!mask.match(/@/)) {
            this.client.notice(this.user.nick, 'ATENTIE! Pentru a ridica restrictia de acces a unui operator trebuie sa folosesti o masca speciala care sa contina hostul de tipul *!*@host')
            return
        }
        const host = mask.match(/@(.+)$/)[1],
              result = archiver.select('SELECT * FROM operators WHERE host = ? COLLATE NOCASE', [host])

        if (!result) {
            this.client.notice(this.user.nick, `Nu exista niciun operator in baza de date cu hostul @${host}`)
            return
        }
        if (!result.suspended) {
            this.client.notice(this.user.nick, `Operatorul ${result.nick} avand hostul @${host} nu este suspendat`)
            return
        }

        archiver.update('UPDATE operators SET suspended = ?, updated_at = ? WHERE host = ?', [null, Date.now(), result.host])

        this.client.notice(this.user.nick, `Restrictia de acces asupra operatorului ${result.nick} a fost revocata cu succes!`)
    }

    manual() {
        for (let command in commands) {
            if (commands[command].level <= this.user.level)
                this.client.notice(this.user.nick, `Comanda: ${command} | Activa: ${commands[command].enabled ? 'da' : 'nu'} | Nivel: ${commands[command].level} | Descriere: ${commands[command].help}`)
        }
    }
}

function pendingCheck(obj) {
    if (pendingType === null) return 0
    
    var item = pending[pending.length-1]

    if (!obj.hasOwnProperty('server')) {
        item.client.notice(item.user.nick, `Utilizatorul ${item.params[0]} nu se afla in canal. Comanda nu poate fi executata.`)
        pending.pop()
        return -1
    }

    // Execute the pending command
    new Command({
        command: item.command,
        user: item.user,
        params: item.params,
        client: item.client,
        whois: obj
    })

    // Remove the command from the pending list
    pending.pop()
    pendingType = null

    return 1
}

function composeTime(timeInMinutes) {
    let years = Math.floor(timeInMinutes / 525000),
        months = Math.floor(timeInMinutes % 525000 / 43800),
        days = Math.floor(timeInMinutes % 525000 % 43800 / 1440),
        hours = Math.floor(timeInMinutes % 525000 % 43800 % 1440 / 60),
        minutes = Math.floor(timeInMinutes % 525000 % 43800 % 1440 % 60),
        format = ''

    if (years) format += `${years} ani `
    if (months) format += `${months} luni `
    if (days) format += `${days} zile `
    if (hours) format += `${hours} ore `
    if (minutes) format += `${minutes} minute`

    return format
}

module.exports = {
    Command,
    pendingCheck
}
