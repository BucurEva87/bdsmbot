const Database = require('better-sqlite3')

class DbManager {
	constructor(databaseName, databaseOptions = {}) {
		const {dbName, dbOptions, options } = (typeof arguments[0] == 'object') 
			? arguments[0] : { dbName: databaseName, dbOptions: databaseOptions }

		this.dbName = dbName
		this.dbOptions = dbOptions
		this.options = options
		this.db = Database(dbName, dbOptions)
		this.stmt = null
	}

	select(query, conditions = [], all = false) {
		conditions = this.safeParams(conditions)

		try {
			if (this.isObject(conditions) && this.isQuestioned(query))
				for (let match of query.matchAll(/(\w+?) = \?/g))
					query = query.replace(match[0], `${match[1]} = @${match[1]}`)

			return all ? this.db.prepare(query).all(conditions) : this.db.prepare(query).get(conditions)
		} catch (err) {
			this.error(err)
			return -1
		}
	}

	insert(query, params) {
		params = this.safeParams(params)

		try {
			if (!this.isObject(params) && !this.isQuestioned(query))
				throw new Error('You are using an array for your values, but designated parameters wait for an object')

			if (this.isObject(params) && this.isQuestioned(query))
				for (let match of query.matchAll(/([a-zA-Z0-9_-]+)(?=[,\)\n])/g)) {
					if (!Object.keys(params).includes(match[1]))
						throw new Error(`Params object must include ${match[1]}, but no such property found`)
					query = query.replace('?', `@${match[1]}`)
				}

			this.db.prepare(query).run(params)
		} catch (err) {
            this.error(err)
			return -1
		}

		return this
	}

	update(query, params, conditions) {
		[params, conditions] = [this.safeParams(params), this.safeParams(conditions)]

		var paramsKeys, conditionsKeys, paramsArray = [], conditionsArray = [], 
			queryExec, queryCond, matches = [], diff

		try {
			// If both params and conditions are objects check if the same property exists in both
			if (this.isObject(params) && this.isObject(conditions)) {
				paramsKeys = Object.keys(params).map(k => k.toLowerCase())
				conditionsKeys = Object.keys(conditions).map(k => k.toLowerCase())

				diff = [...paramsKeys].filter(k => conditionsKeys.includes(k))
				if (diff.length)
					throw new Error(`Same key in params and conditions. ${diff.length} instances discovered [${diff}]`)
			}
	
			var queryExec = query.match(/^(update.+?) where/i)[1],
				queryCond = query.replace(queryExec, '')

			for (let match of queryExec.matchAll(/([a-zA-Z0-9_-]+) ?= ?[:@]\1/g)) {
				matches.push(match[1])
				queryExec = queryExec.replace(match[0], `${match[1]} = ?`)
			}
			if (this.isObject(params))
				for (let match of matches) {
					if (!Object.keys(params).includes(match))
						throw new Error(`Params object must include ${match}, but no such property found`)
					paramsArray.push(params[match])
				}

			matches = []
			for (let match of queryCond.matchAll(/([a-zA-Z0-9_-]+) ?= ?[:@]\1/g)) {
				matches.push(match[1])
				queryCond = queryCond.replace(match[0], `${match[1]} = ?`)
			}
			if (this.isObject(conditions))
				for (let match of matches) {
					if (!Object.keys(conditions).includes(match))
						throw new Error(`Conditions object must include ${match}, but no such property found`)
					conditionsArray.push(conditions[match])
				}
			
			const paramsArg = paramsArray.length ? paramsArray : params,
				  conditionsArg = conditionsArray.length ? conditionsArray : conditions

			console.log(queryExec + queryCond)
			console.log([...paramsArg, ...conditionsArg])

			this.db.prepare(queryExec + queryCond).run([...paramsArg, ...conditionsArg])
		} catch (err) {
			this.error(err)
			return -1
		}

		return this
	}

	delete(query, conditions) {
		conditions = this.safeParams(conditions)

		try {
			if (this.isObject(conditions) && this.isQuestioned(query))
				for (let match of query.matchAll(/(\w+?) = \?/g)) {
					if (!Object.keys(conditions).includes(match[1]))
						throw new Error(`Conditions object must include ${match[1]}, but no such property found`)
					query = query.replace(match[0], `${match[1]} = @${match[1]}`)
				}
			else if (!this.isObject(conditions) && this.isQuestioned(query))
				for (let match of query.matchAll(/([a-zA-Z0-9_-]+) ?= ?[:@]\1/g))
					query = query.replace(match[0], `${match[1]} = ?`)

			this.db.prepare(query).run(conditions)
		} catch (err) {
			this.error(err)
			return -1
		}

		return this
	}

	execute(query) {
		try {
			this.db.exec(query)
		} catch (err) {
			this.error(err)
			return -1
		}

		return this
	}

	isQuestioned(query) {
		return /[a-zA-Z0-9_-]+? = \?/.test(query) || /\?\)/
	}

	isObject(object) {
		return typeof object == 'object' && !Array.isArray(object) && object !== null
	}

	safeParams(o) {
		if (this.isObject(o)) {
			for (let p in o)
				if (!'string|number|bigint'.includes(typeof o[p]) && !Buffer.isBuffer(o[p]) && o[p] !== null)
					o[p] = typeof o[p] == 'boolean' ? +o[p] : JSON.stringify(o[p])
		}
		else
			o = o.map(v => {
				if (!'string|number|bigint'.includes(typeof v) && !Buffer.isBuffer(v) && v !== null)
					return typeof v == 'boolean' ? +v : JSON.stringify(v)
				return v
			})
		
		return o					
	}

	error(err) {
		this.options?.errorFunction ? this.options.errorFunction(err) : console.error(`An error happened: ${err}`)
	}
}

module.exports = DbManager
