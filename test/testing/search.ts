export class Search<T = any> {
	constructor(
		public readonly impl: T,
		public readonly searchFor: (this: Search<T>, query: string) => Promise<Array<Match>>,
	) { }
}

class Match {
	name: string;
	path: string;
}
