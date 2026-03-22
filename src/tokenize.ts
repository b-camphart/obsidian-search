export namespace tokens {
	export const Negate = Object.freeze({ id: Symbol(`"-"`) });
	export function word(word: string) {
		return Object.freeze({
			get word() {
				return word;
			},
		});
	}
	export function phrase(phrase: string) {
		return Object.freeze({
			get phrase() {
				return phrase;
			},
		});
	}
	export namespace keywords {
		export const OR = Object.freeze({ id: Symbol("OR") });
	}

	export namespace symbols {
		export const GroupStart = Object.freeze({ id: Symbol(`"("`) });
		export const GroupEnd = Object.freeze({ id: Symbol(`")"`) });
		export const Colon = Object.freeze({ id: Symbol(`":"`) });
		export const BracketOpen = Object.freeze({ id: Symbol(`"["`) });
		export const BracketClose = Object.freeze({ id: Symbol(`"]"`) });
	}

	export namespace operators {
		export const File = Object.freeze({ id: Symbol("file") });
		export const Path = Object.freeze({ id: Symbol("path") });
		export const Content = Object.freeze({ id: Symbol("content") });
		export const MatchCase = Object.freeze({ id: Symbol("match-case") });
		export const IgnoreCase = Object.freeze({ id: Symbol("ignore-case") });
		export const Tag = Object.freeze({ id: Symbol("tag") });
		export const Line = Object.freeze({ id: Symbol("line") });
		export const Block = Object.freeze({ id: Symbol("block") });
		export const Section = Object.freeze({ id: Symbol("section") });
		export const Task = Object.freeze({ id: Symbol("task") });
		export const TaskToDo = Object.freeze({ id: Symbol("task-todo") });
		export const TaskDone = Object.freeze({ id: Symbol("task-done") });
	}
}

export function tokenize(input: string): object[] {
	let escaped = false;
	let in_phrase = false;
	const collected_tokens = new Array<object>();
	let buffer = new Array<string>();

	function endWord(operator: boolean = false) {
		if (buffer.length > 0) {
			const joined = buffer.join("");
			buffer = [];
			if (joined === "OR") {
				collected_tokens.push(tokens.keywords.OR);
				return;
			} else if (operator) {
				const operators = [
					tokens.operators.File,
					tokens.operators.Path,
					tokens.operators.MatchCase,
					tokens.operators.IgnoreCase,
					tokens.operators.Tag,
					tokens.operators.Content,
					tokens.operators.Line,
					tokens.operators.Block,
					tokens.operators.Section,
					tokens.operators.Task,
					tokens.operators.TaskToDo,
					tokens.operators.TaskDone,
				];
				const matching_operator = operators.find((it) => it.id.description === joined);
				if (matching_operator) {
					collected_tokens.push(matching_operator);
					return;
				}
				console.debug("no matching operator for", joined);
				console.debug(...operators.map((it) => [it.id, it.id.description]));
			}
			collected_tokens.push(tokens.word(joined));
		}
	}

	for (const char of input) {
		if (escaped) {
			escaped = false;
			buffer.push(char);
			continue;
		}
		if (char === "\\") {
			escaped = true;
			continue;
		}
		if (in_phrase) {
			if (char === '"') {
				in_phrase = false;
				collected_tokens.push(tokens.phrase(buffer.join("")));
				buffer = [];
				continue;
			}
			buffer.push(char);
			continue;
		}
		if (char === "-" && buffer.length === 0) {
			collected_tokens.push(tokens.Negate);
			buffer = [];
			continue;
		}
		if (char === '"') {
			in_phrase = true;
			continue;
		}
		if (char === ":") {
			endWord(true);
			collected_tokens.push(tokens.symbols.Colon);
			continue;
		}
		if (char === "(") {
			endWord();
			collected_tokens.push(tokens.symbols.GroupStart);
			continue;
		}
		if (char === ")") {
			endWord();
			collected_tokens.push(tokens.symbols.GroupEnd);
			continue;
		}
		if (char === "[") {
			endWord();
			collected_tokens.push(tokens.symbols.BracketOpen);
			continue;
		}
		if (char === "]") {
			endWord();
			collected_tokens.push(tokens.symbols.BracketClose);
			continue;
		}
		if (char === " ") {
			endWord();
			continue;
		}
		buffer.push(char);
	}
	endWord();

	return collected_tokens;
}
