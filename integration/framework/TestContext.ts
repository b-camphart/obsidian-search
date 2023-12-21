import Module from "module";
import { App } from "obsidian";

export interface TestContext {
    name: string

    beforeAll(cb: (app: App) => void | Promise<void>): void;
    test(name: string, cb: (app: App) => void | Promise<void>): void;
}

export interface TestModule extends Module {

    suite?(this: TestContext): void | Promise<void>

}