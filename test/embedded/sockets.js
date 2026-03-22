const PASSED_SIGNAL = "<<PASSED>>"
const FAILED_SIGNAL = "<<FAILED>>"
const SIGNAL_LENGTH = Math.max(PASSED_SIGNAL.length, FAILED_SIGNAL.length)

/** 
	* logs received messages from the socket, and resolves with the received signal
	*
	* @param {import("net").Socket} socket
	* @param {import("../io.js").Logger} logger
	* @param {(passed: boolean) => void} resolve 
	* @param {(err: unknown) => void} reject 
	*/
export function awaitResultSignal(socket, logger, resolve, reject) {
	let buffer = ""; // most recent characters
	socket.on("data", (data) => {
		let str = data.toString();
		buffer = (buffer + str).slice(-SIGNAL_LENGTH) // only hold the last few chars
		for (const line of str.split("\n")) {
			if (line.length > 0) {
				logger.info(line);
			}
		}
	})
	socket.on("end", () => {
		if (buffer.endsWith(PASSED_SIGNAL)) {
			resolve(true)
			return;
		}
		if (buffer.endsWith(FAILED_SIGNAL)) {
			resolve(false)
			return
		}
		reject(new Error("socket ended with unknown state")) // if we never sent a signal, probably something went wrong
	})
}

/** 
	* @param {import("net").Socket} socket
	* @param {boolean} passed
	*/
export function sendResultSignal(socket, passed) {
	socket.write(passed ? PASSED_SIGNAL : FAILED_SIGNAL, () => socket.end())
}
