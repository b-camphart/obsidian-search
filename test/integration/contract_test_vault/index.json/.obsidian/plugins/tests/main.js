'use strict';

const obsidian = require('obsidian');
const net = require('net');
const util = require('util');
const path = require('path');

function _interopNamespaceDefault(e) {
	const n = Object.create(null, { [Symbol.toStringTag]: { value: 'Module' } });
	if (e) {
		for (const k in e) {
			if (k !== 'default') {
				const d = Object.getOwnPropertyDescriptor(e, k);
				Object.defineProperty(n, k, d.get ? d : {
					enumerable: true,
					get: () => e[k]
				});
			}
		}
	}
	n.default = e;
	return Object.freeze(n);
}

const obsidian__namespace = /*#__PURE__*/_interopNamespaceDefault(obsidian);

class SearchMatch {
  constructor(name) {
    this.name = name;
  }
}
class Files {
  constructor(createFile, deleteFile, searchFor, readFile) {
    this.createFile = createFile;
    this.deleteFile = deleteFile;
    this.searchFor = searchFor;
    this.readFile = readFile;
  }
  static SearchMatch = SearchMatch;
}

function ObsidianFiles(plugin, search) {
  return new Files(
    async (name, body = "", frontmatter) => {
      if (frontmatter) {
        let prefix = "---\n";
        if (frontmatter.tags) {
          prefix += "tags:\n";
          frontmatter.tags.forEach((tag) => prefix += "  - " + tag + "\n");
        }
        if (frontmatter.aliases) {
          prefix += "aliases:\n";
          frontmatter.aliases.forEach((alias) => prefix += `  - ${alias}
`);
        }
        if (frontmatter.properties) {
          for (const [prop, value] of Object.entries(frontmatter.properties)) {
            prefix += `${prop}: ${value}
`;
          }
        }
        prefix += "---\n";
        body = prefix + body;
      }
      const path_parts = name.split("/");
      if (path_parts.length > 1) {
        const folder_path = path.join(...path_parts.slice(0, -1));
        if (!plugin.app.vault.getFolderByPath(folder_path)) {
          await plugin.app.vault.createFolder(folder_path);
        }
      }
      const file = await plugin.app.vault.create(name, body);
      if (plugin.app.metadataCache.getFileCache(file) == null) {
        return new Promise((resolve) => {
          const ref = plugin.app.metadataCache.on("resolved", () => {
            if (plugin.app.metadataCache.getFileCache(file) != null) {
              plugin.app.metadataCache.offref(ref);
              resolve(file);
            }
          });
        });
      }
      return file;
    },
    async (file) => {
      await plugin.app.vault.delete(file, true);
      const path_parts = file.name.split("/");
      if (path_parts.length > 1) {
        const folder_path = path.join(...path_parts.slice(0, -1));
        const folder = plugin.app.vault.getFolderByPath(folder_path);
        if (!folder) return;
        if (folder.children.length === 0) {
          await plugin.app.vault.delete(folder, true);
        }
      }
    },
    search,
    async (file) => {
      return plugin.app.vault.cachedRead(file);
    }
  );
}
class SocketLogger {
  #socket;
  constructor(port = 43617) {
    this.#socket = net.createConnection({ port });
  }
  #sendMessage(...data) {
    let buffer = [];
    for (const entry of data) {
      if (typeof entry === "string") {
        buffer.push(entry);
      } else {
        buffer.push(util.inspect(entry, void 0, 4, true));
      }
    }
    this.#socket.write(buffer.join(" ") + "\0");
  }
  error(message, ...optionalParams) {
    this.#socket.write("ERROR");
    this.#sendMessage(message, ...optionalParams);
  }
  warn(message, ...optionalParams) {
    this.#socket.write("WARN");
    this.#sendMessage(message, ...optionalParams);
  }
  log(message, ...optionalParams) {
    this.#socket.write("INFO");
    this.#sendMessage(message, ...optionalParams);
  }
  end() {
    this.#socket.end();
  }
}
function Plugin(onload) {
  return class extends obsidian__namespace.Plugin {
    onload() {
      this.app.workspace.onLayoutReady(async () => {
        await onload(this);
      });
    }
  };
}

function testBasics(t, files) {
  t.test("word in body", async (t2) => {
    const file_with_match = await files.createFile("test.md", "foo");
    t2.after(() => files.deleteFile(file_with_match));
    const file_without_match = await files.createFile("test1.md");
    t2.after(() => files.deleteFile(file_without_match));
    const matches = await files.searchFor("foo");
    if (!matches.some((match) => match.name === "test.md")) {
      t2.log("expected to find 'test.md' in matches", matches);
      t2.fail();
    }
    if (matches.some((match) => match.name === "test1.md")) {
      t2.log("expected NOT to find 'test1.md' in matches", matches);
      t2.fail();
    }
  });
  t.test("phrase in body", async (t2) => {
    const file_with_match = await files.createFile("test.md", "foo bar");
    t2.after(() => files.deleteFile(file_with_match));
    const file_without_match = await files.createFile("test1.md", "foo");
    t2.after(() => files.deleteFile(file_without_match));
    const matches = await files.searchFor(`"foo bar"`);
    if (!matches.some((match) => match.name === "test.md")) {
      t2.failWith("expected to find 'test.md' in", matches);
    }
    if (matches.some((match) => match.name === "test1.md")) {
      t2.failWith("expected NOT to find 'test1.md' in", matches);
    }
  });
}

