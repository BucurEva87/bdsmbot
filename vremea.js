const Color = require('./Color')
const axios = require('axios').default
const ct = require('countries-and-timezones')

const color = new Color()

async function vremea(city, country = null, state = null) {
    if (state) [state, country] = [country, state]
    const link = 'https://api.openweathermap.org/data/2.5/weather',
          key = 'faf2d015c49c91fa1aeb73cb7f3c9717',
          units = 'metric',
          language = 'ro',
          full = `${link}?q=${city},${state},${country}&appid=${key}&units=${units}&lang=${language}`

    try {
        const result = await axios.get(full),
              response = result.data

        let country = ct.getCountry(response.sys.country),
            format = { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: country.timezones[0] },
            today = color.bold(new Date().toLocaleString('ro-RO', { ...format, year: 'numeric', month: 'short', day: '2-digit' })),
            description = color.bold(color.highlight(response.weather[0].description)),
            deg = parseFloat(response.main.temp),
            degLike = parseFloat(response.main.feels_like),
            min = parseFloat(response.main.temp_min),
            max = parseFloat(response.main.temp_max),
            pressure = color.bold(parseInt(response.main.pressure)),
            humidity = color.bold(parseInt(response.main.humidity)),
            wind = color.bold(parseFloat(response.wind.speed)),
            city = color.bold(response.name),
            sunrise = color.bold(color.getColoredString(` ${new Date(response.sys.sunrise * 1000).toLocaleString('ro-RO', format)}`, 'orange')),
            sunset = color.bold(color.getColoredString(` ${new Date(response.sys.sunset * 1000).toLocaleString('ro-RO', format)}`, 'grey'));

        [deg, degLike, min, max] = [deg, degLike, min, max].map(i => color.bold(color.getColoredString(` ${i}`, i >= 10 ? 'lightred' : 'blue')))

        return `${today} ${color.highlight(city)}, ${color.bold(color.highlight(country.name))} - ${color.bold('Stare vreme')}: ${description}, ${color.bold('Temperatura')}:${deg}° (${color.bold('Resimtita')}:${degLike}° | ${color.bold('Minima')}:${min}° | ${color.bold('Maxima')}:${max}°), ${color.bold('Presiune Atmosferica')}: ${pressure} hPa, ${color.bold('Umiditate')}: ${humidity}%, ${color.bold('Viteza Vantului')}: ${wind} KPH, Soarele ${color.bold('Rasare')} la:${sunrise}, ${color.bold('Apune')} la:${sunset}`
    } catch (error) {
        return `Orasul ${color.bold(color.highlight(city))} nu a fost gasit.`
    }
}

module.exports = vremea
