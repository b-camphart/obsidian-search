export abstract class AsyncFilter<in T> {
	abstract appliesTo(check: T): Promise<boolean>;
	abstract toQuery(): string;
	abstract explanation(this: AsyncFilter<T>): string;

	and(this: AsyncFilter<T>, other: AsyncFilter<T>): AsyncFilter<T> {
		if (other instanceof AsyncAndFilter) {
			return new AsyncAndFilter({ filters: [this, ...other.filters] });
		}
		return new AsyncAndFilter({ filters: [this, other] });
	}

	or(this: AsyncFilter<T>, other: AsyncFilter<T>): AsyncFilter<T> {
		if (other instanceof AsyncOrFilter) {
			return new AsyncOrFilter({ filters: [this, ...other.filters] });
		}
		return new AsyncOrFilter({ filters: [this, other] });
	}

	negated(this: AsyncFilter<T>): AsyncFilter<T> {
		return new AsyncNegation({ filter: this });
	}
}

export abstract class Filter<in T> {
	abstract appliesTo(check: T): boolean;
	abstract toQuery(): string;
	abstract explanation(this: Filter<T>): string;

	and(this: Filter<T>, other: Filter<T>): Filter<T> {
		if (other instanceof AndFilter) {
			return new AndFilter({ filters: [this, ...other.filters] });
		}
		return new AndFilter({ filters: [this, other] });
	}

	or(this: Filter<T>, other: Filter<T>): Filter<T> {
		if (other instanceof OrFilter) {
			return new OrFilter({ filters: [this, ...other.filters] });
		}
		return new OrFilter({ filters: [this, other] });
	}

	negated(this: Filter<T>): Filter<T> {
		return new Negation({ negated_filter: this });
	}

	static #AsyncFilter = class<T> extends AsyncFilter<T> {
		constructor(public filter: Filter<T>) {
			super();
		}

		override async appliesTo(check: T): Promise<boolean> {
			return this.filter.appliesTo(check);
		}

		override toQuery(): string {
			return this.filter.toQuery();
		}

		override explanation(): string {
			return this.filter.explanation();
		}
	};

	async(this: Filter<T>): AsyncFilter<T> {
		return new Filter.#AsyncFilter(this);
	}
}

export class Negation<T> extends Filter<T> {
	negated_filter: Filter<T>;

	constructor(def: { negated_filter: Filter<T> }) {
		super();
		this.negated_filter = def.negated_filter;
	}

	override appliesTo(this: Negation<T>, check: T): boolean {
		return !this.negated_filter.appliesTo(check);
	}

	override toQuery(this: Negation<T>): string {
		return `-${this.negated_filter.toQuery()}`;
	}

	override negated(this: Negation<T>): Filter<T> {
		return this.negated_filter;
	}

	override explanation(this: Negation<T>): string {
		return "";
	}
}

export class AsyncNegation<T> extends AsyncFilter<T> {
	negated_filter: AsyncFilter<T>;

	constructor(def: { filter: AsyncFilter<T> }) {
		super();
		this.negated_filter = def.filter;
	}

	override async appliesTo(check: T): Promise<boolean> {
		return !(await this.negated_filter.appliesTo(check));
	}

	override toQuery(): string {
		return `-${this.negated_filter.toQuery()}`;
	}

	override negated(this: AsyncNegation<T>): AsyncFilter<T> {
		return this.negated_filter;
	}

	override explanation(this: AsyncNegation<T>): string {
		return "";
	}
}

export class AndFilter<T> extends Filter<T> {
	filters;

	constructor(def: { filters: [Filter<T>, ...Filter<T>[]] }) {
		super();
		this.filters = def.filters;
	}

	override appliesTo(this: AndFilter<T>, check: T): boolean {
		for (const filter of this.filters) {
			if (!filter.appliesTo(check)) return false;
		}
		return true;
	}

	override toQuery(this: AndFilter<T>): string {
		let query = "(";
		for (let i = 0; i < this.filters.length; i++) {
			query += this.filters[i].toQuery();
			if (i < this.filters.length - 1) {
				query += " ";
			}
		}
		return query + ")";
	}

	override and(this: AndFilter<T>, other: Filter<T>): Filter<T> {
		if (other instanceof AndFilter) {
			return new AndFilter({
				filters: [...this.filters, ...other.filters],
			});
		}
		return new AndFilter({ filters: [...this.filters, other] });
	}

	override explanation(this: AndFilter<T>): string {
		return "";
	}
}

export class AsyncAndFilter<T> extends AsyncFilter<T> {
	filters;

