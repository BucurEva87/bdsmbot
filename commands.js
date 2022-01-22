const commands = {
    'say': {
        level: 500,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        help: 'Robotul va afisa un mesaj specificat de catre operator'
    },
    'k': {
        level: 100,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        aliases: 'kick',
        help: 'Robotul va da afara de pe canal persoana mentionata de catre operator'
    },
    'b': {
        level: 200,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        aliases: 'ban',
        queue: true,
        help: 'Robotul va interzice intrarea in canal a persoanei mentionata de catre operator. Perioada standard pentru care interdictia actioneaza este de 120 de minute. Pentru permanenta folositi .p'
    },
    'ub': {
        level: 300,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        aliases: 'unban',
        help: 'Robotul va scoate de sub restrictia de ban adresa specificata. Adresele banate permanent nu pot fi deblocate decat de utilizatori de la nivel 400 in sus.'
    },
    'gag': {
        level: 200,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        aliases: 'shutup',
        queue: true,
        help: 'Robotul va reduce la tacere persoana mentionata de catre operator pentru o perioada de timp. Perioada standard este de 10 minute.'
    },
    'n': {
        level: 100,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        aliases: 'nick',
        help: 'Robotul va interzice intrarea in canal a unui anumit nickname mentionat de catre operator. Perioada standard pentru care interdictia actioneaza este de 120 de minute. Pentru permanenta folositi .p'
    },
    'm': {
        level: 500,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        queue: true,
        help: 'Robotul va seta modul "moderat", care nu permite decat utilizatorilor cu acces sau voice sa scrie in canal. Daca modul este activat, atunci robotul il va dezactiva.'
    },
    'p': {
        level: 300,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        aliases: 'exclude',
        queue: true,
        help: 'Robotul va interzice permanent intrarea in canal a unei anumite masti specificata de catre operator. Mastile standard folosite sunt user*!*@* si *!*@host'
    },
    'v': {
        level: 100,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        aliases: 'voice',
        queue: true,
        help: 'Robotul va oferi statut de voiced utilizatorului mentionat de catre operator. Daca utilizatorul deja are statut de voiced, statutul ii va fi revocat.'
    },
    'h': {
        level: 200,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        aliases: 'half',
        queue: true,
        help: 'Robotul va oferi statut de half-operator utilizatorului mentionat de catre operator. Daca utilizatorul deja are statutul de half-operator, statutul ii va fi revocat.'
    },
    'o': {
        level: 300,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        aliases: 'op',
        queue: true,
        help: 'Robotul va oferi statut de operator utilizatorului mentionat de catre super-operator. Daca utilizatorul deja are statutul de operator, statutul ii va fi revocat.'
    },
    'seen': {
        level: 0,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        aliases: 'info',
        help: 'Robotul va afisa ultimul moment in care utilizatorul despre care se cer informatii a fost vazut parasind canalul si ultima replica pe care acesta a dat-o.'
    },
    'horoscop': {
        level: 0,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        aliases: 'sign',
        help: 'Robotul va afisa informatiile pentru ziua in curs despre zodia mentionata. Poate fi folosita si comanda !zodie'
    },
    'vremea': {
        level: 0,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        aliases: 'meteo|weather',
        help: 'Robotul va afisa informatiile pentru ziua in curs despre vremea din localitatea specificata.'
    },
    'ajutor': {
        level: 0,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        aliases: 'help',
        help: 'Robotul va afisa informatiile despre o comanda specificata. Informatiile despre o comanda nu pot fi accesate decat in masura in care utilizatorul care a emis comanda pentru informatii are autorizatie sa acceseze comanda despre care cere informatiile.'
    },
    'add': {
        level: 500,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        help: 'Robotul va adauga in baza de date de operatori utilizatorul mentionat cu nivelul dorit de acces.'
    },
    'remove': {
        level: 500,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        aliases: 'del|delete',
        help: 'Robotul va sterge din baza de date de operatori utilizatorul mentionat cu nivelul dorit de acces.'
    },
    'modify': {
        level: 500,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        aliases: 'update|change',
        help: 'Robotul va modifica nivelul de acces al unui operator din baza de date.'
    },
    'listall': {
        level: 500,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        aliases: 'usersall',
        help: 'Robotul va afisa o lista cu toti operatorii din baza de date.'
    },
    'suspend': {
        level: 500,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        aliases: 'tax',
        help: 'Robotul va suspenda operatorul mentionat pe o perioada de n zile'
    },
    'unsuspend': {
        level: 500,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        aliases: 'untax',
        help: 'Robotul va ridica restrictia de acces a operatorului mentionat'
    },
    'manual': {
        level: 0,
        enabled: true,
        channels: ['#bdsm', "FeetKink's"],
        help: 'Robotul va afisa toate comenzile disponibile nivelului pe care utilizatorul care foloseste aceasta comanda le detine'
    }
}

module.exports = commands
