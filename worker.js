const { fork } = require('child_process')

var time = 0
var interval = setInterval(() => {
    time += 1
    console.log(`Ticking for the ${time} time`)

    if (time == 3) {
        const child = fork('module.js')
        child.send('bdsm.db')
        child.on('message', results => {
            console.log('Results from the module:')
            results.forEach(mask => console.log(`Utilizatorul cu masca ${mask} poate tasta acum pe #fantezii!`))
            child.kill()
        })
    } else if (time == 6) {
        clearInterval(interval)
    }
}, 1000)
