import type * as obsidian from "obsidian";
import * as filters from "./filters";
import { InvalidAsyncFilter, isInvalid } from "./filters/Filter";
import { BasicStringFilter, StringFilter } from "./filters/strings";

enum FileFilterType {
	Async,
	Sync,
}
type FileFilter =
	| { kind: FileFilterType.Sync; filter: filters.file.Filter }
	| { kind: FileFilterType.Async; filter: filters.file.Async };

function syncFileFilter(
	filter: filters.file.Filter,
): Extract<FileFilter, { kind: FileFilterType.Sync }> {
	return { kind: FileFilterType.Sync, filter };
}
function asyncFileFilter(
	filter: filters.file.Async,
): Extract<FileFilter, { kind: FileFilterType.Async }> {
	return { kind: FileFilterType.Async, filter };
}

function joinFileFilters(filterA: FileFilter, filterB: FileFilter): FileFilter {
	switch (filterA.kind) {
		case FileFilterType.Async: {
			switch (filterB.kind) {
				case FileFilterType.Async:
					return asyncFileFilter(filterA.filter.and(filterB.filter));
				case FileFilterType.Sync:
					return asyncFileFilter(filterA.filter.and(filterB.filter.async()));
			}
		}
		case FileFilterType.Sync: {
			switch (filterB.kind) {
				case FileFilterType.Async:
					return asyncFileFilter(filterA.filter.async().and(filterB.filter));
				case FileFilterType.Sync:
					return syncFileFilter(filterA.filter.and(filterB.filter));
			}
		}
	}
}

function eitherFileFilter(filterA: FileFilter, filterB: FileFilter): FileFilter {
	switch (filterA.kind) {
		case FileFilterType.Async: {
			switch (filterB.kind) {
				case FileFilterType.Async:
					return asyncFileFilter(filterA.filter.or(filterB.filter));
				case FileFilterType.Sync:
					return asyncFileFilter(filterA.filter.or(filterB.filter.async()));
			}
		}
		case FileFilterType.Sync: {
			switch (filterB.kind) {
				case FileFilterType.Async:
					return asyncFileFilter(filterA.filter.async().or(filterB.filter));
				case FileFilterType.Sync:
					return syncFileFilter(filterA.filter.or(filterB.filter));
			}
		}
	}
}

function negateFileFilter(filter: FileFilter): FileFilter {
	switch (filter.kind) {
		case FileFilterType.Async: {
			return asyncFileFilter(filter.filter.negated());
		}
		case FileFilterType.Sync: {
			return syncFileFilter(filter.filter.negated());
		}
	}
}

export class Parser {
	metadataCache;

	constructor(def: { metadataCache: Pick<obsidian.MetadataCache, "getFileCache"> }) {
		this.metadataCache = def.metadataCache;
	}

	filterFromQuery(this: Parser, query: string, logger?: Console): FileFilter["filter"] {
		logger?.info("tokenizing query...");
		const tokens = tokenizeQuery(query, logger);
		logger?.info("parsing tokens...");
		return this.#parseTokens(tokens, logger) ?? InvalidAsyncFilter;
	}

