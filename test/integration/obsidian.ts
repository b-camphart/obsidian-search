

class SearchMatch {
	constructor(
		public readonly name: string
	) { }
}

export class Files<File> {
	constructor(
		public createFile: (name_with_extension: string, body?: string, frontmatter?: {
			tags?: string[],
			aliases?: string[],
			properties?: Record<string, any>,
		}) => Promise<File>,
		public deleteFile: (file: File) => Promise<void>,
		public searchFor: (query: string) => Promise<Array<SearchMatch>>,
		public readFile: (file: File) => Promise<string>,
	) { }

	static SearchMatch = SearchMatch;
}


