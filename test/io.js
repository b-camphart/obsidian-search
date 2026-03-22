import readline from "node:readline"

/** @enum {number} */
const LogLevel = {
	Silent: 0,
	Error: 1,
	Warn: 2,
	Info: 3,
};

/** 
	* @template [T = any]
	*
	* Logs messages at or below the log level
	*
	*/
export class Logger {
	/** @type {T} */
	impl;
	level;
	prefix;
	written_count = 0;
	vtable;

	/**
		* @param {object} def
		* @param {T} def.impl
		* @param {string} [def.prefix]
		* @param {LogLevel} [def.level]
		* @param {(this: void, logger: Logger<T>, line: string) => void} [def.writeLine]
		* */
	constructor({ impl, level, prefix, ...vtable }) {
		this.impl = impl;
		this.level = level ?? LogLevel.Info;
		this.prefix = prefix ?? "";
		this.vtable = {
			writeLine: vtable.writeLine ?? Logger.defaultWriteLine,
		};
	}

	/** 
		* @this {typeof Logger}
		*
		* @param {object} def 
		* @param {LogLevel} [def.level]
		* @param {string} [def.prefix] 
		* 
		* @returns {Logger<null>}
		*/
	static init({ level, prefix }) {
		return new Logger({
			impl: null,
			level,
			prefix,
		})
	}

	/** 
		* @this {Logger<T>}
		*
		* @param {string} [prefix]
		* @param {LogLevel} [level]
		*
		* @returns {Logger<T>}
		* */
	createChild(prefix = "    " + this.prefix, level = this.level) {
		return new Logger({
			impl: this.impl,
			prefix,
			level,
			writeLine: this.vtable.writeLine,
		});
	}

	/**
		* @this {Logger<T>}
		*
		* @returns {BufferedLogger}
		*/
	buffered() {
		return new BufferedLogger({
			level: this.level,
			prefix: this.prefix,
		})
	}

	/**
		* @this {Logger<T>}
		*
		* @param {Logger[]} loggers
		*
		* @returns {ConcurrentLogger}
		*/
	concurrent(...loggers) {
		return new ConcurrentLogger(this, ...loggers);
	}

	/** 
		* @this {Logger<T>}
		*
		* @param {string} line
		*/
	writeLine(line) {
		line = `${this.prefix}${line}`
		this.written_count += line.length;
		this.vtable.writeLine(this, line)
	}

	/** 
		* @this {Logger<T>}
		*
		* @param {string} msg 
		* */
	info(msg) {
		if (this.level >= LogLevel.Info) {
			this.writeLine(msg)
		}
	}

	/** 
		* @this {Logger<T>}
		*
		* @param {string} msg 
		* */
	warn(msg) {
		if (this.level >= LogLevel.Warn) {
			this.writeLine(msg)
		}
	}

	/** 
		* @this {Logger<T>}
		*
		* @param {string} msg 
		* */
	error(msg) {
		if (this.level >= LogLevel.Error) {
			this.writeLine(msg)
		}
	}

	/** 
		* writes the line to stdout
		*
		* @this {void}
		*
		* @param {Logger} _logger
		* @param {string} line 
		* */
	static defaultWriteLine(_logger, line) {
		console.log(line);
	}
}

export class BufferedLogger {
	level;
	prefix;
	/** @type {string[]} */
	logs = [];

	/** 
		* @param {object} def
		* @param {LogLevel} [def.level]
		* @param {string} [def.prefix]
		* */
	constructor({ level, prefix }) {
		this.level = level ?? LogLevel.Info;
		this.prefix = prefix ?? "";
	}

	static #Logger = {
		/** 
		* @this {void}
		*
		* @param {Logger<BufferedLogger>} logger
		* @param {string} line
		*/
		writeLine(logger, line) {
			logger.impl.logs.push(line)
		}
	};

	/** 
		* @this {BufferedLogger}
		*
		* @returns {Logger<BufferedLogger>}
		*/
	logger() {
		return new Logger({
			impl: this,
			level: this.level,
			prefix: this.prefix,
			writeLine: BufferedLogger.#Logger.writeLine,
		})
	}

	/** 
		* @this {BufferedLogger}
		*
		* @param {Logger} logger
		* @param {number} [splat]
		* 
		* @returns {number}
		*/
	drain(logger, splat = this.logs.length) {
		let drained = 0;
		while (this.logs.length > 0 && drained < splat) {
			const line = this.logs.shift() ?? "";
			logger.writeLine(line);
			drained++;
		}
		return drained;
	}
}

export class ConcurrentLogger {
	loggers;

	/** @param {Logger[]} loggers */
	constructor(...loggers) {
		this.loggers = loggers;
	}

	/** 
		* @this {void}
		*
		* @param {Logger<ConcurrentLogger>} logger
		* @param {string} line
		*/
	static #writeLine(logger, line) {
		for (const child of logger.impl.loggers) {
			child.writeLine(line);
		}
	}

	/** 
		* @this {ConcurrentLogger}
		*
		* @returns {Logger<ConcurrentLogger>}
		*
		*/
	logger() {
		return new Logger({
			impl: this,
			writeLine: ConcurrentLogger.#writeLine,
		})
	}
}