	#parseTokens(this: Parser, tokens: ReadonlyArray<Token>, logger?: Console) {
		const { filter } = this.#parseNextFilters(tokens, 0, () => false, logger);
		return filter?.filter;
	}

	#parseNextFilter(
		this: Parser,
		tokens: ReadonlyArray<Token>,
		index: number,
		logger?: Console,
	): { filter: FileFilter | null; consumed: number } {
		if (index >= tokens.length) {
			return { filter: null, consumed: 0 };
		}
		const token = tokens[index];
		logger?.info(index, token);

		switch (token.kind) {
			case TokenType.Word: {
				return {
					filter: asyncFileFilter(
						filters.file.fuzzy({
							kind: "string",
							string: token.word,
							exact: false,
						}),
					),
					consumed: 1,
				};
			}
			case TokenType.Phrase: {
				return {
					filter: asyncFileFilter(
						filters.file.fuzzy({
							kind: "string",
							string: token.phrase,
							exact: true,
						}),
					),
					consumed: 1,
				};
			}
			case TokenType.Regex: {
				return {
					filter: asyncFileFilter(
						filters.file.fuzzy({
							kind: "regex",
							regex: token.regex,
						}),
					),
					consumed: 1,
				};
			}
			case TokenType.Keyword: {
				const nextToken = tokens[index + 1];
				if (
					nextToken == null ||
					nextToken.kind !== TokenType.Symbol ||
					nextToken.symbol !== Symbols.Type.Colon
				) {
					throw new Error(`expected colon`);
				}
				switch (token.keyword) {
					case Keyword.Kind.File: {
						const { filter: next, consumed } = this.#parseNextStringFilter(
							tokens,
							index + 2,
						);

						return {
							filter: next == null ? null : syncFileFilter(filters.file.name(next)),
							consumed: consumed + 2,
						};
					}
					case Keyword.Kind.Path: {
						const { filter: next, consumed } = this.#parseNextStringFilter(
							tokens,
							index + 2,
						);

						return {
							filter:
								next == null
									? syncFileFilter(filters.file.path(filters.strings.basic("")))
									: syncFileFilter(filters.file.path(next)),
							consumed: consumed + 2,
						};
					}
					case Keyword.Kind.Tag: {
						const { filter: next, consumed } = this.#parseNextStringFilter(
							tokens,
							index + 2,
						);

						if (next == null) {
							return {
								filter: syncFileFilter(filters.file.tag("", this.metadataCache)),
								consumed: consumed + 2,
							};
						}

						if (!(next instanceof BasicStringFilter) || next.quoted) {
							return {
								filter: syncFileFilter(filters.invalid),
								consumed: consumed + 2,
							};
						}
						let word = next.match;

						if (word.startsWith("#")) {
							word = word.slice(1);
						}

						return {
							filter: syncFileFilter(filters.file.tag(word, this.metadataCache)),
							consumed: consumed + 2,
						};
					}
				}
			}
			case TokenType.Symbol: {
				switch (token.symbol) {
					case Symbols.Type.Negate: {
						const { filter: next, consumed } = this.#parseNextFilter(tokens, index + 1);

						return {
							filter: next === null ? null : negateFileFilter(next),
							consumed: consumed + 1,
						};
					}
					case Symbols.Type.LParen: {
						const { filter: next, consumed } = this.#parseNextFilters(
							tokens,
							index + 1,
							(token) =>
								token.kind === TokenType.Symbol &&
								token.symbol === Symbols.Type.RParen,
							logger,
						);
						return {
							filter: next,
							consumed: consumed + 1,
						};
					}
					case Symbols.Type.Colon: {
						return {
							filter: null,
							consumed: 1,
						};
					}
				}
			}
		}
		throw new Error(`unsupported token ${token}`);
	}

	#parseNextFilters(
		this: Parser,
		tokens: ReadonlyArray<Token>,
		index: number,
		endOn: (token: Token) => boolean,
		logger?: Console,
	) {
		let filter: FileFilter | null = null;
		const start = index;
		for (; index < tokens.length; ) {
			const token = tokens[index];
			if (endOn(token)) {
				logger?.info("ending multi-filter parse on", token);
				return { filter, consumed: index - start + 1 };
			}

			if (token === OR && filter !== null) {
				const prev: FileFilter = filter;
				logger?.info(index, token);
				const { filter: next, consumed } = this.#parseNextFilters(
					tokens,
					index + 1,
					endOn,
					logger,
				);
				index += consumed + 1;
				if (next) {
					filter = eitherFileFilter(prev, next);
				} else {
					filter = prev;
				}
				continue;
			}

			const { filter: next, consumed } = this.#parseNextFilter(tokens, index, logger);
			index += consumed;
			if (next) {
				if (filter) {
					filter = joinFileFilters(filter, next);
				} else {
					filter = next;
				}
			}
		}
		return { filter, consumed: index - start };
	}

	#parseNextStringFilter(
		this: Parser,
		tokens: ReadonlyArray<Token>,
		index: number,
		logger?: Console,
	): { filter: StringFilter | null; consumed: number } {
		if (index >= tokens.length) {
			return { filter: null, consumed: 0 };
		}
		const token = tokens[index];
		logger?.info(index, token);

		switch (token.kind) {
			case TokenType.Word: {
				return {
					filter: filters.strings.basic(token.word),
					consumed: 1,
				};
			}
			case TokenType.Phrase: {
				return {
					filter: filters.strings.quoted(token.phrase),
					consumed: 1,
				};
			}
			case TokenType.Regex: {
				return {
					filter: filters.strings.regex(token.regex),
					consumed: 1,
				};
			}
			case TokenType.Symbol: {
				switch (token.symbol) {
					case Symbols.Type.Negate: {
						const { filter: next, consumed } = this.#parseNextStringFilter(
							tokens,
							index + 1,
							logger,
						);
						return {
							filter: next?.negated() ?? null,
							consumed: consumed + 1,
						};
					}
					case Symbols.Type.LParen: {
						const { filters, consumed } = this.#parseNextStringFilters(
							tokens,
							index + 1,
							(token) =>
								token.kind === TokenType.Symbol &&
								token.symbol === Symbols.Type.RParen,
							logger,
						);
						if (filters.length === 0) {
							return {
								filter: null,
								consumed: consumed + 1,
							};
						}
						return {
							filter: filters
								.slice(1)
								.reduce((combined, filter) => combined.and(filter), filters[0]),
							consumed: consumed + 1,
						};
					}
					case Symbols.Type.RParen:
					case Symbols.Type.LBracket:
					case Symbols.Type.RBracket:
					case Symbols.Type.Colon:
				}
			}
			case TokenType.Keyword:
		}

		throw new Error(`unsupported token ${token}`);
	}

	#parseNextStringFilters(
		this: Parser,
		tokens: ReadonlyArray<Token>,
		index: number,
		endOn: (token: Token) => boolean,
		logger?: Console,
	) {
		const filters: StringFilter[] = [];
		const start = index;
		for (; index < tokens.length; ) {
			const token = tokens[index];
			if (endOn(token)) {
				logger?.info("ending multi-filter parse on", token);
				return { filters, consumed: index - start + 1 };
			}
			const { filter, consumed } = this.#parseNextStringFilter(tokens, index, logger);
			index += consumed;
			if (filter) {
				filters.push(filter);
			}
		}
		return { filters, consumed: index - start };
	}

	parseProperty(
		this: Parser,
		tokens: ReadonlyArray<Token>,
		start: number,
		logger?: Console,
	): { filter: filters.file.Filter; end: number } {
		const { filter: prop_name, end } = this.parsePropertyName(tokens, start, logger);
		logger?.log("parseProperty", { prop_name });
		return {
			filter: filters.file.property(prop_name, this.metadataCache),
			end,
		};
	}

	parsePropertyName(
		this: Parser,
		tokens: ReadonlyArray<Token>,
		start: number,
		logger?: Console,
	): { end: number; filter: filters.file.Frontmatter } {
		let buffer = "";
		let i = start;
		const negated =
			tokens[start]?.kind === TokenType.Symbol &&
			tokens[start]!.symbol === Symbols.Type.Negate;
		if (negated) i++;
		loop: for (; i < tokens.length; i++) {
			const token = tokens[i];
			switch (token.kind) {
				case TokenType.Phrase: {
					if (buffer.length > 0) buffer += " ";
					buffer += '"' + token.phrase + '"';
					continue loop;
				}
				case TokenType.Regex: {
					if (buffer.length > 0) buffer += " ";
					buffer += "/" + token.regex + "/";
					continue loop;
				}
				case TokenType.Word: {
					if (token.word === "OR" && buffer.length > 0) {
						const { filter: next_filter, end } = this.parsePropertyName(
							tokens,
							i + 1,
							logger,
						);
						let first_filter = filters.file.propertyName(strings.basic(buffer));
						if (negated) {
							first_filter = first_filter.negated();
						}
						return { filter: first_filter.or(next_filter), end };
					}
					if (buffer.length > 0) {
						switch (tokens[i - 1].kind) {
							case TokenType.Phrase:
							case TokenType.Regex:
							case TokenType.Word:
								buffer += " ";
						}
					}
					buffer += token.word;
					continue loop;
				}
				case TokenType.Symbol: {
					if (token.symbol === Symbols.Type.RBracket) break loop;
					if (token.symbol === Symbols.Type.Colon) break loop;
					if (token.symbol === Symbols.Type.Negate) {
						// to match obsidian's behavior, intentionally disgard next filters
						const { end } = this.parsePropertyName(tokens, i, logger);
						i = end;
						break loop;
					}
					buffer += token.raw;
					continue loop;
				}
				case TokenType.Keyword: {
					if (buffer.length > 0) buffer += " ";
					buffer += token.raw + ":";
					continue loop;
				}
			}
		}
		let filter = filters.file.propertyName(strings.basic(buffer));
		if (negated) {
			filter = filter.negated();
		}
		return { filter, end: i };
	}
}

