export class Files<File, Impl = any> {
	readonly impl: Impl;
	readonly createFile: (this: Files<File, Impl>, path: string, body?: string, frontmatter?: Frontmatter) => Promise<File>;
	readonly readFile: (this: Files<File, Impl>, file: File) => Promise<string>;
	readonly deleteFile: (this: Files<File, Impl>, file: File) => void;

	constructor(def: {
		impl: any,
		createFile(this: Files<File, Impl>, path: string, body?: string, frontmatter?: {
			tags?: Array<string>,
			aliases?: Array<string>,
			properties?: Record<string, any>,
		}): Promise<File>,
		readFile(this: Files<File, Impl>, file: File): Promise<string>,
		deleteFile(this: Files<File, Impl>, file: File): void,
	}) {
		this.impl = def.impl;
		this.createFile = def.createFile;
		this.readFile = def.readFile;
		this.deleteFile = def.deleteFile;
	}
}

export class Frontmatter {
	tags: Array<string>;
	aliases: Array<string>;
	cssclasses: Array<string>;
	properties: Record<string, any>;

	constructor(def: {
		tags?: Array<string>,
		aliases?: Array<string>,
		cssclasses?: Array<string>,
		properties?: Record<string, any>,
	}) {
		this.tags = def.tags ?? [];
		this.aliases = def.aliases ?? [];
		this.cssclasses= def.cssclasses?? [];
		this.properties = def.properties ?? {};
	}
}