const FAIL_NOW = /* @__PURE__ */ Symbol();
class Suite {
  constructor(logger, parent = null) {
    this.logger = logger;
    this.parent = parent;
  }
  #tests = [];
  test(name, fn) {
    if (this.#ran) {
      this.logger.warn("already ran test suite, but trying to add", name, "test");
      return;
    }
    const nested = new Test(name, this);
    this.#tests.push({ test: nested, fn });
  }
  async suite(name, fn) {
    if (this.#ran) {
      this.logger.warn("already ran test suite, but trying to add", name, "suite");
      return;
    }
    const err = new Error();
    const nested = new Suite({
      log: (...data) => this.logger.log("   ", ...data),
      warn: (...data) => this.logger.warn("   ", ...data),
      error: (...data) => this.logger.error("   ", ...data)
    }, this);
    this.logger.log("TEST", name);
    try {
      await fn(nested);
    } catch (cause) {
      err.cause = cause;
      this.logger.error("Failed to init suite", err);
    }
    await nested.run();
    if (nested.failed()) {
      this.logger.log("FAIL", name);
      this.fail();
    } else {
      this.logger.log("PASS", name);
    }
  }
  #ran = false;
  async run() {
    this.#ran = true;
    for (const { test, fn } of this.#tests) {
      this.logger.log("TEST", test.name);
      const { log } = console;
      try {
        console.log = (...args) => Test.addLog(test, ...args);
        await fn(test);
      } catch (err) {
        test.fail();
        if (err !== FAIL_NOW) {
          Test.addLog(test, err);
        }
      } finally {
        console.log = log;
        let failed_during_test = test.failed();
        if (failed_during_test) {
          this.logger.log("FAIL", test.name);
          for (const { location, args } of test.logs()) {
            this.logger.log(location, ...args);
          }
        } else {
          this.logger.log("PASS", test.name);
        }
        test.cleanup();
        this.#cleanupTest(test);
      }
    }
    for (const cleanup of this.#after_all_fns) {
      try {
        await cleanup(this);
      } catch (err) {
        this.fail();
        this.logger.error("Suite failed during cleanup", err);
      }
    }
  }
  #after_all_fns = [];
  afterAll(fn) {
    this.#after_all_fns.push(fn);
  }
  /** alias for afterAll */
  after(fn) {
    this.afterAll(fn);
  }
  #after_each_fns = [];
  afterEach(fn) {
    this.#after_each_fns.push(fn);
  }
  async #cleanupTest(test) {
    for (const cleanup of this.#after_each_fns) {
      try {
        await cleanup(test);
      } catch (err) {
        test.fail();
        this.logger.error(test.name, "failed during cleanup", err);
      }
    }
    if (this.parent !== null) {
      this.parent.#cleanupTest(test);
    }
  }
  #failed = false;
  fail() {
    this.#failed = true;
    this.parent?.fail();
  }
  failed() {
    return this.#failed;
  }
}
class Test {
  constructor(name, parent) {
    this.name = name;
    this.parent = parent;
  }
  get logger() {
    return this.parent.logger;
  }
  #after_fns = [];
  after(fn) {
    this.#after_fns.push(fn);
  }
  async cleanup() {
    for (const cleanup of this.#after_fns) {
      try {
        await cleanup(this);
      } catch (err) {
        this.fail();
        this.logger.error(this.name, "failed during cleanup", err);
      }
    }
  }
  #failed = false;
  fail() {
    this.#failed = true;
    this.parent.fail();
  }
  failed() {
    return this.#failed;
  }
  /** equivelant to calling `log(...args)` and then `fail()` */
  failWith(...args) {
    const location = new Error().stack.split("\n")[2];
    this.#logs.push({ location, args });
    this.fail();
  }
  failNow() {
    this.fail();
    throw FAIL_NOW;
  }
  #logs = [];
  log(...args) {
    const location = new Error().stack.split("\n")[2];
    this.#logs.push({ location, args });
  }
  static addLog(test, ...args) {
    test.#logs.push({ location: "", args });
  }
  logs() {
    return this.#logs;
  }
}

const tests = /* #__PURE__ */ Object.assign({"./test.basics.ts": testBasics});
function allTests() {
  return Object.entries(tests).map(([filename, fn]) => ({ filename, run: fn }));
}

const contract_main = Plugin(async (plugin) => {
  const files = ObsidianFiles(
    plugin,
    async (query) => {
      const leaves = plugin.app.workspace.getLeavesOfType("search");
      if (leaves.length === 0) throw new Error("could not find any leaves of type 'search'");
      if (!leaves[0].isVisible()) {
        plugin.app.workspace.setActiveLeaf(leaves[0]);
      }
      const search = leaves[0].view;
      search.setQuery(query);
      return new Promise((resolve) => {
        const id = setInterval(() => {
          if (!search.queue.queue.runnable.running) {
            clearInterval(id);
          }
          resolve(Array.from(search.dom.resultDomLookup).map(([file, match]) => {
            return {
              name: file.name,
              path: file.path,
              basename: file.basename,
              extension: file.extension,
              content: match.content,
              metadata: plugin.app.metadataCache.getFileCache(file)?.frontmatter
            };
          }));
        }, 1);
      });
    }
  );
  const logger = new SocketLogger();
  const t = new Suite(logger);
  for (const { filename, run } of allTests()) {
    await t.suite(filename, (t2) => run(t2, files));
  }
  logger.log("");
  logger.end();
});