function tokenizeQuery(query: string, logger?: Console) {
	query = query.trim();

	const found_tokens: Array<Token> = [];
	let buf_start = 0;
	for (let i = 0; i < query.length; i++) {
		const char = query[i];
		logger?.log({ char, i, buf_start });

		if (char === "-") {
			found_tokens.push(Symbols.Negate);
			buf_start += 1;
			continue;
		}

		if (char === "(") {
			found_tokens.push(Symbols.LParen);
			buf_start += 1;
			continue;
		}

		if (char === ")") {
			if (buf_start < i) {
				found_tokens.push(new Word({ word: query.slice(buf_start, i) }));
			}
			found_tokens.push(Symbols.RParen);
			buf_start = i + 1;
			continue;
		}

		if (char === "/") {
			const { regex, end } = tokenizeRegex(query, i + 1);
			logger?.log({ regex });
			found_tokens.push(new RegexToken({ regex }));
			buf_start = end + 1;
			i = end;
			continue;
		}

		if (char === '"' && buf_start === i) {
			const { quote, end } = consumeQuote(query, i + 1);
			logger?.log({ quote });
			found_tokens.push(new Phrase({ phrase: quote }));
			buf_start = end + 1;
			i = end;
			continue;
		}

		if (char === "[") {
			found_tokens.push(Symbols.LBracket);
			buf_start = i + 1;
			continue;
		}
		if (char === "]") {
			if (buf_start < i) {
				found_tokens.push(new Word({ word: query.slice(buf_start, i) }));
			}
			found_tokens.push(Symbols.RBracket);
			buf_start = i + 1;
			continue;
		}

		if (char === ":") {
			const word = query.slice(buf_start, i);
			switch (word.toLowerCase()) {
				case "file": {
					found_tokens.push(Keyword.File);
					break;
				}
				case "path": {
					found_tokens.push(Keyword.Path);
					break;
				}
				case "tag": {
					found_tokens.push(Keyword.Tag);
					break;
				}
				default:
					found_tokens.push(new Word({ word }));
			}
			found_tokens.push(Symbols.Colon);
			buf_start = i + 1;
			continue;
		}

		if (char === " ") {
			const word = query.slice(buf_start, i).trim();
			if (word !== "") {
				if (word === OR.raw) {
					found_tokens.push(OR);
				} else {
					found_tokens.push(new Word({ word }));
				}
			}
			buf_start = i + 1;
			continue;
		}
	}
	if (buf_start < query.length) {
		const word = query.slice(buf_start).trim();
		if (word === OR.raw) {
			found_tokens.push(OR);
		} else {
			found_tokens.push(new Word({ word }));
		}
	}

	return found_tokens;
}

