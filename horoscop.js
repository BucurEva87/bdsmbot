const Color = require('./Color')
const cheerio = require('cheerio')
const axios = require('axios').default

const color = new Color()

async function horoscop(zodie) {
    try {
        const response = await axios.get(`https://www.horoscop.ro/${zodie}/`),
              $ = cheerio.load(response.data),
              text = $('.zodie-content-texts p').text()
        let data = ''

        $('.screen-reader-text').each((i, elem) => {
            data += `${color.bold(['DRAGOSTE', 'BANI', 'SANATATE'][i])}: ${['❤️', '💲', '⭐'][i].repeat(parseInt($(elem).text()))} `
        })

        return [text, data]
    } catch (error) {
        return [`Zodia ${zodie} nu exista`, null]
    }
}

module.exports = horoscop
