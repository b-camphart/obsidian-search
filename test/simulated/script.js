import api from "../api/script.js"
import { Logger } from "../io.js";

export async function run() {
	if (await api.maybeRun("api", Logger.init({}))) {
		// continue
	} else {
		return false;
	}


}