function consumeQuote(query: string, start: number): { quote: string; end: number } {
	const buffer: Array<string> = [];
	let escaped = false;
	let i = start;
	for (i; i < query.length; i++) {
		const char = query[i];

		if (escaped) {
			escaped = false;
			buffer.push(char);
			continue;
		}
		if (char === "\\") {
			escaped = true;
			continue;
		}

		if (char === '"') {
			i++;
			break;
		}

		buffer.push(char);
	}
	return { quote: buffer.join(""), end: i };
}

function tokenizeRegex(query: string, start: number): { regex: RegExp; end: number } {
	const buffer: Array<string> = [];
	let i = start;
	for (i; i < query.length; i++) {
		const char = query[i];

		if (char === "/") {
			if (buffer.length > 0 && buffer[buffer.length - 1] === "\\") {
				buffer.push(char);
				continue;
			}
			i++;
			break;
		}

		buffer.push(char);
	}
	return { regex: new RegExp(buffer.join("")), end: i };
}

enum TokenType {
	Word,
	Phrase,
	Regex,
	OR,

	Symbol,

	Keyword,
}

namespace Keyword {
	export enum Kind {
		File,
		Path,
		Tag,
	}

	export const File = Object.freeze({
		kind: TokenType.Keyword,
		keyword: Keyword.Kind.File,
		raw: "file",
	});
	export const Path = Object.freeze({
		kind: TokenType.Keyword,
		keyword: Keyword.Kind.Path,
		raw: "path",
	});
	export const Tag = Object.freeze({
		kind: TokenType.Keyword,
		keyword: Keyword.Kind.Tag,
		raw: "tag",
	});

