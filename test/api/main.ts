import { inspect } from "util";
import * as embedded from "../embedded/plugin"
import * as embedded_sockets from "../embedded/sockets.js"
import * as testing from "../framework"
import { runTests } from "./tests";

export default class Api extends embedded.SocketReporterPlugin {
	onload(this: Api) {
		this.app.workspace.onLayoutReady(async () => {
			const runner = new testing.Runner({
				reporter: new testing.StartStopReporter({
					output: new testing.Writer({
						impl: this.socket,
						write(writer, data) {
							writer.impl.write(data);
						}
					})
				}).reporter(),
			});
			try {
				const passed = await runTests(runner, this.app);

				embedded_sockets.sendResultSignal(this.socket, passed)
			} catch (e) {
				this.socket.write("catastrophic error: " + inspect(e))
			}

		})
	}
}
