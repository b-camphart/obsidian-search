import { Filter } from "./Filter";

export type StringFilter = Filter<string>;

export class BasicStringFilter extends Filter<string> {
	match: string;
	quoted: boolean;
	constructor(def: Pick<BasicStringFilter, "match" | "quoted">) {
		super();
		this.match = def.match;
		this.quoted = def.quoted;
	}

	override toQuery(this: BasicStringFilter): string {
		if (this.quoted) return `"${this.match}"`;
		return this.match;
	}

	override appliesTo(check: string): boolean {
		if (this.match === "") return false;
		return check.toLowerCase().includes(this.match.toLowerCase());
	}
}

export function basic(string: string): StringFilter {
	return new BasicStringFilter({ match: string, quoted: false });
}
export function quoted(string: string): StringFilter {
	return new BasicStringFilter({ match: string, quoted: true });
}

export function regex(regex: RegExp): StringFilter {
	return new RegexStringFilter({ regex });
}

/** filters strings based on if they match a regex */
export class RegexStringFilter extends Filter<string> {
	regex;

	constructor({ regex }: { regex: RegExp }) {
		super();
		this.regex = regex;
	}

	override appliesTo(check: string): boolean {
		return this.matchesString(check);
	}

	override toQuery(): string {
		return `/${this.regex.source}/`;
	}

	matchesString(this: RegexStringFilter, string: string): boolean {
		return this.regex.test(string);
	}
}