	export type Token = typeof File | typeof Path | typeof Tag;
}

namespace Symbols {
	export enum Type {
		Negate,
		LParen,
		RParen,
		LBracket,
		RBracket,
		Colon,
	}

	export const Negate = Object.freeze({
		kind: TokenType.Symbol,
		symbol: Type.Negate,
		raw: "-",
	});
	export const Colon = Object.freeze({
		kind: TokenType.Symbol,
		symbol: Type.Colon,
		raw: ":",
	});
	export const LParen = Object.freeze({
		kind: TokenType.Symbol,
		symbol: Type.LParen,
		raw: "(",
	});
	export const RParen = Object.freeze({
		kind: TokenType.Symbol,
		symbol: Type.RParen,
		raw: ")",
	});
	export const LBracket = Object.freeze({
		kind: TokenType.Symbol,
		symbol: Type.LBracket,
		raw: "[",
	});
	export const RBracket = Object.freeze({
		kind: TokenType.Symbol,
		symbol: Type.RBracket,
		raw: "]",
	});

	export type Token =
		| typeof Negate
		| typeof LParen
		| typeof RParen
		| typeof LBracket
		| typeof RBracket
		| typeof Colon;
}

class Phrase {
	get kind(): TokenType.Phrase {
		return TokenType.Phrase;
	}

	phrase: string;
	get raw(): string {
		return this.phrase;
	}

	constructor(def: { phrase: string }) {
		this.phrase = def.phrase;
	}
}

class RegexToken {
	get kind(): TokenType.Regex {
		return TokenType.Regex;
	}

	regex: RegExp;
	get raw(): string {
		return this.regex.source;
	}

	constructor(def: { regex: RegExp }) {
		this.regex = def.regex;
	}
}

class Word {
	get kind(): TokenType.Word {
		return TokenType.Word;
	}

	word: string;
	get raw(): string {
		return this.word;
	}

	constructor(def: { word: string }) {
		this.word = def.word;
	}
}

const OR = Object.freeze({
	kind: TokenType.OR,
	raw: "OR",
});

type Token = Phrase | Word | RegexToken | typeof OR | Symbols.Token | Keyword.Token;
