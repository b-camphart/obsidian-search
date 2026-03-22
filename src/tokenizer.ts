class TokenType {
	constructor() {
		Object.freeze(this);
	}
}
export type { TokenType };

export namespace tokens {
	export namespace literals {
		export const Word = class {
			constructor(public readonly word: string) {
				Object.freeze(this);
			}
		};
		export const Phrase = class {
			constructor(public readonly word: string) {
				Object.freeze(this);
			}
		};
	}
	export namespace operators {
		export const Negate = new TokenType();
		export const Field = new TokenType();
		export const Or = new TokenType();
	}
	export namespace symbols {
		export const Paren = Object.freeze({
			Open: new TokenType(),
			Close: new TokenType(),
		});
		export const Bracket = Object.freeze({
			Open: new TokenType(),
			Close: new TokenType(),
		});
	}
	export namespace keywords {
		export const Tag = new TokenType();
		export const Path = new TokenType();
		export const File = new TokenType();
		export const Content = new TokenType();
	}
}

type Token = object;

export function tokensFromQuery(query: string) {
	query = query.trim();
	return tokenizeDefault(query, 0, []);
}

function tokenizeDefault(query: string, i: number, found_tokens: Array<Token>): Array<Token> {
	if (i === query.length) return found_tokens;
	switch (query[i]) {
		case `-`: {
			found_tokens.push(tokens.operators.Negate);
			return tokenizeDefault(query, i + 1, found_tokens);
		}
		case `"`: {
			return tokenizePhrase(query, i + 1, found_tokens);
		}
		case `/`: {
			return new RegexParser(this.filterType, this.matchCase);
		}
		case `(`: {
			found_tokens.push(tokens.symbols.Paren.Open);
			return tokenizeDefault(query, i + 1, found_tokens);
		}
		case `[`: {
			found_tokens.push(tokens.symbols.Bracket.Open);
			return tokenizeProperty(query, i + 1, found_tokens);
		}
		case ` `: {
			return tokenizeDefault(query, i + 1, found_tokens);
		}
		default: {
			return tokenizeWord(query, i, found_tokens); // don't increment
		}
	}
}

function tokenizePhrase(query: string, i: number, found_tokens: Array<Token>): Array<Token> {
	if (i === query.length) return found_tokens;

	let buffer = "";
	let escaped = false;
	for (; i < query.length; i++) {
		if (escaped) {
			escaped = false;
			buffer += query[i];
			continue;
		}
		if (query[i] === "\\") {
			escaped = true;
			continue;
		}
		if (query[i] === `"`) {
			found_tokens.push(new tokens.literals.Phrase(buffer));
			return tokenizeDefault(query, i + 1, found_tokens);
		}
	}
}

function tokenizeWord(query: string, i: number, found_tokens: Array<Token>): Array<Token> {
	if (i === query.length) return found_tokens;

	let buffer = "";
	for (; i < query.length; i++) {
		if (query[i] === ":") {
			switch (buffer) {
				case `file`: {
					found_tokens.push(tokens.keywords.File);
					return tokenizeDefault(query, i + 1, found_tokens);
				}
				case `path`: {
					found_tokens.push(tokens.keywords.Path);
					return tokenizeDefault(query, i + 1, found_tokens);
				}
				case "content": {
					found_tokens.push(tokens.keywords.Content);
					return tokenizeDefault(query, i + 1, found_tokens);
				}
				case "tag": {
					found_tokens.push(tokens.keywords.Tag);
					return tokenizeDefault(query, i + 1, found_tokens);
				}
			}
		}
		if (query[i] === ` `) {
			found_tokens.push(new tokens.literals.Word(buffer));
			return tokenizeDefault(query, i + 1, found_tokens);
		}
		buffer += query[i];
	}
}

function tokenizeProperty(query: string, i: number, found_tokens: Array<Token>): Array<Token> {
	if (i === query.length) return found_tokens;

	let buffer = "";
	for (; i < query.length; i++) {
		if (query[i] === "]") {
			found_tokens.push(new tokens.literals.Word(buffer));
			return tokenizeDefault(query, i + 1, found_tokens);
		} else if (query[i] === ":") {
			found_tokens.push(new tokens.literals.Word(buffer));
			return tokenizePropertyValue(query, i + 1, found_tokens);
		}

		buffer += query[i];
	}
}

function tokenizePropertyValue(query: string, i: number, found_tokens: Array<Token>): Array<Token> {
	if (i === query.length) return found_tokens;

	let buffer = "";
	for (; i < query.length; i++) {
		if (query[i] === "]") {
			found_tokens.push(new tokens.literals.Word(buffer));
			return tokenizeDefault(query, i + 1, found_tokens);
		}
		buffer += query[i];
	}
}
