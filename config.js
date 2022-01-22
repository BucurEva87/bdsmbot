module.exports = {
    server: 'irc.apropochat.ro',
    botName: process.argv[2] || 'rehashtest',
    commandPrefix: '.',
    config: {
        userName: process.argv[2] || 'rehashtest',
        realName: 'Master of Ceremonies',
        port: 6667,
        channels: ['#bdsm', "#FeetKink's"],
        password: 'mefeDrona8193#',
        autoRejoin: true,
        autoConnect: true,
        floodProtection: true,
        floodProtectionDelay: 3000
    },
    logFileName: 'logger.log',
    database: {
        name: 'bdsm.db',
        mainTable: 'fazan',
        mainOverseer: 'SYSTEM'
    },
    autoLeaveApropo: true,
    stripColors: true,
    autoJoinOnInvite: true
}