module.exports = contract_main;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzaWRpYW4tc2VhcmNoLmNqcyIsInNvdXJjZXMiOlsiLi4vdGVzdC9pbnRlZ3JhdGlvbi9vYnNpZGlhbi50cyIsIi4uL3Rlc3QvaW50ZWdyYXRpb24vY29tbW9uLm1haW4udHMiLCIuLi90ZXN0L2ludGVncmF0aW9uL3Rlc3RzL3Rlc3QuYmFzaWNzLnRzIiwiLi4vdGVzdC9pbnRlZ3JhdGlvbi9mcmFtZXdvcmsudHMiLCIuLi90ZXN0L2ludGVncmF0aW9uL3Rlc3RzL2luZGV4LnRzIiwiLi4vdGVzdC9pbnRlZ3JhdGlvbi9jb250cmFjdC5tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIlxuXG5jbGFzcyBTZWFyY2hNYXRjaCB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdHB1YmxpYyByZWFkb25seSBuYW1lOiBzdHJpbmdcblx0KSB7IH1cbn1cblxuZXhwb3J0IGNsYXNzIEZpbGVzPEZpbGU+IHtcblx0Y29uc3RydWN0b3IoXG5cdFx0cHVibGljIGNyZWF0ZUZpbGU6IChuYW1lX3dpdGhfZXh0ZW5zaW9uOiBzdHJpbmcsIGJvZHk/OiBzdHJpbmcsIGZyb250bWF0dGVyPzoge1xuXHRcdFx0dGFncz86IHN0cmluZ1tdLFxuXHRcdFx0YWxpYXNlcz86IHN0cmluZ1tdLFxuXHRcdFx0cHJvcGVydGllcz86IFJlY29yZDxzdHJpbmcsIGFueT4sXG5cdFx0fSkgPT4gUHJvbWlzZTxGaWxlPixcblx0XHRwdWJsaWMgZGVsZXRlRmlsZTogKGZpbGU6IEZpbGUpID0+IFByb21pc2U8dm9pZD4sXG5cdFx0cHVibGljIHNlYXJjaEZvcjogKHF1ZXJ5OiBzdHJpbmcpID0+IFByb21pc2U8QXJyYXk8U2VhcmNoTWF0Y2g+Pixcblx0XHRwdWJsaWMgcmVhZEZpbGU6IChmaWxlOiBGaWxlKSA9PiBQcm9taXNlPHN0cmluZz4sXG5cdCkgeyB9XG5cblx0c3RhdGljIFNlYXJjaE1hdGNoID0gU2VhcmNoTWF0Y2g7XG59XG5cblxuIiwiaW1wb3J0ICogYXMgb2JzaWRpYW4gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgbmV0IGZyb20gXCJuZXRcIjtcblxuaW1wb3J0IHsgRmlsZXMgfSBmcm9tIFwiLi9vYnNpZGlhblwiO1xuaW1wb3J0IHsgaW5zcGVjdCB9IGZyb20gXCJ1dGlsXCI7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSBcInBhdGhcIjtcblxuZGVjbGFyZSBjb25zdCBfX1RFU1RfUlVOTkVSX1BPUlRfXzogbnVtYmVyO1xuXG5leHBvcnQgZnVuY3Rpb24gT2JzaWRpYW5GaWxlcyhwbHVnaW46IG9ic2lkaWFuLlBsdWdpbiwgc2VhcmNoOiAocXVlcnk6IHN0cmluZykgPT4gUHJvbWlzZTx0eXBlb2YgRmlsZXMuU2VhcmNoTWF0Y2gucHJvdG90eXBlW10+KSB7XG5cdHJldHVybiBuZXcgRmlsZXM8b2JzaWRpYW4uVEZpbGU+KFxuXHRcdGFzeW5jIChuYW1lLCBib2R5ID0gXCJcIiwgZnJvbnRtYXR0ZXIpID0+IHtcblx0XHRcdGlmIChmcm9udG1hdHRlcikge1xuXHRcdFx0XHRsZXQgcHJlZml4ID0gXCItLS1cXG5cIjtcblx0XHRcdFx0aWYgKGZyb250bWF0dGVyLnRhZ3MpIHtcblx0XHRcdFx0XHRwcmVmaXggKz0gXCJ0YWdzOlxcblwiXG5cdFx0XHRcdFx0ZnJvbnRtYXR0ZXIudGFncy5mb3JFYWNoKHRhZyA9PiBwcmVmaXggKz0gXCIgIC0gXCIgKyB0YWcgKyBcIlxcblwiKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChmcm9udG1hdHRlci5hbGlhc2VzKSB7XG5cdFx0XHRcdFx0cHJlZml4ICs9IFwiYWxpYXNlczpcXG5cIlxuXHRcdFx0XHRcdGZyb250bWF0dGVyLmFsaWFzZXMuZm9yRWFjaChhbGlhcyA9PiBwcmVmaXggKz0gYCAgLSAke2FsaWFzfVxcbmApXG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGZyb250bWF0dGVyLnByb3BlcnRpZXMpIHtcblx0XHRcdFx0XHRmb3IgKGNvbnN0IFtwcm9wLCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoZnJvbnRtYXR0ZXIucHJvcGVydGllcykpIHtcblx0XHRcdFx0XHRcdHByZWZpeCArPSBgJHtwcm9wfTogJHt2YWx1ZX1cXG5gXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHByZWZpeCArPSBcIi0tLVxcblwiO1xuXHRcdFx0XHRib2R5ID0gcHJlZml4ICsgYm9keTtcblx0XHRcdH1cblx0XHRcdGNvbnN0IHBhdGhfcGFydHMgPSBuYW1lLnNwbGl0KFwiL1wiKTtcblx0XHRcdGlmIChwYXRoX3BhcnRzLmxlbmd0aCA+IDEpIHtcblx0XHRcdFx0Y29uc3QgZm9sZGVyX3BhdGggPSBqb2luKC4uLnBhdGhfcGFydHMuc2xpY2UoMCwgLTEpKTtcblx0XHRcdFx0aWYgKCFwbHVnaW4uYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aChmb2xkZXJfcGF0aCkpIHtcblx0XHRcdFx0XHRhd2FpdCBwbHVnaW4uYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihmb2xkZXJfcGF0aCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGNvbnN0IGZpbGUgPSBhd2FpdCBwbHVnaW4uYXBwLnZhdWx0LmNyZWF0ZShuYW1lLCBib2R5KTtcblx0XHRcdGlmIChwbHVnaW4uYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpID09IG51bGwpIHtcblx0XHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IHJlZiA9IHBsdWdpbi5hcHAubWV0YWRhdGFDYWNoZS5vbihcInJlc29sdmVkXCIsICgpID0+IHtcblx0XHRcdFx0XHRcdGlmIChwbHVnaW4uYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0cGx1Z2luLmFwcC5tZXRhZGF0YUNhY2hlLm9mZnJlZihyZWYpO1xuXHRcdFx0XHRcdFx0XHRyZXNvbHZlKGZpbGUpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZpbGU7XG5cdFx0fSxcblx0XHRhc3luYyAoZmlsZSkgPT4ge1xuXHRcdFx0YXdhaXQgcGx1Z2luLmFwcC52YXVsdC5kZWxldGUoZmlsZSwgdHJ1ZSlcblx0XHRcdGNvbnN0IHBhdGhfcGFydHMgPSBmaWxlLm5hbWUuc3BsaXQoXCIvXCIpXG5cdFx0XHRpZiAocGF0aF9wYXJ0cy5sZW5ndGggPiAxKSB7XG5cdFx0XHRcdGNvbnN0IGZvbGRlcl9wYXRoID0gam9pbiguLi5wYXRoX3BhcnRzLnNsaWNlKDAsIC0xKSlcblx0XHRcdFx0Y29uc3QgZm9sZGVyID0gcGx1Z2luLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgoZm9sZGVyX3BhdGgpO1xuXHRcdFx0XHRpZiAoIWZvbGRlcikgcmV0dXJuO1xuXHRcdFx0XHRpZiAoZm9sZGVyLmNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdGF3YWl0IHBsdWdpbi5hcHAudmF1bHQuZGVsZXRlKGZvbGRlciwgdHJ1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXHRcdHNlYXJjaCxcblx0XHRhc3luYyAoZmlsZSkgPT4ge1xuXHRcdFx0cmV0dXJuIHBsdWdpbi5hcHAudmF1bHQuY2FjaGVkUmVhZChmaWxlKVxuXHRcdH0sXG5cdCk7XG59XG5cbmV4cG9ydCBjbGFzcyBTb2NrZXRMb2dnZXIge1xuXHQjc29ja2V0O1xuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHBvcnQ6IG51bWJlciA9IF9fVEVTVF9SVU5ORVJfUE9SVF9fXG5cdCkge1xuXHRcdHRoaXMuI3NvY2tldCA9IG5ldC5jcmVhdGVDb25uZWN0aW9uKHsgcG9ydCB9KTtcblx0fVxuXG5cdCNzZW5kTWVzc2FnZSh0aGlzOiBTb2NrZXRMb2dnZXIsIC4uLmRhdGE6IHVua25vd25bXSkge1xuXHRcdGxldCBidWZmZXI6IEFycmF5PHN0cmluZz4gPSBbXTtcblx0XHRmb3IgKGNvbnN0IGVudHJ5IG9mIGRhdGEpIHtcblx0XHRcdGlmICh0eXBlb2YgZW50cnkgPT09IFwic3RyaW5nXCIpIHtcblx0XHRcdFx0YnVmZmVyLnB1c2goZW50cnkpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRidWZmZXIucHVzaChpbnNwZWN0KGVudHJ5LCB1bmRlZmluZWQsIDQsIHRydWUpKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy4jc29ja2V0LndyaXRlKGJ1ZmZlci5qb2luKFwiIFwiKSArIFwiXFwwXCIpXG5cdH1cblxuXHRlcnJvcih0aGlzOiBTb2NrZXRMb2dnZXIsIG1lc3NhZ2U/OiB1bmtub3duLCAuLi5vcHRpb25hbFBhcmFtczogdW5rbm93bltdKTogdm9pZCB7XG5cdFx0dGhpcy4jc29ja2V0LndyaXRlKFwiRVJST1JcIilcblx0XHR0aGlzLiNzZW5kTWVzc2FnZShtZXNzYWdlLCAuLi5vcHRpb25hbFBhcmFtcyk7XG5cdH1cblx0d2Fybih0aGlzOiBTb2NrZXRMb2dnZXIsIG1lc3NhZ2U/OiB1bmtub3duLCAuLi5vcHRpb25hbFBhcmFtczogdW5rbm93bltdKTogdm9pZCB7XG5cdFx0dGhpcy4jc29ja2V0LndyaXRlKFwiV0FSTlwiKVxuXHRcdHRoaXMuI3NlbmRNZXNzYWdlKG1lc3NhZ2UsIC4uLm9wdGlvbmFsUGFyYW1zKTtcblx0fVxuXHRsb2codGhpczogU29ja2V0TG9nZ2VyLCBtZXNzYWdlPzogdW5rbm93biwgLi4ub3B0aW9uYWxQYXJhbXM6IHVua25vd25bXSk6IHZvaWQge1xuXHRcdHRoaXMuI3NvY2tldC53cml0ZShcIklORk9cIilcblx0XHR0aGlzLiNzZW5kTWVzc2FnZShtZXNzYWdlLCAuLi5vcHRpb25hbFBhcmFtcyk7XG5cdH1cblxuXHRlbmQodGhpczogU29ja2V0TG9nZ2VyKSB7XG5cdFx0dGhpcy4jc29ja2V0LmVuZCgpO1xuXHR9XG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFBsdWdpbihcblx0b25sb2FkOiAocGx1Z2luOiBvYnNpZGlhbi5QbHVnaW4pID0+IFByb21pc2U8dm9pZD4sXG4pOiB0eXBlb2Ygb2JzaWRpYW4uUGx1Z2luIHtcblx0cmV0dXJuIGNsYXNzIGV4dGVuZHMgb2JzaWRpYW4uUGx1Z2luIHtcblx0XHRvbmxvYWQoKTogdm9pZCB7XG5cdFx0XHR0aGlzLmFwcC53b3Jrc3BhY2Uub25MYXlvdXRSZWFkeShhc3luYyAoKSA9PiB7XG5cdFx0XHRcdGF3YWl0IG9ubG9hZCh0aGlzKTtcblx0XHRcdH0pXG5cdFx0fVxuXHR9XG5cbn1cbiIsIlxuaW1wb3J0ICogYXMgdGVzdGluZyBmcm9tIFwiLi4vZnJhbWV3b3JrXCI7XG5pbXBvcnQgeyBGaWxlcyB9IGZyb20gXCIuLi9vYnNpZGlhblwiXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHRlc3RCYXNpY3M8RmlsZT4oXG5cdHQ6IHRlc3RpbmcuVCxcblx0ZmlsZXM6IEZpbGVzPEZpbGU+LFxuKSB7XG5cblx0dC50ZXN0KFwid29yZCBpbiBib2R5XCIsIGFzeW5jICh0KSA9PiB7XG5cdFx0Y29uc3QgZmlsZV93aXRoX21hdGNoID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QubWRcIiwgXCJmb29cIik7XG5cdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKGZpbGVfd2l0aF9tYXRjaCkpO1xuXG5cdFx0Y29uc3QgZmlsZV93aXRob3V0X21hdGNoID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QxLm1kXCIpO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlX3dpdGhvdXRfbWF0Y2gpKTtcblxuXHRcdGNvbnN0IG1hdGNoZXMgPSBhd2FpdCBmaWxlcy5zZWFyY2hGb3IoXCJmb29cIilcblxuXHRcdGlmICghbWF0Y2hlcy5zb21lKG1hdGNoID0+IG1hdGNoLm5hbWUgPT09IFwidGVzdC5tZFwiKSkge1xuXHRcdFx0dC5sb2coXCJleHBlY3RlZCB0byBmaW5kICd0ZXN0Lm1kJyBpbiBtYXRjaGVzXCIsIG1hdGNoZXMpO1xuXHRcdFx0dC5mYWlsKCk7XG5cdFx0fVxuXHRcdGlmIChtYXRjaGVzLnNvbWUobWF0Y2ggPT4gbWF0Y2gubmFtZSA9PT0gXCJ0ZXN0MS5tZFwiKSkge1xuXHRcdFx0dC5sb2coXCJleHBlY3RlZCBOT1QgdG8gZmluZCAndGVzdDEubWQnIGluIG1hdGNoZXNcIiwgbWF0Y2hlcyk7XG5cdFx0XHR0LmZhaWwoKTtcblx0XHR9XG5cdH0pXG5cblx0dC50ZXN0KFwicGhyYXNlIGluIGJvZHlcIiwgYXN5bmMgKHQpID0+IHtcblx0XHRjb25zdCBmaWxlX3dpdGhfbWF0Y2ggPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdC5tZFwiLCBcImZvbyBiYXJcIik7XG5cdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKGZpbGVfd2l0aF9tYXRjaCkpO1xuXG5cdFx0Y29uc3QgZmlsZV93aXRob3V0X21hdGNoID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QxLm1kXCIsIFwiZm9vXCIpO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlX3dpdGhvdXRfbWF0Y2gpKTtcblxuXHRcdGNvbnN0IG1hdGNoZXMgPSBhd2FpdCBmaWxlcy5zZWFyY2hGb3IoYFwiZm9vIGJhclwiYClcblxuXHRcdGlmICghbWF0Y2hlcy5zb21lKG1hdGNoID0+IG1hdGNoLm5hbWUgPT09IFwidGVzdC5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcImV4cGVjdGVkIHRvIGZpbmQgJ3Rlc3QubWQnIGluXCIsIG1hdGNoZXMpXG5cdFx0fVxuXHRcdGlmIChtYXRjaGVzLnNvbWUobWF0Y2ggPT4gbWF0Y2gubmFtZSA9PT0gXCJ0ZXN0MS5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcImV4cGVjdGVkIE5PVCB0byBmaW5kICd0ZXN0MS5tZCcgaW5cIiwgbWF0Y2hlcylcblx0XHR9XG5cdH0pXG59XG4iLCJjb25zdCBGQUlMX05PVyA9IFN5bWJvbCgpO1xuXG5leHBvcnQgdHlwZSBMb2dnZXIgPSBQaWNrPENvbnNvbGUsIFwiZXJyb3JcIiB8IFwid2FyblwiIHwgXCJsb2dcIj47XG5cbmV4cG9ydCBjbGFzcyBTdWl0ZSB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdHB1YmxpYyBsb2dnZXI6IFBpY2s8Q29uc29sZSwgXCJlcnJvclwiIHwgXCJ3YXJuXCIgfCBcImxvZ1wiPixcblx0XHRwdWJsaWMgcGFyZW50OiBTdWl0ZSB8IG51bGwgPSBudWxsLFxuXHQpIHsgfVxuXG5cdCN0ZXN0czogQXJyYXk8eyB0ZXN0OiBUZXN0LCBmbjogKHQ6IFRlc3QpID0+ICh2b2lkIHwgUHJvbWlzZTx2b2lkPikgfT4gPSBbXTtcblxuXHR0ZXN0KG5hbWU6IHN0cmluZywgZm46ICh0OiBUZXN0KSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPikge1xuXHRcdGlmICh0aGlzLiNyYW4pIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oXCJhbHJlYWR5IHJhbiB0ZXN0IHN1aXRlLCBidXQgdHJ5aW5nIHRvIGFkZFwiLCBuYW1lLCBcInRlc3RcIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGNvbnN0IG5lc3RlZCA9IG5ldyBUZXN0KG5hbWUsIHRoaXMpO1xuXHRcdHRoaXMuI3Rlc3RzLnB1c2goeyB0ZXN0OiBuZXN0ZWQsIGZuIH0pO1xuXHR9XG5cblx0YXN5bmMgc3VpdGUobmFtZTogc3RyaW5nLCBmbjogKHM6IFN1aXRlKSA9PiBQcm9taXNlPHZvaWQ+KSB7XG5cdFx0aWYgKHRoaXMuI3Jhbikge1xuXHRcdFx0dGhpcy5sb2dnZXIud2FybihcImFscmVhZHkgcmFuIHRlc3Qgc3VpdGUsIGJ1dCB0cnlpbmcgdG8gYWRkXCIsIG5hbWUsIFwic3VpdGVcIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGNvbnN0IGVyciA9IG5ldyBFcnJvcigpO1xuXHRcdGNvbnN0IG5lc3RlZCA9IG5ldyBTdWl0ZSh7XG5cdFx0XHRsb2c6ICguLi5kYXRhKSA9PiB0aGlzLmxvZ2dlci5sb2coXCIgICBcIiwgLi4uZGF0YSksXG5cdFx0XHR3YXJuOiAoLi4uZGF0YSkgPT4gdGhpcy5sb2dnZXIud2FybihcIiAgIFwiLCAuLi5kYXRhKSxcblx0XHRcdGVycm9yOiAoLi4uZGF0YSkgPT4gdGhpcy5sb2dnZXIuZXJyb3IoXCIgICBcIiwgLi4uZGF0YSksXG5cdFx0fSwgdGhpcyk7XG5cblx0XHR0aGlzLmxvZ2dlci5sb2coXCJURVNUXCIsIG5hbWUpO1xuXG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IGZuKG5lc3RlZCk7XG5cdFx0fSBjYXRjaCAoY2F1c2UpIHtcblx0XHRcdGVyci5jYXVzZSA9IGNhdXNlO1xuXHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IoXCJGYWlsZWQgdG8gaW5pdCBzdWl0ZVwiLCBlcnIpO1xuXHRcdH1cblxuXHRcdGF3YWl0IG5lc3RlZC5ydW4oKTtcblxuXHRcdGlmIChuZXN0ZWQuZmFpbGVkKCkpIHtcblx0XHRcdHRoaXMubG9nZ2VyLmxvZyhcIkZBSUxcIiwgbmFtZSk7XG5cdFx0XHR0aGlzLmZhaWwoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5sb2dnZXIubG9nKFwiUEFTU1wiLCBuYW1lKTtcblx0XHR9XG5cdH1cblxuXHQjcmFuID0gZmFsc2U7XG5cdGFzeW5jIHJ1bih0aGlzOiBTdWl0ZSkge1xuXHRcdHRoaXMuI3JhbiA9IHRydWU7XG5cdFx0Zm9yIChjb25zdCB7IHRlc3QsIGZuIH0gb2YgdGhpcy4jdGVzdHMpIHtcblx0XHRcdHRoaXMubG9nZ2VyLmxvZyhcIlRFU1RcIiwgdGVzdC5uYW1lKTtcblxuXHRcdFx0Y29uc3QgeyBsb2cgfSA9IGNvbnNvbGU7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nID0gKC4uLmFyZ3MpID0+IFRlc3QuYWRkTG9nKHRlc3QsIC4uLmFyZ3MpO1xuXHRcdFx0XHRhd2FpdCBmbih0ZXN0KTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHR0ZXN0LmZhaWwoKTtcblx0XHRcdFx0aWYgKGVyciAhPT0gRkFJTF9OT1cpIHtcblx0XHRcdFx0XHRUZXN0LmFkZExvZyh0ZXN0LCBlcnIpXG5cdFx0XHRcdH1cblx0XHRcdH0gZmluYWxseSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nID0gbG9nO1xuXHRcdFx0XHRsZXQgZmFpbGVkX2R1cmluZ190ZXN0ID0gdGVzdC5mYWlsZWQoKTtcblx0XHRcdFx0aWYgKGZhaWxlZF9kdXJpbmdfdGVzdCkge1xuXHRcdFx0XHRcdHRoaXMubG9nZ2VyLmxvZyhcIkZBSUxcIiwgdGVzdC5uYW1lKVxuXHRcdFx0XHRcdGZvciAoY29uc3QgeyBsb2NhdGlvbiwgYXJncyB9IG9mIHRlc3QubG9ncygpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmxvZ2dlci5sb2cobG9jYXRpb24sIC4uLmFyZ3MpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci5sb2coXCJQQVNTXCIsIHRlc3QubmFtZSlcblx0XHRcdFx0fVxuXHRcdFx0XHR0ZXN0LmNsZWFudXAoKVxuXHRcdFx0XHR0aGlzLiNjbGVhbnVwVGVzdCh0ZXN0KVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgY2xlYW51cCBvZiB0aGlzLiNhZnRlcl9hbGxfZm5zKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRhd2FpdCBjbGVhbnVwKHRoaXMpO1xuXHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdHRoaXMuZmFpbCgpO1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihcIlN1aXRlIGZhaWxlZCBkdXJpbmcgY2xlYW51cFwiLCBlcnIpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdCNhZnRlcl9hbGxfZm5zOiBBcnJheTwoczogU3VpdGUpID0+IGFueT4gPSBbXTtcblx0YWZ0ZXJBbGw8Uj4odGhpczogU3VpdGUsIGZuOiAoczogU3VpdGUpID0+IFIgfCBQcm9taXNlPFI+KSB7XG5cdFx0dGhpcy4jYWZ0ZXJfYWxsX2Zucy5wdXNoKGZuKTtcblx0fVxuXG5cdC8qKiBhbGlhcyBmb3IgYWZ0ZXJBbGwgKi9cblx0YWZ0ZXI8Uj4odGhpczogU3VpdGUsIGZuOiAoczogU3VpdGUpID0+IFIgfCBQcm9taXNlPFI+KSB7XG5cdFx0dGhpcy5hZnRlckFsbChmbik7XG5cdH1cblxuXHQjYWZ0ZXJfZWFjaF9mbnM6IEFycmF5PCh0OiBUZXN0KSA9PiBhbnk+ID0gW107XG5cdGFmdGVyRWFjaDxSPih0aGlzOiBTdWl0ZSwgZm46ICh0OiBUZXN0KSA9PiBSIHwgUHJvbWlzZTxSPikge1xuXHRcdHRoaXMuI2FmdGVyX2VhY2hfZm5zLnB1c2goZm4pO1xuXHR9XG5cblx0YXN5bmMgI2NsZWFudXBUZXN0KHRoaXM6IFN1aXRlLCB0ZXN0OiBUZXN0KSB7XG5cdFx0Zm9yIChjb25zdCBjbGVhbnVwIG9mIHRoaXMuI2FmdGVyX2VhY2hfZm5zKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRhd2FpdCBjbGVhbnVwKHRlc3QpO1xuXHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdHRlc3QuZmFpbCgpO1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5lcnJvcih0ZXN0Lm5hbWUsIFwiZmFpbGVkIGR1cmluZyBjbGVhbnVwXCIsIGVycik7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmICh0aGlzLnBhcmVudCAhPT0gbnVsbCkge1xuXHRcdFx0dGhpcy5wYXJlbnQuI2NsZWFudXBUZXN0KHRlc3QpO1xuXHRcdH1cblx0fVxuXG5cdCNmYWlsZWQgPSBmYWxzZTtcblx0ZmFpbCh0aGlzOiBTdWl0ZSkge1xuXHRcdHRoaXMuI2ZhaWxlZCA9IHRydWU7XG5cdFx0dGhpcy5wYXJlbnQ/LmZhaWwoKTtcblx0fVxuXG5cdGZhaWxlZCh0aGlzOiBTdWl0ZSk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLiNmYWlsZWQ7XG5cdH1cblxufVxuXG5leHBvcnQgeyBTdWl0ZSBhcyBUIH1cblxuY2xhc3MgVGVzdCB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdHB1YmxpYyBuYW1lOiBzdHJpbmcsXG5cdFx0cHVibGljIHBhcmVudDogU3VpdGUsXG5cdCkgeyB9XG5cblx0Z2V0IGxvZ2dlcigpIHtcblx0XHRyZXR1cm4gdGhpcy5wYXJlbnQubG9nZ2VyXG5cdH1cblxuXHQjYWZ0ZXJfZm5zOiBBcnJheTwodDogVGVzdCkgPT4gYW55PiA9IFtdO1xuXHRhZnRlcjxSPih0aGlzOiBUZXN0LCBmbjogKHQ6IFRlc3QpID0+IFIgfCBQcm9taXNlPFI+KSB7XG5cdFx0dGhpcy4jYWZ0ZXJfZm5zLnB1c2goZm4pO1xuXHR9XG5cblx0YXN5bmMgY2xlYW51cCh0aGlzOiBUZXN0KSB7XG5cdFx0Zm9yIChjb25zdCBjbGVhbnVwIG9mIHRoaXMuI2FmdGVyX2Zucykge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0YXdhaXQgY2xlYW51cCh0aGlzKTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHR0aGlzLmZhaWwoKTtcblx0XHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IodGhpcy5uYW1lLCBcImZhaWxlZCBkdXJpbmcgY2xlYW51cFwiLCBlcnIpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdCNmYWlsZWQgPSBmYWxzZTtcblx0ZmFpbCh0aGlzOiBUZXN0KSB7XG5cdFx0dGhpcy4jZmFpbGVkID0gdHJ1ZTtcblx0XHR0aGlzLnBhcmVudC5mYWlsKCk7XG5cdH1cblx0ZmFpbGVkKHRoaXM6IFRlc3QpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy4jZmFpbGVkO1xuXHR9XG5cdC8qKiBlcXVpdmVsYW50IHRvIGNhbGxpbmcgYGxvZyguLi5hcmdzKWAgYW5kIHRoZW4gYGZhaWwoKWAgKi9cblx0ZmFpbFdpdGgodGhpczogVGVzdCwgLi4uYXJnczogYW55W10pIHtcblx0XHRjb25zdCBsb2NhdGlvbiA9IG5ldyBFcnJvcigpLnN0YWNrIS5zcGxpdChcIlxcblwiKVsyXTtcblx0XHR0aGlzLiNsb2dzLnB1c2goeyBsb2NhdGlvbiwgYXJncyB9KTtcblx0XHR0aGlzLmZhaWwoKTtcblx0fVxuXG5cdGZhaWxOb3codGhpczogVGVzdCk6IG5ldmVyIHtcblx0XHR0aGlzLmZhaWwoKTtcblx0XHR0aHJvdyBGQUlMX05PVztcblx0fVxuXG5cdCNsb2dzOiBBcnJheTx7IGxvY2F0aW9uOiBzdHJpbmcsIGFyZ3M6IGFueVtdIH0+ID0gW107XG5cdGxvZyh0aGlzOiBUZXN0LCAuLi5hcmdzOiBhbnlbXSkge1xuXHRcdGNvbnN0IGxvY2F0aW9uID0gbmV3IEVycm9yKCkuc3RhY2shLnNwbGl0KFwiXFxuXCIpWzJdO1xuXHRcdHRoaXMuI2xvZ3MucHVzaCh7IGxvY2F0aW9uLCBhcmdzIH0pO1xuXHR9XG5cdHN0YXRpYyBhZGRMb2codGhpczogdHlwZW9mIFRlc3QsIHRlc3Q6IFRlc3QsIC4uLmFyZ3M6IGFueVtdKSB7XG5cdFx0dGVzdC4jbG9ncy5wdXNoKHsgbG9jYXRpb246IFwiXCIsIGFyZ3MgfSlcblx0fVxuXHRsb2dzKHRoaXM6IFRlc3QpOiBSZWFkb25seUFycmF5PHsgbG9jYXRpb246IHN0cmluZywgYXJnczogYW55W10gfT4ge1xuXHRcdHJldHVybiB0aGlzLiNsb2dzO1xuXHR9XG59XG4iLCJpbXBvcnQgKiBhcyB0ZXN0aW5nIGZyb20gXCIuLi9mcmFtZXdvcmtcIlxuaW1wb3J0ICogYXMgb2JzaWRpYW4gZnJvbSBcIi4uL29ic2lkaWFuXCJcblxuXG5jb25zdCB0ZXN0cyA9IGltcG9ydC5tZXRhLmdsb2I8dHJ1ZSwgc3RyaW5nLCAodDogdGVzdGluZy5TdWl0ZSwgZmlsZXM6IG9ic2lkaWFuLkZpbGVzPGFueT4pID0+IFByb21pc2U8dm9pZD4+KFwiLi8qKi90ZXN0LioudHNcIiwgeyBlYWdlcjogdHJ1ZSwgaW1wb3J0OiBcImRlZmF1bHRcIiB9KVxuXG5leHBvcnQgZnVuY3Rpb24gYWxsVGVzdHM8Rj4oKTogQXJyYXk8eyBmaWxlbmFtZTogc3RyaW5nLCBydW46ICh0aGlzOiB2b2lkLCB0OiB0ZXN0aW5nLlN1aXRlLCBmaWxlczogb2JzaWRpYW4uRmlsZXM8Rj4pID0+IFByb21pc2U8dm9pZD4gfT4ge1xuXHRyZXR1cm4gT2JqZWN0LmVudHJpZXModGVzdHMpLm1hcCgoW2ZpbGVuYW1lLCBmbl0pID0+ICh7IGZpbGVuYW1lLCBydW46IGZuIH0pKVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuVGVzdHM8RmlsZT4obG9nZ2VyOiB0ZXN0aW5nLkxvZ2dlciwgZmlsZXM6IG9ic2lkaWFuLkZpbGVzPEZpbGU+KSB7XG5cdGNvbnN0IHRlc3RlciA9IG5ldyB0ZXN0aW5nLlN1aXRlKGxvZ2dlcik7XG5cblx0Zm9yIChjb25zdCBbZmlsZW5hbWUsIGZuXSBvZiBPYmplY3QuZW50cmllcyh0ZXN0cykpIHtcblx0XHRhd2FpdCB0ZXN0ZXIuc3VpdGUoZmlsZW5hbWUsIHJ1biA9PiBmbihydW4sIGZpbGVzKSk7XG5cdH1cblxufVxuIiwiaW1wb3J0IHR5cGUgKiBhcyBvYnNpZGlhbiBmcm9tIFwib2JzaWRpYW5cIlxuaW1wb3J0ICogYXMgY29tbW9uIGZyb20gXCIuL2NvbW1vbi5tYWluXCJcbmltcG9ydCAqIGFzIHRlc3RzIGZyb20gXCIuL3Rlc3RzXCI7XG5pbXBvcnQgKiBhcyB0ZXN0aW5nIGZyb20gXCIuL2ZyYW1ld29ya1wiXG5cbmV4cG9ydCBkZWZhdWx0IGNvbW1vbi5QbHVnaW4oYXN5bmMgKHBsdWdpbikgPT4ge1xuXHRjb25zdCBmaWxlcyA9IGNvbW1vbi5PYnNpZGlhbkZpbGVzKHBsdWdpbiwgYXN5bmMgKHF1ZXJ5KSA9PiB7XG5cdFx0XHRjb25zdCBsZWF2ZXMgPSBwbHVnaW4uYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoXCJzZWFyY2hcIik7XG5cdFx0XHRpZiAobGVhdmVzLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IEVycm9yKFwiY291bGQgbm90IGZpbmQgYW55IGxlYXZlcyBvZiB0eXBlICdzZWFyY2gnXCIpO1xuXHRcdFx0aWYgKCFsZWF2ZXNbMF0uaXNWaXNpYmxlKCkpIHtcblx0XHRcdFx0cGx1Z2luLmFwcC53b3Jrc3BhY2Uuc2V0QWN0aXZlTGVhZihsZWF2ZXNbMF0pO1xuXHRcdFx0fVxuXHRcdFx0Y29uc3Qgc2VhcmNoID0gbGVhdmVzWzBdLnZpZXc7XG5cdFx0XHRzZWFyY2guc2V0UXVlcnkocXVlcnkpO1xuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuXHRcdFx0XHRjb25zdCBpZCA9IHNldEludGVydmFsKCgpID0+IHtcblx0XHRcdFx0XHRpZiAoIXNlYXJjaC5xdWV1ZS5xdWV1ZS5ydW5uYWJsZS5ydW5uaW5nKSB7XG5cdFx0XHRcdFx0XHRjbGVhckludGVydmFsKGlkKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmVzb2x2ZShBcnJheS5mcm9tKHNlYXJjaC5kb20ucmVzdWx0RG9tTG9va3VwKS5tYXAoKFtmaWxlLCBtYXRjaF0pID0+IHtcblx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdG5hbWU6IGZpbGUubmFtZSxcblx0XHRcdFx0XHRcdFx0cGF0aDogZmlsZS5wYXRoLFxuXHRcdFx0XHRcdFx0XHRiYXNlbmFtZTogZmlsZS5iYXNlbmFtZSxcblx0XHRcdFx0XHRcdFx0ZXh0ZW5zaW9uOiBmaWxlLmV4dGVuc2lvbixcblx0XHRcdFx0XHRcdFx0Y29udGVudDogbWF0Y2guY29udGVudCxcblx0XHRcdFx0XHRcdFx0bWV0YWRhdGE6IHBsdWdpbi5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk/LmZyb250bWF0dGVyXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSkpXG5cdFx0XHRcdH0sIDEpXG5cdFx0XHR9KVxuXHRcdH0sXG5cdCk7XG5cblx0Y29uc3QgbG9nZ2VyID0gbmV3IGNvbW1vbi5Tb2NrZXRMb2dnZXIoKVxuXG5cdGNvbnN0IHQgPSBuZXcgdGVzdGluZy5TdWl0ZShsb2dnZXIpXG5cblxuXG5cdGZvciAoY29uc3QgeyBmaWxlbmFtZSwgcnVuIH0gb2YgdGVzdHMuYWxsVGVzdHM8b2JzaWRpYW4uVEZpbGU+KCkpIHtcblx0XHRhd2FpdCB0LnN1aXRlKGZpbGVuYW1lLCB0ID0+IHJ1bih0LCBmaWxlcykpXG5cdH1cblxuXHRsb2dnZXIubG9nKFwiXCIpXG5cdGxvZ2dlci5lbmQoKTtcblxufSk7XG4iXSwibmFtZXMiOlsiam9pbiIsImluc3BlY3QiLCJvYnNpZGlhbiIsInQiLCJfX3ZpdGVfZ2xvYl8wXzAiLCJjb21tb24uUGx1Z2luIiwiY29tbW9uLk9ic2lkaWFuRmlsZXMiLCJjb21tb24uU29ja2V0TG9nZ2VyIiwidGVzdGluZy5TdWl0ZSIsInRlc3RzLmFsbFRlc3RzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU0sV0FBQSxDQUFZO0FBQUEsRUFDakIsWUFDaUIsSUFBQSxFQUNmO0FBRGUsSUFBQSxJQUFBLENBQUEsSUFBQSxHQUFBLElBQUE7QUFBQSxFQUNiO0FBQ0w7QUFFTyxNQUFNLEtBQUEsQ0FBWTtBQUFBLEVBQ3hCLFdBQUEsQ0FDUSxVQUFBLEVBS0EsVUFBQSxFQUNBLFNBQUEsRUFDQSxRQUFBLEVBQ047QUFSTSxJQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsVUFBQTtBQUtBLElBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxVQUFBO0FBQ0EsSUFBQSxJQUFBLENBQUEsU0FBQSxHQUFBLFNBQUE7QUFDQSxJQUFBLElBQUEsQ0FBQSxRQUFBLEdBQUEsUUFBQTtBQUFBLEVBQ0o7QUFBQSxFQUVKLE9BQU8sV0FBQSxHQUFjLFdBQUE7QUFDdEI7O0FDWk8sU0FBUyxhQUFBLENBQWMsUUFBeUIsTUFBQSxFQUEwRTtBQUNoSSxFQUFBLE9BQU8sSUFBSSxLQUFBO0FBQUEsSUFDVixPQUFPLElBQUEsRUFBTSxJQUFBLEdBQU8sRUFBQSxFQUFJLFdBQUEsS0FBZ0I7QUFDdkMsTUFBQSxJQUFJLFdBQUEsRUFBYTtBQUNoQixRQUFBLElBQUksTUFBQSxHQUFTLE9BQUE7QUFDYixRQUFBLElBQUksWUFBWSxJQUFBLEVBQU07QUFDckIsVUFBQSxNQUFBLElBQVUsU0FBQTtBQUNWLFVBQUEsV0FBQSxDQUFZLEtBQUssT0FBQSxDQUFRLENBQUEsUUFBTyxNQUFBLElBQVUsTUFBQSxHQUFTLE1BQU0sSUFBSSxDQUFBO0FBQUEsUUFDOUQ7QUFDQSxRQUFBLElBQUksWUFBWSxPQUFBLEVBQVM7QUFDeEIsVUFBQSxNQUFBLElBQVUsWUFBQTtB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
