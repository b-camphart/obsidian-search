import {
	AndFilter,
	AsyncAndFilter,
	AsyncFilter,
	AsyncNegation,
	AsyncOrFilter,
	Filter,
	Negation,
	OrFilter,
	InvalidFilter,
} from "./Filter";

export const invalid = new InvalidFilter();

export function all<T>(first_filter: Filter<T>, ...filters: Filter<T>[]): Filter<T> {
	if (filters.length === 0) return first_filter;
	if (first_filter instanceof AndFilter) {
		return new AndFilter({
			filters: [...first_filter.filters, ...filters],
		});
	}
	return new AndFilter({ filters: [first_filter, ...filters] });
}
function allAsync<T>(first_filter: AsyncFilter<T>, ...filters: AsyncFilter<T>[]): AsyncFilter<T> {
	if (filters.length === 0) return first_filter;
	if (first_filter instanceof AsyncAndFilter) {
		return new AsyncAndFilter({
			filters: [...first_filter.filters, ...filters],
		});
	}
	return new AsyncAndFilter({ filters: [first_filter, ...filters] });
}

export { all as matchAll };

export function any<T>(first_filter: Filter<T>, ...filters: Filter<T>[]): Filter<T> {
	if (filters.length === 0) return first_filter;
	if (first_filter instanceof OrFilter) {
		return new OrFilter({ filters: [...first_filter.filters, ...filters] });
	}
	return new OrFilter({ filters: [first_filter, ...filters] });
}

function anyAsync<T>(first_filter: AsyncFilter<T>, ...filters: AsyncFilter<T>[]): AsyncFilter<T> {
	if (filters.length === 0) return first_filter;
	if (first_filter instanceof AsyncOrFilter) {
		return new AsyncOrFilter({
			filters: [...first_filter.filters, ...filters],
		});
	}
	return new AsyncOrFilter({ filters: [first_filter, ...filters] });
}

export function negate<T>(to_negate: Filter<T>): Filter<T> {
	if (to_negate instanceof Negation) {
		return to_negate.negated_filter;
	}
	return new Negation({ negated_filter: to_negate });
}

function negateAsync<T>(to_negate: AsyncFilter<T>): AsyncFilter<T> {
	if (to_negate instanceof AsyncNegation) {
		return to_negate.negated_filter;
	}
	return new AsyncNegation({ filter: to_negate });
}

export { Filter };
export { Negation };
export { OrFilter as Or };
export { AndFilter as And };

export namespace async {
	export const all = allAsync;
	export const any = anyAsync;
	export const negate = negateAsync;

	export const Filter = AsyncFilter;
	export const And = AsyncAndFilter;
	export const Or = AsyncOrFilter;
	export const Negation = AsyncNegation;
}

import * as file_filter from "./FileFilter";
import * as file_name from "./FileNameFilter";
import * as file_path from "./FilePathFilter";
import * as file_property from "./FilePropertyFilter";
import * as file_content from "./FileContentFilter";
import * as file_tags from "./FileTagsFilter";
import * as fuzzy_file_filter from "./FuzzyFileFilter";
export namespace file {
	export type Filter = file_filter.FileFilter;
	export type Async = file_filter.AsyncFileFilter;

	export const Name = file_name.NameFilter;
	export const name = file_name.file;

	export const Path = file_path.PathFilter;
	export const path = file_path.path;

	export type Property = file_property.PropertyFilter;
	export const Property = file_property.PropertyFilter;
	export const property = file_property.property;
	export const propertyName = file_property.propertyName;
	export type PropertyName = file_property.PropertyNameFilter;
	export const PropertyName = file_property.PropertyNameFilter;
	export const propertyValue = file_property.propertyValue;
	export type Frontmatter = file_property.FrontmatterFilter;

	export const Content = file_content.ContentFilter;
	export const content = file_content.content;

	export const Tags = file_tags.TagFilter;
	export const tag = file_tags.tag;

	export const Fuzzy = fuzzy_file_filter.FuzzyFileFilter;
	export const fuzzy = fuzzy_file_filter.FuzzyFileFilter.make;
}

import {
	BasicStringFilter,
	RegexStringFilter,
	StringFilter,
	basic as basicStringFilter,
	quoted as quotedStringFilter,
	regex as regexStringFilter,
} from "./strings";
export namespace strings {
	export type Filter = StringFilter;

	export const Basic = BasicStringFilter;
	export const basic = basicStringFilter;
	export const quoted = quotedStringFilter;
	export const Regex = RegexStringFilter;
	export const regex = regexStringFilter;
}