	constructor(def: { filters: [AsyncFilter<T>, ...AsyncFilter<T>[]] }) {
		super();
		this.filters = def.filters;
	}

	override async appliesTo(this: AsyncAndFilter<T>, check: T): Promise<boolean> {
		const all = await Promise.all(this.filters.map((it) => it.appliesTo(check)));
		return all.every((it) => it);
	}

	override toQuery(this: AsyncAndFilter<T>): string {
		let query = "";
		for (let i = 0; i < this.filters.length; i++) {
			query += this.filters[i].toQuery();
			if (i < this.filters.length - 1) {
				query += " ";
			}
		}
		return query;
	}

	override and(this: AsyncAndFilter<T>, other: AsyncFilter<T>): AsyncFilter<T> {
		if (other instanceof AsyncAndFilter) {
			return new AsyncAndFilter({
				filters: [...this.filters, ...other.filters],
			});
		}
		return new AsyncAndFilter({ filters: [...this.filters, other] });
	}

	override explanation(this: AsyncAndFilter<T>): string {
		return "";
	}
}

export class OrFilter<T> extends Filter<T> {
	filters;

	constructor(def: { filters: [Filter<T>, ...Filter<T>[]] }) {
		super();
		this.filters = def.filters;
	}

	override appliesTo(this: OrFilter<T>, check: T): boolean {
		for (const filter of this.filters) {
			if (filter.appliesTo(check)) return true;
		}
		return false;
	}

	override toQuery(): string {
		return orQuery(this.filters);
	}

	override or(this: OrFilter<T>, other: Filter<T>): Filter<T> {
		if (other instanceof OrFilter) {
			return new OrFilter({
				filters: [...this.filters, ...other.filters],
			});
		}
		return new OrFilter({ filters: [...this.filters, other] });
	}

	override explanation(this: OrFilter<T>): string {
		return "";
	}
}

function orQuery(filters: Array<{ toQuery(): string }>): string {
	if (filters.length === 1) return filters[0].toQuery();
	let query = "";
	for (let i = 0; i < filters.length; i++) {
		query += filters[i].toQuery();
		if (i < filters.length - 1) {
			query += " OR ";
		}
	}
	return query;
}

export class AsyncOrFilter<T> extends AsyncFilter<T> {
	filters;

	constructor(def: { filters: [AsyncFilter<T>, ...AsyncFilter<T>[]] }) {
		super();
		this.filters = def.filters;
	}

	override async appliesTo(this: AsyncOrFilter<T>, check: T): Promise<boolean> {
		for (const filter of this.filters) {
			if (await filter.appliesTo(check)) return true;
		}
		return false;
	}

	override toQuery(): string {
		return orQuery(this.filters);
	}

	override or(this: AsyncOrFilter<T>, other: AsyncFilter<T>): AsyncFilter<T> {
		if (other instanceof AsyncOrFilter) {
			return new AsyncOrFilter({
				filters: [...this.filters, ...other.filters],
			});
		}
		return new AsyncOrFilter({ filters: [...this.filters, other] });
	}

	override explanation(this: AsyncOrFilter<T>): string {
		return "";
	}
}

export class InvalidFilter extends Filter<any> {
	override appliesTo(check: any): boolean {
		return false;
	}

	override toQuery(): string {
		return "";
	}

	override negated(this: Filter<any>): Filter<any> {
		return this;
	}

	override and(this: Filter<any>, other: Filter<any>): Filter<any> {
		return this;
	}

	override or(this: Filter<any>, other: Filter<any>): Filter<any> {
		return this;
	}

	override async(this: Filter<any>): AsyncFilter<any> {
		return new InvalidAsyncFilter();
	}

	override explanation(this: Filter<any>): string {
		return "invalid";
	}
}

export class InvalidAsyncFilter extends AsyncFilter<any> {
	override appliesTo(check: any): Promise<boolean> {
		return Promise.resolve(false);
	}

	override toQuery(): string {
		return "";
	}

	override negated(): AsyncFilter<any> {
		return this;
	}

	override and(_other: AsyncFilter<any>): AsyncFilter<any> {
		return this;
	}

	override or(_other: AsyncFilter<any>): AsyncFilter<any> {
		return this;
	}

	override explanation(this: AsyncFilter<any>): string {
		return "invalid";
	}
}

export function isInvalid(filter: Filter<any> | AsyncFilter<any>): boolean {
	return filter instanceof InvalidFilter || filter instanceof InvalidAsyncFilter;
}
