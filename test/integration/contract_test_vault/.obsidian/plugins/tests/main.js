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

function testAnd(run, obsidian) {
  run.test("implicit", async (t) => {
    const file = await obsidian.createFile("test.md", `one two three`);
    t.after(() => obsidian.deleteFile(file));
    const file_with_only_one = await obsidian.createFile("test1.md", "one");
    t.after(() => obsidian.deleteFile(file_with_only_one));
    const matches = await obsidian.searchFor("one three");
    if (!matches.some((it) => it.name === "test.md")) {
      t.failWith("'test.md' has both 'one' and 'three' in its body, but was not in", matches);
    }
    if (matches.some((it) => it.name === "test1.md")) {
      t.failWith("'test1.md' only has 'one' in its body, but was in", matches);
    }
  });
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

function testFileOperator(t, files) {
  t.test("does not match against directory path", async (t2) => {
    const matching_file = await files.createFile("dir/test.md");
    t2.after(() => files.deleteFile(matching_file));
    const file_in_dir = await files.createFile("test/foo.md");
    t2.after(() => files.deleteFile(file_in_dir));
    const matches = await files.searchFor("file:test");
    if (!matches.some((match) => match.name === "test.md")) {
      t2.failWith("did not match file name");
    }
    if (matches.some((match) => match.name === "foo.md")) {
      t2.failWith("should not have matched directory name");
    }
  });
  t.test("path:", async (t2) => {
    const matching_file = await files.createFile("dir/test.md");
    t2.after(() => files.deleteFile(matching_file));
    const file_in_dir = await files.createFile("test/foo.md");
    t2.after(() => files.deleteFile(file_in_dir));
    const matches = await files.searchFor("path:test");
    if (!matches.some((match) => match.name === "test.md")) {
      t2.failWith("did not match file name");
    }
    if (!matches.some((match) => match.name === "foo.md")) {
      t2.failWith("did not match directory name");
    }
  });
}

function testNegation(run, obsidian) {
  run.test("not word", async (t) => {
    const file = await obsidian.createFile("has word.md", "word");
    t.after(() => obsidian.deleteFile(file));
    const matches = await obsidian.searchFor(`-word`);
    if (matches.some((it) => it.name === "has word.md")) {
      t.failWith("file with word should NOT match because it was negated");
    }
  });
}

async function testProperty(t, files) {
  await t.suite("[property]", async (t2) => {
    t2.test("[tags]", async (t3) => {
      const file = await files.createFile("test.md", "", {
        tags: [
          "foo"
        ]
      });
      t3.after(() => files.deleteFile(file));
      const non_match = await files.createFile("test1.md");
      t3.after(() => files.deleteFile(non_match));
      const matches = await files.searchFor("[tags]");
      if (!matches.some((it) => it.name === "test.md")) {
        t3.failWith("expected to find 'test.md' in", matches);
      }
      if (matches.some((it) => it.name === "test1.md")) {
        t3.failWith("expected NOT to find", non_match, "in", matches);
      }
    });
    t2.test("[aliases]", async (t3) => {
      const file = await files.createFile("test.md", "", {
        aliases: [
          "foo"
        ]
      });
      t3.after(() => files.deleteFile(file));
      const non_match = await files.createFile("test1.md");
      t3.after(() => files.deleteFile(non_match));
      const matches = await files.searchFor("[aliases]");
      if (!matches.some((it) => it.name === "test.md")) {
        t3.failWith("expected to find 'test.md' in", matches);
      }
      if (matches.some((it) => it.name === "test1.md")) {
        t3.failWith("expected NOT to find", non_match, "in", matches);
      }
    });
    t2.test("arbitrary property", async (t3) => {
      const file = await files.createFile("test.md", "", {
        properties: {
          "some-prop": 0
        }
      });
      t3.after(() => files.deleteFile(file));
      const non_match = await files.createFile("test1.md");
      t3.after(() => files.deleteFile(non_match));
      t3.log("test.md:", await files.readFile(file));
      t3.log("test1.md:", await files.readFile(non_match));
      const matches = await files.searchFor("[some-prop]");
      if (!matches.some((it) => it.name === "test.md")) {
        t3.failWith("expected to find 'test.md' in", matches);
      }
      if (matches.some((it) => it.name === "test1.md")) {
        t3.failWith("expected NOT to find 'test1.md' in", matches);
      }
    });
  });
  await t.suite("[property:value]", async (t2) => {
    t2.test("[aliases:Name]", async (t3) => {
      const file = await files.createFile("test.md", "", {
        aliases: [
          "Name"
        ]
      });
      t3.after(() => files.deleteFile(file));
      const non_match = await files.createFile("test1.md", "", {
        aliases: [
          "Other"
        ]
      });
      t3.after(() => files.deleteFile(non_match));
      const matches = await files.searchFor("[aliases:Name]");
      if (!matches.some((it) => it.name === "test.md")) {
        t3.failWith("expected to find 'test.md' in", matches);
      }
      if (matches.some((it) => it.name === "test1.md")) {
        t3.failWith("expected NOT to find 'test1.md' in", matches);
      }
    });
    t2.test("[aliases:value1 OR value2]", async (t3) => {
      const match1 = await files.createFile("test.md", "", {
        aliases: [
          "value1"
        ]
      });
      t3.after(() => files.deleteFile(match1));
      const match2 = await files.createFile("test1.md", "", {
        aliases: [
          "value2"
        ]
      });
      t3.after(() => files.deleteFile(match2));
      const non_match = await files.createFile("test2.md", "", {
        aliases: [
          "value3"
        ]
      });
      t3.after(() => files.deleteFile(non_match));
      const matches = await files.searchFor("[aliases:value1 OR value2]");
      if (!matches.some((it) => it.name === "test.md")) {
        t3.failWith("expected to find test.md in", matches);
      }
      if (!matches.some((it) => it.name === "test1.md")) {
        t3.failWith("expected to find 'test1.md' in", matches);
      }
      if (matches.some((it) => it.name === "test3.md")) {
        t3.failWith("expected NOT to find 'test3.md' in", matches);
      }
    });
  });
}

function trimIndent(str) {
  const lines = str.split("\n");
  const first_index = lines.findIndex((it) => it.length > 0 && it !== "\n");
  if (first_index < 0) {
    return str;
  }
  const first = lines[first_index];
  const whitespace = first.length - first.trimStart().length;
  return lines.slice(first_index).map((it) => it.substring(whitespace)).join("\n");
}

function testTags(run, obsidian) {
  run.test("tags in body", async (t) => {
    const tagged = await obsidian.createFile("tagged.md", "#meeting");
    t.after(() => obsidian.deleteFile(tagged));
    const matches = await obsidian.searchFor("tag:#meeting");
    if (!matches.some((it) => it.name === "tagged.md")) {
      t.failWith("tagged.md has tag '#meeting' in body, but it was not found in", matches);
    }
  });
  run.test("prefixed tags in frontmatter", async (t) => {
    const tagged = await obsidian.createFile("tagged.md", "", {
      tags: ["#meeting"]
    });
    t.after(() => obsidian.deleteFile(tagged));
    const content = await obsidian.readFile(tagged);
    t.log("tagged.md", content);
    const matches = await obsidian.searchFor("tag:#meeting");
    if (matches.some((it) => it.name === "tagged.md")) {
      t.failWith("tags of a file do not have hashes at the start, so the following should NOT match", matches);
    }
  });
  run.test("raw tag in frontmatter", async (t) => {
    const tagged = await obsidian.createFile("tagged.md", "", {
      tags: ["meeting"]
    });
    t.after(() => obsidian.deleteFile(tagged));
    const matches = await obsidian.searchFor("tag:#meeting");
    if (!matches.some((it) => it.name === "tagged.md")) {
      t.failWith("tagged.md has tag 'meeting' in frontmatter, but it was not found in", matches);
    }
  });
  run.test("no hash after tag operator", async (t) => {
    const tagged = await obsidian.createFile("tagged.md", "", { tags: ["meeting"] });
    t.after(() => obsidian.deleteFile(tagged));
    const matches = await obsidian.searchFor("tag:meeting");
    if (!matches.some((it) => it.name === "tagged.md")) {
      t.failWith("tagged.md has tag 'meeting' in frontmatter, but it was not found in", matches);
    }
  });
  run.test("tag in codeblock", async (t) => {
    const file = await obsidian.createFile("tagged in codeblock.md", trimIndent(`
			\`\`\`
			#meeting
			\`\`\`
		`));
    t.after(() => obsidian.deleteFile(file));
    const raw_matches = await obsidian.searchFor("#meeting");
    const tag_matches = await obsidian.searchFor("tag:#meeting");
    const no_hash = await obsidian.searchFor("tag:meeting");
    if (!raw_matches.some((it) => it.name === "tagged in codeblock.md")) {
      t.failWith("raw search for '#meeting' did not find file with '#meeting' in codeblock");
    }
    if (tag_matches.some((it) => it.name === "tagged in codeblock.md")) {
      t.failWith("tag search for '#meeting' incorrectly matched file with '#meeting' in codeblock");
    }
    if (no_hash.some((it) => it.name === "tagged in codeblock.md")) {
      t.failWith("tag search for '#meeting' incorrectly matched file with '#meeting' in codeblock");
    }
  });
}

const FAIL_NOW = Symbol();
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

const tests = /* #__PURE__ */ Object.assign({"./test.and.ts": testAnd,"./test.basics.ts": testBasics,"./test.file.ts": testFileOperator,"./test.negation.ts": testNegation,"./test.property.ts": testProperty,"./test.tags.ts": testTags});
async function runTests(logger, files) {
  const tester = new Suite(logger);
  for (const [filename, fn] of Object.entries(tests)) {
    await tester.suite(filename, (run) => fn(run, files));
  }
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
function Plugin(make_files) {
  return class extends obsidian__namespace.Plugin {
    socket = null;
    sendMessage(data) {
      let buffer = [];
      for (const entry of data) {
        if (typeof entry === "string") {
          buffer.push(entry);
        } else {
          buffer.push(util.inspect(entry, void 0, 4, true));
        }
      }
      this.socket?.write(buffer.join(" ") + "\0");
    }
    onload() {
      const socket = this.socket = net.createConnection({ port: 43861 });
      const logger = {
        error: (...data) => {
          socket.write("ERROR");
          this.sendMessage(data);
        },
        warn: (...data) => {
          socket.write("WARN");
          this.sendMessage(data);
        },
        log: (...data) => {
          socket.write("INFO");
          this.sendMessage(data);
        }
      };
      this.app.workspace.onLayoutReady(async () => {
        await runTests(logger, make_files(this));
        socket.write("INFO\0");
        socket.end();
      });
    }
    onunload() {
      this.socket?.end();
      this.socket = null;
    }
  };
}

const contract_main = Plugin((plugin) => ObsidianFiles(
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
));

module.exports = contract_main;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzaWRpYW4tc2VhcmNoLmNqcyIsInNvdXJjZXMiOlsiLi4vdGVzdC9pbnRlZ3JhdGlvbi9vYnNpZGlhbi50cyIsIi4uL3Rlc3QvaW50ZWdyYXRpb24vdGVzdHMvdGVzdC5hbmQudHMiLCIuLi90ZXN0L2ludGVncmF0aW9uL3Rlc3RzL3Rlc3QuYmFzaWNzLnRzIiwiLi4vdGVzdC9pbnRlZ3JhdGlvbi90ZXN0cy90ZXN0LmZpbGUudHMiLCIuLi90ZXN0L2ludGVncmF0aW9uL3Rlc3RzL3Rlc3QubmVnYXRpb24udHMiLCIuLi90ZXN0L2ludGVncmF0aW9uL3Rlc3RzL3Rlc3QucHJvcGVydHkudHMiLCIuLi9zcmMvbGliL3N0cmluZ3MudHMiLCIuLi90ZXN0L2ludGVncmF0aW9uL3Rlc3RzL3Rlc3QudGFncy50cyIsIi4uL3Rlc3QvaW50ZWdyYXRpb24vZnJhbWV3b3JrLnRzIiwiLi4vdGVzdC9pbnRlZ3JhdGlvbi90ZXN0cy9pbmRleC50cyIsIi4uL3Rlc3QvaW50ZWdyYXRpb24vY29tbW9uLm1haW4udHMiLCIuLi90ZXN0L2ludGVncmF0aW9uL2NvbnRyYWN0Lm1haW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5cbmNsYXNzIFNlYXJjaE1hdGNoIHtcblx0Y29uc3RydWN0b3IoXG5cdFx0cHVibGljIHJlYWRvbmx5IG5hbWU6IHN0cmluZ1xuXHQpIHsgfVxufVxuXG5leHBvcnQgY2xhc3MgRmlsZXM8RmlsZT4ge1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRwdWJsaWMgY3JlYXRlRmlsZTogKG5hbWVfd2l0aF9leHRlbnNpb246IHN0cmluZywgYm9keT86IHN0cmluZywgZnJvbnRtYXR0ZXI/OiB7XG5cdFx0XHR0YWdzPzogc3RyaW5nW10sXG5cdFx0XHRhbGlhc2VzPzogc3RyaW5nW10sXG5cdFx0XHRwcm9wZXJ0aWVzPzogUmVjb3JkPHN0cmluZywgYW55Pixcblx0XHR9KSA9PiBQcm9taXNlPEZpbGU+LFxuXHRcdHB1YmxpYyBkZWxldGVGaWxlOiAoZmlsZTogRmlsZSkgPT4gUHJvbWlzZTx2b2lkPixcblx0XHRwdWJsaWMgc2VhcmNoRm9yOiAocXVlcnk6IHN0cmluZykgPT4gUHJvbWlzZTxBcnJheTxTZWFyY2hNYXRjaD4+LFxuXHRcdHB1YmxpYyByZWFkRmlsZTogKGZpbGU6IEZpbGUpID0+IFByb21pc2U8c3RyaW5nPixcblx0KSB7IH1cblxuXHRzdGF0aWMgU2VhcmNoTWF0Y2ggPSBTZWFyY2hNYXRjaDtcbn1cblxuXG4iLCJcbmltcG9ydCAqIGFzIHRlc3RpbmcgZnJvbSBcIi4uL2ZyYW1ld29ya1wiO1xuaW1wb3J0IHR5cGUgeyBGaWxlcyB9IGZyb20gXCIuLi9vYnNpZGlhblwiXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHRlc3RBbmQ8RmlsZT4ocnVuOiB0ZXN0aW5nLlN1aXRlLCBvYnNpZGlhbjogRmlsZXM8RmlsZT4pIHtcblx0cnVuLnRlc3QoXCJpbXBsaWNpdFwiLCBhc3luYyB0ID0+IHtcblx0XHRjb25zdCBmaWxlID0gYXdhaXQgb2JzaWRpYW4uY3JlYXRlRmlsZShcInRlc3QubWRcIiwgYG9uZSB0d28gdGhyZWVgKTtcblx0XHR0LmFmdGVyKCgpID0+IG9ic2lkaWFuLmRlbGV0ZUZpbGUoZmlsZSkpXG5cblx0XHRjb25zdCBmaWxlX3dpdGhfb25seV9vbmUgPSBhd2FpdCBvYnNpZGlhbi5jcmVhdGVGaWxlKFwidGVzdDEubWRcIiwgXCJvbmVcIik7XG5cdFx0dC5hZnRlcigoKSA9PiBvYnNpZGlhbi5kZWxldGVGaWxlKGZpbGVfd2l0aF9vbmx5X29uZSkpXG5cblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgb2JzaWRpYW4uc2VhcmNoRm9yKFwib25lIHRocmVlXCIpXG5cblx0XHRpZiAoIW1hdGNoZXMuc29tZShpdCA9PiBpdC5uYW1lID09PSBcInRlc3QubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCIndGVzdC5tZCcgaGFzIGJvdGggJ29uZScgYW5kICd0aHJlZScgaW4gaXRzIGJvZHksIGJ1dCB3YXMgbm90IGluXCIsIG1hdGNoZXMpXG5cdFx0fVxuXHRcdGlmIChtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0ZXN0MS5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcIid0ZXN0MS5tZCcgb25seSBoYXMgJ29uZScgaW4gaXRzIGJvZHksIGJ1dCB3YXMgaW5cIiwgbWF0Y2hlcylcblx0XHR9XG5cdH0pXG59XG4iLCJcbmltcG9ydCAqIGFzIHRlc3RpbmcgZnJvbSBcIi4uL2ZyYW1ld29ya1wiO1xuaW1wb3J0IHsgRmlsZXMgfSBmcm9tIFwiLi4vb2JzaWRpYW5cIlxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB0ZXN0QmFzaWNzPEZpbGU+KFxuXHR0OiB0ZXN0aW5nLlQsXG5cdGZpbGVzOiBGaWxlczxGaWxlPixcbikge1xuXG5cdHQudGVzdChcIndvcmQgaW4gYm9keVwiLCBhc3luYyAodCkgPT4ge1xuXHRcdGNvbnN0IGZpbGVfd2l0aF9tYXRjaCA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJ0ZXN0Lm1kXCIsIFwiZm9vXCIpO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlX3dpdGhfbWF0Y2gpKTtcblxuXHRcdGNvbnN0IGZpbGVfd2l0aG91dF9tYXRjaCA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJ0ZXN0MS5tZFwiKTtcblx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUoZmlsZV93aXRob3V0X21hdGNoKSk7XG5cblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgZmlsZXMuc2VhcmNoRm9yKFwiZm9vXCIpXG5cblx0XHRpZiAoIW1hdGNoZXMuc29tZShtYXRjaCA9PiBtYXRjaC5uYW1lID09PSBcInRlc3QubWRcIikpIHtcblx0XHRcdHQubG9nKFwiZXhwZWN0ZWQgdG8gZmluZCAndGVzdC5tZCcgaW4gbWF0Y2hlc1wiLCBtYXRjaGVzKTtcblx0XHRcdHQuZmFpbCgpO1xuXHRcdH1cblx0XHRpZiAobWF0Y2hlcy5zb21lKG1hdGNoID0+IG1hdGNoLm5hbWUgPT09IFwidGVzdDEubWRcIikpIHtcblx0XHRcdHQubG9nKFwiZXhwZWN0ZWQgTk9UIHRvIGZpbmQgJ3Rlc3QxLm1kJyBpbiBtYXRjaGVzXCIsIG1hdGNoZXMpO1xuXHRcdFx0dC5mYWlsKCk7XG5cdFx0fVxuXHR9KVxuXG5cdHQudGVzdChcInBocmFzZSBpbiBib2R5XCIsIGFzeW5jICh0KSA9PiB7XG5cdFx0Y29uc3QgZmlsZV93aXRoX21hdGNoID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QubWRcIiwgXCJmb28gYmFyXCIpO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlX3dpdGhfbWF0Y2gpKTtcblxuXHRcdGNvbnN0IGZpbGVfd2l0aG91dF9tYXRjaCA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJ0ZXN0MS5tZFwiLCBcImZvb1wiKTtcblx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUoZmlsZV93aXRob3V0X21hdGNoKSk7XG5cblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgZmlsZXMuc2VhcmNoRm9yKGBcImZvbyBiYXJcImApXG5cblx0XHRpZiAoIW1hdGNoZXMuc29tZShtYXRjaCA9PiBtYXRjaC5uYW1lID09PSBcInRlc3QubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJleHBlY3RlZCB0byBmaW5kICd0ZXN0Lm1kJyBpblwiLCBtYXRjaGVzKVxuXHRcdH1cblx0XHRpZiAobWF0Y2hlcy5zb21lKG1hdGNoID0+IG1hdGNoLm5hbWUgPT09IFwidGVzdDEubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJleHBlY3RlZCBOT1QgdG8gZmluZCAndGVzdDEubWQnIGluXCIsIG1hdGNoZXMpXG5cdFx0fVxuXHR9KVxufVxuIiwiaW1wb3J0ICogYXMgdGVzdGluZyBmcm9tIFwiLi4vZnJhbWV3b3JrXCI7XG5pbXBvcnQgeyBGaWxlcyB9IGZyb20gXCIuLi9vYnNpZGlhblwiXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHRlc3RGaWxlT3BlcmF0b3I8RmlsZT4oXG5cdHQ6IHRlc3RpbmcuVCxcblx0ZmlsZXM6IEZpbGVzPEZpbGU+LFxuKSB7XG5cdHQudGVzdChcImRvZXMgbm90IG1hdGNoIGFnYWluc3QgZGlyZWN0b3J5IHBhdGhcIiwgYXN5bmMgdCA9PiB7XG5cdFx0Y29uc3QgbWF0Y2hpbmdfZmlsZSA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJkaXIvdGVzdC5tZFwiKTtcblx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUobWF0Y2hpbmdfZmlsZSkpO1xuXG5cdFx0Y29uc3QgZmlsZV9pbl9kaXIgPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdC9mb28ubWRcIik7XG5cdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKGZpbGVfaW5fZGlyKSk7XG5cblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgZmlsZXMuc2VhcmNoRm9yKFwiZmlsZTp0ZXN0XCIpXG5cblx0XHRpZiAoIW1hdGNoZXMuc29tZShtYXRjaCA9PiBtYXRjaC5uYW1lID09PSBcInRlc3QubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJkaWQgbm90IG1hdGNoIGZpbGUgbmFtZVwiKVxuXHRcdH1cblx0XHRpZiAobWF0Y2hlcy5zb21lKG1hdGNoID0+IG1hdGNoLm5hbWUgPT09IFwiZm9vLm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwic2hvdWxkIG5vdCBoYXZlIG1hdGNoZWQgZGlyZWN0b3J5IG5hbWVcIilcblx0XHR9XG5cdH0pXG5cblx0dC50ZXN0KFwicGF0aDpcIiwgYXN5bmMgdCA9PiB7XG5cdFx0Y29uc3QgbWF0Y2hpbmdfZmlsZSA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJkaXIvdGVzdC5tZFwiKTtcblx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUobWF0Y2hpbmdfZmlsZSkpO1xuXG5cdFx0Y29uc3QgZmlsZV9pbl9kaXIgPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdC9mb28ubWRcIik7XG5cdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKGZpbGVfaW5fZGlyKSk7XG5cblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgZmlsZXMuc2VhcmNoRm9yKFwicGF0aDp0ZXN0XCIpXG5cblx0XHRpZiAoIW1hdGNoZXMuc29tZShtYXRjaCA9PiBtYXRjaC5uYW1lID09PSBcInRlc3QubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJkaWQgbm90IG1hdGNoIGZpbGUgbmFtZVwiKVxuXHRcdH1cblx0XHRpZiAoIW1hdGNoZXMuc29tZShtYXRjaCA9PiBtYXRjaC5uYW1lID09PSBcImZvby5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcImRpZCBub3QgbWF0Y2ggZGlyZWN0b3J5IG5hbWVcIilcblx0XHR9XG5cdH0pXG59XG4iLCJpbXBvcnQgKiBhcyB0ZXN0aW5nIGZyb20gXCIuLi9mcmFtZXdvcmtcIlxuaW1wb3J0IHR5cGUgeyBGaWxlcyB9IGZyb20gXCIuLi9vYnNpZGlhblwiXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHRlc3ROZWdhdGlvbjxGaWxlPihydW46IHRlc3RpbmcuVCwgb2JzaWRpYW46IEZpbGVzPEZpbGU+KSB7XG5cdHJ1bi50ZXN0KFwibm90IHdvcmRcIiwgYXN5bmMgdCA9PiB7XG5cdFx0Y29uc3QgZmlsZSA9IGF3YWl0IG9ic2lkaWFuLmNyZWF0ZUZpbGUoXCJoYXMgd29yZC5tZFwiLCBcIndvcmRcIik7XG5cdFx0dC5hZnRlcigoKSA9PiBvYnNpZGlhbi5kZWxldGVGaWxlKGZpbGUpKTtcblxuXHRcdGNvbnN0IG1hdGNoZXMgPSBhd2FpdCBvYnNpZGlhbi5zZWFyY2hGb3IoYC13b3JkYClcblxuXHRcdGlmIChtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJoYXMgd29yZC5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcImZpbGUgd2l0aCB3b3JkIHNob3VsZCBOT1QgbWF0Y2ggYmVjYXVzZSBpdCB3YXMgbmVnYXRlZFwiKVxuXHRcdH1cblx0fSlcbn1cbiIsImltcG9ydCB0eXBlICogYXMgdGVzdGluZyBmcm9tIFwiLi4vZnJhbWV3b3JrXCI7XG5pbXBvcnQgdHlwZSAqIGFzIG9ic2lkaWFuIGZyb20gXCIuLi9vYnNpZGlhblwiO1xuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiB0ZXN0UHJvcGVydHk8Rj4oXG5cdHQ6IHRlc3RpbmcuVCxcblx0ZmlsZXM6IG9ic2lkaWFuLkZpbGVzPEY+XG4pIHtcblxuXHRhd2FpdCB0LnN1aXRlKFwiW3Byb3BlcnR5XVwiLCBhc3luYyAodCkgPT4ge1xuXHRcdHQudGVzdChcIlt0YWdzXVwiLCBhc3luYyAodCkgPT4ge1xuXHRcdFx0Y29uc3QgZmlsZSA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJ0ZXN0Lm1kXCIsIFwiXCIsIHtcblx0XHRcdFx0dGFnczogW1xuXHRcdFx0XHRcdFwiZm9vXCJcblx0XHRcdFx0XSxcblx0XHRcdH0pO1xuXHRcdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKGZpbGUpKVxuXG5cdFx0XHRjb25zdCBub25fbWF0Y2ggPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdDEubWRcIik7XG5cdFx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUobm9uX21hdGNoKSlcblxuXHRcdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IGZpbGVzLnNlYXJjaEZvcihcIlt0YWdzXVwiKTtcblxuXHRcdFx0aWYgKCFtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0ZXN0Lm1kXCIpKSB7XG5cdFx0XHRcdHQuZmFpbFdpdGgoXCJleHBlY3RlZCB0byBmaW5kICd0ZXN0Lm1kJyBpblwiLCBtYXRjaGVzKTtcblx0XHRcdH1cblx0XHRcdGlmIChtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0ZXN0MS5tZFwiKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKFwiZXhwZWN0ZWQgTk9UIHRvIGZpbmRcIiwgbm9uX21hdGNoLCBcImluXCIsIG1hdGNoZXMpO1xuXHRcdFx0fVxuXHRcdH0pXG5cdFx0dC50ZXN0KFwiW2FsaWFzZXNdXCIsIGFzeW5jICh0KSA9PiB7XG5cdFx0XHRjb25zdCBmaWxlID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QubWRcIiwgXCJcIiwge1xuXHRcdFx0XHRhbGlhc2VzOiBbXG5cdFx0XHRcdFx0XCJmb29cIlxuXHRcdFx0XHRdLFxuXHRcdFx0fSk7XG5cdFx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUoZmlsZSkpXG5cblx0XHRcdGNvbnN0IG5vbl9tYXRjaCA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJ0ZXN0MS5tZFwiKTtcblx0XHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShub25fbWF0Y2gpKTtcblxuXHRcdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IGZpbGVzLnNlYXJjaEZvcihcIlthbGlhc2VzXVwiKTtcblxuXHRcdFx0aWYgKCFtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0ZXN0Lm1kXCIpKSB7XG5cdFx0XHRcdHQuZmFpbFdpdGgoXCJleHBlY3RlZCB0byBmaW5kICd0ZXN0Lm1kJyBpblwiLCBtYXRjaGVzKTtcblx0XHRcdH1cblx0XHRcdGlmIChtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0ZXN0MS5tZFwiKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKFwiZXhwZWN0ZWQgTk9UIHRvIGZpbmRcIiwgbm9uX21hdGNoLCBcImluXCIsIG1hdGNoZXMpO1xuXHRcdFx0fVxuXHRcdH0pXG5cdFx0dC50ZXN0KFwiYXJiaXRyYXJ5IHByb3BlcnR5XCIsIGFzeW5jICh0KSA9PiB7XG5cdFx0XHRjb25zdCBmaWxlID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QubWRcIiwgXCJcIiwge1xuXHRcdFx0XHRwcm9wZXJ0aWVzOiB7XG5cdFx0XHRcdFx0XCJzb21lLXByb3BcIjogMFxuXHRcdFx0XHR9LFxuXHRcdFx0fSk7XG5cdFx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUoZmlsZSkpXG5cblx0XHRcdGNvbnN0IG5vbl9tYXRjaCA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJ0ZXN0MS5tZFwiKTtcblx0XHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShub25fbWF0Y2gpKTtcblxuXHRcdFx0dC5sb2coXCJ0ZXN0Lm1kOlwiLCBhd2FpdCBmaWxlcy5yZWFkRmlsZShmaWxlKSlcblx0XHRcdHQubG9nKFwidGVzdDEubWQ6XCIsIGF3YWl0IGZpbGVzLnJlYWRGaWxlKG5vbl9tYXRjaCkpXG5cblx0XHRcdGNvbnN0IG1hdGNoZXMgPSBhd2FpdCBmaWxlcy5zZWFyY2hGb3IoXCJbc29tZS1wcm9wXVwiKTtcblxuXHRcdFx0aWYgKCFtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0ZXN0Lm1kXCIpKSB7XG5cdFx0XHRcdHQuZmFpbFdpdGgoXCJleHBlY3RlZCB0byBmaW5kICd0ZXN0Lm1kJyBpblwiLCBtYXRjaGVzKTtcblx0XHRcdH1cblx0XHRcdGlmIChtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0ZXN0MS5tZFwiKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKFwiZXhwZWN0ZWQgTk9UIHRvIGZpbmQgJ3Rlc3QxLm1kJyBpblwiLCBtYXRjaGVzKTtcblx0XHRcdH1cblx0XHR9KVxuXHR9KVxuXG5cdGF3YWl0IHQuc3VpdGUoXCJbcHJvcGVydHk6dmFsdWVdXCIsIGFzeW5jICh0KSA9PiB7XG5cdFx0dC50ZXN0KFwiW2FsaWFzZXM6TmFtZV1cIiwgYXN5bmMgKHQpID0+IHtcblx0XHRcdGNvbnN0IGZpbGUgPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdC5tZFwiLCBcIlwiLCB7XG5cdFx0XHRcdGFsaWFzZXM6IFtcblx0XHRcdFx0XHRcIk5hbWVcIlxuXHRcdFx0XHRdLFxuXHRcdFx0fSk7XG5cdFx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUoZmlsZSkpXG5cblx0XHRcdGNvbnN0IG5vbl9tYXRjaCA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJ0ZXN0MS5tZFwiLCBcIlwiLCB7XG5cdFx0XHRcdGFsaWFzZXM6IFtcblx0XHRcdFx0XHRcIk90aGVyXCJcblx0XHRcdFx0XSxcblx0XHRcdH0pO1xuXHRcdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKG5vbl9tYXRjaCkpO1xuXG5cdFx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgZmlsZXMuc2VhcmNoRm9yKFwiW2FsaWFzZXM6TmFtZV1cIik7XG5cblx0XHRcdGlmICghbWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGVzdC5tZFwiKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKFwiZXhwZWN0ZWQgdG8gZmluZCAndGVzdC5tZCcgaW5cIiwgbWF0Y2hlcyk7XG5cdFx0XHR9XG5cdFx0XHRpZiAobWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGVzdDEubWRcIikpIHtcblx0XHRcdFx0dC5mYWlsV2l0aChcImV4cGVjdGVkIE5PVCB0byBmaW5kICd0ZXN0MS5tZCcgaW5cIiwgbWF0Y2hlcyk7XG5cdFx0XHR9XG5cdFx0fSlcblxuXHRcdHQudGVzdChcIlthbGlhc2VzOnZhbHVlMSBPUiB2YWx1ZTJdXCIsIGFzeW5jIHQgPT4ge1xuXHRcdFx0Y29uc3QgbWF0Y2gxID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QubWRcIiwgXCJcIiwge1xuXHRcdFx0XHRhbGlhc2VzOiBbXG5cdFx0XHRcdFx0XCJ2YWx1ZTFcIlxuXHRcdFx0XHRdXG5cdFx0XHR9KVxuXHRcdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKG1hdGNoMSkpO1xuXG5cdFx0XHRjb25zdCBtYXRjaDIgPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdDEubWRcIiwgXCJcIiwge1xuXHRcdFx0XHRhbGlhc2VzOiBbXG5cdFx0XHRcdFx0XCJ2YWx1ZTJcIlxuXHRcdFx0XHRdXG5cdFx0XHR9KVxuXHRcdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKG1hdGNoMikpO1xuXG5cdFx0XHRjb25zdCBub25fbWF0Y2ggPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdDIubWRcIiwgXCJcIiwge1xuXHRcdFx0XHRhbGlhc2VzOiBbXG5cdFx0XHRcdFx0XCJ2YWx1ZTNcIlxuXHRcdFx0XHRdXG5cdFx0XHR9KVxuXHRcdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKG5vbl9tYXRjaCkpO1xuXG5cdFx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgZmlsZXMuc2VhcmNoRm9yKFwiW2FsaWFzZXM6dmFsdWUxIE9SIHZhbHVlMl1cIik7XG5cblx0XHRcdGlmICghbWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGVzdC5tZFwiKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKFwiZXhwZWN0ZWQgdG8gZmluZCB0ZXN0Lm1kIGluXCIsIG1hdGNoZXMpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCFtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0ZXN0MS5tZFwiKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKFwiZXhwZWN0ZWQgdG8gZmluZCAndGVzdDEubWQnIGluXCIsIG1hdGNoZXMpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKG1hdGNoZXMuc29tZShpdCA9PiBpdC5uYW1lID09PSBcInRlc3QzLm1kXCIpKSB7XG5cdFx0XHRcdHQuZmFpbFdpdGgoXCJleHBlY3RlZCBOT1QgdG8gZmluZCAndGVzdDMubWQnIGluXCIsIG1hdGNoZXMpO1xuXHRcdFx0fVxuXG5cdFx0fSlcblx0fSlcblxufVxuIiwiXG5leHBvcnQgZnVuY3Rpb24gdHJpbUluZGVudChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG5cdGNvbnN0IGxpbmVzID0gc3RyLnNwbGl0KFwiXFxuXCIpXG5cdGNvbnN0IGZpcnN0X2luZGV4ID0gbGluZXMuZmluZEluZGV4KGl0ID0+IGl0Lmxlbmd0aCA+IDAgJiYgaXQgIT09IFwiXFxuXCIpO1xuXHRpZiAoZmlyc3RfaW5kZXggPCAwKSB7XG5cdFx0cmV0dXJuIHN0cjtcblx0fVxuXHRjb25zdCBmaXJzdCA9IGxpbmVzW2ZpcnN0X2luZGV4XTtcblx0Y29uc3Qgd2hpdGVzcGFjZSA9IGZpcnN0Lmxlbmd0aCAtIGZpcnN0LnRyaW1TdGFydCgpLmxlbmd0aFxuXHRyZXR1cm4gbGluZXMuc2xpY2UoZmlyc3RfaW5kZXgpLm1hcChpdCA9PiBpdC5zdWJzdHJpbmcod2hpdGVzcGFjZSkpLmpvaW4oXCJcXG5cIik7XG59XG4iLCJcbmltcG9ydCB7IHRyaW1JbmRlbnQgfSBmcm9tIFwiLi4vLi4vLi4vc3JjL2xpYi9zdHJpbmdzXCI7XG5pbXBvcnQgKiBhcyB0ZXN0aW5nIGZyb20gXCIuLi9mcmFtZXdvcmtcIjtcbmltcG9ydCB0eXBlIHsgRmlsZXMgfSBmcm9tIFwiLi4vb2JzaWRpYW5cIlxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB0ZXN0VGFnczxGaWxlPihydW46IHRlc3RpbmcuVCwgb2JzaWRpYW46IEZpbGVzPEZpbGU+KSB7XG5cdHJ1bi50ZXN0KFwidGFncyBpbiBib2R5XCIsIGFzeW5jICh0KSA9PiB7XG5cdFx0Y29uc3QgdGFnZ2VkID0gYXdhaXQgb2JzaWRpYW4uY3JlYXRlRmlsZShcInRhZ2dlZC5tZFwiLCBcIiNtZWV0aW5nXCIpO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gb2JzaWRpYW4uZGVsZXRlRmlsZSh0YWdnZWQpKTtcblxuXHRcdGNvbnN0IG1hdGNoZXMgPSBhd2FpdCBvYnNpZGlhbi5zZWFyY2hGb3IoXCJ0YWc6I21lZXRpbmdcIik7XG5cblx0XHRpZiAoIW1hdGNoZXMuc29tZShpdCA9PiBpdC5uYW1lID09PSBcInRhZ2dlZC5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcInRhZ2dlZC5tZCBoYXMgdGFnICcjbWVldGluZycgaW4gYm9keSwgYnV0IGl0IHdhcyBub3QgZm91bmQgaW5cIiwgbWF0Y2hlcylcblx0XHR9XG5cdH0pXG5cblx0cnVuLnRlc3QoXCJwcmVmaXhlZCB0YWdzIGluIGZyb250bWF0dGVyXCIsIGFzeW5jICh0KSA9PiB7XG5cdFx0Y29uc3QgdGFnZ2VkID0gYXdhaXQgb2JzaWRpYW4uY3JlYXRlRmlsZShcInRhZ2dlZC5tZFwiLCBcIlwiLCB7XG5cdFx0XHR0YWdzOiBbXCIjbWVldGluZ1wiXVxuXHRcdH0pO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gb2JzaWRpYW4uZGVsZXRlRmlsZSh0YWdnZWQpKTtcblx0XHRjb25zdCBjb250ZW50ID0gYXdhaXQgb2JzaWRpYW4ucmVhZEZpbGUodGFnZ2VkKTtcblx0XHR0LmxvZyhcInRhZ2dlZC5tZFwiLGNvbnRlbnQpXG5cblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgb2JzaWRpYW4uc2VhcmNoRm9yKFwidGFnOiNtZWV0aW5nXCIpO1xuXG5cdFx0aWYgKG1hdGNoZXMuc29tZShpdCA9PiBpdC5uYW1lID09PSBcInRhZ2dlZC5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcInRhZ3Mgb2YgYSBmaWxlIGRvIG5vdCBoYXZlIGhhc2hlcyBhdCB0aGUgc3RhcnQsIHNvIHRoZSBmb2xsb3dpbmcgc2hvdWxkIE5PVCBtYXRjaFwiLCBtYXRjaGVzKVxuXHRcdH1cblx0fSlcblxuXHRydW4udGVzdChcInJhdyB0YWcgaW4gZnJvbnRtYXR0ZXJcIiwgYXN5bmMgKHQpID0+IHtcblx0XHRjb25zdCB0YWdnZWQgPSBhd2FpdCBvYnNpZGlhbi5jcmVhdGVGaWxlKFwidGFnZ2VkLm1kXCIsIFwiXCIsIHtcblx0XHRcdHRhZ3M6IFtcIm1lZXRpbmdcIl1cblx0XHR9KTtcblx0XHR0LmFmdGVyKCgpID0+IG9ic2lkaWFuLmRlbGV0ZUZpbGUodGFnZ2VkKSk7XG5cblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgb2JzaWRpYW4uc2VhcmNoRm9yKFwidGFnOiNtZWV0aW5nXCIpO1xuXG5cdFx0aWYgKCFtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0YWdnZWQubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJ0YWdnZWQubWQgaGFzIHRhZyAnbWVldGluZycgaW4gZnJvbnRtYXR0ZXIsIGJ1dCBpdCB3YXMgbm90IGZvdW5kIGluXCIsIG1hdGNoZXMpXG5cdFx0fVxuXHR9KVxuXG5cdHJ1bi50ZXN0KFwibm8gaGFzaCBhZnRlciB0YWcgb3BlcmF0b3JcIiwgYXN5bmMgdCA9PiB7XG5cdFx0Y29uc3QgdGFnZ2VkID0gYXdhaXQgb2JzaWRpYW4uY3JlYXRlRmlsZShcInRhZ2dlZC5tZFwiLCBcIlwiLCB7IHRhZ3M6IFtcIm1lZXRpbmdcIl0gfSk7XG5cdFx0dC5hZnRlcigoKSA9PiBvYnNpZGlhbi5kZWxldGVGaWxlKHRhZ2dlZCkpO1xuXG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IG9ic2lkaWFuLnNlYXJjaEZvcihcInRhZzptZWV0aW5nXCIpO1xuXG5cdFx0aWYgKCFtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0YWdnZWQubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJ0YWdnZWQubWQgaGFzIHRhZyAnbWVldGluZycgaW4gZnJvbnRtYXR0ZXIsIGJ1dCBpdCB3YXMgbm90IGZvdW5kIGluXCIsIG1hdGNoZXMpXG5cdFx0fVxuXHR9KVxuXG5cdHJ1bi50ZXN0KFwidGFnIGluIGNvZGVibG9ja1wiLCBhc3luYyAodCkgPT4ge1xuXHRcdGNvbnN0IGZpbGUgPSBhd2FpdCBvYnNpZGlhbi5jcmVhdGVGaWxlKFwidGFnZ2VkIGluIGNvZGVibG9jay5tZFwiLCB0cmltSW5kZW50KGBcblx0XHRcdFxcYFxcYFxcYFxuXHRcdFx0I21lZXRpbmdcblx0XHRcdFxcYFxcYFxcYFxuXHRcdGApKTtcblx0XHR0LmFmdGVyKCgpID0+IG9ic2lkaWFuLmRlbGV0ZUZpbGUoZmlsZSkpXG5cblx0XHRjb25zdCByYXdfbWF0Y2hlcyA9IGF3YWl0IG9ic2lkaWFuLnNlYXJjaEZvcihcIiNtZWV0aW5nXCIpO1xuXHRcdGNvbnN0IHRhZ19tYXRjaGVzID0gYXdhaXQgb2JzaWRpYW4uc2VhcmNoRm9yKFwidGFnOiNtZWV0aW5nXCIpO1xuXHRcdGNvbnN0IG5vX2hhc2ggPSBhd2FpdCBvYnNpZGlhbi5zZWFyY2hGb3IoXCJ0YWc6bWVldGluZ1wiKTtcblxuXHRcdGlmICghcmF3X21hdGNoZXMuc29tZShpdCA9PiBpdC5uYW1lID09PSBcInRhZ2dlZCBpbiBjb2RlYmxvY2subWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJyYXcgc2VhcmNoIGZvciAnI21lZXRpbmcnIGRpZCBub3QgZmluZCBmaWxlIHdpdGggJyNtZWV0aW5nJyBpbiBjb2RlYmxvY2tcIilcblx0XHR9XG5cdFx0aWYgKHRhZ19tYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0YWdnZWQgaW4gY29kZWJsb2NrLm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwidGFnIHNlYXJjaCBmb3IgJyNtZWV0aW5nJyBpbmNvcnJlY3RseSBtYXRjaGVkIGZpbGUgd2l0aCAnI21lZXRpbmcnIGluIGNvZGVibG9ja1wiKVxuXHRcdH1cblx0XHRpZiAobm9faGFzaC5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGFnZ2VkIGluIGNvZGVibG9jay5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcInRhZyBzZWFyY2ggZm9yICcjbWVldGluZycgaW5jb3JyZWN0bHkgbWF0Y2hlZCBmaWxlIHdpdGggJyNtZWV0aW5nJyBpbiBjb2RlYmxvY2tcIilcblx0XHR9XG5cdH0pXG59XG4iLCJjb25zdCBGQUlMX05PVyA9IFN5bWJvbCgpO1xuXG5leHBvcnQgdHlwZSBMb2dnZXIgPSBQaWNrPENvbnNvbGUsIFwiZXJyb3JcIiB8IFwid2FyblwiIHwgXCJsb2dcIj47XG5cbmV4cG9ydCBjbGFzcyBTdWl0ZSB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdHB1YmxpYyBsb2dnZXI6IFBpY2s8Q29uc29sZSwgXCJlcnJvclwiIHwgXCJ3YXJuXCIgfCBcImxvZ1wiPixcblx0XHRwdWJsaWMgcGFyZW50OiBTdWl0ZSB8IG51bGwgPSBudWxsLFxuXHQpIHsgfVxuXG5cdCN0ZXN0czogQXJyYXk8eyB0ZXN0OiBUZXN0LCBmbjogKHQ6IFRlc3QpID0+ICh2b2lkIHwgUHJvbWlzZTx2b2lkPikgfT4gPSBbXTtcblxuXHR0ZXN0KG5hbWU6IHN0cmluZywgZm46ICh0OiBUZXN0KSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPikge1xuXHRcdGlmICh0aGlzLiNyYW4pIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oXCJhbHJlYWR5IHJhbiB0ZXN0IHN1aXRlLCBidXQgdHJ5aW5nIHRvIGFkZFwiLCBuYW1lLCBcInRlc3RcIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGNvbnN0IG5lc3RlZCA9IG5ldyBUZXN0KG5hbWUsIHRoaXMpO1xuXHRcdHRoaXMuI3Rlc3RzLnB1c2goeyB0ZXN0OiBuZXN0ZWQsIGZuIH0pO1xuXHR9XG5cblx0YXN5bmMgc3VpdGUobmFtZTogc3RyaW5nLCBmbjogKHM6IFN1aXRlKSA9PiBQcm9taXNlPHZvaWQ+KSB7XG5cdFx0aWYgKHRoaXMuI3Jhbikge1xuXHRcdFx0dGhpcy5sb2dnZXIud2FybihcImFscmVhZHkgcmFuIHRlc3Qgc3VpdGUsIGJ1dCB0cnlpbmcgdG8gYWRkXCIsIG5hbWUsIFwic3VpdGVcIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGNvbnN0IGVyciA9IG5ldyBFcnJvcigpO1xuXHRcdGNvbnN0IG5lc3RlZCA9IG5ldyBTdWl0ZSh7XG5cdFx0XHRsb2c6ICguLi5kYXRhKSA9PiB0aGlzLmxvZ2dlci5sb2coXCIgICBcIiwgLi4uZGF0YSksXG5cdFx0XHR3YXJuOiAoLi4uZGF0YSkgPT4gdGhpcy5sb2dnZXIud2FybihcIiAgIFwiLCAuLi5kYXRhKSxcblx0XHRcdGVycm9yOiAoLi4uZGF0YSkgPT4gdGhpcy5sb2dnZXIuZXJyb3IoXCIgICBcIiwgLi4uZGF0YSksXG5cdFx0fSwgdGhpcyk7XG5cblx0XHR0aGlzLmxvZ2dlci5sb2coXCJURVNUXCIsIG5hbWUpO1xuXG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IGZuKG5lc3RlZCk7XG5cdFx0fSBjYXRjaCAoY2F1c2UpIHtcblx0XHRcdGVyci5jYXVzZSA9IGNhdXNlO1xuXHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IoXCJGYWlsZWQgdG8gaW5pdCBzdWl0ZVwiLCBlcnIpO1xuXHRcdH1cblxuXHRcdGF3YWl0IG5lc3RlZC5ydW4oKTtcblxuXHRcdGlmIChuZXN0ZWQuZmFpbGVkKCkpIHtcblx0XHRcdHRoaXMubG9nZ2VyLmxvZyhcIkZBSUxcIiwgbmFtZSk7XG5cdFx0XHR0aGlzLmZhaWwoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5sb2dnZXIubG9nKFwiUEFTU1wiLCBuYW1lKTtcblx0XHR9XG5cdH1cblxuXHQjcmFuID0gZmFsc2U7XG5cdGFzeW5jIHJ1bih0aGlzOiBTdWl0ZSkge1xuXHRcdHRoaXMuI3JhbiA9IHRydWU7XG5cdFx0Zm9yIChjb25zdCB7IHRlc3QsIGZuIH0gb2YgdGhpcy4jdGVzdHMpIHtcblx0XHRcdHRoaXMubG9nZ2VyLmxvZyhcIlRFU1RcIiwgdGVzdC5uYW1lKTtcblxuXHRcdFx0Y29uc3QgeyBsb2cgfSA9IGNvbnNvbGU7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nID0gKC4uLmFyZ3MpID0+IFRlc3QuYWRkTG9nKHRlc3QsIC4uLmFyZ3MpO1xuXHRcdFx0XHRhd2FpdCBmbih0ZXN0KTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHR0ZXN0LmZhaWwoKTtcblx0XHRcdFx0aWYgKGVyciAhPT0gRkFJTF9OT1cpIHtcblx0XHRcdFx0XHRUZXN0LmFkZExvZyh0ZXN0LCBlcnIpXG5cdFx0XHRcdH1cblx0XHRcdH0gZmluYWxseSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nID0gbG9nO1xuXHRcdFx0XHRsZXQgZmFpbGVkX2R1cmluZ190ZXN0ID0gdGVzdC5mYWlsZWQoKTtcblx0XHRcdFx0aWYgKGZhaWxlZF9kdXJpbmdfdGVzdCkge1xuXHRcdFx0XHRcdHRoaXMubG9nZ2VyLmxvZyhcIkZBSUxcIiwgdGVzdC5uYW1lKVxuXHRcdFx0XHRcdGZvciAoY29uc3QgeyBsb2NhdGlvbiwgYXJncyB9IG9mIHRlc3QubG9ncygpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLmxvZ2dlci5sb2cobG9jYXRpb24sIC4uLmFyZ3MpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci5sb2coXCJQQVNTXCIsIHRlc3QubmFtZSlcblx0XHRcdFx0fVxuXHRcdFx0XHR0ZXN0LmNsZWFudXAoKVxuXHRcdFx0XHR0aGlzLiNjbGVhbnVwVGVzdCh0ZXN0KVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgY2xlYW51cCBvZiB0aGlzLiNhZnRlcl9hbGxfZm5zKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRhd2FpdCBjbGVhbnVwKHRoaXMpO1xuXHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdHRoaXMuZmFpbCgpO1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5lcnJvcihcIlN1aXRlIGZhaWxlZCBkdXJpbmcgY2xlYW51cFwiLCBlcnIpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdCNhZnRlcl9hbGxfZm5zOiBBcnJheTwoczogU3VpdGUpID0+IGFueT4gPSBbXTtcblx0YWZ0ZXJBbGw8Uj4odGhpczogU3VpdGUsIGZuOiAoczogU3VpdGUpID0+IFIgfCBQcm9taXNlPFI+KSB7XG5cdFx0dGhpcy4jYWZ0ZXJfYWxsX2Zucy5wdXNoKGZuKTtcblx0fVxuXG5cdC8qKiBhbGlhcyBmb3IgYWZ0ZXJBbGwgKi9cblx0YWZ0ZXI8Uj4odGhpczogU3VpdGUsIGZuOiAoczogU3VpdGUpID0+IFIgfCBQcm9taXNlPFI+KSB7XG5cdFx0dGhpcy5hZnRlckFsbChmbik7XG5cdH1cblxuXHQjYWZ0ZXJfZWFjaF9mbnM6IEFycmF5PCh0OiBUZXN0KSA9PiBhbnk+ID0gW107XG5cdGFmdGVyRWFjaDxSPih0aGlzOiBTdWl0ZSwgZm46ICh0OiBUZXN0KSA9PiBSIHwgUHJvbWlzZTxSPikge1xuXHRcdHRoaXMuI2FmdGVyX2VhY2hfZm5zLnB1c2goZm4pO1xuXHR9XG5cblx0YXN5bmMgI2NsZWFudXBUZXN0KHRoaXM6IFN1aXRlLCB0ZXN0OiBUZXN0KSB7XG5cdFx0Zm9yIChjb25zdCBjbGVhbnVwIG9mIHRoaXMuI2FmdGVyX2VhY2hfZm5zKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRhd2FpdCBjbGVhbnVwKHRlc3QpO1xuXHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdHRlc3QuZmFpbCgpO1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5lcnJvcih0ZXN0Lm5hbWUsIFwiZmFpbGVkIGR1cmluZyBjbGVhbnVwXCIsIGVycik7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmICh0aGlzLnBhcmVudCAhPT0gbnVsbCkge1xuXHRcdFx0dGhpcy5wYXJlbnQuI2NsZWFudXBUZXN0KHRlc3QpO1xuXHRcdH1cblx0fVxuXG5cdCNmYWlsZWQgPSBmYWxzZTtcblx0ZmFpbCh0aGlzOiBTdWl0ZSkge1xuXHRcdHRoaXMuI2ZhaWxlZCA9IHRydWU7XG5cdFx0dGhpcy5wYXJlbnQ/LmZhaWwoKTtcblx0fVxuXG5cdGZhaWxlZCh0aGlzOiBTdWl0ZSk6IGJvb2xlYW4ge1xuXHRcdHJldHVybiB0aGlzLiNmYWlsZWQ7XG5cdH1cblxufVxuXG5leHBvcnQgeyBTdWl0ZSBhcyBUIH1cblxuY2xhc3MgVGVzdCB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdHB1YmxpYyBuYW1lOiBzdHJpbmcsXG5cdFx0cHVibGljIHBhcmVudDogU3VpdGUsXG5cdCkgeyB9XG5cblx0Z2V0IGxvZ2dlcigpIHtcblx0XHRyZXR1cm4gdGhpcy5wYXJlbnQubG9nZ2VyXG5cdH1cblxuXHQjYWZ0ZXJfZm5zOiBBcnJheTwodDogVGVzdCkgPT4gYW55PiA9IFtdO1xuXHRhZnRlcjxSPih0aGlzOiBUZXN0LCBmbjogKHQ6IFRlc3QpID0+IFIgfCBQcm9taXNlPFI+KSB7XG5cdFx0dGhpcy4jYWZ0ZXJfZm5zLnB1c2goZm4pO1xuXHR9XG5cblx0YXN5bmMgY2xlYW51cCh0aGlzOiBUZXN0KSB7XG5cdFx0Zm9yIChjb25zdCBjbGVhbnVwIG9mIHRoaXMuI2FmdGVyX2Zucykge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0YXdhaXQgY2xlYW51cCh0aGlzKTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHR0aGlzLmZhaWwoKTtcblx0XHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IodGhpcy5uYW1lLCBcImZhaWxlZCBkdXJpbmcgY2xlYW51cFwiLCBlcnIpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdCNmYWlsZWQgPSBmYWxzZTtcblx0ZmFpbCh0aGlzOiBUZXN0KSB7XG5cdFx0dGhpcy4jZmFpbGVkID0gdHJ1ZTtcblx0XHR0aGlzLnBhcmVudC5mYWlsKCk7XG5cdH1cblx0ZmFpbGVkKHRoaXM6IFRlc3QpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy4jZmFpbGVkO1xuXHR9XG5cdC8qKiBlcXVpdmVsYW50IHRvIGNhbGxpbmcgYGxvZyguLi5hcmdzKWAgYW5kIHRoZW4gYGZhaWwoKWAgKi9cblx0ZmFpbFdpdGgodGhpczogVGVzdCwgLi4uYXJnczogYW55W10pIHtcblx0XHRjb25zdCBsb2NhdGlvbiA9IG5ldyBFcnJvcigpLnN0YWNrIS5zcGxpdChcIlxcblwiKVsyXTtcblx0XHR0aGlzLiNsb2dzLnB1c2goeyBsb2NhdGlvbiwgYXJncyB9KTtcblx0XHR0aGlzLmZhaWwoKTtcblx0fVxuXG5cdGZhaWxOb3codGhpczogVGVzdCk6IG5ldmVyIHtcblx0XHR0aGlzLmZhaWwoKTtcblx0XHR0aHJvdyBGQUlMX05PVztcblx0fVxuXG5cdCNsb2dzOiBBcnJheTx7IGxvY2F0aW9uOiBzdHJpbmcsIGFyZ3M6IGFueVtdIH0+ID0gW107XG5cdGxvZyh0aGlzOiBUZXN0LCAuLi5hcmdzOiBhbnlbXSkge1xuXHRcdGNvbnN0IGxvY2F0aW9uID0gbmV3IEVycm9yKCkuc3RhY2shLnNwbGl0KFwiXFxuXCIpWzJdO1xuXHRcdHRoaXMuI2xvZ3MucHVzaCh7IGxvY2F0aW9uLCBhcmdzIH0pO1xuXHR9XG5cdHN0YXRpYyBhZGRMb2codGhpczogdHlwZW9mIFRlc3QsIHRlc3Q6IFRlc3QsIC4uLmFyZ3M6IGFueVtdKSB7XG5cdFx0dGVzdC4jbG9ncy5wdXNoKHsgbG9jYXRpb246IFwiXCIsIGFyZ3MgfSlcblx0fVxuXHRsb2dzKHRoaXM6IFRlc3QpOiBSZWFkb25seUFycmF5PHsgbG9jYXRpb246IHN0cmluZywgYXJnczogYW55W10gfT4ge1xuXHRcdHJldHVybiB0aGlzLiNsb2dzO1xuXHR9XG59XG4iLCJpbXBvcnQgKiBhcyB0ZXN0aW5nIGZyb20gXCIuLi9mcmFtZXdvcmtcIlxuaW1wb3J0ICogYXMgb2JzaWRpYW4gZnJvbSBcIi4uL29ic2lkaWFuXCJcblxuXG5jb25zdCB0ZXN0cyA9IGltcG9ydC5tZXRhLmdsb2I8dHJ1ZSwgc3RyaW5nLCAodDogdGVzdGluZy5TdWl0ZSwgZmlsZXM6IG9ic2lkaWFuLkZpbGVzPGFueT4pID0+IFByb21pc2U8dm9pZD4+KFwiLi90ZXN0LioudHNcIiwgeyBlYWdlcjogdHJ1ZSwgaW1wb3J0OiBcImRlZmF1bHRcIiB9KVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuVGVzdHM8RmlsZT4obG9nZ2VyOiB0ZXN0aW5nLkxvZ2dlciwgZmlsZXM6IG9ic2lkaWFuLkZpbGVzPEZpbGU+KSB7XG5cdGNvbnN0IHRlc3RlciA9IG5ldyB0ZXN0aW5nLlN1aXRlKGxvZ2dlcik7XG5cblx0Zm9yIChjb25zdCBbZmlsZW5hbWUsIGZuXSBvZiBPYmplY3QuZW50cmllcyh0ZXN0cykpIHtcblx0XHRhd2FpdCB0ZXN0ZXIuc3VpdGUoZmlsZW5hbWUsIHJ1biA9PiBmbihydW4sIGZpbGVzKSk7XG5cdH1cblxufVxuIiwiaW1wb3J0ICogYXMgb2JzaWRpYW4gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgbmV0IGZyb20gXCJuZXRcIjtcblxuaW1wb3J0IHsgRmlsZXMgfSBmcm9tIFwiLi9vYnNpZGlhblwiO1xuaW1wb3J0ICogYXMgdGVzdHMgZnJvbSBcIi4vdGVzdHMvaW5kZXhcIlxuaW1wb3J0IHsgaW5zcGVjdCB9IGZyb20gXCJ1dGlsXCI7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSBcInBhdGhcIjtcblxuZGVjbGFyZSBjb25zdCBfX1RFU1RfUlVOTkVSX1BPUlRfXzogbnVtYmVyO1xuXG5leHBvcnQgZnVuY3Rpb24gT2JzaWRpYW5GaWxlcyhwbHVnaW46IG9ic2lkaWFuLlBsdWdpbiwgc2VhcmNoOiAocXVlcnk6IHN0cmluZykgPT4gUHJvbWlzZTx0eXBlb2YgRmlsZXMuU2VhcmNoTWF0Y2gucHJvdG90eXBlW10+KSB7XG5cdHJldHVybiBuZXcgRmlsZXM8b2JzaWRpYW4uVEZpbGU+KFxuXHRcdGFzeW5jIChuYW1lLCBib2R5ID0gXCJcIiwgZnJvbnRtYXR0ZXIpID0+IHtcblx0XHRcdGlmIChmcm9udG1hdHRlcikge1xuXHRcdFx0XHRsZXQgcHJlZml4ID0gXCItLS1cXG5cIjtcblx0XHRcdFx0aWYgKGZyb250bWF0dGVyLnRhZ3MpIHtcblx0XHRcdFx0XHRwcmVmaXggKz0gXCJ0YWdzOlxcblwiXG5cdFx0XHRcdFx0ZnJvbnRtYXR0ZXIudGFncy5mb3JFYWNoKHRhZyA9PiBwcmVmaXggKz0gXCIgIC0gXCIgKyB0YWcgKyBcIlxcblwiKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChmcm9udG1hdHRlci5hbGlhc2VzKSB7XG5cdFx0XHRcdFx0cHJlZml4ICs9IFwiYWxpYXNlczpcXG5cIlxuXHRcdFx0XHRcdGZyb250bWF0dGVyLmFsaWFzZXMuZm9yRWFjaChhbGlhcyA9PiBwcmVmaXggKz0gYCAgLSAke2FsaWFzfVxcbmApXG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGZyb250bWF0dGVyLnByb3BlcnRpZXMpIHtcblx0XHRcdFx0XHRmb3IgKGNvbnN0IFtwcm9wLCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoZnJvbnRtYXR0ZXIucHJvcGVydGllcykpIHtcblx0XHRcdFx0XHRcdHByZWZpeCArPSBgJHtwcm9wfTogJHt2YWx1ZX1cXG5gXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHByZWZpeCArPSBcIi0tLVxcblwiO1xuXHRcdFx0XHRib2R5ID0gcHJlZml4ICsgYm9keTtcblx0XHRcdH1cblx0XHRcdGNvbnN0IHBhdGhfcGFydHMgPSBuYW1lLnNwbGl0KFwiL1wiKTtcblx0XHRcdGlmIChwYXRoX3BhcnRzLmxlbmd0aCA+IDEpIHtcblx0XHRcdFx0Y29uc3QgZm9sZGVyX3BhdGggPSBqb2luKC4uLnBhdGhfcGFydHMuc2xpY2UoMCwgLTEpKTtcblx0XHRcdFx0aWYgKCFwbHVnaW4uYXBwLnZhdWx0LmdldEZvbGRlckJ5UGF0aChmb2xkZXJfcGF0aCkpIHtcblx0XHRcdFx0XHRhd2FpdCBwbHVnaW4uYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihmb2xkZXJfcGF0aCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGNvbnN0IGZpbGUgPSBhd2FpdCBwbHVnaW4uYXBwLnZhdWx0LmNyZWF0ZShuYW1lLCBib2R5KTtcblx0XHRcdGlmIChwbHVnaW4uYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpID09IG51bGwpIHtcblx0XHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IHJlZiA9IHBsdWdpbi5hcHAubWV0YWRhdGFDYWNoZS5vbihcInJlc29sdmVkXCIsICgpID0+IHtcblx0XHRcdFx0XHRcdGlmIChwbHVnaW4uYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0cGx1Z2luLmFwcC5tZXRhZGF0YUNhY2hlLm9mZnJlZihyZWYpO1xuXHRcdFx0XHRcdFx0XHRyZXNvbHZlKGZpbGUpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZpbGU7XG5cdFx0fSxcblx0XHRhc3luYyAoZmlsZSkgPT4ge1xuXHRcdFx0YXdhaXQgcGx1Z2luLmFwcC52YXVsdC5kZWxldGUoZmlsZSwgdHJ1ZSlcblx0XHRcdGNvbnN0IHBhdGhfcGFydHMgPSBmaWxlLm5hbWUuc3BsaXQoXCIvXCIpXG5cdFx0XHRpZiAocGF0aF9wYXJ0cy5sZW5ndGggPiAxKSB7XG5cdFx0XHRcdGNvbnN0IGZvbGRlcl9wYXRoID0gam9pbiguLi5wYXRoX3BhcnRzLnNsaWNlKDAsIC0xKSlcblx0XHRcdFx0Y29uc3QgZm9sZGVyID0gcGx1Z2luLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgoZm9sZGVyX3BhdGgpO1xuXHRcdFx0XHRpZiAoIWZvbGRlcikgcmV0dXJuO1xuXHRcdFx0XHRpZiAoZm9sZGVyLmNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdGF3YWl0IHBsdWdpbi5hcHAudmF1bHQuZGVsZXRlKGZvbGRlciwgdHJ1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXHRcdHNlYXJjaCxcblx0XHRhc3luYyAoZmlsZSkgPT4ge1xuXHRcdFx0cmV0dXJuIHBsdWdpbi5hcHAudmF1bHQuY2FjaGVkUmVhZChmaWxlKVxuXHRcdH0sXG5cdCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBQbHVnaW48RmlsZT4obWFrZV9maWxlczogKHBsdWdpbjogb2JzaWRpYW4uUGx1Z2luKSA9PiBGaWxlczxGaWxlPik6IHR5cGVvZiBvYnNpZGlhbi5QbHVnaW4ge1xuXHRyZXR1cm4gY2xhc3MgZXh0ZW5kcyBvYnNpZGlhbi5QbHVnaW4ge1xuXHRcdHNvY2tldDogbmV0LlNvY2tldCB8IG51bGwgPSBudWxsO1xuXG5cdFx0c2VuZE1lc3NhZ2UoZGF0YTogYW55W10pIHtcblx0XHRcdGxldCBidWZmZXI6IEFycmF5PHN0cmluZz4gPSBbXTtcblx0XHRcdGZvciAoY29uc3QgZW50cnkgb2YgZGF0YSkge1xuXHRcdFx0XHRpZiAodHlwZW9mIGVudHJ5ID09PSBcInN0cmluZ1wiKSB7XG5cdFx0XHRcdFx0YnVmZmVyLnB1c2goZW50cnkpXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YnVmZmVyLnB1c2goaW5zcGVjdChlbnRyeSwgdW5kZWZpbmVkLCA0LCB0cnVlKSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHRoaXMuc29ja2V0Py53cml0ZShidWZmZXIuam9pbihcIiBcIikgKyBcIlxcMFwiKVxuXHRcdH1cblxuXHRcdG9ubG9hZCgpOiB2b2lkIHtcblx0XHRcdGNvbnN0IHNvY2tldCA9IHRoaXMuc29ja2V0ID0gbmV0LmNyZWF0ZUNvbm5lY3Rpb24oeyBwb3J0OiBfX1RFU1RfUlVOTkVSX1BPUlRfXyB9KTtcblxuXHRcdFx0Y29uc3QgbG9nZ2VyID0ge1xuXHRcdFx0XHRlcnJvcjogKC4uLmRhdGE6IGFueVtdKSA9PiB7XG5cdFx0XHRcdFx0c29ja2V0LndyaXRlKFwiRVJST1JcIik7XG5cdFx0XHRcdFx0dGhpcy5zZW5kTWVzc2FnZShkYXRhKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0d2FybjogKC4uLmRhdGE6IGFueVtdKSA9PiB7XG5cdFx0XHRcdFx0c29ja2V0LndyaXRlKFwiV0FSTlwiKTtcblx0XHRcdFx0XHR0aGlzLnNlbmRNZXNzYWdlKGRhdGEpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRsb2c6ICguLi5kYXRhOiBhbnlbXSkgPT4ge1xuXHRcdFx0XHRcdHNvY2tldC53cml0ZShcIklORk9cIik7XG5cdFx0XHRcdFx0dGhpcy5zZW5kTWVzc2FnZShkYXRhKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmFwcC53b3Jrc3BhY2Uub25MYXlvdXRSZWFkeShhc3luYyAoKSA9PiB7XG5cdFx0XHRcdGF3YWl0IHRlc3RzLnJ1blRlc3RzKGxvZ2dlciwgbWFrZV9maWxlcyh0aGlzKSlcblx0XHRcdFx0c29ja2V0LndyaXRlKFwiSU5GT1xcMFwiKVxuXHRcdFx0XHRzb2NrZXQuZW5kKCk7XG5cdFx0XHR9KVxuXHRcdH1cblxuXHRcdG9udW5sb2FkKCkge1xuXHRcdFx0dGhpcy5zb2NrZXQ/LmVuZCgpO1xuXHRcdFx0dGhpcy5zb2NrZXQgPSBudWxsO1xuXG5cdFx0fVxuXHR9XG59XG4iLCJpbXBvcnQgKiBhcyBjb21tb24gZnJvbSBcIi4vY29tbW9uLm1haW5cIlxuXG5leHBvcnQgZGVmYXVsdCBjb21tb24uUGx1Z2luKChwbHVnaW4pID0+IGNvbW1vbi5PYnNpZGlhbkZpbGVzKHBsdWdpbixcdGFzeW5jIChxdWVyeSkgPT4ge1xuXHRcdGNvbnN0IGxlYXZlcyA9IHBsdWdpbi5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShcInNlYXJjaFwiKTtcblx0XHRpZiAobGVhdmVzLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IEVycm9yKFwiY291bGQgbm90IGZpbmQgYW55IGxlYXZlcyBvZiB0eXBlICdzZWFyY2gnXCIpO1xuXHRcdGlmICghbGVhdmVzWzBdLmlzVmlzaWJsZSgpKSB7XG5cdFx0XHRwbHVnaW4uYXBwLndvcmtzcGFjZS5zZXRBY3RpdmVMZWFmKGxlYXZlc1swXSk7XG5cdFx0fVxuXHRcdGNvbnN0IHNlYXJjaCA9IGxlYXZlc1swXS52aWV3O1xuXHRcdHNlYXJjaC5zZXRRdWVyeShxdWVyeSk7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuXHRcdFx0Y29uc3QgaWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0XHRcdGlmICghc2VhcmNoLnF1ZXVlLnF1ZXVlLnJ1bm5hYmxlLnJ1bm5pbmcpIHtcblx0XHRcdFx0XHRjbGVhckludGVydmFsKGlkKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXNvbHZlKEFycmF5LmZyb20oc2VhcmNoLmRvbS5yZXN1bHREb21Mb29rdXApLm1hcCgoW2ZpbGUsIG1hdGNoXSkgPT4ge1xuXHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRuYW1lOiBmaWxlLm5hbWUsXG5cdFx0XHRcdFx0XHRwYXRoOiBmaWxlLnBhdGgsXG5cdFx0XHRcdFx0XHRiYXNlbmFtZTogZmlsZS5iYXNlbmFtZSxcblx0XHRcdFx0XHRcdGV4dGVuc2lvbjogZmlsZS5leHRlbnNpb24sXG5cdFx0XHRcdFx0XHRjb250ZW50OiBtYXRjaC5jb250ZW50LFxuXHRcdFx0XHRcdFx0bWV0YWRhdGE6IHBsdWdpbi5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoZmlsZSk/LmZyb250bWF0dGVyXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KSlcblx0XHRcdH0sIDEpXG5cdFx0fSlcblx0fSxcbikpO1xuIl0sIm5hbWVzIjpbInQiLCJfX3ZpdGVfZ2xvYl8wXzAiLCJfX3ZpdGVfZ2xvYl8wXzEiLCJfX3ZpdGVfZ2xvYl8wXzIiLCJfX3ZpdGVfZ2xvYl8wXzMiLCJfX3ZpdGVfZ2xvYl8wXzQiLCJfX3ZpdGVfZ2xvYl8wXzUiLCJ0ZXN0aW5nLlN1aXRlIiwiam9pbiIsIm9ic2lkaWFuIiwiaW5zcGVjdCIsInRlc3RzLnJ1blRlc3RzIiwiY29tbW9uLlBsdWdpbiIsImNvbW1vbi5PYnNpZGlhbkZpbGVzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU0sV0FBQSxDQUFZO0FBQUEsRUFDakIsWUFDaUIsSUFBQSxFQUNmO0FBRGUsSUFBQSxJQUFBLENBQUEsSUFBQSxHQUFBLElBQUE7QUFBQSxFQUNiO0FBQ0w7QUFFTyxNQUFNLEtBQUEsQ0FBWTtBQUFBLEVBQ3hCLFdBQUEsQ0FDUSxVQUFBLEVBS0EsVUFBQSxFQUNBLFNBQUEsRUFDQSxRQUFBLEVBQ047QUFSTSxJQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsVUFBQTtBQUtBLElBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxVQUFBO0FBQ0EsSUFBQSxJQUFBLENBQUEsU0FBQSxHQUFBLFNBQUE7QUFDQSxJQUFBLElBQUEsQ0FBQSxRQUFBLEdBQUEsUUFBQTtBQUFBLEVBQ0o7QUFBQSxFQUVKLE9BQU8sV0FBQSxHQUFjLFdBQUE7QUFDdEI7O0FDakJBLFNBQXdCLE9BQUEsQ0FBYyxLQUFvQixRQUFBLEVBQXVCO0FBQ2hGLEVBQUEsR0FBQSxDQUFJLElBQUEsQ0FBSyxV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
