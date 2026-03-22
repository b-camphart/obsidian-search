import { type TFile } from "obsidian";
import { AsyncFilter } from "./Filter";

enum MatchKind {
	String,
	Regex,
}
type Match =
	| ({ kind: MatchKind.String; string: string } & (
			| { exact: false }
			| { exact: true; regex: RegExp }
	  ))
	| { kind: MatchKind.Regex; regex: RegExp };

function stringMatch(
	string: string,
	exact: boolean = false,
): Extract<Match, { kind: MatchKind.String }> {
	switch (exact) {
		case false:
			return { kind: MatchKind.String, string, exact };
		case true: {
			const escaped = string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

			const regex = new RegExp(`(^|[^\\w])${escaped}(?!\\w)`);
			return { kind: MatchKind.String, string, exact, regex };
		}
	}
}

function regexMatch(regex: RegExp): Extract<Match, { kind: MatchKind.Regex }> {
	return { kind: MatchKind.Regex, regex };
}

type File = {
	basename: string;
	vault: {
		cachedRead(file: File): Promise<string>;
	};
};

export class FuzzyFileFilter extends AsyncFilter<TFile> {
	static make(
		match:
			| { regex: RegExp; kind?: "regex" }
			| { string: string; exact?: boolean; kind?: "string" },
	): FuzzyFileFilter {
		switch (match.kind) {
			case "string":
				return new FuzzyFileFilter({ match: stringMatch(match.string, match.exact) });
			case "regex":
				return new FuzzyFileFilter({ match: regexMatch(match.regex) });
			default: {
				if ("string" in match) {
					return new FuzzyFileFilter({ match: stringMatch(match.string, match.exact) });
				} else {
					return new FuzzyFileFilter({ match: regexMatch(match.regex) });
				}
			}
		}
	}

	match: Match;

	constructor(def: { match: Match }) {
		super();
		this.match = def.match;
	}

	static appliesTo(match: Match, file: File) {
		switch (match.kind) {
			case MatchKind.String: {
				if (file.basename.includes(match.string)) {
					return true;
				}

				return file.vault.cachedRead(file).then((content) => {
					switch (match.exact) {
						case false: {
							return content.includes(match.string);
						}
						case true: {
							match.regex.lastIndex = 0;
							return match.regex.test(content);
						}
					}
				});
			}
			case MatchKind.Regex: {
				if (match.regex.test(file.basename)) {
					return true;
				}

				return file.vault.cachedRead(file).then((content) => {
					match.regex.lastIndex = 0;
					return match.regex.test(content);
				});
			}
		}
	}

	async appliesTo(this: FuzzyFileFilter, file: TFile): Promise<boolean> {
		return FuzzyFileFilter.appliesTo(this.match, file);
	}

	toQuery(this: FuzzyFileFilter): string {
		switch (this.match.kind) {
			case MatchKind.Regex:
				return this.match.regex.toString();
			case MatchKind.String: {
				switch (this.match.exact) {
					case true:
						return `"${this.match.string}"`;
					case false:
						return this.match.string;
				}
			}
		}
	}

	override explanation(): string {
		switch (this.match.kind) {
			case MatchKind.String: {
				switch (this.match.exact) {
					case false:
						return `Matches text: "${this.match.string}"`;
					case true:
						return `Contains exact text: "${this.match.string}"`;
				}
			}
			case MatchKind.Regex:
		}
		return "";
	}
}
