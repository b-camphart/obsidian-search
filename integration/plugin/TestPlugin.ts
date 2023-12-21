/// <reference types="vite/client" />
import { App, Plugin } from "obsidian";
import { TestContext, TestModule } from "../framework/TestContext";

const testModules = import.meta.glob("../tests/**/*.test.ts", { eager: true });

class Context implements TestContext {
    constructor(
        private readonly app: App
    ) {}

    private currentContext: { id: string, name: string } | undefined;

    get name() {
        return this.currentContext?.name ?? ""
    }
    set name(name: string) {
        if (this.currentContext != null) {
            this.currentContext.name = name
        }
    }

    suite(id: string): TestContext {
        const context: { id: string, name: string } = {
            id,
            name: "",
        };

        this.currentContext = context;

        return this;
    }

    private beforeAllCallbacks = new Map<
        string,
        ((app: App) => void | Promise<void>)[]
    >();
    async triggerBeforeAll() {
        let log = "";
        for (const [moduleId, callbacks] of this.beforeAllCallbacks) {
            for (const callback of callbacks) {
                try {
                    const result = callback(this.app);
                    if (result instanceof Promise) await result;
                } catch (e) {
                    log += `> [!error] ${moduleId}\n> Failed during beforeAll.\n> ${e}\n\n`;
                }
            }
        }

        return log;
    }

    beforeAll(cb: (app: App) => void | Promise<void>): void {
        const context = this.currentContext;
        if (context == null) return;
        const callbacks = this.beforeAllCallbacks.get(context.id) ?? [];
        callbacks.push(cb);
        this.beforeAllCallbacks.set(context.id, callbacks);
    }

    private tests = new Map<
        string,
        { name: string; cb: (app: App) => void | Promise<void> }[]
    >();
    test(name: string, cb: (app: App) => void | Promise<void>): void {
        const context = this.currentContext;
        if (context == null) return;
        const callbacks = this.tests.get(context.id) ?? [];
        callbacks.push({ name, cb });
        this.tests.set(context.id, callbacks);
    }

    async * runTests() {
        for (const [moduleId, tests] of this.tests) {
            if (tests.length > 0) {
                yield "###### "+ moduleId + "\n"
            }
            for (const test of tests) {
                try {
                    const result = test.cb(this.app);
                    if (result instanceof Promise) await result;
                    yield `> [!info] ${test.name}\n\n`;
                } catch (e) {
                    yield `> [!error] ${test.name}\n> ${e}\n\n`;
                }
            }
        }

    }
}

export default class TestPlugin extends Plugin {
    onload(): void {
        const context = new Context(this.app);
        let resultLog = "";

        process.on("message", (message) => {
            console.log("Plugin received process message", message)
        })

        const initializations: Promise<void>[] = []
        for (const moduleId in testModules) {
            const module = testModules[moduleId] as TestModule;
            if (module.suite != null) {
                try {
                   const result = module.suite.call(context.suite(moduleId));
                   if (result instanceof Promise) initializations.push(result)
                } catch (e) {
                    resultLog += `> [!error] ${moduleId}\n> Failed during initialization.\n> ${e}\n\n`;
                }
            } else {
                resultLog += `> [!warn] ${moduleId}\n> No suite defined.\n\n`;
            }
        }

        this.app.workspace.onLayoutReady(async () => {
            await Promise.all(initializations)
            const resultsFile = await this.app.vault.create("results.md", resultLog + "Waiting for tests to execute...");
            this.app.workspace.openLinkText("", "results.md")
            
            resultLog += await context.triggerBeforeAll();

            let triggered = false;
            const triggerCallbacks = async () => {
                if (triggered) return;
                triggered = true;

                for await (const result of context.runTests()) {
                    resultLog += result;
                    await this.app.vault.modify(resultsFile, resultLog)
                }
                

            };
            setTimeout(triggerCallbacks, 2000);
        });
    }
}
