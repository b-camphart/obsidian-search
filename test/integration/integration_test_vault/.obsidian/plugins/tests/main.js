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
      const socket = this.socket = net.createConnection({ port: 40867 });
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

function isFileFilter(obj) {
  return obj != null && typeof obj === "object" && "appliesTo" in obj && typeof obj.appliesTo === "function";
}

function or(a, b) {
  a = Array.isArray(a) ? matchAll(a) : a;
  b = Array.isArray(b) ? matchAll(b) : b;
  return new OrFilter(a, b);
}
class OrFilter {
  constructor(a, b) {
    this.a = a;
    this.b = b;
  }
  async appliesTo(file) {
    return await this.a.appliesTo(file) || await this.b.appliesTo(file);
  }
  and(filter) {
    return matchAll(this, filter);
  }
  or(filter) {
    return or(this, filter);
  }
}

function matchAll(...filters) {
  if (filters.length === 1) {
    if (Array.isArray(filters[0])) {
      return combine$1(filters[0]);
    }
  }
  return combine$1(filters);
}
function combine$1(filters) {
  if (filters.length === 1) return filters[0];
  if (filters.length === 0) return MatchNone;
  return MatchAllFilter.flattened(filters);
}
const MatchNone = {
  async appliesTo(file) {
    return false;
  },
  and(filter) {
    return this;
  },
  or(filter) {
    return filter;
  }
};
class MatchAllFilter {
  constructor(filters) {
    this.filters = filters;
  }
  static flattened(filters) {
    if (!filters.some((filter) => filter instanceof MatchAllFilter)) {
      return new MatchAllFilter(filters);
    }
    return new MatchAllFilter(
      filters.flatMap((filter) => {
        if (filter instanceof MatchAllFilter) {
          return filter.filters;
        }
        return [filter];
      })
    );
  }
  async appliesTo(file) {
    return Promise.all(
      this.filters.map((filter) => filter.appliesTo(file))
    ).then((all) => all.every((it) => it));
  }
  and(filter) {
    if (filter instanceof MatchAllFilter) {
      return new MatchAllFilter(this.filters.concat(filter.filters));
    }
    return new MatchAllFilter(
      this.filters.concat(filter)
    );
  }
  or(filter) {
    return or(this, filter);
  }
}

class FileContentFilter {
  constructor(checker) {
    this.checker = checker;
  }
  async appliesTo(file) {
    const content2 = await file.vault.cachedRead(file);
    return this.checker.matches(content2);
  }
  and(filter) {
    return matchAll(this, filter);
  }
  or(filter) {
    return or(this, filter);
  }
}

function isParentParser(parser) {
  return "containsNestedGroupParser" in parser && typeof parser.containsNestedGroupParser === "function";
}

function isStringChecker(obj) {
  return obj != null && typeof obj === "object" && "matches" in obj && typeof obj.matches === "function";
}

class FileNameFilter {
  constructor(checker) {
    this.checker = checker;
  }
  async appliesTo(file2) {
    return this.checker.matches(file2.basename);
  }
  and(filter) {
    return matchAll(this, filter);
  }
  or(filter) {
    return or(this, filter);
  }
}

class FilePathFilter {
  constructor(checker) {
    this.checker = checker;
  }
  async appliesTo(file) {
    return this.checker.matches(file.path);
  }
  and(filter) {
    return matchAll(this, filter);
  }
  or(filter) {
    return matchAll(this, filter);
  }
}

class Or {
  constructor(a, b) {
    this.a = a;
    this.b = b;
  }
  matches(test) {
    return this.a.matches(test) || this.b.matches(test);
  }
  or(checker) {
    return new Or(this, checker);
  }
  and(checker) {
    return group(this, checker);
  }
}

function group(...checkers) {
  if (checkers.length === 1) {
    if (Array.isArray(checkers[0])) {
      return combine(checkers[0]);
    }
  }
  return combine(checkers);
}
function combine(checkers) {
  if (checkers.length === 1) return checkers[0];
  return new Group(checkers);
}
class Group {
  constructor(checkers) {
    this.checkers = checkers;
  }
  matches(test) {
    return this.checkers.every((checker) => checker.matches(test));
  }
  or(checker) {
    return new Or(this, checker);
  }
  and(checker) {
    return group(this.checkers.concat([checker]));
  }
}

class Phrase {
  constructor(phrase2, matchCase = true) {
    this.phrase = phrase2;
    this.matchCase = matchCase;
  }
  matches(test) {
    if (this.matchCase) return test.includes(this.phrase);
    return test.toLocaleUpperCase().includes(this.phrase.toLocaleUpperCase());
  }
  or(checker) {
    return new Or(this, checker);
  }
  and(checker) {
    return group(this, checker);
  }
}

class SubQueryPhraseParser {
  constructor(matchCase = true, buffer = "") {
    this.matchCase = matchCase;
    this.buffer = buffer;
  }
  parse(char) {
    switch (char) {
      case `\\`: {
        return new EscapedSubQueryPhraseParser(this.buffer, this.matchCase);
      }
      case `"`: {
        return null;
      }
    }
    return new SubQueryPhraseParser(this.matchCase, this.buffer + char);
  }
  end() {
    if (this.buffer.length > 0) {
      return new Phrase(this.buffer, this.matchCase);
    }
  }
}
class EscapedSubQueryPhraseParser extends SubQueryPhraseParser {
  constructor(buffer, matchCase = true) {
    super(matchCase, buffer);
  }
  parse(char) {
    return new SubQueryPhraseParser(
      this.matchCase,
      this.buffer + char
    );
  }
}

function not(checker) {
  if (checker instanceof Not) {
    return checker.not();
  }
  return new Not(checker);
}
class Not {
  constructor(checker) {
    this.checker = checker;
  }
  matches(test) {
    return !this.checker.matches(test);
  }
  not() {
    return this.checker;
  }
  or(checker) {
    return new Or(this, checker);
  }
  and(checker) {
    return group(this, checker);
  }
}

const Word = Phrase;

class SubQueryWordParser {
  constructor(buffer, matchCase) {
    this.buffer = buffer;
    this.matchCase = matchCase;
  }
  parse(char) {
    if (char === ` `) {
      return null;
    }
    return new SubQueryWordParser(
      this.buffer + char,
      this.matchCase
    );
  }
  end() {
    if (this.buffer.length > 0) {
      return new Word(this.buffer, this.matchCase);
    }
  }
}

class SubQueryEitherParser {
  constructor(aChecker, bChecker, matchCase, internalParser = new DefaultSubQueryParser(matchCase)) {
    this.aChecker = aChecker;
    this.bChecker = bChecker;
    this.matchCase = matchCase;
    this.internalParser = internalParser;
  }
  static start(aChecker, matchCase = true) {
    return new SubQueryEitherParser(
      aChecker,
      group(),
      matchCase
    );
  }
  parse(char) {
    const nextParser = this.internalParser.parse(char);
    if (nextParser == null) {
      return new SubQueryEitherParser(
        this.aChecker,
        this.nextChecker(),
        this.matchCase,
        new DefaultSubQueryParser(this.matchCase)
      );
    }
    return new SubQueryEitherParser(
      this.aChecker,
      this.bChecker,
      this.matchCase,
      nextParser
    );
  }
  nextChecker() {
    const next = this.internalParser.end();
    if (next != null) {
      return this.bChecker.and(next);
    }
    return this.bChecker;
  }
  end() {
    return this.aChecker.or(this.nextChecker());
  }
}

class SubQueryGroupParser {
  constructor(internalCheckers, internalParser, matchCase) {
    this.internalCheckers = internalCheckers;
    this.internalParser = internalParser;
    this.matchCase = matchCase;
  }
  static start(matchCase) {
    return new SubQueryGroupParser(
      [],
      new DefaultSubQueryParser(matchCase),
      matchCase
    );
  }
  parse(char) {
    if (char === `)` && !this.containsNestedGroupParser()) {
      return null;
    }
    const nextParser = this.internalParser.parse(char);
    if (nextParser != null) {
      return new SubQueryGroupParser(
        this.internalCheckers,
        nextParser,
        this.matchCase
      );
    } else {
      if (this.internalParser instanceof SubQueryWordParser) {
        switch (this.internalParser.buffer.toLocaleLowerCase()) {
          case "or": {
            return new SubQueryGroupParser(
              [],
              SubQueryEitherParser.start(
                group(this.internalCheckers),
                this.matchCase
              ),
              this.matchCase
            );
          }
          case "and": {
            return new SubQueryGroupParser(
              this.internalCheckers,
              new DefaultSubQueryParser(this.matchCase),
              this.matchCase
            );
          }
        }
      }
      return new SubQueryGroupParser(
        this.endInternalParser(),
        new DefaultSubQueryParser(this.matchCase),
        this.matchCase
      );
    }
  }
  containsNestedGroupParser() {
    return this.internalParser instanceof SubQueryGroupParser || isParentParser(this.internalParser) && this.internalParser.containsNestedGroupParser();
  }
  endInternalParser() {
    const checker = this.internalParser.end();
    if (checker != null) {
      return this.internalCheckers.concat([checker]);
    }
    return this.internalCheckers;
  }
  end() {
    return group(this.endInternalParser());
  }
}

class SubQueryNegatedParser {
  constructor(matchCase, internalParser = new DefaultSubQueryParser(matchCase)) {
    this.matchCase = matchCase;
    this.internalParser = internalParser;
  }
  parse(char) {
    const nextParser = this.internalParser.parse(char);
    if (nextParser == null) {
      return null;
    }
    return new SubQueryNegatedParser(this.matchCase, nextParser);
  }
  containsNestedGroupParser() {
    return this.internalParser instanceof SubQueryGroupParser || isParentParser(this.internalParser) && this.internalParser.containsNestedGroupParser();
  }
  end() {
    const result = this.internalParser.end();
    if (isStringChecker(result)) {
      return not(result);
    }
  }
}

class DefaultSubQueryParser {
  constructor(matchCase) {
    this.matchCase = matchCase;
  }
  parse(char) {
    switch (char) {
      case `-`: {
        return new SubQueryNegatedParser(this.matchCase);
      }
      case `"`: {
        return new SubQueryPhraseParser(this.matchCase);
      }
      case `(`: {
        return SubQueryGroupParser.start(this.matchCase);
      }
      case ` `: {
        return this;
      }
      default: {
        return new SubQueryWordParser(char, this.matchCase);
      }
    }
  }
  end() {
  }
}

class MetadataTagFilter {
  constructor(checker) {
    this.checker = checker;
  }
  appliesTo(metadata) {
    console.log(this, "appliesTo", metadata);
    const tags = metadata?.tags;
    if (tags != null) {
      if (tags.some((tag) => this.checker.matches(`#${tag.tag}`))) {
        return true;
      }
    }
    const frontmatter = metadata?.frontmatter;
    if (frontmatter == null) return false;
    if (this.checkTags(frontmatter.tag)) {
      return true;
    }
    if (this.checkTags(frontmatter.tags)) {
      return true;
    }
    return false;
  }
  checkTags(tags) {
    if (tags == null) {
      return false;
    }
    if (typeof tags === "string") {
      const match = this.checker.matches(tags);
      return match;
    }
    if (Array.isArray(tags)) {
      const match = tags.some((tag) => tag != null && this.checker.matches(tag));
      return match;
    }
  }
}
class FileTagsFilter {
  constructor(tagChecker, metadata) {
    this.metadata = metadata;
    this.metadataFilter = new MetadataTagFilter(tagChecker);
  }
  metadataFilter;
  async appliesTo(file) {
    const cache = this.metadata.getFileCache(file);
    return this.metadataFilter.appliesTo(cache);
  }
  and(filter) {
    return matchAll(this, filter);
  }
  or(filter) {
    return or(this, filter);
  }
}

class OperatorParser {
  constructor(operator, metadata, internalParser, matchCase) {
    this.operator = operator;
    this.metadata = metadata;
    this.internalParser = internalParser;
    this.matchCase = matchCase;
  }
  static start(operator, metadata, matchCase) {
    return new OperatorParser(
      operator,
      metadata,
      new DefaultSubQueryParser(matchCase),
      matchCase
    );
  }
  parse(char) {
    if (this.operator === "tag" && char === "#") return this;
    const nextParser = this.internalParser.parse(char);
    if (nextParser == null) {
      return null;
    }
    return new OperatorParser(
      this.operator,
      this.metadata,
      nextParser,
      this.matchCase
    );
  }
  containsNestedGroupParser() {
    return this.internalParser instanceof SubQueryGroupParser || isParentParser(this.internalParser) && this.internalParser.containsNestedGroupParser();
  }
  end(activeFilter) {
    const checker = this.internalParser.end();
    if (isStringChecker(checker)) {
      switch (this.operator) {
        case "file": {
          return activeFilter.and(new FileNameFilter(checker));
        }
        case "path": {
          return activeFilter.and(new FilePathFilter(checker));
        }
        case "content": {
          return activeFilter.and(new FileContentFilter(checker));
        }
        case "tag": {
          return activeFilter.and(
            new FileTagsFilter(checker, this.metadata)
          );
        }
      }
    }
    return activeFilter;
  }
}

class MetatdataPropertyFilter {
  constructor(property, value) {
    this.property = property;
    this.value = value;
  }
  appliesTo(metadata) {
    const properties = metadata?.frontmatter;
    if (properties == null) return false;
    const keys = Object.keys(properties).filter(
      (key) => this.property.matches(key)
    );
    if (keys.length === 0) return false;
    if (this.value == null) return true;
    return keys.some((key) => {
      if (!Object.hasOwn(properties, key)) {
        return false;
      }
      const value = properties[key]?.toString();
      return this.value.matches(value);
    });
  }
}
class FilePropertyFilter {
  constructor(metadata, property, value) {
    this.metadata = metadata;
    this.metadataFilter = new MetatdataPropertyFilter(property, value);
  }
  metadataFilter;
  async appliesTo(file) {
    const cache = this.metadata.getFileCache(file);
    return this.metadataFilter.appliesTo(cache);
  }
  and(filter) {
    return matchAll(this, filter);
  }
  or(filter) {
    return or(this, filter);
  }
}

function negate(filters) {
  if (Array.isArray(filters)) {
    return negateSingle(matchAll(filters));
  }
  return negateSingle(filters);
}
function negateSingle(filter) {
  if (filter instanceof Negation) return filter.negate();
  return new Negation(filter);
}
class Negation {
  constructor(negated) {
    this.negated = negated;
  }
  async appliesTo(file) {
    return !this.negated.appliesTo(file);
  }
  negate() {
    return this.negated;
  }
  and(filter) {
    return matchAll(this, filter);
  }
  or(filter) {
    return or(this, filter);
  }
}

class EitherPerser {
  constructor(metadata, filterType, matchCase, collectedBFilters = [], internalParser = new DefaultParser(metadata, filterType, matchCase)) {
    this.metadata = metadata;
    this.filterType = filterType;
    this.matchCase = matchCase;
    this.collectedBFilters = collectedBFilters;
    this.internalParser = internalParser;
  }
  static start(metadata, filterType, matchCase) {
    return new EitherPerser(metadata, filterType, matchCase);
  }
  parse(char) {
    const nextParser = this.internalParser.parse(char);
    if (nextParser == null) {
      const filterOrChecker = this.internalParser.end(EmtpyFilter);
      if (isFileFilter(filterOrChecker)) {
        return new EitherPerser(
          this.metadata,
          this.filterType,
          this.matchCase,
          this.collectedBFilters.concat([filterOrChecker])
        );
      }
      return new EitherPerser(
        this.metadata,
        this.filterType,
        this.matchCase
      );
    }
    return new EitherPerser(
      this.metadata,
      this.filterType,
      this.matchCase,
      this.collectedBFilters,
      nextParser
    );
  }
  end(activeFilter) {
    const filterOrChecker = this.internalParser.end(EmtpyFilter);
    if (isFileFilter(filterOrChecker)) {
      return activeFilter.or(matchAll(this.collectedBFilters.concat([filterOrChecker])));
    }
    return activeFilter;
  }
}

class WordParser {
  constructor(subParser, filterType, metadata, matchCase) {
    this.subParser = subParser;
    this.filterType = filterType;
    this.metadata = metadata;
    this.matchCase = matchCase;
  }
  static start(buffer, filterType, metadata, matchCase) {
    return new WordParser(
      new SubQueryWordParser(buffer, matchCase),
      filterType,
      metadata,
      matchCase
    );
  }
  get buffer() {
    return this.subParser.buffer;
  }
  parse(char) {
    if (char === `:`) {
      const buffer = this.subParser.buffer;
      switch (buffer) {
        case `file`:
        case `path`:
        case "content":
        case "tag": {
          return OperatorParser.start(buffer, this.metadata, this.matchCase);
        }
      }
      return new DefaultParser(this.metadata);
    }
    const nextParser = this.subParser.parse(char);
    if (nextParser == null) {
      switch (this.buffer.toLocaleLowerCase()) {
        case "or": {
          return EitherPerser.start(this.metadata, this.filterType, this.matchCase);
        }
        case "and": {
          return new DefaultParser(this.metadata);
        }
      }
      return null;
    }
    return new WordParser(
      nextParser,
      this.filterType,
      this.metadata,
      this.matchCase
    );
  }
  end(activeFilter) {
    const checker = this.subParser.end();
    if (checker != null) {
      return activeFilter.and(this.filterType(checker));
    }
    return activeFilter;
  }
}

class GroupParser {
  constructor(metadata, filterType, internalFilter, internalParser, matchCase) {
    this.metadata = metadata;
    this.filterType = filterType;
    this.internalFilter = internalFilter;
    this.internalParser = internalParser;
    this.matchCase = matchCase;
  }
  static start(metadata, filterType, matchCase) {
    return new GroupParser(
      metadata,
      filterType,
      EmtpyFilter,
      new DefaultParser(metadata, filterType, matchCase),
      matchCase
    );
  }
  parse(char) {
    if (char === `)` && !this.containsNestedGroupParser()) {
      return null;
    }
    const nextParser = this.internalParser.parse(char);
    if (nextParser != null) {
      return new GroupParser(
        this.metadata,
        this.filterType,
        this.internalFilter,
        nextParser,
        this.matchCase
      );
    } else {
      const filter = this.endInternalParser();
      return new GroupParser(
        this.metadata,
        this.filterType,
        filter,
        new DefaultParser(
          this.metadata,
          this.filterType,
          this.matchCase
        ),
        this.matchCase
      );
    }
  }
  containsNestedGroupParser() {
    return this.internalParser instanceof GroupParser || isParentParser(this.internalParser) && this.internalParser.containsNestedGroupParser();
  }
  endInternalParser() {
    const filter = this.internalParser.end(this.internalFilter);
    if (isFileFilter(filter)) {
      return filter;
    }
    return this.internalFilter;
  }
  end(activeFilter) {
    const filter = this.endInternalParser();
    return activeFilter.and(filter);
  }
}

class NegatedParser {
  constructor(metadata, filterType, internalParser, matchCase) {
    this.metadata = metadata;
    this.filterType = filterType;
    this.internalParser = internalParser;
    this.matchCase = matchCase;
  }
  static start(metadata, filterType, matchCase) {
    return new NegatedParser(
      metadata,
      filterType,
      new DefaultParser(metadata, filterType, matchCase),
      matchCase
    );
  }
  parse(char) {
    const nextParser = this.internalParser.parse(char);
    if (nextParser == null) {
      return null;
    }
    return new NegatedParser(
      this.metadata,
      this.filterType,
      nextParser,
      this.matchCase
    );
  }
  containsNestedGroupParser() {
    return this.internalParser instanceof GroupParser || isParentParser(this.internalParser) && this.internalParser.containsNestedGroupParser();
  }
  end(activeFilter) {
    const result = this.internalParser.end(EmtpyFilter);
    if (isFileFilter(result)) {
      return activeFilter.and(negate(result));
    }
    return activeFilter;
  }
}

class PhraseParser {
  constructor(filterType, matchCase = true) {
    this.filterType = filterType;
    this.subParser = new SubQueryPhraseParser(matchCase);
  }
  subParser;
  parse(char) {
    const nextParser = this.subParser.parse(char);
    if (nextParser == null) {
      return null;
    }
    this.subParser = nextParser;
    return this;
  }
  end(activeFilter) {
    const checker = this.subParser.end();
    if (checker != null) {
      return activeFilter.and(this.filterType(checker));
    }
    return activeFilter;
  }
}

function regex(regex2, matchCase = false) {
  if (typeof regex2 === "string" || regex2 instanceof RegExp) {
    return new Regex(new RegExp(regex2));
  }
  return new Regex(new RegExp(regex2.join("")));
}
class Regex {
  regex;
  constructor(regex2, matchCase = false) {
    if (matchCase && regex2.flags.includes("i")) {
      this.regex = new RegExp(regex2, regex2.flags.split("").filter((it) => it !== "i").join(""));
    } else if (!matchCase && !regex2.flags.includes("i")) {
      this.regex = new RegExp(regex2, regex2.flags + "i");
    } else {
      this.regex = regex2;
    }
  }
  matches(test) {
    return this.regex.test(test);
  }
  or(checker) {
    return new Or(this, checker);
  }
  and(checker) {
    return group(this, checker);
  }
}

class SubQueryRegexParser {
  constructor(matchCase = true) {
    this.matchCase = matchCase;
  }
  escaped = false;
  buffer = "";
  parse(char) {
    switch (char) {
      case `\\`: {
        if (!this.escaped) {
          this.escaped = true;
          return this;
        }
      }
      case `/`: {
        if (!this.escaped) {
          return null;
        }
      }
    }
    this.escaped = false;
    this.buffer += char;
    return this;
  }
  end() {
    if (this.buffer.length > 0) {
      return regex(this.buffer, this.matchCase);
    }
  }
}

class RegexParser {
  constructor(filterType, matchCase = true) {
    this.filterType = filterType;
    this.subParser = new SubQueryRegexParser(matchCase);
  }
  subParser;
  parse(char) {
    const nextParser = this.subParser.parse(char);
    if (nextParser == null) {
      return null;
    }
    this.subParser = nextParser;
    return this;
  }
  end(activeFilter) {
    const checker = this.subParser.end();
    if (checker != null) {
      return activeFilter.and(this.filterType(checker));
    }
    return activeFilter;
  }
}

function parseProperty(metadata) {
  return new PropertyNameParser([], metadata);
}
class PropertyNameParser {
  constructor(checkers, metadata, parser = new DefaultSubQueryParser()) {
    this.checkers = checkers;
    this.metadata = metadata;
    this.parser = parser;
  }
  parse(char) {
    if (char === `]`) {
      return null;
    }
    if (char === `:`) {
      return new PropertyValueParser(
        group(this.endInternalParser()),
        this.metadata
      );
    }
    const next = this.parser.parse(char);
    if (next == null) {
      return new PropertyNameParser(
        this.endInternalParser(),
        this.metadata
      );
    }
    return new PropertyNameParser(this.checkers, this.metadata, next);
  }
  endInternalParser() {
    const checker = this.parser.end();
    if (checker != null) {
      return this.checkers.concat([checker]);
    }
    return this.checkers;
  }
  end(activeFilter) {
    return activeFilter.and(
      new FilePropertyFilter(
        this.metadata,
        group(this.endInternalParser())
      )
    );
  }
}
class PropertyValueParser {
  constructor(property, metadata, checkers = [], parser = new DefaultSubQueryParser()) {
    this.property = property;
    this.metadata = metadata;
    this.checkers = checkers;
    this.parser = parser;
  }
  parse(char) {
    if (char === `]`) {
      return null;
    }
    const next = this.parser.parse(char);
    if (next == null) {
      return new PropertyValueParser(
        this.property,
        this.metadata,
        this.endInternalParser(),
        new DefaultSubQueryParser()
      );
    }
    return new PropertyValueParser(
      this.property,
      this.metadata,
      this.checkers,
      next
    );
  }
  endInternalParser() {
    const checker = this.parser.end();
    if (checker != null) {
      return this.checkers.concat([checker]);
    }
    return this.checkers;
  }
  end(activeFilter) {
    return activeFilter.and(
      new FilePropertyFilter(
        this.metadata,
        this.property,
        group(this.endInternalParser())
      )
    );
  }
}

class DefaultParser {
  constructor(metadata, filterType = (checker) => new FileContentFilter(checker), matchCase) {
    this.metadata = metadata;
    this.filterType = filterType;
    this.matchCase = matchCase;
  }
  parse(char) {
    switch (char) {
      case `-`: {
        return NegatedParser.start(this.metadata, this.filterType, this.matchCase);
      }
      case `"`: {
        return new PhraseParser(this.filterType, this.matchCase);
      }
      case `/`: {
        return new RegexParser(this.filterType, this.matchCase);
      }
      case `(`: {
        return GroupParser.start(this.metadata, this.filterType, this.matchCase);
      }
      case `[`: {
        return parseProperty(this.metadata);
      }
      case ` `: {
        return null;
      }
      default: {
        return WordParser.start(char, this.filterType, this.metadata, this.matchCase);
      }
    }
  }
  end(activeFilter) {
    return activeFilter;
  }
}

const EmtpyFilter = {
  async appliesTo(file) {
    return false;
  },
  and(filter) {
    return filter;
  },
  or(filter) {
    return filter;
  }
};
function parse(query, metadata, filter = EmtpyFilter) {
  query = query.trim();
  let parser = new DefaultParser(metadata);
  for (const char of query) {
    const nextParser = parser.parse(char);
    if (nextParser == null) {
      const checker2 = parser.end(filter);
      if (isFileFilter(checker2)) {
        filter = checker2;
      }
      parser = new DefaultParser(metadata);
    } else {
      parser = nextParser;
    }
  }
  const checker = parser.end(filter);
  if (isFileFilter(checker)) {
    return checker;
  }
  return filter;
}
async function* search(query, app) {
  const allFiles = app.vault.getMarkdownFiles();
  const filter = parse(query, app.metadataCache);
  for (const file of allFiles) {
    if (await filter.appliesTo(file)) {
      yield file;
    }
  }
}

const integration_main = Plugin((plugin) => ObsidianFiles(plugin, async (query) => {
  const matches = [];
  for await (const file of search(query, plugin.app)) {
    matches.push(file);
  }
  return matches;
}));

module.exports = integration_main;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzaWRpYW4tc2VhcmNoLmNqcyIsInNvdXJjZXMiOlsiLi4vdGVzdC9pbnRlZ3JhdGlvbi9vYnNpZGlhbi50cyIsIi4uL3Rlc3QvaW50ZWdyYXRpb24vdGVzdHMvdGVzdC5hbmQudHMiLCIuLi90ZXN0L2ludGVncmF0aW9uL3Rlc3RzL3Rlc3QuYmFzaWNzLnRzIiwiLi4vdGVzdC9pbnRlZ3JhdGlvbi90ZXN0cy90ZXN0LmZpbGUudHMiLCIuLi90ZXN0L2ludGVncmF0aW9uL3Rlc3RzL3Rlc3QubmVnYXRpb24udHMiLCIuLi90ZXN0L2ludGVncmF0aW9uL3Rlc3RzL3Rlc3QucHJvcGVydHkudHMiLCIuLi9zcmMvbGliL3N0cmluZ3MudHMiLCIuLi90ZXN0L2ludGVncmF0aW9uL3Rlc3RzL3Rlc3QudGFncy50cyIsIi4uL3Rlc3QvaW50ZWdyYXRpb24vZnJhbWV3b3JrLnRzIiwiLi4vdGVzdC9pbnRlZ3JhdGlvbi90ZXN0cy9pbmRleC50cyIsIi4uL3Rlc3QvaW50ZWdyYXRpb24vY29tbW9uLm1haW4udHMiLCIuLi9zcmMvZmlsdGVycy9GaWxlRmlsdGVyLnRzIiwiLi4vc3JjL2ZpbHRlcnMvT3JGaWx0ZXIudHMiLCIuLi9zcmMvZmlsdGVycy9NYXRjaEFsbEZpbHRlci50cyIsIi4uL3NyYy9maWx0ZXJzL0ZpbGVDb250ZW50RmlsdGVyLnRzIiwiLi4vc3JjL3BhcnNlcnMvUGFyc2VyLnRzIiwiLi4vc3JjL2NoZWNrZXJzL1N0cmluZ0NoZWNrZXIudHMiLCIuLi9zcmMvZmlsdGVycy9GaWxlTmFtZUZpbHRlci50cyIsIi4uL3NyYy9maWx0ZXJzL0ZpbGVQYXRoRmlsdGVyLnRzIiwiLi4vc3JjL2NoZWNrZXJzL09yLnRzIiwiLi4vc3JjL2NoZWNrZXJzL0dyb3VwLnRzIiwiLi4vc3JjL2NoZWNrZXJzL1BocmFzZS50cyIsIi4uL3NyYy9wYXJzZXJzL3N1YnF1ZXJ5L1N1YlF1ZXJ5UGhyYXNlUGFyc2VyLnRzIiwiLi4vc3JjL2NoZWNrZXJzL05vdC50cyIsIi4uL3NyYy9jaGVja2Vycy9Xb3JkLnRzIiwiLi4vc3JjL3BhcnNlcnMvc3VicXVlcnkvU3ViUXVlcnlXb3JkUGFyc2VyLnRzIiwiLi4vc3JjL3BhcnNlcnMvc3VicXVlcnkvU3ViUXVlcnlFaXRoZXJQYXJzZXIudHMiLCIuLi9zcmMvcGFyc2Vycy9zdWJxdWVyeS9TdWJRdWVyeUdyb3VwUGFyc2VyLnRzIiwiLi4vc3JjL3BhcnNlcnMvc3VicXVlcnkvU3ViUXVlcnlOZWdhdGVkUGFyc2VyLnRzIiwiLi4vc3JjL3BhcnNlcnMvc3VicXVlcnkvRGVmYXVsdFN1YlF1ZXJ5UGFyc2VyLnRzIiwiLi4vc3JjL2ZpbHRlcnMvRmlsZVRhZ3NGaWx0ZXIudHMiLCIuLi9zcmMvcGFyc2Vycy9PcGVyYXRvclBhcnNlci50cyIsIi4uL3NyYy9maWx0ZXJzL0ZpbGVQcm9wZXJ0eUZpbHRlci50cyIsIi4uL3NyYy9maWx0ZXJzL05lZ2F0aW9uLnRzIiwiLi4vc3JjL3BhcnNlcnMvRWl0aGVyUGFyc2VyLnRzIiwiLi4vc3JjL3BhcnNlcnMvV29yZFBhcnNlci50cyIsIi4uL3NyYy9wYXJzZXJzL0dyb3VwUGFyc2VyLnRzIiwiLi4vc3JjL3BhcnNlcnMvTmVnYXRlZFBhcnNlci50cyIsIi4uL3NyYy9wYXJzZXJzL1BocmFzZVBhcnNlci50cyIsIi4uL3NyYy9jaGVja2Vycy9SZWdleC50cyIsIi4uL3NyYy9wYXJzZXJzL3N1YnF1ZXJ5L1N1YlF1ZXJ5UmVnZXhQYXJzZXIudHMiLCIuLi9zcmMvcGFyc2Vycy9SZWdleFBhcnNlci50cyIsIi4uL3NyYy9wYXJzZXJzL1Byb3BlcnR5UGFyc2VyLnRzIiwiLi4vc3JjL3BhcnNlcnMvRGVmYXVsdFBhcnNlci50cyIsIi4uL3NyYy9tYWluLnRzIiwiLi4vdGVzdC9pbnRlZ3JhdGlvbi9pbnRlZ3JhdGlvbi5tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIlxuXG5jbGFzcyBTZWFyY2hNYXRjaCB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdHB1YmxpYyByZWFkb25seSBuYW1lOiBzdHJpbmdcblx0KSB7IH1cbn1cblxuZXhwb3J0IGNsYXNzIEZpbGVzPEZpbGU+IHtcblx0Y29uc3RydWN0b3IoXG5cdFx0cHVibGljIGNyZWF0ZUZpbGU6IChuYW1lX3dpdGhfZXh0ZW5zaW9uOiBzdHJpbmcsIGJvZHk/OiBzdHJpbmcsIGZyb250bWF0dGVyPzoge1xuXHRcdFx0dGFncz86IHN0cmluZ1tdLFxuXHRcdFx0YWxpYXNlcz86IHN0cmluZ1tdLFxuXHRcdFx0cHJvcGVydGllcz86IFJlY29yZDxzdHJpbmcsIGFueT4sXG5cdFx0fSkgPT4gUHJvbWlzZTxGaWxlPixcblx0XHRwdWJsaWMgZGVsZXRlRmlsZTogKGZpbGU6IEZpbGUpID0+IFByb21pc2U8dm9pZD4sXG5cdFx0cHVibGljIHNlYXJjaEZvcjogKHF1ZXJ5OiBzdHJpbmcpID0+IFByb21pc2U8QXJyYXk8U2VhcmNoTWF0Y2g+Pixcblx0XHRwdWJsaWMgcmVhZEZpbGU6IChmaWxlOiBGaWxlKSA9PiBQcm9taXNlPHN0cmluZz4sXG5cdCkgeyB9XG5cblx0c3RhdGljIFNlYXJjaE1hdGNoID0gU2VhcmNoTWF0Y2g7XG59XG5cblxuIiwiXG5pbXBvcnQgKiBhcyB0ZXN0aW5nIGZyb20gXCIuLi9mcmFtZXdvcmtcIjtcbmltcG9ydCB0eXBlIHsgRmlsZXMgfSBmcm9tIFwiLi4vb2JzaWRpYW5cIlxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB0ZXN0QW5kPEZpbGU+KHJ1bjogdGVzdGluZy5TdWl0ZSwgb2JzaWRpYW46IEZpbGVzPEZpbGU+KSB7XG5cdHJ1bi50ZXN0KFwiaW1wbGljaXRcIiwgYXN5bmMgdCA9PiB7XG5cdFx0Y29uc3QgZmlsZSA9IGF3YWl0IG9ic2lkaWFuLmNyZWF0ZUZpbGUoXCJ0ZXN0Lm1kXCIsIGBvbmUgdHdvIHRocmVlYCk7XG5cdFx0dC5hZnRlcigoKSA9PiBvYnNpZGlhbi5kZWxldGVGaWxlKGZpbGUpKVxuXG5cdFx0Y29uc3QgZmlsZV93aXRoX29ubHlfb25lID0gYXdhaXQgb2JzaWRpYW4uY3JlYXRlRmlsZShcInRlc3QxLm1kXCIsIFwib25lXCIpO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gb2JzaWRpYW4uZGVsZXRlRmlsZShmaWxlX3dpdGhfb25seV9vbmUpKVxuXG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IG9ic2lkaWFuLnNlYXJjaEZvcihcIm9uZSB0aHJlZVwiKVxuXG5cdFx0aWYgKCFtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0ZXN0Lm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwiJ3Rlc3QubWQnIGhhcyBib3RoICdvbmUnIGFuZCAndGhyZWUnIGluIGl0cyBib2R5LCBidXQgd2FzIG5vdCBpblwiLCBtYXRjaGVzKVxuXHRcdH1cblx0XHRpZiAobWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGVzdDEubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCIndGVzdDEubWQnIG9ubHkgaGFzICdvbmUnIGluIGl0cyBib2R5LCBidXQgd2FzIGluXCIsIG1hdGNoZXMpXG5cdFx0fVxuXHR9KVxufVxuIiwiXG5pbXBvcnQgKiBhcyB0ZXN0aW5nIGZyb20gXCIuLi9mcmFtZXdvcmtcIjtcbmltcG9ydCB7IEZpbGVzIH0gZnJvbSBcIi4uL29ic2lkaWFuXCJcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gdGVzdEJhc2ljczxGaWxlPihcblx0dDogdGVzdGluZy5ULFxuXHRmaWxlczogRmlsZXM8RmlsZT4sXG4pIHtcblxuXHR0LnRlc3QoXCJ3b3JkIGluIGJvZHlcIiwgYXN5bmMgKHQpID0+IHtcblx0XHRjb25zdCBmaWxlX3dpdGhfbWF0Y2ggPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdC5tZFwiLCBcImZvb1wiKTtcblx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUoZmlsZV93aXRoX21hdGNoKSk7XG5cblx0XHRjb25zdCBmaWxlX3dpdGhvdXRfbWF0Y2ggPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdDEubWRcIik7XG5cdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKGZpbGVfd2l0aG91dF9tYXRjaCkpO1xuXG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IGZpbGVzLnNlYXJjaEZvcihcImZvb1wiKVxuXG5cdFx0aWYgKCFtYXRjaGVzLnNvbWUobWF0Y2ggPT4gbWF0Y2gubmFtZSA9PT0gXCJ0ZXN0Lm1kXCIpKSB7XG5cdFx0XHR0LmxvZyhcImV4cGVjdGVkIHRvIGZpbmQgJ3Rlc3QubWQnIGluIG1hdGNoZXNcIiwgbWF0Y2hlcyk7XG5cdFx0XHR0LmZhaWwoKTtcblx0XHR9XG5cdFx0aWYgKG1hdGNoZXMuc29tZShtYXRjaCA9PiBtYXRjaC5uYW1lID09PSBcInRlc3QxLm1kXCIpKSB7XG5cdFx0XHR0LmxvZyhcImV4cGVjdGVkIE5PVCB0byBmaW5kICd0ZXN0MS5tZCcgaW4gbWF0Y2hlc1wiLCBtYXRjaGVzKTtcblx0XHRcdHQuZmFpbCgpO1xuXHRcdH1cblx0fSlcblxuXHR0LnRlc3QoXCJwaHJhc2UgaW4gYm9keVwiLCBhc3luYyAodCkgPT4ge1xuXHRcdGNvbnN0IGZpbGVfd2l0aF9tYXRjaCA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJ0ZXN0Lm1kXCIsIFwiZm9vIGJhclwiKTtcblx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUoZmlsZV93aXRoX21hdGNoKSk7XG5cblx0XHRjb25zdCBmaWxlX3dpdGhvdXRfbWF0Y2ggPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdDEubWRcIiwgXCJmb29cIik7XG5cdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKGZpbGVfd2l0aG91dF9tYXRjaCkpO1xuXG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IGZpbGVzLnNlYXJjaEZvcihgXCJmb28gYmFyXCJgKVxuXG5cdFx0aWYgKCFtYXRjaGVzLnNvbWUobWF0Y2ggPT4gbWF0Y2gubmFtZSA9PT0gXCJ0ZXN0Lm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwiZXhwZWN0ZWQgdG8gZmluZCAndGVzdC5tZCcgaW5cIiwgbWF0Y2hlcylcblx0XHR9XG5cdFx0aWYgKG1hdGNoZXMuc29tZShtYXRjaCA9PiBtYXRjaC5uYW1lID09PSBcInRlc3QxLm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwiZXhwZWN0ZWQgTk9UIHRvIGZpbmQgJ3Rlc3QxLm1kJyBpblwiLCBtYXRjaGVzKVxuXHRcdH1cblx0fSlcbn1cbiIsImltcG9ydCAqIGFzIHRlc3RpbmcgZnJvbSBcIi4uL2ZyYW1ld29ya1wiO1xuaW1wb3J0IHsgRmlsZXMgfSBmcm9tIFwiLi4vb2JzaWRpYW5cIlxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB0ZXN0RmlsZU9wZXJhdG9yPEZpbGU+KFxuXHR0OiB0ZXN0aW5nLlQsXG5cdGZpbGVzOiBGaWxlczxGaWxlPixcbikge1xuXHR0LnRlc3QoXCJkb2VzIG5vdCBtYXRjaCBhZ2FpbnN0IGRpcmVjdG9yeSBwYXRoXCIsIGFzeW5jIHQgPT4ge1xuXHRcdGNvbnN0IG1hdGNoaW5nX2ZpbGUgPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwiZGlyL3Rlc3QubWRcIik7XG5cdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKG1hdGNoaW5nX2ZpbGUpKTtcblxuXHRcdGNvbnN0IGZpbGVfaW5fZGlyID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QvZm9vLm1kXCIpO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlX2luX2RpcikpO1xuXG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IGZpbGVzLnNlYXJjaEZvcihcImZpbGU6dGVzdFwiKVxuXG5cdFx0aWYgKCFtYXRjaGVzLnNvbWUobWF0Y2ggPT4gbWF0Y2gubmFtZSA9PT0gXCJ0ZXN0Lm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwiZGlkIG5vdCBtYXRjaCBmaWxlIG5hbWVcIilcblx0XHR9XG5cdFx0aWYgKG1hdGNoZXMuc29tZShtYXRjaCA9PiBtYXRjaC5uYW1lID09PSBcImZvby5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcInNob3VsZCBub3QgaGF2ZSBtYXRjaGVkIGRpcmVjdG9yeSBuYW1lXCIpXG5cdFx0fVxuXHR9KVxuXG5cdHQudGVzdChcInBhdGg6XCIsIGFzeW5jIHQgPT4ge1xuXHRcdGNvbnN0IG1hdGNoaW5nX2ZpbGUgPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwiZGlyL3Rlc3QubWRcIik7XG5cdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKG1hdGNoaW5nX2ZpbGUpKTtcblxuXHRcdGNvbnN0IGZpbGVfaW5fZGlyID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QvZm9vLm1kXCIpO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlX2luX2RpcikpO1xuXG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IGZpbGVzLnNlYXJjaEZvcihcInBhdGg6dGVzdFwiKVxuXG5cdFx0aWYgKCFtYXRjaGVzLnNvbWUobWF0Y2ggPT4gbWF0Y2gubmFtZSA9PT0gXCJ0ZXN0Lm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwiZGlkIG5vdCBtYXRjaCBmaWxlIG5hbWVcIilcblx0XHR9XG5cdFx0aWYgKCFtYXRjaGVzLnNvbWUobWF0Y2ggPT4gbWF0Y2gubmFtZSA9PT0gXCJmb28ubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJkaWQgbm90IG1hdGNoIGRpcmVjdG9yeSBuYW1lXCIpXG5cdFx0fVxuXHR9KVxufVxuIiwiaW1wb3J0ICogYXMgdGVzdGluZyBmcm9tIFwiLi4vZnJhbWV3b3JrXCJcbmltcG9ydCB0eXBlIHsgRmlsZXMgfSBmcm9tIFwiLi4vb2JzaWRpYW5cIlxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB0ZXN0TmVnYXRpb248RmlsZT4ocnVuOiB0ZXN0aW5nLlQsIG9ic2lkaWFuOiBGaWxlczxGaWxlPikge1xuXHRydW4udGVzdChcIm5vdCB3b3JkXCIsIGFzeW5jIHQgPT4ge1xuXHRcdGNvbnN0IGZpbGUgPSBhd2FpdCBvYnNpZGlhbi5jcmVhdGVGaWxlKFwiaGFzIHdvcmQubWRcIiwgXCJ3b3JkXCIpO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gb2JzaWRpYW4uZGVsZXRlRmlsZShmaWxlKSk7XG5cblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgb2JzaWRpYW4uc2VhcmNoRm9yKGAtd29yZGApXG5cblx0XHRpZiAobWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwiaGFzIHdvcmQubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJmaWxlIHdpdGggd29yZCBzaG91bGQgTk9UIG1hdGNoIGJlY2F1c2UgaXQgd2FzIG5lZ2F0ZWRcIilcblx0XHR9XG5cdH0pXG59XG4iLCJpbXBvcnQgdHlwZSAqIGFzIHRlc3RpbmcgZnJvbSBcIi4uL2ZyYW1ld29ya1wiO1xuaW1wb3J0IHR5cGUgKiBhcyBvYnNpZGlhbiBmcm9tIFwiLi4vb2JzaWRpYW5cIjtcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gdGVzdFByb3BlcnR5PEY+KFxuXHR0OiB0ZXN0aW5nLlQsXG5cdGZpbGVzOiBvYnNpZGlhbi5GaWxlczxGPlxuKSB7XG5cblx0YXdhaXQgdC5zdWl0ZShcIltwcm9wZXJ0eV1cIiwgYXN5bmMgKHQpID0+IHtcblx0XHR0LnRlc3QoXCJbdGFnc11cIiwgYXN5bmMgKHQpID0+IHtcblx0XHRcdGNvbnN0IGZpbGUgPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdC5tZFwiLCBcIlwiLCB7XG5cdFx0XHRcdHRhZ3M6IFtcblx0XHRcdFx0XHRcImZvb1wiXG5cdFx0XHRcdF0sXG5cdFx0XHR9KTtcblx0XHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShmaWxlKSlcblxuXHRcdFx0Y29uc3Qgbm9uX21hdGNoID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QxLm1kXCIpO1xuXHRcdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKG5vbl9tYXRjaCkpXG5cblx0XHRcdGNvbnN0IG1hdGNoZXMgPSBhd2FpdCBmaWxlcy5zZWFyY2hGb3IoXCJbdGFnc11cIik7XG5cblx0XHRcdGlmICghbWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGVzdC5tZFwiKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKFwiZXhwZWN0ZWQgdG8gZmluZCAndGVzdC5tZCcgaW5cIiwgbWF0Y2hlcyk7XG5cdFx0XHR9XG5cdFx0XHRpZiAobWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGVzdDEubWRcIikpIHtcblx0XHRcdFx0dC5mYWlsV2l0aChcImV4cGVjdGVkIE5PVCB0byBmaW5kXCIsIG5vbl9tYXRjaCwgXCJpblwiLCBtYXRjaGVzKTtcblx0XHRcdH1cblx0XHR9KVxuXHRcdHQudGVzdChcIlthbGlhc2VzXVwiLCBhc3luYyAodCkgPT4ge1xuXHRcdFx0Y29uc3QgZmlsZSA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJ0ZXN0Lm1kXCIsIFwiXCIsIHtcblx0XHRcdFx0YWxpYXNlczogW1xuXHRcdFx0XHRcdFwiZm9vXCJcblx0XHRcdFx0XSxcblx0XHRcdH0pO1xuXHRcdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKGZpbGUpKVxuXG5cdFx0XHRjb25zdCBub25fbWF0Y2ggPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdDEubWRcIik7XG5cdFx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUobm9uX21hdGNoKSk7XG5cblx0XHRcdGNvbnN0IG1hdGNoZXMgPSBhd2FpdCBmaWxlcy5zZWFyY2hGb3IoXCJbYWxpYXNlc11cIik7XG5cblx0XHRcdGlmICghbWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGVzdC5tZFwiKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKFwiZXhwZWN0ZWQgdG8gZmluZCAndGVzdC5tZCcgaW5cIiwgbWF0Y2hlcyk7XG5cdFx0XHR9XG5cdFx0XHRpZiAobWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGVzdDEubWRcIikpIHtcblx0XHRcdFx0dC5mYWlsV2l0aChcImV4cGVjdGVkIE5PVCB0byBmaW5kXCIsIG5vbl9tYXRjaCwgXCJpblwiLCBtYXRjaGVzKTtcblx0XHRcdH1cblx0XHR9KVxuXHRcdHQudGVzdChcImFyYml0cmFyeSBwcm9wZXJ0eVwiLCBhc3luYyAodCkgPT4ge1xuXHRcdFx0Y29uc3QgZmlsZSA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJ0ZXN0Lm1kXCIsIFwiXCIsIHtcblx0XHRcdFx0cHJvcGVydGllczoge1xuXHRcdFx0XHRcdFwic29tZS1wcm9wXCI6IDBcblx0XHRcdFx0fSxcblx0XHRcdH0pO1xuXHRcdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKGZpbGUpKVxuXG5cdFx0XHRjb25zdCBub25fbWF0Y2ggPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdDEubWRcIik7XG5cdFx0XHR0LmFmdGVyKCgpID0+IGZpbGVzLmRlbGV0ZUZpbGUobm9uX21hdGNoKSk7XG5cblx0XHRcdHQubG9nKFwidGVzdC5tZDpcIiwgYXdhaXQgZmlsZXMucmVhZEZpbGUoZmlsZSkpXG5cdFx0XHR0LmxvZyhcInRlc3QxLm1kOlwiLCBhd2FpdCBmaWxlcy5yZWFkRmlsZShub25fbWF0Y2gpKVxuXG5cdFx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgZmlsZXMuc2VhcmNoRm9yKFwiW3NvbWUtcHJvcF1cIik7XG5cblx0XHRcdGlmICghbWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGVzdC5tZFwiKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKFwiZXhwZWN0ZWQgdG8gZmluZCAndGVzdC5tZCcgaW5cIiwgbWF0Y2hlcyk7XG5cdFx0XHR9XG5cdFx0XHRpZiAobWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGVzdDEubWRcIikpIHtcblx0XHRcdFx0dC5mYWlsV2l0aChcImV4cGVjdGVkIE5PVCB0byBmaW5kICd0ZXN0MS5tZCcgaW5cIiwgbWF0Y2hlcyk7XG5cdFx0XHR9XG5cdFx0fSlcblx0fSlcblxuXHRhd2FpdCB0LnN1aXRlKFwiW3Byb3BlcnR5OnZhbHVlXVwiLCBhc3luYyAodCkgPT4ge1xuXHRcdHQudGVzdChcIlthbGlhc2VzOk5hbWVdXCIsIGFzeW5jICh0KSA9PiB7XG5cdFx0XHRjb25zdCBmaWxlID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QubWRcIiwgXCJcIiwge1xuXHRcdFx0XHRhbGlhc2VzOiBbXG5cdFx0XHRcdFx0XCJOYW1lXCJcblx0XHRcdFx0XSxcblx0XHRcdH0pO1xuXHRcdFx0dC5hZnRlcigoKSA9PiBmaWxlcy5kZWxldGVGaWxlKGZpbGUpKVxuXG5cdFx0XHRjb25zdCBub25fbWF0Y2ggPSBhd2FpdCBmaWxlcy5jcmVhdGVGaWxlKFwidGVzdDEubWRcIiwgXCJcIiwge1xuXHRcdFx0XHRhbGlhc2VzOiBbXG5cdFx0XHRcdFx0XCJPdGhlclwiXG5cdFx0XHRcdF0sXG5cdFx0XHR9KTtcblx0XHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShub25fbWF0Y2gpKTtcblxuXHRcdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IGZpbGVzLnNlYXJjaEZvcihcIlthbGlhc2VzOk5hbWVdXCIpO1xuXG5cdFx0XHRpZiAoIW1hdGNoZXMuc29tZShpdCA9PiBpdC5uYW1lID09PSBcInRlc3QubWRcIikpIHtcblx0XHRcdFx0dC5mYWlsV2l0aChcImV4cGVjdGVkIHRvIGZpbmQgJ3Rlc3QubWQnIGluXCIsIG1hdGNoZXMpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKG1hdGNoZXMuc29tZShpdCA9PiBpdC5uYW1lID09PSBcInRlc3QxLm1kXCIpKSB7XG5cdFx0XHRcdHQuZmFpbFdpdGgoXCJleHBlY3RlZCBOT1QgdG8gZmluZCAndGVzdDEubWQnIGluXCIsIG1hdGNoZXMpO1xuXHRcdFx0fVxuXHRcdH0pXG5cblx0XHR0LnRlc3QoXCJbYWxpYXNlczp2YWx1ZTEgT1IgdmFsdWUyXVwiLCBhc3luYyB0ID0+IHtcblx0XHRcdGNvbnN0IG1hdGNoMSA9IGF3YWl0IGZpbGVzLmNyZWF0ZUZpbGUoXCJ0ZXN0Lm1kXCIsIFwiXCIsIHtcblx0XHRcdFx0YWxpYXNlczogW1xuXHRcdFx0XHRcdFwidmFsdWUxXCJcblx0XHRcdFx0XVxuXHRcdFx0fSlcblx0XHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShtYXRjaDEpKTtcblxuXHRcdFx0Y29uc3QgbWF0Y2gyID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QxLm1kXCIsIFwiXCIsIHtcblx0XHRcdFx0YWxpYXNlczogW1xuXHRcdFx0XHRcdFwidmFsdWUyXCJcblx0XHRcdFx0XVxuXHRcdFx0fSlcblx0XHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShtYXRjaDIpKTtcblxuXHRcdFx0Y29uc3Qgbm9uX21hdGNoID0gYXdhaXQgZmlsZXMuY3JlYXRlRmlsZShcInRlc3QyLm1kXCIsIFwiXCIsIHtcblx0XHRcdFx0YWxpYXNlczogW1xuXHRcdFx0XHRcdFwidmFsdWUzXCJcblx0XHRcdFx0XVxuXHRcdFx0fSlcblx0XHRcdHQuYWZ0ZXIoKCkgPT4gZmlsZXMuZGVsZXRlRmlsZShub25fbWF0Y2gpKTtcblxuXHRcdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IGZpbGVzLnNlYXJjaEZvcihcIlthbGlhc2VzOnZhbHVlMSBPUiB2YWx1ZTJdXCIpO1xuXG5cdFx0XHRpZiAoIW1hdGNoZXMuc29tZShpdCA9PiBpdC5uYW1lID09PSBcInRlc3QubWRcIikpIHtcblx0XHRcdFx0dC5mYWlsV2l0aChcImV4cGVjdGVkIHRvIGZpbmQgdGVzdC5tZCBpblwiLCBtYXRjaGVzKTtcblx0XHRcdH1cblx0XHRcdGlmICghbWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGVzdDEubWRcIikpIHtcblx0XHRcdFx0dC5mYWlsV2l0aChcImV4cGVjdGVkIHRvIGZpbmQgJ3Rlc3QxLm1kJyBpblwiLCBtYXRjaGVzKTtcblx0XHRcdH1cblx0XHRcdGlmIChtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0ZXN0My5tZFwiKSkge1xuXHRcdFx0XHR0LmZhaWxXaXRoKFwiZXhwZWN0ZWQgTk9UIHRvIGZpbmQgJ3Rlc3QzLm1kJyBpblwiLCBtYXRjaGVzKTtcblx0XHRcdH1cblxuXHRcdH0pXG5cdH0pXG5cbn1cbiIsIlxuZXhwb3J0IGZ1bmN0aW9uIHRyaW1JbmRlbnQoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRjb25zdCBsaW5lcyA9IHN0ci5zcGxpdChcIlxcblwiKVxuXHRjb25zdCBmaXJzdF9pbmRleCA9IGxpbmVzLmZpbmRJbmRleChpdCA9PiBpdC5sZW5ndGggPiAwICYmIGl0ICE9PSBcIlxcblwiKTtcblx0aWYgKGZpcnN0X2luZGV4IDwgMCkge1xuXHRcdHJldHVybiBzdHI7XG5cdH1cblx0Y29uc3QgZmlyc3QgPSBsaW5lc1tmaXJzdF9pbmRleF07XG5cdGNvbnN0IHdoaXRlc3BhY2UgPSBmaXJzdC5sZW5ndGggLSBmaXJzdC50cmltU3RhcnQoKS5sZW5ndGhcblx0cmV0dXJuIGxpbmVzLnNsaWNlKGZpcnN0X2luZGV4KS5tYXAoaXQgPT4gaXQuc3Vic3RyaW5nKHdoaXRlc3BhY2UpKS5qb2luKFwiXFxuXCIpO1xufVxuIiwiXG5pbXBvcnQgeyB0cmltSW5kZW50IH0gZnJvbSBcIi4uLy4uLy4uL3NyYy9saWIvc3RyaW5nc1wiO1xuaW1wb3J0ICogYXMgdGVzdGluZyBmcm9tIFwiLi4vZnJhbWV3b3JrXCI7XG5pbXBvcnQgdHlwZSB7IEZpbGVzIH0gZnJvbSBcIi4uL29ic2lkaWFuXCJcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gdGVzdFRhZ3M8RmlsZT4ocnVuOiB0ZXN0aW5nLlQsIG9ic2lkaWFuOiBGaWxlczxGaWxlPikge1xuXHRydW4udGVzdChcInRhZ3MgaW4gYm9keVwiLCBhc3luYyAodCkgPT4ge1xuXHRcdGNvbnN0IHRhZ2dlZCA9IGF3YWl0IG9ic2lkaWFuLmNyZWF0ZUZpbGUoXCJ0YWdnZWQubWRcIiwgXCIjbWVldGluZ1wiKTtcblx0XHR0LmFmdGVyKCgpID0+IG9ic2lkaWFuLmRlbGV0ZUZpbGUodGFnZ2VkKSk7XG5cblx0XHRjb25zdCBtYXRjaGVzID0gYXdhaXQgb2JzaWRpYW4uc2VhcmNoRm9yKFwidGFnOiNtZWV0aW5nXCIpO1xuXG5cdFx0aWYgKCFtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0YWdnZWQubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJ0YWdnZWQubWQgaGFzIHRhZyAnI21lZXRpbmcnIGluIGJvZHksIGJ1dCBpdCB3YXMgbm90IGZvdW5kIGluXCIsIG1hdGNoZXMpXG5cdFx0fVxuXHR9KVxuXG5cdHJ1bi50ZXN0KFwicHJlZml4ZWQgdGFncyBpbiBmcm9udG1hdHRlclwiLCBhc3luYyAodCkgPT4ge1xuXHRcdGNvbnN0IHRhZ2dlZCA9IGF3YWl0IG9ic2lkaWFuLmNyZWF0ZUZpbGUoXCJ0YWdnZWQubWRcIiwgXCJcIiwge1xuXHRcdFx0dGFnczogW1wiI21lZXRpbmdcIl1cblx0XHR9KTtcblx0XHR0LmFmdGVyKCgpID0+IG9ic2lkaWFuLmRlbGV0ZUZpbGUodGFnZ2VkKSk7XG5cdFx0Y29uc3QgY29udGVudCA9IGF3YWl0IG9ic2lkaWFuLnJlYWRGaWxlKHRhZ2dlZCk7XG5cdFx0dC5sb2coXCJ0YWdnZWQubWRcIixjb250ZW50KVxuXG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IG9ic2lkaWFuLnNlYXJjaEZvcihcInRhZzojbWVldGluZ1wiKTtcblxuXHRcdGlmIChtYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0YWdnZWQubWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJ0YWdzIG9mIGEgZmlsZSBkbyBub3QgaGF2ZSBoYXNoZXMgYXQgdGhlIHN0YXJ0LCBzbyB0aGUgZm9sbG93aW5nIHNob3VsZCBOT1QgbWF0Y2hcIiwgbWF0Y2hlcylcblx0XHR9XG5cdH0pXG5cblx0cnVuLnRlc3QoXCJyYXcgdGFnIGluIGZyb250bWF0dGVyXCIsIGFzeW5jICh0KSA9PiB7XG5cdFx0Y29uc3QgdGFnZ2VkID0gYXdhaXQgb2JzaWRpYW4uY3JlYXRlRmlsZShcInRhZ2dlZC5tZFwiLCBcIlwiLCB7XG5cdFx0XHR0YWdzOiBbXCJtZWV0aW5nXCJdXG5cdFx0fSk7XG5cdFx0dC5hZnRlcigoKSA9PiBvYnNpZGlhbi5kZWxldGVGaWxlKHRhZ2dlZCkpO1xuXG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGF3YWl0IG9ic2lkaWFuLnNlYXJjaEZvcihcInRhZzojbWVldGluZ1wiKTtcblxuXHRcdGlmICghbWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGFnZ2VkLm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwidGFnZ2VkLm1kIGhhcyB0YWcgJ21lZXRpbmcnIGluIGZyb250bWF0dGVyLCBidXQgaXQgd2FzIG5vdCBmb3VuZCBpblwiLCBtYXRjaGVzKVxuXHRcdH1cblx0fSlcblxuXHRydW4udGVzdChcIm5vIGhhc2ggYWZ0ZXIgdGFnIG9wZXJhdG9yXCIsIGFzeW5jIHQgPT4ge1xuXHRcdGNvbnN0IHRhZ2dlZCA9IGF3YWl0IG9ic2lkaWFuLmNyZWF0ZUZpbGUoXCJ0YWdnZWQubWRcIiwgXCJcIiwgeyB0YWdzOiBbXCJtZWV0aW5nXCJdIH0pO1xuXHRcdHQuYWZ0ZXIoKCkgPT4gb2JzaWRpYW4uZGVsZXRlRmlsZSh0YWdnZWQpKTtcblxuXHRcdGNvbnN0IG1hdGNoZXMgPSBhd2FpdCBvYnNpZGlhbi5zZWFyY2hGb3IoXCJ0YWc6bWVldGluZ1wiKTtcblxuXHRcdGlmICghbWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGFnZ2VkLm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwidGFnZ2VkLm1kIGhhcyB0YWcgJ21lZXRpbmcnIGluIGZyb250bWF0dGVyLCBidXQgaXQgd2FzIG5vdCBmb3VuZCBpblwiLCBtYXRjaGVzKVxuXHRcdH1cblx0fSlcblxuXHRydW4udGVzdChcInRhZyBpbiBjb2RlYmxvY2tcIiwgYXN5bmMgKHQpID0+IHtcblx0XHRjb25zdCBmaWxlID0gYXdhaXQgb2JzaWRpYW4uY3JlYXRlRmlsZShcInRhZ2dlZCBpbiBjb2RlYmxvY2subWRcIiwgdHJpbUluZGVudChgXG5cdFx0XHRcXGBcXGBcXGBcblx0XHRcdCNtZWV0aW5nXG5cdFx0XHRcXGBcXGBcXGBcblx0XHRgKSk7XG5cdFx0dC5hZnRlcigoKSA9PiBvYnNpZGlhbi5kZWxldGVGaWxlKGZpbGUpKVxuXG5cdFx0Y29uc3QgcmF3X21hdGNoZXMgPSBhd2FpdCBvYnNpZGlhbi5zZWFyY2hGb3IoXCIjbWVldGluZ1wiKTtcblx0XHRjb25zdCB0YWdfbWF0Y2hlcyA9IGF3YWl0IG9ic2lkaWFuLnNlYXJjaEZvcihcInRhZzojbWVldGluZ1wiKTtcblx0XHRjb25zdCBub19oYXNoID0gYXdhaXQgb2JzaWRpYW4uc2VhcmNoRm9yKFwidGFnOm1lZXRpbmdcIik7XG5cblx0XHRpZiAoIXJhd19tYXRjaGVzLnNvbWUoaXQgPT4gaXQubmFtZSA9PT0gXCJ0YWdnZWQgaW4gY29kZWJsb2NrLm1kXCIpKSB7XG5cdFx0XHR0LmZhaWxXaXRoKFwicmF3IHNlYXJjaCBmb3IgJyNtZWV0aW5nJyBkaWQgbm90IGZpbmQgZmlsZSB3aXRoICcjbWVldGluZycgaW4gY29kZWJsb2NrXCIpXG5cdFx0fVxuXHRcdGlmICh0YWdfbWF0Y2hlcy5zb21lKGl0ID0+IGl0Lm5hbWUgPT09IFwidGFnZ2VkIGluIGNvZGVibG9jay5tZFwiKSkge1xuXHRcdFx0dC5mYWlsV2l0aChcInRhZyBzZWFyY2ggZm9yICcjbWVldGluZycgaW5jb3JyZWN0bHkgbWF0Y2hlZCBmaWxlIHdpdGggJyNtZWV0aW5nJyBpbiBjb2RlYmxvY2tcIilcblx0XHR9XG5cdFx0aWYgKG5vX2hhc2guc29tZShpdCA9PiBpdC5uYW1lID09PSBcInRhZ2dlZCBpbiBjb2RlYmxvY2subWRcIikpIHtcblx0XHRcdHQuZmFpbFdpdGgoXCJ0YWcgc2VhcmNoIGZvciAnI21lZXRpbmcnIGluY29ycmVjdGx5IG1hdGNoZWQgZmlsZSB3aXRoICcjbWVldGluZycgaW4gY29kZWJsb2NrXCIpXG5cdFx0fVxuXHR9KVxufVxuIiwiY29uc3QgRkFJTF9OT1cgPSBTeW1ib2woKTtcblxuZXhwb3J0IHR5cGUgTG9nZ2VyID0gUGljazxDb25zb2xlLCBcImVycm9yXCIgfCBcIndhcm5cIiB8IFwibG9nXCI+O1xuXG5leHBvcnQgY2xhc3MgU3VpdGUge1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRwdWJsaWMgbG9nZ2VyOiBQaWNrPENvbnNvbGUsIFwiZXJyb3JcIiB8IFwid2FyblwiIHwgXCJsb2dcIj4sXG5cdFx0cHVibGljIHBhcmVudDogU3VpdGUgfCBudWxsID0gbnVsbCxcblx0KSB7IH1cblxuXHQjdGVzdHM6IEFycmF5PHsgdGVzdDogVGVzdCwgZm46ICh0OiBUZXN0KSA9PiAodm9pZCB8IFByb21pc2U8dm9pZD4pIH0+ID0gW107XG5cblx0dGVzdChuYW1lOiBzdHJpbmcsIGZuOiAodDogVGVzdCkgPT4gdm9pZCB8IFByb21pc2U8dm9pZD4pIHtcblx0XHRpZiAodGhpcy4jcmFuKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKFwiYWxyZWFkeSByYW4gdGVzdCBzdWl0ZSwgYnV0IHRyeWluZyB0byBhZGRcIiwgbmFtZSwgXCJ0ZXN0XCIpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRjb25zdCBuZXN0ZWQgPSBuZXcgVGVzdChuYW1lLCB0aGlzKTtcblx0XHR0aGlzLiN0ZXN0cy5wdXNoKHsgdGVzdDogbmVzdGVkLCBmbiB9KTtcblx0fVxuXG5cdGFzeW5jIHN1aXRlKG5hbWU6IHN0cmluZywgZm46IChzOiBTdWl0ZSkgPT4gUHJvbWlzZTx2b2lkPikge1xuXHRcdGlmICh0aGlzLiNyYW4pIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oXCJhbHJlYWR5IHJhbiB0ZXN0IHN1aXRlLCBidXQgdHJ5aW5nIHRvIGFkZFwiLCBuYW1lLCBcInN1aXRlXCIpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRjb25zdCBlcnIgPSBuZXcgRXJyb3IoKTtcblx0XHRjb25zdCBuZXN0ZWQgPSBuZXcgU3VpdGUoe1xuXHRcdFx0bG9nOiAoLi4uZGF0YSkgPT4gdGhpcy5sb2dnZXIubG9nKFwiICAgXCIsIC4uLmRhdGEpLFxuXHRcdFx0d2FybjogKC4uLmRhdGEpID0+IHRoaXMubG9nZ2VyLndhcm4oXCIgICBcIiwgLi4uZGF0YSksXG5cdFx0XHRlcnJvcjogKC4uLmRhdGEpID0+IHRoaXMubG9nZ2VyLmVycm9yKFwiICAgXCIsIC4uLmRhdGEpLFxuXHRcdH0sIHRoaXMpO1xuXG5cdFx0dGhpcy5sb2dnZXIubG9nKFwiVEVTVFwiLCBuYW1lKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCBmbihuZXN0ZWQpO1xuXHRcdH0gY2F0Y2ggKGNhdXNlKSB7XG5cdFx0XHRlcnIuY2F1c2UgPSBjYXVzZTtcblx0XHRcdHRoaXMubG9nZ2VyLmVycm9yKFwiRmFpbGVkIHRvIGluaXQgc3VpdGVcIiwgZXJyKTtcblx0XHR9XG5cblx0XHRhd2FpdCBuZXN0ZWQucnVuKCk7XG5cblx0XHRpZiAobmVzdGVkLmZhaWxlZCgpKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5sb2coXCJGQUlMXCIsIG5hbWUpO1xuXHRcdFx0dGhpcy5mYWlsKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMubG9nZ2VyLmxvZyhcIlBBU1NcIiwgbmFtZSk7XG5cdFx0fVxuXHR9XG5cblx0I3JhbiA9IGZhbHNlO1xuXHRhc3luYyBydW4odGhpczogU3VpdGUpIHtcblx0XHR0aGlzLiNyYW4gPSB0cnVlO1xuXHRcdGZvciAoY29uc3QgeyB0ZXN0LCBmbiB9IG9mIHRoaXMuI3Rlc3RzKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci5sb2coXCJURVNUXCIsIHRlc3QubmFtZSk7XG5cblx0XHRcdGNvbnN0IHsgbG9nIH0gPSBjb25zb2xlO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyA9ICguLi5hcmdzKSA9PiBUZXN0LmFkZExvZyh0ZXN0LCAuLi5hcmdzKTtcblx0XHRcdFx0YXdhaXQgZm4odGVzdCk7XG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0dGVzdC5mYWlsKCk7XG5cdFx0XHRcdGlmIChlcnIgIT09IEZBSUxfTk9XKSB7XG5cdFx0XHRcdFx0VGVzdC5hZGRMb2codGVzdCwgZXJyKVxuXHRcdFx0XHR9XG5cdFx0XHR9IGZpbmFsbHkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyA9IGxvZztcblx0XHRcdFx0bGV0IGZhaWxlZF9kdXJpbmdfdGVzdCA9IHRlc3QuZmFpbGVkKCk7XG5cdFx0XHRcdGlmIChmYWlsZWRfZHVyaW5nX3Rlc3QpIHtcblx0XHRcdFx0XHR0aGlzLmxvZ2dlci5sb2coXCJGQUlMXCIsIHRlc3QubmFtZSlcblx0XHRcdFx0XHRmb3IgKGNvbnN0IHsgbG9jYXRpb24sIGFyZ3MgfSBvZiB0ZXN0LmxvZ3MoKSkge1xuXHRcdFx0XHRcdFx0dGhpcy5sb2dnZXIubG9nKGxvY2F0aW9uLCAuLi5hcmdzKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhpcy5sb2dnZXIubG9nKFwiUEFTU1wiLCB0ZXN0Lm5hbWUpXG5cdFx0XHRcdH1cblx0XHRcdFx0dGVzdC5jbGVhbnVwKClcblx0XHRcdFx0dGhpcy4jY2xlYW51cFRlc3QodGVzdClcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKGNvbnN0IGNsZWFudXAgb2YgdGhpcy4jYWZ0ZXJfYWxsX2Zucykge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0YXdhaXQgY2xlYW51cCh0aGlzKTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHR0aGlzLmZhaWwoKTtcblx0XHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IoXCJTdWl0ZSBmYWlsZWQgZHVyaW5nIGNsZWFudXBcIiwgZXJyKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQjYWZ0ZXJfYWxsX2ZuczogQXJyYXk8KHM6IFN1aXRlKSA9PiBhbnk+ID0gW107XG5cdGFmdGVyQWxsPFI+KHRoaXM6IFN1aXRlLCBmbjogKHM6IFN1aXRlKSA9PiBSIHwgUHJvbWlzZTxSPikge1xuXHRcdHRoaXMuI2FmdGVyX2FsbF9mbnMucHVzaChmbik7XG5cdH1cblxuXHQvKiogYWxpYXMgZm9yIGFmdGVyQWxsICovXG5cdGFmdGVyPFI+KHRoaXM6IFN1aXRlLCBmbjogKHM6IFN1aXRlKSA9PiBSIHwgUHJvbWlzZTxSPikge1xuXHRcdHRoaXMuYWZ0ZXJBbGwoZm4pO1xuXHR9XG5cblx0I2FmdGVyX2VhY2hfZm5zOiBBcnJheTwodDogVGVzdCkgPT4gYW55PiA9IFtdO1xuXHRhZnRlckVhY2g8Uj4odGhpczogU3VpdGUsIGZuOiAodDogVGVzdCkgPT4gUiB8IFByb21pc2U8Uj4pIHtcblx0XHR0aGlzLiNhZnRlcl9lYWNoX2Zucy5wdXNoKGZuKTtcblx0fVxuXG5cdGFzeW5jICNjbGVhbnVwVGVzdCh0aGlzOiBTdWl0ZSwgdGVzdDogVGVzdCkge1xuXHRcdGZvciAoY29uc3QgY2xlYW51cCBvZiB0aGlzLiNhZnRlcl9lYWNoX2Zucykge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0YXdhaXQgY2xlYW51cCh0ZXN0KTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHR0ZXN0LmZhaWwoKTtcblx0XHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IodGVzdC5uYW1lLCBcImZhaWxlZCBkdXJpbmcgY2xlYW51cFwiLCBlcnIpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAodGhpcy5wYXJlbnQgIT09IG51bGwpIHtcblx0XHRcdHRoaXMucGFyZW50LiNjbGVhbnVwVGVzdCh0ZXN0KTtcblx0XHR9XG5cdH1cblxuXHQjZmFpbGVkID0gZmFsc2U7XG5cdGZhaWwodGhpczogU3VpdGUpIHtcblx0XHR0aGlzLiNmYWlsZWQgPSB0cnVlO1xuXHRcdHRoaXMucGFyZW50Py5mYWlsKCk7XG5cdH1cblxuXHRmYWlsZWQodGhpczogU3VpdGUpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy4jZmFpbGVkO1xuXHR9XG5cbn1cblxuZXhwb3J0IHsgU3VpdGUgYXMgVCB9XG5cbmNsYXNzIFRlc3Qge1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRwdWJsaWMgbmFtZTogc3RyaW5nLFxuXHRcdHB1YmxpYyBwYXJlbnQ6IFN1aXRlLFxuXHQpIHsgfVxuXG5cdGdldCBsb2dnZXIoKSB7XG5cdFx0cmV0dXJuIHRoaXMucGFyZW50LmxvZ2dlclxuXHR9XG5cblx0I2FmdGVyX2ZuczogQXJyYXk8KHQ6IFRlc3QpID0+IGFueT4gPSBbXTtcblx0YWZ0ZXI8Uj4odGhpczogVGVzdCwgZm46ICh0OiBUZXN0KSA9PiBSIHwgUHJvbWlzZTxSPikge1xuXHRcdHRoaXMuI2FmdGVyX2Zucy5wdXNoKGZuKTtcblx0fVxuXG5cdGFzeW5jIGNsZWFudXAodGhpczogVGVzdCkge1xuXHRcdGZvciAoY29uc3QgY2xlYW51cCBvZiB0aGlzLiNhZnRlcl9mbnMpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IGNsZWFudXAodGhpcyk7XG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0dGhpcy5mYWlsKCk7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmVycm9yKHRoaXMubmFtZSwgXCJmYWlsZWQgZHVyaW5nIGNsZWFudXBcIiwgZXJyKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQjZmFpbGVkID0gZmFsc2U7XG5cdGZhaWwodGhpczogVGVzdCkge1xuXHRcdHRoaXMuI2ZhaWxlZCA9IHRydWU7XG5cdFx0dGhpcy5wYXJlbnQuZmFpbCgpO1xuXHR9XG5cdGZhaWxlZCh0aGlzOiBUZXN0KTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuI2ZhaWxlZDtcblx0fVxuXHQvKiogZXF1aXZlbGFudCB0byBjYWxsaW5nIGBsb2coLi4uYXJncylgIGFuZCB0aGVuIGBmYWlsKClgICovXG5cdGZhaWxXaXRoKHRoaXM6IFRlc3QsIC4uLmFyZ3M6IGFueVtdKSB7XG5cdFx0Y29uc3QgbG9jYXRpb24gPSBuZXcgRXJyb3IoKS5zdGFjayEuc3BsaXQoXCJcXG5cIilbMl07XG5cdFx0dGhpcy4jbG9ncy5wdXNoKHsgbG9jYXRpb24sIGFyZ3MgfSk7XG5cdFx0dGhpcy5mYWlsKCk7XG5cdH1cblxuXHRmYWlsTm93KHRoaXM6IFRlc3QpOiBuZXZlciB7XG5cdFx0dGhpcy5mYWlsKCk7XG5cdFx0dGhyb3cgRkFJTF9OT1c7XG5cdH1cblxuXHQjbG9nczogQXJyYXk8eyBsb2NhdGlvbjogc3RyaW5nLCBhcmdzOiBhbnlbXSB9PiA9IFtdO1xuXHRsb2codGhpczogVGVzdCwgLi4uYXJnczogYW55W10pIHtcblx0XHRjb25zdCBsb2NhdGlvbiA9IG5ldyBFcnJvcigpLnN0YWNrIS5zcGxpdChcIlxcblwiKVsyXTtcblx0XHR0aGlzLiNsb2dzLnB1c2goeyBsb2NhdGlvbiwgYXJncyB9KTtcblx0fVxuXHRzdGF0aWMgYWRkTG9nKHRoaXM6IHR5cGVvZiBUZXN0LCB0ZXN0OiBUZXN0LCAuLi5hcmdzOiBhbnlbXSkge1xuXHRcdHRlc3QuI2xvZ3MucHVzaCh7IGxvY2F0aW9uOiBcIlwiLCBhcmdzIH0pXG5cdH1cblx0bG9ncyh0aGlzOiBUZXN0KTogUmVhZG9ubHlBcnJheTx7IGxvY2F0aW9uOiBzdHJpbmcsIGFyZ3M6IGFueVtdIH0+IHtcblx0XHRyZXR1cm4gdGhpcy4jbG9ncztcblx0fVxufVxuIiwiaW1wb3J0ICogYXMgdGVzdGluZyBmcm9tIFwiLi4vZnJhbWV3b3JrXCJcbmltcG9ydCAqIGFzIG9ic2lkaWFuIGZyb20gXCIuLi9vYnNpZGlhblwiXG5cblxuY29uc3QgdGVzdHMgPSBpbXBvcnQubWV0YS5nbG9iPHRydWUsIHN0cmluZywgKHQ6IHRlc3RpbmcuU3VpdGUsIGZpbGVzOiBvYnNpZGlhbi5GaWxlczxhbnk+KSA9PiBQcm9taXNlPHZvaWQ+PihcIi4vdGVzdC4qLnRzXCIsIHsgZWFnZXI6IHRydWUsIGltcG9ydDogXCJkZWZhdWx0XCIgfSlcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1blRlc3RzPEZpbGU+KGxvZ2dlcjogdGVzdGluZy5Mb2dnZXIsIGZpbGVzOiBvYnNpZGlhbi5GaWxlczxGaWxlPikge1xuXHRjb25zdCB0ZXN0ZXIgPSBuZXcgdGVzdGluZy5TdWl0ZShsb2dnZXIpO1xuXG5cdGZvciAoY29uc3QgW2ZpbGVuYW1lLCBmbl0gb2YgT2JqZWN0LmVudHJpZXModGVzdHMpKSB7XG5cdFx0YXdhaXQgdGVzdGVyLnN1aXRlKGZpbGVuYW1lLCBydW4gPT4gZm4ocnVuLCBmaWxlcykpO1xuXHR9XG5cbn1cbiIsImltcG9ydCAqIGFzIG9ic2lkaWFuIGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IG5ldCBmcm9tIFwibmV0XCI7XG5cbmltcG9ydCB7IEZpbGVzIH0gZnJvbSBcIi4vb2JzaWRpYW5cIjtcbmltcG9ydCAqIGFzIHRlc3RzIGZyb20gXCIuL3Rlc3RzL2luZGV4XCJcbmltcG9ydCB7IGluc3BlY3QgfSBmcm9tIFwidXRpbFwiO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gXCJwYXRoXCI7XG5cbmRlY2xhcmUgY29uc3QgX19URVNUX1JVTk5FUl9QT1JUX186IG51bWJlcjtcblxuZXhwb3J0IGZ1bmN0aW9uIE9ic2lkaWFuRmlsZXMocGx1Z2luOiBvYnNpZGlhbi5QbHVnaW4sIHNlYXJjaDogKHF1ZXJ5OiBzdHJpbmcpID0+IFByb21pc2U8dHlwZW9mIEZpbGVzLlNlYXJjaE1hdGNoLnByb3RvdHlwZVtdPikge1xuXHRyZXR1cm4gbmV3IEZpbGVzPG9ic2lkaWFuLlRGaWxlPihcblx0XHRhc3luYyAobmFtZSwgYm9keSA9IFwiXCIsIGZyb250bWF0dGVyKSA9PiB7XG5cdFx0XHRpZiAoZnJvbnRtYXR0ZXIpIHtcblx0XHRcdFx0bGV0IHByZWZpeCA9IFwiLS0tXFxuXCI7XG5cdFx0XHRcdGlmIChmcm9udG1hdHRlci50YWdzKSB7XG5cdFx0XHRcdFx0cHJlZml4ICs9IFwidGFnczpcXG5cIlxuXHRcdFx0XHRcdGZyb250bWF0dGVyLnRhZ3MuZm9yRWFjaCh0YWcgPT4gcHJlZml4ICs9IFwiICAtIFwiICsgdGFnICsgXCJcXG5cIilcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZnJvbnRtYXR0ZXIuYWxpYXNlcykge1xuXHRcdFx0XHRcdHByZWZpeCArPSBcImFsaWFzZXM6XFxuXCJcblx0XHRcdFx0XHRmcm9udG1hdHRlci5hbGlhc2VzLmZvckVhY2goYWxpYXMgPT4gcHJlZml4ICs9IGAgIC0gJHthbGlhc31cXG5gKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChmcm9udG1hdHRlci5wcm9wZXJ0aWVzKSB7XG5cdFx0XHRcdFx0Zm9yIChjb25zdCBbcHJvcCwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGZyb250bWF0dGVyLnByb3BlcnRpZXMpKSB7XG5cdFx0XHRcdFx0XHRwcmVmaXggKz0gYCR7cHJvcH06ICR7dmFsdWV9XFxuYFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRwcmVmaXggKz0gXCItLS1cXG5cIjtcblx0XHRcdFx0Ym9keSA9IHByZWZpeCArIGJvZHk7XG5cdFx0XHR9XG5cdFx0XHRjb25zdCBwYXRoX3BhcnRzID0gbmFtZS5zcGxpdChcIi9cIik7XG5cdFx0XHRpZiAocGF0aF9wYXJ0cy5sZW5ndGggPiAxKSB7XG5cdFx0XHRcdGNvbnN0IGZvbGRlcl9wYXRoID0gam9pbiguLi5wYXRoX3BhcnRzLnNsaWNlKDAsIC0xKSk7XG5cdFx0XHRcdGlmICghcGx1Z2luLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgoZm9sZGVyX3BhdGgpKSB7XG5cdFx0XHRcdFx0YXdhaXQgcGx1Z2luLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIoZm9sZGVyX3BhdGgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRjb25zdCBmaWxlID0gYXdhaXQgcGx1Z2luLmFwcC52YXVsdC5jcmVhdGUobmFtZSwgYm9keSk7XG5cdFx0XHRpZiAocGx1Z2luLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKSA9PSBudWxsKSB7XG5cdFx0XHRcdHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcblx0XHRcdFx0XHRjb25zdCByZWYgPSBwbHVnaW4uYXBwLm1ldGFkYXRhQ2FjaGUub24oXCJyZXNvbHZlZFwiLCAoKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAocGx1Z2luLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShmaWxlKSAhPSBudWxsKSB7XG5cdFx0XHRcdFx0XHRcdHBsdWdpbi5hcHAubWV0YWRhdGFDYWNoZS5vZmZyZWYocmVmKTtcblx0XHRcdFx0XHRcdFx0cmVzb2x2ZShmaWxlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSlcblx0XHRcdH1cblx0XHRcdHJldHVybiBmaWxlO1xuXHRcdH0sXG5cdFx0YXN5bmMgKGZpbGUpID0+IHtcblx0XHRcdGF3YWl0IHBsdWdpbi5hcHAudmF1bHQuZGVsZXRlKGZpbGUsIHRydWUpXG5cdFx0XHRjb25zdCBwYXRoX3BhcnRzID0gZmlsZS5uYW1lLnNwbGl0KFwiL1wiKVxuXHRcdFx0aWYgKHBhdGhfcGFydHMubGVuZ3RoID4gMSkge1xuXHRcdFx0XHRjb25zdCBmb2xkZXJfcGF0aCA9IGpvaW4oLi4ucGF0aF9wYXJ0cy5zbGljZSgwLCAtMSkpXG5cdFx0XHRcdGNvbnN0IGZvbGRlciA9IHBsdWdpbi5hcHAudmF1bHQuZ2V0Rm9sZGVyQnlQYXRoKGZvbGRlcl9wYXRoKTtcblx0XHRcdFx0aWYgKCFmb2xkZXIpIHJldHVybjtcblx0XHRcdFx0aWYgKGZvbGRlci5jaGlsZHJlbi5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRhd2FpdCBwbHVnaW4uYXBwLnZhdWx0LmRlbGV0ZShmb2xkZXIsIHRydWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRzZWFyY2gsXG5cdFx0YXN5bmMgKGZpbGUpID0+IHtcblx0XHRcdHJldHVybiBwbHVnaW4uYXBwLnZhdWx0LmNhY2hlZFJlYWQoZmlsZSlcblx0XHR9LFxuXHQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gUGx1Z2luPEZpbGU+KG1ha2VfZmlsZXM6IChwbHVnaW46IG9ic2lkaWFuLlBsdWdpbikgPT4gRmlsZXM8RmlsZT4pOiB0eXBlb2Ygb2JzaWRpYW4uUGx1Z2luIHtcblx0cmV0dXJuIGNsYXNzIGV4dGVuZHMgb2JzaWRpYW4uUGx1Z2luIHtcblx0XHRzb2NrZXQ6IG5ldC5Tb2NrZXQgfCBudWxsID0gbnVsbDtcblxuXHRcdHNlbmRNZXNzYWdlKGRhdGE6IGFueVtdKSB7XG5cdFx0XHRsZXQgYnVmZmVyOiBBcnJheTxzdHJpbmc+ID0gW107XG5cdFx0XHRmb3IgKGNvbnN0IGVudHJ5IG9mIGRhdGEpIHtcblx0XHRcdFx0aWYgKHR5cGVvZiBlbnRyeSA9PT0gXCJzdHJpbmdcIikge1xuXHRcdFx0XHRcdGJ1ZmZlci5wdXNoKGVudHJ5KVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGJ1ZmZlci5wdXNoKGluc3BlY3QoZW50cnksIHVuZGVmaW5lZCwgNCwgdHJ1ZSkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHR0aGlzLnNvY2tldD8ud3JpdGUoYnVmZmVyLmpvaW4oXCIgXCIpICsgXCJcXDBcIilcblx0XHR9XG5cblx0XHRvbmxvYWQoKTogdm9pZCB7XG5cdFx0XHRjb25zdCBzb2NrZXQgPSB0aGlzLnNvY2tldCA9IG5ldC5jcmVhdGVDb25uZWN0aW9uKHsgcG9ydDogX19URVNUX1JVTk5FUl9QT1JUX18gfSk7XG5cblx0XHRcdGNvbnN0IGxvZ2dlciA9IHtcblx0XHRcdFx0ZXJyb3I6ICguLi5kYXRhOiBhbnlbXSkgPT4ge1xuXHRcdFx0XHRcdHNvY2tldC53cml0ZShcIkVSUk9SXCIpO1xuXHRcdFx0XHRcdHRoaXMuc2VuZE1lc3NhZ2UoZGF0YSk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHdhcm46ICguLi5kYXRhOiBhbnlbXSkgPT4ge1xuXHRcdFx0XHRcdHNvY2tldC53cml0ZShcIldBUk5cIik7XG5cdFx0XHRcdFx0dGhpcy5zZW5kTWVzc2FnZShkYXRhKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0bG9nOiAoLi4uZGF0YTogYW55W10pID0+IHtcblx0XHRcdFx0XHRzb2NrZXQud3JpdGUoXCJJTkZPXCIpO1xuXHRcdFx0XHRcdHRoaXMuc2VuZE1lc3NhZ2UoZGF0YSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dGhpcy5hcHAud29ya3NwYWNlLm9uTGF5b3V0UmVhZHkoYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRhd2FpdCB0ZXN0cy5ydW5UZXN0cyhsb2dnZXIsIG1ha2VfZmlsZXModGhpcykpXG5cdFx0XHRcdHNvY2tldC53cml0ZShcIklORk9cXDBcIilcblx0XHRcdFx0c29ja2V0LmVuZCgpO1xuXHRcdFx0fSlcblx0XHR9XG5cblx0XHRvbnVubG9hZCgpIHtcblx0XHRcdHRoaXMuc29ja2V0Py5lbmQoKTtcblx0XHRcdHRoaXMuc29ja2V0ID0gbnVsbDtcblxuXHRcdH1cblx0fVxufVxuIiwiaW1wb3J0IHR5cGUgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNGaWxlRmlsdGVyKG9iajogYW55KTogb2JqIGlzIEZpbGVGaWx0ZXIge1xuICAgIHJldHVybiAoXG4gICAgICAgIG9iaiAhPSBudWxsICYmXG4gICAgICAgIHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgXCJhcHBsaWVzVG9cIiBpbiBvYmogJiZcbiAgICAgICAgdHlwZW9mIG9iai5hcHBsaWVzVG8gPT09IFwiZnVuY3Rpb25cIlxuICAgICk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmlsZUZpbHRlcjxGaWxlUGFydCBleHRlbmRzIFBhcnRpYWw8VEZpbGU+ID0gVEZpbGU+IHtcbiAgICBhcHBsaWVzVG8oZmlsZTogRmlsZVBhcnQpOiBQcm9taXNlPGJvb2xlYW4+O1xuXG4gICAgYW5kPFIgZXh0ZW5kcyBQYXJ0aWFsPFRGaWxlPj4oZmlsdGVyOiBGaWxlRmlsdGVyPFI+KTogRmlsZUZpbHRlcjxGaWxlUGFydCAmIFI+XG4gICAgb3I8UiBleHRlbmRzIFBhcnRpYWw8VEZpbGU+PihmaWx0ZXI6IEZpbGVGaWx0ZXI8Uj4pOiBGaWxlRmlsdGVyPEZpbGVQYXJ0ICYgUj5cbn1cblxuIiwiaW1wb3J0IHR5cGUgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgRmlsZUZpbHRlciB9IGZyb20gXCIuL0ZpbGVGaWx0ZXJcIjtcbmltcG9ydCB7IG1hdGNoQWxsIH0gZnJvbSBcIi4vTWF0Y2hBbGxGaWx0ZXJcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIG9yPEZpbGVQYXJ0IGV4dGVuZHMgUGFydGlhbDxURmlsZT4+KFxuXHRhOiBGaWxlRmlsdGVyPEZpbGVQYXJ0PiB8IHJlYWRvbmx5IEZpbGVGaWx0ZXI8RmlsZVBhcnQ+W10sXG5cdGI6IEZpbGVGaWx0ZXI8RmlsZVBhcnQ+IHwgcmVhZG9ubHkgRmlsZUZpbHRlcjxGaWxlUGFydD5bXVxuKTogRmlsZUZpbHRlcjxGaWxlUGFydD4ge1xuXG5cdGEgPSBBcnJheS5pc0FycmF5KGEpID8gbWF0Y2hBbGwoYSkgOiAoYSBhcyBGaWxlRmlsdGVyPEZpbGVQYXJ0Pik7XG5cdGIgPSBBcnJheS5pc0FycmF5KGIpID8gbWF0Y2hBbGwoYikgOiAoYiBhcyBGaWxlRmlsdGVyPEZpbGVQYXJ0Pik7XG5cblx0cmV0dXJuIG5ldyBPckZpbHRlcihhLCBiKVxuXG59XG5cbmV4cG9ydCBjbGFzcyBPckZpbHRlcjxGaWxlUGFydCBleHRlbmRzIFBhcnRpYWw8VEZpbGU+ID0gVEZpbGU+IGltcGxlbWVudHMgRmlsZUZpbHRlcjxGaWxlUGFydD4ge1xuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgYTogRmlsZUZpbHRlcjxGaWxlUGFydD4sXG5cdFx0cHJpdmF0ZSByZWFkb25seSBiOiBGaWxlRmlsdGVyPEZpbGVQYXJ0PlxuXHQpIHsgfVxuXG5cdGFzeW5jIGFwcGxpZXNUbyhmaWxlOiBGaWxlUGFydCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdHJldHVybiBhd2FpdCB0aGlzLmEuYXBwbGllc1RvKGZpbGUpIHx8IGF3YWl0IHRoaXMuYi5hcHBsaWVzVG8oZmlsZSlcblx0fVxuXG5cdGFuZDxSIGV4dGVuZHMgUGFydGlhbDxURmlsZT4+KGZpbHRlcjogRmlsZUZpbHRlcjxSPik6IEZpbGVGaWx0ZXI8RmlsZVBhcnQgJiBSPiB7XG5cdFx0cmV0dXJuIG1hdGNoQWxsKHRoaXMsIGZpbHRlciBhcyBhbnkpXG5cdH1cblxuXHRvcjxSIGV4dGVuZHMgUGFydGlhbDxURmlsZT4+KGZpbHRlcjogRmlsZUZpbHRlcjxSPik6IEZpbGVGaWx0ZXI8RmlsZVBhcnQgJiBSPiB7XG5cdFx0cmV0dXJuIG9yKHRoaXMsIGZpbHRlciBhcyBhbnkpXG5cdH1cblxufVxuIiwiaW1wb3J0IHR5cGUgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgRmlsZUZpbHRlciB9IGZyb20gXCIuL0ZpbGVGaWx0ZXJcIjtcbmltcG9ydCB7IG9yIH0gZnJvbSBcIi4vT3JGaWx0ZXJcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoQWxsPEZpbGVQYXJ0IGV4dGVuZHMgUGFydGlhbDxURmlsZT4+KFxuXHRmaWx0ZXJzOiByZWFkb25seSBGaWxlRmlsdGVyPEZpbGVQYXJ0PltdLFxuKTogRmlsZUZpbHRlcjxGaWxlUGFydD47XG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hBbGw8RmlsZVBhcnQgZXh0ZW5kcyBQYXJ0aWFsPFRGaWxlPj4oXG5cdC4uLmZpbHRlcnM6IHJlYWRvbmx5IEZpbGVGaWx0ZXI8RmlsZVBhcnQ+W11cbik6IEZpbGVGaWx0ZXI8RmlsZVBhcnQ+O1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoQWxsPEZpbGVQYXJ0IGV4dGVuZHMgUGFydGlhbDxURmlsZT4+KFxuXHQuLi5maWx0ZXJzOlxuXHRcdHwgcmVhZG9ubHkgRmlsZUZpbHRlcjxGaWxlUGFydD5bXVxuXHRcdHwgW3JlYWRvbmx5IEZpbGVGaWx0ZXI8RmlsZVBhcnQ+W11dXG4pOiBGaWxlRmlsdGVyPEZpbGVQYXJ0PiB7XG5cdGlmIChmaWx0ZXJzLmxlbmd0aCA9PT0gMSkge1xuXHRcdGlmIChBcnJheS5pc0FycmF5KGZpbHRlcnNbMF0pKSB7XG5cdFx0XHRyZXR1cm4gY29tYmluZShmaWx0ZXJzWzBdKTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGNvbWJpbmUoZmlsdGVycyBhcyBGaWxlRmlsdGVyPEZpbGVQYXJ0PltdKTtcbn1cblxuZnVuY3Rpb24gY29tYmluZTxGaWxlUGFydCBleHRlbmRzIFBhcnRpYWw8VEZpbGU+Pihcblx0ZmlsdGVyczogcmVhZG9ubHkgRmlsZUZpbHRlcjxGaWxlUGFydD5bXSxcbik6IEZpbGVGaWx0ZXI8RmlsZVBhcnQ+IHtcblx0aWYgKGZpbHRlcnMubGVuZ3RoID09PSAxKSByZXR1cm4gZmlsdGVyc1swXTtcblx0aWYgKGZpbHRlcnMubGVuZ3RoID09PSAwKSByZXR1cm4gTWF0Y2hOb25lIGFzIEZpbGVGaWx0ZXI8RmlsZVBhcnQ+O1xuXHRyZXR1cm4gTWF0Y2hBbGxGaWx0ZXIuZmxhdHRlbmVkKGZpbHRlcnMpO1xufVxuXG5leHBvcnQgY29uc3QgTWF0Y2hOb25lOiBGaWxlRmlsdGVyID0ge1xuXHRhc3luYyBhcHBsaWVzVG8oZmlsZSkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblx0YW5kKGZpbHRlcikge1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHRvcihmaWx0ZXIpIHtcblx0XHRyZXR1cm4gZmlsdGVyO1xuXHR9LFxufTtcblxuZXhwb3J0IGNsYXNzIE1hdGNoQWxsRmlsdGVyPEZpbGVQYXJ0IGV4dGVuZHMgUGFydGlhbDxURmlsZT4gPSBURmlsZT5cblx0aW1wbGVtZW50cyBGaWxlRmlsdGVyPEZpbGVQYXJ0PiB7XG5cdHN0YXRpYyBmbGF0dGVuZWQ8RmlsZVBhcnQgZXh0ZW5kcyBQYXJ0aWFsPFRGaWxlPj4oXG5cdFx0ZmlsdGVyczogcmVhZG9ubHkgRmlsZUZpbHRlcjxGaWxlUGFydD5bXSxcblx0KSB7XG5cdFx0aWYgKCFmaWx0ZXJzLnNvbWUoKGZpbHRlcikgPT4gZmlsdGVyIGluc3RhbmNlb2YgTWF0Y2hBbGxGaWx0ZXIpKSB7XG5cdFx0XHRyZXR1cm4gbmV3IE1hdGNoQWxsRmlsdGVyKGZpbHRlcnMpO1xuXHRcdH1cblx0XHRyZXR1cm4gbmV3IE1hdGNoQWxsRmlsdGVyKFxuXHRcdFx0ZmlsdGVycy5mbGF0TWFwKChmaWx0ZXIpID0+IHtcblx0XHRcdFx0aWYgKGZpbHRlciBpbnN0YW5jZW9mIE1hdGNoQWxsRmlsdGVyKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZpbHRlci5maWx0ZXJzO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBbZmlsdGVyXVxuXHRcdFx0fSksXG5cdFx0KTtcblx0fVxuXG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgZmlsdGVyczogcmVhZG9ubHkgRmlsZUZpbHRlcjxGaWxlUGFydD5bXSkgeyB9XG5cblx0YXN5bmMgYXBwbGllc1RvKGZpbGU6IEZpbGVQYXJ0KTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0cmV0dXJuIFByb21pc2UuYWxsKFxuXHRcdFx0dGhpcy5maWx0ZXJzLm1hcCgoZmlsdGVyKSA9PiBmaWx0ZXIuYXBwbGllc1RvKGZpbGUpKSxcblx0XHQpLnRoZW4oKGFsbCkgPT4gYWxsLmV2ZXJ5KChpdCkgPT4gaXQpKTtcblx0fVxuXG5cdGFuZDxSIGV4dGVuZHMgUGFydGlhbDxURmlsZT4+KFxuXHRcdGZpbHRlcjogRmlsZUZpbHRlcjxSPixcblx0KTogRmlsZUZpbHRlcjxGaWxlUGFydCAmIFI+IHtcblx0XHRpZiAoZmlsdGVyIGluc3RhbmNlb2YgTWF0Y2hBbGxGaWx0ZXIpIHtcblx0XHRcdHJldHVybiBuZXcgTWF0Y2hBbGxGaWx0ZXIodGhpcy5maWx0ZXJzLmNvbmNhdChmaWx0ZXIuZmlsdGVycykpO1xuXHRcdH1cblx0XHRyZXR1cm4gbmV3IE1hdGNoQWxsRmlsdGVyKFxuXHRcdFx0KHRoaXMuZmlsdGVycyBhcyBGaWxlRmlsdGVyPEZpbGVQYXJ0ICYgUj5bXSkuY29uY2F0KGZpbHRlciksXG5cdFx0KTtcblx0fVxuXG5cdG9yPFIgZXh0ZW5kcyBQYXJ0aWFsPFRGaWxlPj4oXG5cdFx0ZmlsdGVyOiBGaWxlRmlsdGVyPFI+LFxuXHQpOiBGaWxlRmlsdGVyPEZpbGVQYXJ0ICYgUj4ge1xuXHRcdHJldHVybiBvcih0aGlzLCBmaWx0ZXIgYXMgYW55KTtcblx0fVxufVxuIiwiaW1wb3J0IHR5cGUgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgU3RyaW5nQ2hlY2tlciB9IGZyb20gXCJzcmMvY2hlY2tlcnMvU3RyaW5nQ2hlY2tlclwiO1xuaW1wb3J0IHsgRmlsZUZpbHRlciB9IGZyb20gXCJzcmMvZmlsdGVycy9GaWxlRmlsdGVyXCI7XG5pbXBvcnQgeyBtYXRjaEFsbCB9IGZyb20gXCIuL01hdGNoQWxsRmlsdGVyXCI7XG5pbXBvcnQgeyBvciB9IGZyb20gXCIuL09yRmlsdGVyXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBjb250ZW50KGNoZWNrZXI6IFN0cmluZ0NoZWNrZXIpOiBGaWxlRmlsdGVyIHtcblx0cmV0dXJuIG5ldyBGaWxlQ29udGVudEZpbHRlcihjaGVja2VyKVxufVxuXG5leHBvcnQgY2xhc3MgRmlsZUNvbnRlbnRGaWx0ZXIgaW1wbGVtZW50cyBGaWxlRmlsdGVyIHtcblxuXHRjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGNoZWNrZXI6IFN0cmluZ0NoZWNrZXIpIHsgfVxuXG5cdGFzeW5jIGFwcGxpZXNUbyhmaWxlOiBURmlsZSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmaWxlLnZhdWx0LmNhY2hlZFJlYWQoZmlsZSlcblx0XHRyZXR1cm4gdGhpcy5jaGVja2VyLm1hdGNoZXMoY29udGVudClcblx0fVxuXG5cdGFuZDxSIGV4dGVuZHMgUGFydGlhbDxURmlsZT4+KGZpbHRlcjogRmlsZUZpbHRlcjxSPik6IEZpbGVGaWx0ZXI8VEZpbGUgJiBSPiB7XG5cdFx0cmV0dXJuIG1hdGNoQWxsPFRGaWxlPih0aGlzLCBmaWx0ZXIgYXMgRmlsZUZpbHRlcilcblx0fVxuXG5cdG9yPFIgZXh0ZW5kcyBQYXJ0aWFsPFRGaWxlPj4oZmlsdGVyOiBGaWxlRmlsdGVyPFI+KTogRmlsZUZpbHRlcjxURmlsZSAmIFI+IHtcblx0XHRyZXR1cm4gb3I8VEZpbGU+KHRoaXMsIGZpbHRlciBhcyBGaWxlRmlsdGVyKVxuXHR9XG5cblxufVxuIiwiaW1wb3J0IHsgU3RyaW5nQ2hlY2tlciB9IGZyb20gXCJzcmMvY2hlY2tlcnMvU3RyaW5nQ2hlY2tlclwiO1xuaW1wb3J0IHsgRmlsZUZpbHRlciB9IGZyb20gXCJzcmMvZmlsdGVycy9GaWxlRmlsdGVyXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VyIHtcbiAgICBwYXJzZShjaGFyOiBzdHJpbmcpOiBQYXJzZXIgfCBudWxsO1xuICAgIGVuZChhY3RpdmVGaWx0ZXI6IEZpbGVGaWx0ZXIpOiBGaWxlRmlsdGVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBhcmVudFBhcnNlciBleHRlbmRzIFBhcnNlciB7XG4gICAgY29udGFpbnNOZXN0ZWRHcm91cFBhcnNlcigpOiBib29sZWFuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNQYXJlbnRQYXJzZXIocGFyc2VyOiBvYmplY3QpOiBwYXJzZXIgaXMgUGFyZW50UGFyc2VyIHtcbiAgICByZXR1cm4gKFxuICAgICAgICBcImNvbnRhaW5zTmVzdGVkR3JvdXBQYXJzZXJcIiBpbiBwYXJzZXIgJiZcbiAgICAgICAgdHlwZW9mIHBhcnNlci5jb250YWluc05lc3RlZEdyb3VwUGFyc2VyID09PSBcImZ1bmN0aW9uXCJcbiAgICApO1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGlzU3RyaW5nQ2hlY2tlcihvYmo6IGFueSk6IG9iaiBpcyBTdHJpbmdDaGVja2VyIHtcbiAgICByZXR1cm4gKFxuICAgICAgICBvYmogIT0gbnVsbCAmJlxuICAgICAgICB0eXBlb2Ygb2JqID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgIFwibWF0Y2hlc1wiIGluIG9iaiAmJlxuICAgICAgICB0eXBlb2Ygb2JqLm1hdGNoZXMgPT09IFwiZnVuY3Rpb25cIlxuICAgICk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RyaW5nQ2hlY2tlciB7XG4gICAgbWF0Y2hlcyh0ZXN0OiBzdHJpbmcpOiBib29sZWFuO1xuICAgIG9yKGNoZWNrZXI6IFN0cmluZ0NoZWNrZXIpOiBTdHJpbmdDaGVja2VyO1xuICAgIGFuZChjaGVja2VyOiBTdHJpbmdDaGVja2VyKTogU3RyaW5nQ2hlY2tlcjtcbn1cbiIsImltcG9ydCB0eXBlIHsgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEZpbGVGaWx0ZXIgfSBmcm9tIFwic3JjL2ZpbHRlcnMvRmlsZUZpbHRlclwiO1xuaW1wb3J0IHsgU3RyaW5nQ2hlY2tlciB9IGZyb20gXCIuLi9jaGVja2Vycy9TdHJpbmdDaGVja2VyXCI7XG5pbXBvcnQgeyBtYXRjaEFsbCB9IGZyb20gXCIuL01hdGNoQWxsRmlsdGVyXCI7XG5pbXBvcnQgeyBvciB9IGZyb20gXCIuL09yRmlsdGVyXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBmaWxlKGNoZWNrZXI6IFN0cmluZ0NoZWNrZXIpOiBGaWxlRmlsdGVyPFBpY2s8VEZpbGUsICdiYXNlbmFtZSc+PiB7XG5cdHJldHVybiBuZXcgRmlsZU5hbWVGaWx0ZXIoY2hlY2tlcilcbn1cblxuZXhwb3J0IGNsYXNzIEZpbGVOYW1lRmlsdGVyIGltcGxlbWVudHMgRmlsZUZpbHRlcjxQaWNrPFRGaWxlLCAnYmFzZW5hbWUnPj4ge1xuXG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgY2hlY2tlcjogU3RyaW5nQ2hlY2tlcikgeyB9XG5cblx0YXN5bmMgYXBwbGllc1RvKGZpbGU6IFBpY2s8VEZpbGUsICdiYXNlbmFtZSc+KTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0cmV0dXJuIHRoaXMuY2hlY2tlci5tYXRjaGVzKGZpbGUuYmFzZW5hbWUpXG5cdH1cblxuXHRhbmQ8UiBleHRlbmRzIFBhcnRpYWw8VEZpbGU+PihmaWx0ZXI6IEZpbGVGaWx0ZXI8Uj4pOiBGaWxlRmlsdGVyPFBpY2s8VEZpbGUsIFwiYmFzZW5hbWVcIj4gJiBSPiB7XG5cdFx0cmV0dXJuIG1hdGNoQWxsKHRoaXMsIGZpbHRlciBhcyBGaWxlRmlsdGVyKVxuXHR9XG5cblx0b3I8UiBleHRlbmRzIFBhcnRpYWw8VEZpbGU+PihmaWx0ZXI6IEZpbGVGaWx0ZXI8Uj4pOiBGaWxlRmlsdGVyPFBpY2s8VEZpbGUsIFwiYmFzZW5hbWVcIj4gJiBSPiB7XG5cdFx0cmV0dXJuIG9yKHRoaXMsIGZpbHRlciBhcyBGaWxlRmlsdGVyKVxuXHR9XG5cbn1cbiIsImltcG9ydCB0eXBlIHsgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IFN0cmluZ0NoZWNrZXIgfSBmcm9tIFwic3JjL2NoZWNrZXJzL1N0cmluZ0NoZWNrZXJcIjtcbmltcG9ydCB7IEZpbGVGaWx0ZXIgfSBmcm9tIFwic3JjL2ZpbHRlcnMvRmlsZUZpbHRlclwiO1xuaW1wb3J0IHsgbWF0Y2hBbGwgfSBmcm9tIFwiLi9NYXRjaEFsbEZpbHRlclwiO1xuXG5leHBvcnQgZnVuY3Rpb24gcGF0aChjaGVja2VyOiBTdHJpbmdDaGVja2VyKTogRmlsZUZpbHRlcjxQaWNrPFRGaWxlLCAncGF0aCc+PiB7XG5cdHJldHVybiBuZXcgRmlsZVBhdGhGaWx0ZXIoY2hlY2tlcilcbn1cblxuZXhwb3J0IGNsYXNzIEZpbGVQYXRoRmlsdGVyIGltcGxlbWVudHMgRmlsZUZpbHRlcjxQaWNrPFRGaWxlLCAncGF0aCc+PiB7XG5cblx0Y29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBjaGVja2VyOiBTdHJpbmdDaGVja2VyKSB7IH1cblxuXHRhc3luYyBhcHBsaWVzVG8oZmlsZTogUGljazxURmlsZSwgJ3BhdGgnPik6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdHJldHVybiB0aGlzLmNoZWNrZXIubWF0Y2hlcyhmaWxlLnBhdGgpXG5cdH1cblxuXHRhbmQ8UiBleHRlbmRzIFBhcnRpYWw8VEZpbGU+PihmaWx0ZXI6IEZpbGVGaWx0ZXI8Uj4pOiBGaWxlRmlsdGVyPFBpY2s8VEZpbGUsIFwicGF0aFwiPiAmIFI+IHtcblx0XHRyZXR1cm4gbWF0Y2hBbGwodGhpcywgZmlsdGVyIGFzIEZpbGVGaWx0ZXIpXG5cdH1cblxuXHRvcjxSIGV4dGVuZHMgUGFydGlhbDxURmlsZT4+KGZpbHRlcjogRmlsZUZpbHRlcjxSPik6IEZpbGVGaWx0ZXI8UGljazxURmlsZSwgXCJwYXRoXCI+ICYgUj4ge1xuXHRcdHJldHVybiBtYXRjaEFsbCh0aGlzLCBmaWx0ZXIgYXMgRmlsZUZpbHRlcilcblx0fVxuXG59XG4iLCJpbXBvcnQgeyBncm91cCB9IGZyb20gXCIuL0dyb3VwXCI7XG5pbXBvcnQgeyBTdHJpbmdDaGVja2VyIH0gZnJvbSBcIi4vU3RyaW5nQ2hlY2tlclwiO1xuXG5leHBvcnQgY2xhc3MgT3IgaW1wbGVtZW50cyBTdHJpbmdDaGVja2VyIHtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcml2YXRlIHJlYWRvbmx5IGE6IFN0cmluZ0NoZWNrZXIsXG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgYjogU3RyaW5nQ2hlY2tlclxuICAgICkge31cblxuICAgIG1hdGNoZXModGVzdDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmEubWF0Y2hlcyh0ZXN0KSB8fCB0aGlzLmIubWF0Y2hlcyh0ZXN0KVxuICAgIH1cblxuICAgIG9yKGNoZWNrZXI6IFN0cmluZ0NoZWNrZXIpOiBTdHJpbmdDaGVja2VyIHtcbiAgICAgICAgcmV0dXJuIG5ldyBPcih0aGlzLCBjaGVja2VyKVxuICAgIH1cblxuICAgIGFuZChjaGVja2VyOiBTdHJpbmdDaGVja2VyKTogU3RyaW5nQ2hlY2tlciB7XG4gICAgICAgIHJldHVybiBncm91cCh0aGlzLCBjaGVja2VyKVxuICAgIH1cbn0iLCJpbXBvcnQgeyBPciB9IGZyb20gXCIuL09yXCI7XG5pbXBvcnQgeyBTdHJpbmdDaGVja2VyIH0gZnJvbSBcIi4vU3RyaW5nQ2hlY2tlclwiO1xuXG5leHBvcnQgZnVuY3Rpb24gZ3JvdXAoY2hlY2tlcnM6IHJlYWRvbmx5IFN0cmluZ0NoZWNrZXJbXSk6IFN0cmluZ0NoZWNrZXI7XG5leHBvcnQgZnVuY3Rpb24gZ3JvdXAoLi4uY2hlY2tlcnM6IHJlYWRvbmx5IFN0cmluZ0NoZWNrZXJbXSk6IFN0cmluZ0NoZWNrZXI7XG5leHBvcnQgZnVuY3Rpb24gZ3JvdXAoLi4uY2hlY2tlcnM6IHJlYWRvbmx5IFN0cmluZ0NoZWNrZXJbXSB8IFtyZWFkb25seSBTdHJpbmdDaGVja2VyW11dKTogU3RyaW5nQ2hlY2tlciB7XG4gICAgaWYgKGNoZWNrZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjaGVja2Vyc1swXSkpIHtcbiAgICAgICAgICAgIHJldHVybiBjb21iaW5lKGNoZWNrZXJzWzBdKVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb21iaW5lKGNoZWNrZXJzIGFzIFN0cmluZ0NoZWNrZXJbXSlcbn1cblxuZnVuY3Rpb24gY29tYmluZShjaGVja2VyczogU3RyaW5nQ2hlY2tlcltdKTogU3RyaW5nQ2hlY2tlciB7XG4gICAgaWYgKGNoZWNrZXJzLmxlbmd0aCA9PT0gMSkgcmV0dXJuIGNoZWNrZXJzWzBdXG4gICAgcmV0dXJuIG5ldyBHcm91cChjaGVja2Vycylcbn1cblxuZXhwb3J0IGNsYXNzIEdyb3VwIGltcGxlbWVudHMgU3RyaW5nQ2hlY2tlciB7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGNoZWNrZXJzOiByZWFkb25seSBTdHJpbmdDaGVja2VyW10pIHt9XG5cbiAgICBtYXRjaGVzKHRlc3Q6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jaGVja2Vycy5ldmVyeShjaGVja2VyID0+IGNoZWNrZXIubWF0Y2hlcyh0ZXN0KSlcbiAgICB9XG5cbiAgICBvcihjaGVja2VyOiBTdHJpbmdDaGVja2VyKTogU3RyaW5nQ2hlY2tlciB7XG4gICAgICAgIHJldHVybiBuZXcgT3IodGhpcywgY2hlY2tlcilcbiAgICB9XG5cbiAgICBhbmQoY2hlY2tlcjogU3RyaW5nQ2hlY2tlcik6IFN0cmluZ0NoZWNrZXIge1xuICAgICAgICByZXR1cm4gZ3JvdXAodGhpcy5jaGVja2Vycy5jb25jYXQoW2NoZWNrZXJdKSlcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBncm91cCB9IGZyb20gXCIuL0dyb3VwXCI7XG5pbXBvcnQgeyBPciB9IGZyb20gXCIuL09yXCI7XG5pbXBvcnQgeyBTdHJpbmdDaGVja2VyIH0gZnJvbSBcIi4vU3RyaW5nQ2hlY2tlclwiO1xuXG5leHBvcnQgZnVuY3Rpb24gcGhyYXNlKFxuICAgIHBocmFzZTogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiB7IG1hdGNoQ2FzZTogYm9vbGVhbiB9LFxuKTogU3RyaW5nQ2hlY2tlcjtcbmV4cG9ydCBmdW5jdGlvbiBwaHJhc2UocGhyYXNlOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSk6IFN0cmluZ0NoZWNrZXI7XG5leHBvcnQgZnVuY3Rpb24gcGhyYXNlKFxuICAgIHBocmFzZTogVGVtcGxhdGVTdHJpbmdzQXJyYXkgfCBzdHJpbmcsXG4gICAgeyBtYXRjaENhc2UgPSB0cnVlIH06IHsgbWF0Y2hDYXNlOiBib29sZWFuIH0gPSB7IG1hdGNoQ2FzZTogdHJ1ZSB9LFxuKTogU3RyaW5nQ2hlY2tlciB7XG4gICAgaWYgKHR5cGVvZiBwaHJhc2UgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQaHJhc2UocGhyYXNlLCBtYXRjaENhc2UpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFBocmFzZShwaHJhc2Uuam9pbihcIlwiKSwgbWF0Y2hDYXNlKTtcbn1cblxuZXhwb3J0IGNsYXNzIFBocmFzZSBpbXBsZW1lbnRzIFN0cmluZ0NoZWNrZXIge1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcml2YXRlIHJlYWRvbmx5IHBocmFzZTogc3RyaW5nLFxuXG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgbWF0Y2hDYXNlOiBib29sZWFuID0gdHJ1ZSxcbiAgICApIHt9XG5cbiAgICBtYXRjaGVzKHRlc3Q6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICBpZiAodGhpcy5tYXRjaENhc2UpIHJldHVybiB0ZXN0LmluY2x1ZGVzKHRoaXMucGhyYXNlKTtcbiAgICAgICAgcmV0dXJuIHRlc3RcbiAgICAgICAgICAgIC50b0xvY2FsZVVwcGVyQ2FzZSgpXG4gICAgICAgICAgICAuaW5jbHVkZXModGhpcy5waHJhc2UudG9Mb2NhbGVVcHBlckNhc2UoKSk7XG4gICAgfVxuXG4gICAgb3IoY2hlY2tlcjogU3RyaW5nQ2hlY2tlcik6IFN0cmluZ0NoZWNrZXIge1xuICAgICAgICByZXR1cm4gbmV3IE9yKHRoaXMsIGNoZWNrZXIpXG4gICAgfVxuXG4gICAgYW5kKGNoZWNrZXI6IFN0cmluZ0NoZWNrZXIpOiBTdHJpbmdDaGVja2VyIHtcbiAgICAgICAgcmV0dXJuIGdyb3VwKHRoaXMsIGNoZWNrZXIpXG4gICAgfVxufVxuIiwiaW1wb3J0IHsgU3RyaW5nQ2hlY2tlciB9IGZyb20gXCJzcmMvY2hlY2tlcnMvU3RyaW5nQ2hlY2tlclwiO1xuaW1wb3J0IHsgU3ViUXVlcnlQYXJzZXIgfSBmcm9tIFwiLi9TdWJRdWVyeVBhcnNlclwiO1xuaW1wb3J0IHsgUGhyYXNlIH0gZnJvbSBcInNyYy9jaGVja2Vycy9QaHJhc2VcIjtcblxuZXhwb3J0IGNsYXNzIFN1YlF1ZXJ5UGhyYXNlUGFyc2VyIGltcGxlbWVudHMgU3ViUXVlcnlQYXJzZXIge1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcm90ZWN0ZWQgcmVhZG9ubHkgbWF0Y2hDYXNlOiBib29sZWFuID0gdHJ1ZSxcbiAgICAgICAgcHJvdGVjdGVkIHJlYWRvbmx5IGJ1ZmZlcjogc3RyaW5nID0gXCJcIixcbiAgICApIHt9XG5cbiAgICBwYXJzZShjaGFyOiBzdHJpbmcpOiBTdWJRdWVyeVBhcnNlciB8IG51bGwge1xuICAgICAgICBzd2l0Y2ggKGNoYXIpIHtcbiAgICAgICAgICAgIGNhc2UgYFxcXFxgOiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBFc2NhcGVkU3ViUXVlcnlQaHJhc2VQYXJzZXIodGhpcy5idWZmZXIsIHRoaXMubWF0Y2hDYXNlKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBgXCJgOiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBTdWJRdWVyeVBocmFzZVBhcnNlcih0aGlzLm1hdGNoQ2FzZSwgdGhpcy5idWZmZXIgKyBjaGFyKVxuICAgIH1cblxuICAgIGVuZCgpOiBTdHJpbmdDaGVja2VyIHwgdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmJ1ZmZlci5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFBocmFzZSh0aGlzLmJ1ZmZlciwgdGhpcy5tYXRjaENhc2UpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5jbGFzcyBFc2NhcGVkU3ViUXVlcnlQaHJhc2VQYXJzZXIgZXh0ZW5kcyBTdWJRdWVyeVBocmFzZVBhcnNlciB7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgYnVmZmVyOiBzdHJpbmcsXG4gICAgICAgIG1hdGNoQ2FzZTogYm9vbGVhbiA9IHRydWVcbiAgICApIHtcbiAgICAgICAgc3VwZXIobWF0Y2hDYXNlLCBidWZmZXIpXG4gICAgfVxuXG4gICAgcGFyc2UoY2hhcjogc3RyaW5nKTogU3ViUXVlcnlQYXJzZXIgfCBudWxsIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdWJRdWVyeVBocmFzZVBhcnNlcihcbiAgICAgICAgICAgIHRoaXMubWF0Y2hDYXNlLFxuICAgICAgICAgICAgdGhpcy5idWZmZXIgKyBjaGFyLCBcbiAgICAgICAgKVxuICAgIH1cblxufSIsImltcG9ydCB7IGdyb3VwIH0gZnJvbSBcIi4vR3JvdXBcIjtcbmltcG9ydCB7IE9yIH0gZnJvbSBcIi4vT3JcIjtcbmltcG9ydCB7IFN0cmluZ0NoZWNrZXIgfSBmcm9tIFwiLi9TdHJpbmdDaGVja2VyXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBub3QoY2hlY2tlcjogU3RyaW5nQ2hlY2tlcik6IFN0cmluZ0NoZWNrZXIge1xuICAgIGlmIChjaGVja2VyIGluc3RhbmNlb2YgTm90KSB7XG4gICAgICAgIHJldHVybiBjaGVja2VyLm5vdCgpXG4gICAgfVxuICAgIHJldHVybiBuZXcgTm90KGNoZWNrZXIpXG59XG5cbmV4cG9ydCBjbGFzcyBOb3QgaW1wbGVtZW50cyBTdHJpbmdDaGVja2VyIHtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgY2hlY2tlcjogU3RyaW5nQ2hlY2tlcikge31cblxuICAgIG1hdGNoZXModGVzdDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiAhIHRoaXMuY2hlY2tlci5tYXRjaGVzKHRlc3QpXG4gICAgfVxuXG4gICAgbm90KCkgeyByZXR1cm4gdGhpcy5jaGVja2VyIH1cblxuICAgIG9yKGNoZWNrZXI6IFN0cmluZ0NoZWNrZXIpOiBTdHJpbmdDaGVja2VyIHtcbiAgICAgICAgcmV0dXJuIG5ldyBPcih0aGlzLCBjaGVja2VyKVxuICAgIH1cblxuICAgIGFuZChjaGVja2VyOiBTdHJpbmdDaGVja2VyKTogU3RyaW5nQ2hlY2tlciB7XG4gICAgICAgIHJldHVybiBncm91cCh0aGlzLCBjaGVja2VyKVxuICAgIH1cblxufSIsImltcG9ydCB7IFBocmFzZSB9IGZyb20gXCIuL1BocmFzZVwiO1xuaW1wb3J0IHsgU3RyaW5nQ2hlY2tlciB9IGZyb20gXCIuL1N0cmluZ0NoZWNrZXJcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHdvcmQoXG4gICAgd29yZDogc3RyaW5nLFxuICAgIG9wdGlvbnM/OiB7IG1hdGNoQ2FzZTogYm9vbGVhbiB9LFxuKTogU3RyaW5nQ2hlY2tlcjtcbmV4cG9ydCBmdW5jdGlvbiB3b3JkKHdvcmQ6IFRlbXBsYXRlU3RyaW5nc0FycmF5KTogU3RyaW5nQ2hlY2tlcjtcbmV4cG9ydCBmdW5jdGlvbiB3b3JkKFxuICAgIHdvcmQ6IFRlbXBsYXRlU3RyaW5nc0FycmF5IHwgc3RyaW5nLFxuICAgIHsgbWF0Y2hDYXNlID0gdHJ1ZSB9OiB7IG1hdGNoQ2FzZTogYm9vbGVhbiB9ID0geyBtYXRjaENhc2U6IHRydWUgfSxcbik6IFN0cmluZ0NoZWNrZXIge1xuICAgIGlmICh0eXBlb2Ygd29yZCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICByZXR1cm4gbmV3IFdvcmQod29yZCwgbWF0Y2hDYXNlKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBXb3JkKHdvcmQuam9pbihcIlwiKSwgbWF0Y2hDYXNlKTtcbn1cblxuZXhwb3J0IGNvbnN0IFdvcmQgPSBQaHJhc2UiLCJpbXBvcnQgeyBTdHJpbmdDaGVja2VyIH0gZnJvbSBcInNyYy9jaGVja2Vycy9TdHJpbmdDaGVja2VyXCI7XG5pbXBvcnQgeyBTdWJRdWVyeVBhcnNlciB9IGZyb20gXCIuL1N1YlF1ZXJ5UGFyc2VyXCI7XG5pbXBvcnQgeyBXb3JkIH0gZnJvbSBcInNyYy9jaGVja2Vycy9Xb3JkXCI7XG5cbmV4cG9ydCBjbGFzcyBTdWJRdWVyeVdvcmRQYXJzZXIgaW1wbGVtZW50cyBTdWJRdWVyeVBhcnNlciB7XG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHJlYWRvbmx5IGJ1ZmZlcjogc3RyaW5nLFxuICAgICAgICBwcml2YXRlIHJlYWRvbmx5IG1hdGNoQ2FzZT86IGJvb2xlYW4sXG4gICAgKSB7fVxuXG4gICAgcGFyc2UoY2hhcjogc3RyaW5nKTogU3ViUXVlcnlXb3JkUGFyc2VyIHwgbnVsbCB7XG4gICAgICAgIGlmIChjaGFyID09PSBgIGApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgU3ViUXVlcnlXb3JkUGFyc2VyKFxuICAgICAgICAgICAgdGhpcy5idWZmZXIgKyBjaGFyLFxuICAgICAgICAgICAgdGhpcy5tYXRjaENhc2VcbiAgICAgICAgKVxuICAgIH1cblxuICAgIGVuZCgpOiBTdHJpbmdDaGVja2VyIHwgdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmJ1ZmZlci5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFdvcmQodGhpcy5idWZmZXIsIHRoaXMubWF0Y2hDYXNlKTtcbiAgICAgICAgfVxuICAgIH1cbn0iLCJpbXBvcnQgeyBTdHJpbmdDaGVja2VyIH0gZnJvbSBcInNyYy9jaGVja2Vycy9TdHJpbmdDaGVja2VyXCI7XG5pbXBvcnQgeyBTdWJRdWVyeVBhcnNlciB9IGZyb20gXCIuL1N1YlF1ZXJ5UGFyc2VyXCI7XG5pbXBvcnQgeyBEZWZhdWx0U3ViUXVlcnlQYXJzZXIgfSBmcm9tIFwiLi9EZWZhdWx0U3ViUXVlcnlQYXJzZXJcIjtcbmltcG9ydCB7IG1hdGNoQWxsIH0gZnJvbSBcInNyYy9maWx0ZXJzXCI7XG5pbXBvcnQgeyBncm91cCB9IGZyb20gXCJzcmMvY2hlY2tlcnMvR3JvdXBcIjtcblxuZXhwb3J0IGNsYXNzIFN1YlF1ZXJ5RWl0aGVyUGFyc2VyIGltcGxlbWVudHMgU3ViUXVlcnlQYXJzZXIge1xuXG4gICAgc3RhdGljIHN0YXJ0KFxuICAgICAgICBhQ2hlY2tlcjogU3RyaW5nQ2hlY2tlcixcbiAgICAgICAgbWF0Y2hDYXNlOiBib29sZWFuID0gdHJ1ZVxuICAgICk6IFN1YlF1ZXJ5RWl0aGVyUGFyc2VyIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdWJRdWVyeUVpdGhlclBhcnNlcihcbiAgICAgICAgICAgIGFDaGVja2VyLFxuICAgICAgICAgICAgZ3JvdXAoKSxcbiAgICAgICAgICAgIG1hdGNoQ2FzZSxcbiAgICAgICAgKVxuICAgIH1cblxuICAgIHByaXZhdGUgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgYUNoZWNrZXI6IFN0cmluZ0NoZWNrZXIsXG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgYkNoZWNrZXI6IFN0cmluZ0NoZWNrZXIsXG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgbWF0Y2hDYXNlPzogYm9vbGVhbixcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBpbnRlcm5hbFBhcnNlcjogU3ViUXVlcnlQYXJzZXIgPSBuZXcgRGVmYXVsdFN1YlF1ZXJ5UGFyc2VyKG1hdGNoQ2FzZSlcbiAgICApe31cblxuICAgIHBhcnNlKGNoYXI6IHN0cmluZyk6IFN1YlF1ZXJ5UGFyc2VyIHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IG5leHRQYXJzZXIgPSB0aGlzLmludGVybmFsUGFyc2VyLnBhcnNlKGNoYXIpXG4gICAgICAgIGlmIChuZXh0UGFyc2VyID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgU3ViUXVlcnlFaXRoZXJQYXJzZXIoXG4gICAgICAgICAgICAgICAgdGhpcy5hQ2hlY2tlcixcbiAgICAgICAgICAgICAgICB0aGlzLm5leHRDaGVja2VyKCksXG4gICAgICAgICAgICAgICAgdGhpcy5tYXRjaENhc2UsXG4gICAgICAgICAgICAgICAgbmV3IERlZmF1bHRTdWJRdWVyeVBhcnNlcih0aGlzLm1hdGNoQ2FzZSlcbiAgICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFN1YlF1ZXJ5RWl0aGVyUGFyc2VyKFxuICAgICAgICAgICAgdGhpcy5hQ2hlY2tlcixcbiAgICAgICAgICAgIHRoaXMuYkNoZWNrZXIsXG4gICAgICAgICAgICB0aGlzLm1hdGNoQ2FzZSxcbiAgICAgICAgICAgIG5leHRQYXJzZXJcbiAgICAgICAgKVxuICAgIH1cblxuICAgIHByaXZhdGUgbmV4dENoZWNrZXIoKSB7XG4gICAgICAgIGNvbnN0IG5leHQgPSB0aGlzLmludGVybmFsUGFyc2VyLmVuZCgpXG4gICAgICAgIGlmIChuZXh0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmJDaGVja2VyLmFuZChuZXh0KVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmJDaGVja2VyXG4gICAgfVxuXG4gICAgZW5kKCk6IHZvaWQgfCBTdHJpbmdDaGVja2VyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYUNoZWNrZXIub3IodGhpcy5uZXh0Q2hlY2tlcigpKVxuICAgIH1cblxufSIsImltcG9ydCB7IFN0cmluZ0NoZWNrZXIgfSBmcm9tIFwic3JjL2NoZWNrZXJzL1N0cmluZ0NoZWNrZXJcIjtcbmltcG9ydCB7IFN1YlF1ZXJ5UGFyc2VyIH0gZnJvbSBcIi4vU3ViUXVlcnlQYXJzZXJcIjtcbmltcG9ydCB7IERlZmF1bHRTdWJRdWVyeVBhcnNlciB9IGZyb20gXCIuL0RlZmF1bHRTdWJRdWVyeVBhcnNlclwiO1xuaW1wb3J0IHsgZ3JvdXAgfSBmcm9tIFwic3JjL2NoZWNrZXJzL0dyb3VwXCI7XG5pbXBvcnQgeyBpc1BhcmVudFBhcnNlciB9IGZyb20gXCIuLi9QYXJzZXJcIjtcbmltcG9ydCB7IFN1YlF1ZXJ5V29yZFBhcnNlciB9IGZyb20gXCIuL1N1YlF1ZXJ5V29yZFBhcnNlclwiO1xuaW1wb3J0IHsgU3ViUXVlcnlFaXRoZXJQYXJzZXIgfSBmcm9tIFwiLi9TdWJRdWVyeUVpdGhlclBhcnNlclwiO1xuXG5leHBvcnQgY2xhc3MgU3ViUXVlcnlHcm91cFBhcnNlciBpbXBsZW1lbnRzIFN1YlF1ZXJ5UGFyc2VyIHtcbiAgICBwdWJsaWMgc3RhdGljIHN0YXJ0KG1hdGNoQ2FzZT86IGJvb2xlYW4pOiBTdWJRdWVyeUdyb3VwUGFyc2VyIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdWJRdWVyeUdyb3VwUGFyc2VyKFxuICAgICAgICAgICAgW10sXG4gICAgICAgICAgICBuZXcgRGVmYXVsdFN1YlF1ZXJ5UGFyc2VyKG1hdGNoQ2FzZSksXG4gICAgICAgICAgICBtYXRjaENhc2UsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBpbnRlcm5hbENoZWNrZXJzOiByZWFkb25seSBTdHJpbmdDaGVja2VyW10sXG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgaW50ZXJuYWxQYXJzZXI6IFN1YlF1ZXJ5UGFyc2VyLFxuICAgICAgICBwcml2YXRlIHJlYWRvbmx5IG1hdGNoQ2FzZT86IGJvb2xlYW4sXG4gICAgKSB7fVxuXG4gICAgcGFyc2UoY2hhcjogc3RyaW5nKTogU3ViUXVlcnlQYXJzZXIgfCBudWxsIHtcbiAgICAgICAgaWYgKGNoYXIgPT09IGApYCAmJiAhdGhpcy5jb250YWluc05lc3RlZEdyb3VwUGFyc2VyKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbmV4dFBhcnNlciA9IHRoaXMuaW50ZXJuYWxQYXJzZXIucGFyc2UoY2hhcik7XG4gICAgICAgIGlmIChuZXh0UGFyc2VyICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgU3ViUXVlcnlHcm91cFBhcnNlcihcbiAgICAgICAgICAgICAgICB0aGlzLmludGVybmFsQ2hlY2tlcnMsXG4gICAgICAgICAgICAgICAgbmV4dFBhcnNlcixcbiAgICAgICAgICAgICAgICB0aGlzLm1hdGNoQ2FzZSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pbnRlcm5hbFBhcnNlciBpbnN0YW5jZW9mIFN1YlF1ZXJ5V29yZFBhcnNlcikge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAodGhpcy5pbnRlcm5hbFBhcnNlci5idWZmZXIudG9Mb2NhbGVMb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwib3JcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTdWJRdWVyeUdyb3VwUGFyc2VyKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN1YlF1ZXJ5RWl0aGVyUGFyc2VyLnN0YXJ0KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cCh0aGlzLmludGVybmFsQ2hlY2tlcnMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1hdGNoQ2FzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWF0Y2hDYXNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiYW5kXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU3ViUXVlcnlHcm91cFBhcnNlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVybmFsQ2hlY2tlcnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IERlZmF1bHRTdWJRdWVyeVBhcnNlcih0aGlzLm1hdGNoQ2FzZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXRjaENhc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBTdWJRdWVyeUdyb3VwUGFyc2VyKFxuICAgICAgICAgICAgICAgIHRoaXMuZW5kSW50ZXJuYWxQYXJzZXIoKSxcbiAgICAgICAgICAgICAgICBuZXcgRGVmYXVsdFN1YlF1ZXJ5UGFyc2VyKHRoaXMubWF0Y2hDYXNlKSxcbiAgICAgICAgICAgICAgICB0aGlzLm1hdGNoQ2FzZSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb250YWluc05lc3RlZEdyb3VwUGFyc2VyKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgdGhpcy5pbnRlcm5hbFBhcnNlciBpbnN0YW5jZW9mIFN1YlF1ZXJ5R3JvdXBQYXJzZXIgfHxcbiAgICAgICAgICAgIChpc1BhcmVudFBhcnNlcih0aGlzLmludGVybmFsUGFyc2VyKSAmJlxuICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJuYWxQYXJzZXIuY29udGFpbnNOZXN0ZWRHcm91cFBhcnNlcigpKVxuICAgICAgICApO1xuICAgIH1cblxuICAgIHByaXZhdGUgZW5kSW50ZXJuYWxQYXJzZXIoKSB7XG4gICAgICAgIGNvbnN0IGNoZWNrZXIgPSB0aGlzLmludGVybmFsUGFyc2VyLmVuZCgpO1xuICAgICAgICBpZiAoY2hlY2tlciAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbnRlcm5hbENoZWNrZXJzLmNvbmNhdChbY2hlY2tlcl0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmludGVybmFsQ2hlY2tlcnM7XG4gICAgfVxuXG4gICAgZW5kKCk6IFN0cmluZ0NoZWNrZXIgfCB2b2lkIHtcbiAgICAgICAgcmV0dXJuIGdyb3VwKHRoaXMuZW5kSW50ZXJuYWxQYXJzZXIoKSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgU3RyaW5nQ2hlY2tlciwgaXNTdHJpbmdDaGVja2VyIH0gZnJvbSBcInNyYy9jaGVja2Vycy9TdHJpbmdDaGVja2VyXCI7XG5pbXBvcnQgeyBTdWJRdWVyeVBhcnNlciB9IGZyb20gXCIuL1N1YlF1ZXJ5UGFyc2VyXCI7XG5pbXBvcnQgeyBub3QgfSBmcm9tIFwic3JjL2NoZWNrZXJzL05vdFwiO1xuaW1wb3J0IHsgRGVmYXVsdFN1YlF1ZXJ5UGFyc2VyIH0gZnJvbSBcIi4vRGVmYXVsdFN1YlF1ZXJ5UGFyc2VyXCI7XG5pbXBvcnQgeyBTdWJRdWVyeUdyb3VwUGFyc2VyIH0gZnJvbSBcIi4vU3ViUXVlcnlHcm91cFBhcnNlclwiO1xuaW1wb3J0IHsgaXNQYXJlbnRQYXJzZXIgfSBmcm9tIFwiLi4vUGFyc2VyXCI7XG5cbmV4cG9ydCBjbGFzcyBTdWJRdWVyeU5lZ2F0ZWRQYXJzZXIgaW1wbGVtZW50cyBTdWJRdWVyeVBhcnNlciB7XG4gICAgO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgbWF0Y2hDYXNlPzogYm9vbGVhbixcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBpbnRlcm5hbFBhcnNlcjogU3ViUXVlcnlQYXJzZXIgPSBuZXcgRGVmYXVsdFN1YlF1ZXJ5UGFyc2VyKG1hdGNoQ2FzZSlcbiAgICApIHt9XG5cbiAgICBwYXJzZShjaGFyOiBzdHJpbmcpOiBTdWJRdWVyeVBhcnNlciB8IG51bGwge1xuICAgICAgICBjb25zdCBuZXh0UGFyc2VyID0gdGhpcy5pbnRlcm5hbFBhcnNlci5wYXJzZShjaGFyKTtcbiAgICAgICAgaWYgKG5leHRQYXJzZXIgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBTdWJRdWVyeU5lZ2F0ZWRQYXJzZXIodGhpcy5tYXRjaENhc2UsIG5leHRQYXJzZXIpXG4gICAgfVxuXG4gICAgY29udGFpbnNOZXN0ZWRHcm91cFBhcnNlcigpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIHRoaXMuaW50ZXJuYWxQYXJzZXIgaW5zdGFuY2VvZiBTdWJRdWVyeUdyb3VwUGFyc2VyIHx8XG4gICAgICAgICAgICAoaXNQYXJlbnRQYXJzZXIodGhpcy5pbnRlcm5hbFBhcnNlcikgJiZcbiAgICAgICAgICAgICAgICB0aGlzLmludGVybmFsUGFyc2VyLmNvbnRhaW5zTmVzdGVkR3JvdXBQYXJzZXIoKSlcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBlbmQoKTogU3RyaW5nQ2hlY2tlciB8IHZvaWQge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmludGVybmFsUGFyc2VyLmVuZCgpO1xuICAgICAgICBpZiAoaXNTdHJpbmdDaGVja2VyKHJlc3VsdCkpIHtcbiAgICAgICAgICAgIHJldHVybiBub3QocmVzdWx0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7IFN0cmluZ0NoZWNrZXIgfSBmcm9tIFwic3JjL2NoZWNrZXJzL1N0cmluZ0NoZWNrZXJcIjtcbmltcG9ydCB7IFN1YlF1ZXJ5UGhyYXNlUGFyc2VyIH0gZnJvbSBcIi4vU3ViUXVlcnlQaHJhc2VQYXJzZXJcIjtcbmltcG9ydCB7IFN1YlF1ZXJ5TmVnYXRlZFBhcnNlciB9IGZyb20gXCIuL1N1YlF1ZXJ5TmVnYXRlZFBhcnNlclwiO1xuaW1wb3J0IHsgU3ViUXVlcnlQYXJzZXIgfSBmcm9tIFwiLi9TdWJRdWVyeVBhcnNlclwiO1xuaW1wb3J0IHsgU3ViUXVlcnlXb3JkUGFyc2VyIH0gZnJvbSBcIi4vU3ViUXVlcnlXb3JkUGFyc2VyXCI7XG5pbXBvcnQgeyBTdWJRdWVyeUdyb3VwUGFyc2VyIH0gZnJvbSBcIi4vU3ViUXVlcnlHcm91cFBhcnNlclwiO1xuXG5leHBvcnQgY2xhc3MgRGVmYXVsdFN1YlF1ZXJ5UGFyc2VyIGltcGxlbWVudHMgU3ViUXVlcnlQYXJzZXIge1xuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgbWF0Y2hDYXNlPzogYm9vbGVhbikge31cblxuICAgIHBhcnNlKGNoYXI6IHN0cmluZyk6IFN1YlF1ZXJ5UGFyc2VyIHwgbnVsbCB7XG4gICAgICAgIHN3aXRjaCAoY2hhcikge1xuICAgICAgICAgICAgY2FzZSBgLWA6IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFN1YlF1ZXJ5TmVnYXRlZFBhcnNlcih0aGlzLm1hdGNoQ2FzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIGBcImA6IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFN1YlF1ZXJ5UGhyYXNlUGFyc2VyKHRoaXMubWF0Y2hDYXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgYChgOiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFN1YlF1ZXJ5R3JvdXBQYXJzZXIuc3RhcnQodGhpcy5tYXRjaENhc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIGAgYDoge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU3ViUXVlcnlXb3JkUGFyc2VyKGNoYXIsIHRoaXMubWF0Y2hDYXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGVuZCgpOiBTdHJpbmdDaGVja2VyIHwgdm9pZCB7fVxufSIsImltcG9ydCB0eXBlIHsgQ2FjaGVkTWV0YWRhdGEsIEZyb250TWF0dGVyQ2FjaGUsIE1ldGFkYXRhQ2FjaGUsIFRGaWxlLCBUYWdDYWNoZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgU3RyaW5nQ2hlY2tlciB9IGZyb20gXCJzcmMvY2hlY2tlcnMvU3RyaW5nQ2hlY2tlclwiO1xuaW1wb3J0IHsgRmlsZUZpbHRlciB9IGZyb20gXCJzcmMvZmlsdGVycy9GaWxlRmlsdGVyXCI7XG5pbXBvcnQgeyBtYXRjaEFsbCB9IGZyb20gXCIuL01hdGNoQWxsRmlsdGVyXCI7XG5pbXBvcnQgeyBvciB9IGZyb20gXCIuL09yRmlsdGVyXCI7XG5cbnR5cGUgVGFnUHJvcGVydHkgPSBzdHJpbmcgfCAoc3RyaW5nIHwgbnVsbClbXVxuXG5pbnRlcmZhY2UgTWV0YWRhdGEge1xuXHQvKipcblx0ICogQHNlZSB7QGxpbmsgQ2FjaGVkTWV0YWRhdGEudGFnc31cblx0ICovXG5cdHRhZ3M/OiBPbWl0PFRhZ0NhY2hlLCAncG9zaXRpb24nPltdO1xuXHQvKipcblx0ICogQHNlZSB7QGxpbmsgQ2FjaGVkTWV0YWRhdGEuZnJvbnRtYXR0ZXJ9XG5cdCAqL1xuXHRmcm9udG1hdHRlcj86IFBhcnRpYWw8RnJvbnRNYXR0ZXJDYWNoZT4gJiB7IHRhZz86IFRhZ1Byb3BlcnR5LCB0YWdzPzogVGFnUHJvcGVydHkgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNZXRhZGF0YVJlcG9zaXRvcnkge1xuXHQvKipcblx0ICogQHNlZSB7QGxpbmsgTWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGV9XG5cdCAqL1xuXHRnZXRGaWxlQ2FjaGUoZmlsZTogVEZpbGUpOiBNZXRhZGF0YSB8IG51bGxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNZXRhZGF0YUZpbHRlciB7XG5cdGFwcGxpZXNUbyhtZXRhZGF0YTogTWV0YWRhdGEgfCBudWxsKTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIE1ldGFkYXRhVGFnRmlsdGVyIGltcGxlbWVudHMgTWV0YWRhdGFGaWx0ZXIge1xuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY2hlY2tlcjogU3RyaW5nQ2hlY2tlclxuXHQpIHsgfVxuXG5cdGFwcGxpZXNUbyhtZXRhZGF0YTogTWV0YWRhdGEgfCBudWxsKTogYm9vbGVhbiB7XG5cdFx0Y29uc29sZS5sb2codGhpcywgXCJhcHBsaWVzVG9cIiwgbWV0YWRhdGEpXG5cdFx0Y29uc3QgdGFncyA9IG1ldGFkYXRhPy50YWdzXG5cdFx0aWYgKHRhZ3MgIT0gbnVsbCkge1xuXHRcdFx0aWYgKHRhZ3Muc29tZSh0YWcgPT4gdGhpcy5jaGVja2VyLm1hdGNoZXMoYCMke3RhZy50YWd9YCkpKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgZnJvbnRtYXR0ZXIgPSBtZXRhZGF0YT8uZnJvbnRtYXR0ZXJcblx0XHRpZiAoZnJvbnRtYXR0ZXIgPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuXHRcdGlmICh0aGlzLmNoZWNrVGFncyhmcm9udG1hdHRlci50YWcpKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZVxuXHRcdH1cblx0XHRpZiAodGhpcy5jaGVja1RhZ3MoZnJvbnRtYXR0ZXIudGFncykpIHtcblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0cHJpdmF0ZSBjaGVja1RhZ3ModGFncz86IFRhZ1Byb3BlcnR5KSB7XG5cdFx0aWYgKHRhZ3MgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRpZiAodHlwZW9mIHRhZ3MgPT09IFwic3RyaW5nXCIpIHtcblx0XHRcdGNvbnN0IG1hdGNoID0gdGhpcy5jaGVja2VyLm1hdGNoZXModGFncylcblx0XHRcdHJldHVybiBtYXRjaFxuXHRcdH1cblx0XHRpZiAoQXJyYXkuaXNBcnJheSh0YWdzKSkge1xuXHRcdFx0Y29uc3QgbWF0Y2ggPSB0YWdzLnNvbWUodGFnID0+IHRhZyAhPSBudWxsICYmIHRoaXMuY2hlY2tlci5tYXRjaGVzKHRhZykpXG5cdFx0XHRyZXR1cm4gbWF0Y2hcblx0XHR9XG5cdH1cblxufVxuXG5leHBvcnQgY2xhc3MgRmlsZVRhZ3NGaWx0ZXIgaW1wbGVtZW50cyBGaWxlRmlsdGVyIHtcblxuXHRwcml2YXRlIHJlYWRvbmx5IG1ldGFkYXRhRmlsdGVyOiBNZXRhZGF0YUZpbHRlcjtcblxuXHRjb25zdHJ1Y3Rvcihcblx0XHR0YWdDaGVja2VyOiBTdHJpbmdDaGVja2VyLFxuXG5cdFx0cHJpdmF0ZSByZWFkb25seSBtZXRhZGF0YTogTWV0YWRhdGFSZXBvc2l0b3J5XG5cdCkge1xuXHRcdHRoaXMubWV0YWRhdGFGaWx0ZXIgPSBuZXcgTWV0YWRhdGFUYWdGaWx0ZXIodGFnQ2hlY2tlcilcblx0fVxuXG5cdGFzeW5jIGFwcGxpZXNUbyhmaWxlOiBURmlsZSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IGNhY2hlID0gdGhpcy5tZXRhZGF0YS5nZXRGaWxlQ2FjaGUoZmlsZSlcblx0XHRyZXR1cm4gdGhpcy5tZXRhZGF0YUZpbHRlci5hcHBsaWVzVG8oY2FjaGUpXG5cdH1cblxuXHRhbmQ8UiBleHRlbmRzIFBhcnRpYWw8VEZpbGU+PihmaWx0ZXI6IEZpbGVGaWx0ZXI8Uj4pOiBGaWxlRmlsdGVyPFRGaWxlICYgUj4ge1xuXHRcdHJldHVybiBtYXRjaEFsbCh0aGlzLCBmaWx0ZXIgYXMgRmlsZUZpbHRlcilcblx0fVxuXG5cdG9yPFIgZXh0ZW5kcyBQYXJ0aWFsPFRGaWxlPj4oZmlsdGVyOiBGaWxlRmlsdGVyPFI+KTogRmlsZUZpbHRlcjxURmlsZSAmIFI+IHtcblx0XHRyZXR1cm4gb3IodGhpcywgZmlsdGVyIGFzIEZpbGVGaWx0ZXIpXG5cdH1cbn1cbiIsImltcG9ydCB7IEZpbGVGaWx0ZXIgfSBmcm9tIFwic3JjL2ZpbHRlcnMvRmlsZUZpbHRlclwiO1xuaW1wb3J0IHsgUGFyZW50UGFyc2VyLCBQYXJzZXIsIGlzUGFyZW50UGFyc2VyIH0gZnJvbSBcIi4vUGFyc2VyXCI7XG5pbXBvcnQgeyBTdWJRdWVyeVBhcnNlciB9IGZyb20gXCIuL3N1YnF1ZXJ5L1N1YlF1ZXJ5UGFyc2VyXCI7XG5pbXBvcnQgeyBpc1N0cmluZ0NoZWNrZXIgfSBmcm9tIFwic3JjL2NoZWNrZXJzL1N0cmluZ0NoZWNrZXJcIjtcbmltcG9ydCB7IEZpbGVOYW1lRmlsdGVyIH0gZnJvbSBcInNyYy9maWx0ZXJzL0ZpbGVOYW1lRmlsdGVyXCI7XG5pbXBvcnQgeyBGaWxlUGF0aEZpbHRlciB9IGZyb20gXCJzcmMvZmlsdGVycy9GaWxlUGF0aEZpbHRlclwiO1xuaW1wb3J0IHsgRGVmYXVsdFN1YlF1ZXJ5UGFyc2VyIH0gZnJvbSBcIi4vc3VicXVlcnkvRGVmYXVsdFN1YlF1ZXJ5UGFyc2VyXCI7XG5pbXBvcnQgeyBGaWxlQ29udGVudEZpbHRlciB9IGZyb20gXCJzcmMvZmlsdGVycy9GaWxlQ29udGVudEZpbHRlclwiO1xuaW1wb3J0IHsgRmlsZVRhZ3NGaWx0ZXIgfSBmcm9tIFwic3JjL2ZpbHRlcnMvRmlsZVRhZ3NGaWx0ZXJcIjtcbmltcG9ydCB7IE1ldGFkYXRhQ2FjaGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IFN1YlF1ZXJ5R3JvdXBQYXJzZXIgfSBmcm9tIFwiLi9zdWJxdWVyeS9TdWJRdWVyeUdyb3VwUGFyc2VyXCI7XG5cbmV4cG9ydCBjbGFzcyBPcGVyYXRvclBhcnNlciBpbXBsZW1lbnRzIFBhcmVudFBhcnNlciB7XG4gICAgcHVibGljIHN0YXRpYyBzdGFydChcbiAgICAgICAgb3BlcmF0b3I6IHN0cmluZyxcbiAgICAgICAgbWV0YWRhdGE6IE1ldGFkYXRhQ2FjaGUsXG4gICAgICAgIG1hdGNoQ2FzZT86IGJvb2xlYW4sXG4gICAgKTogT3BlcmF0b3JQYXJzZXIge1xuICAgICAgICByZXR1cm4gbmV3IE9wZXJhdG9yUGFyc2VyKFxuICAgICAgICAgICAgb3BlcmF0b3IsXG4gICAgICAgICAgICBtZXRhZGF0YSxcbiAgICAgICAgICAgIG5ldyBEZWZhdWx0U3ViUXVlcnlQYXJzZXIobWF0Y2hDYXNlKSxcbiAgICAgICAgICAgIG1hdGNoQ2FzZSxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcml2YXRlIHJlYWRvbmx5IG9wZXJhdG9yOiBzdHJpbmcsXG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgbWV0YWRhdGE6IE1ldGFkYXRhQ2FjaGUsXG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgaW50ZXJuYWxQYXJzZXI6IFN1YlF1ZXJ5UGFyc2VyLFxuICAgICAgICBwcml2YXRlIHJlYWRvbmx5IG1hdGNoQ2FzZT86IGJvb2xlYW4sXG4gICAgKSB7fVxuXG4gICAgcGFyc2UoY2hhcjogc3RyaW5nKTogUGFyc2VyIHwgbnVsbCB7XG4gICAgICAgIGlmICh0aGlzLm9wZXJhdG9yID09PSBcInRhZ1wiICYmIGNoYXIgPT09IFwiI1wiKSByZXR1cm4gdGhpcztcblxuICAgICAgICBjb25zdCBuZXh0UGFyc2VyID0gdGhpcy5pbnRlcm5hbFBhcnNlci5wYXJzZShjaGFyKTtcbiAgICAgICAgaWYgKG5leHRQYXJzZXIgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBPcGVyYXRvclBhcnNlcihcbiAgICAgICAgICAgIHRoaXMub3BlcmF0b3IsXG4gICAgICAgICAgICB0aGlzLm1ldGFkYXRhLFxuICAgICAgICAgICAgbmV4dFBhcnNlcixcbiAgICAgICAgICAgIHRoaXMubWF0Y2hDYXNlLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIGNvbnRhaW5zTmVzdGVkR3JvdXBQYXJzZXIoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICB0aGlzLmludGVybmFsUGFyc2VyIGluc3RhbmNlb2YgU3ViUXVlcnlHcm91cFBhcnNlciB8fFxuICAgICAgICAgICAgKGlzUGFyZW50UGFyc2VyKHRoaXMuaW50ZXJuYWxQYXJzZXIpICYmXG4gICAgICAgICAgICAgICAgdGhpcy5pbnRlcm5hbFBhcnNlci5jb250YWluc05lc3RlZEdyb3VwUGFyc2VyKCkpXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgZW5kKGFjdGl2ZUZpbHRlcjogRmlsZUZpbHRlcik6IEZpbGVGaWx0ZXIge1xuICAgICAgICBjb25zdCBjaGVja2VyID0gdGhpcy5pbnRlcm5hbFBhcnNlci5lbmQoKTtcbiAgICAgICAgaWYgKGlzU3RyaW5nQ2hlY2tlcihjaGVja2VyKSkge1xuICAgICAgICAgICAgc3dpdGNoICh0aGlzLm9wZXJhdG9yKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcImZpbGVcIjoge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWN0aXZlRmlsdGVyLmFuZChuZXcgRmlsZU5hbWVGaWx0ZXIoY2hlY2tlcikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXNlIFwicGF0aFwiOiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY3RpdmVGaWx0ZXIuYW5kKG5ldyBGaWxlUGF0aEZpbHRlcihjaGVja2VyKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhc2UgXCJjb250ZW50XCI6IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjdGl2ZUZpbHRlci5hbmQobmV3IEZpbGVDb250ZW50RmlsdGVyKGNoZWNrZXIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FzZSBcInRhZ1wiOiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY3RpdmVGaWx0ZXIuYW5kKFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEZpbGVUYWdzRmlsdGVyKGNoZWNrZXIsIHRoaXMubWV0YWRhdGEpLFxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWN0aXZlRmlsdGVyO1xuICAgIH1cbn1cbiIsImltcG9ydCB0eXBlIHtcblx0Q2FjaGVkTWV0YWRhdGEsXG5cdE1ldGFkYXRhQ2FjaGUsXG5cdFRGaWxlLFxufSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEZpbGVGaWx0ZXIgfSBmcm9tIFwic3JjL2ZpbHRlcnMvRmlsZUZpbHRlclwiO1xuaW1wb3J0IHsgU3RyaW5nQ2hlY2tlciB9IGZyb20gXCIuLi9jaGVja2Vycy9TdHJpbmdDaGVja2VyXCI7XG5pbXBvcnQgeyBtYXRjaEFsbCB9IGZyb20gXCIuL01hdGNoQWxsRmlsdGVyXCI7XG5pbXBvcnQgeyBvciB9IGZyb20gXCIuL09yRmlsdGVyXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWV0YWRhdGEgZXh0ZW5kcyBQaWNrPE1ldGFkYXRhQ2FjaGUsIFwiZ2V0RmlsZUNhY2hlXCI+IHtcblx0Z2V0RmlsZUNhY2hlKGZpbGU6IFRGaWxlKTogbnVsbCB8IFBpY2s8Q2FjaGVkTWV0YWRhdGEsIFwiZnJvbnRtYXR0ZXJcIj47XG59XG5cbmV4cG9ydCBjbGFzcyBNZXRhdGRhdGFQcm9wZXJ0eUZpbHRlciB7XG5cblx0Y29uc3RydWN0b3IoXG5cdFx0cHJpdmF0ZSBwcm9wZXJ0eTogU3RyaW5nQ2hlY2tlcixcblx0XHRwcml2YXRlIHZhbHVlPzogU3RyaW5nQ2hlY2tlcixcblx0KSB7IH1cblxuXHRhcHBsaWVzVG8obWV0YWRhdGE6IFBpY2s8Q2FjaGVkTWV0YWRhdGEsICdmcm9udG1hdHRlcic+IHwgbnVsbCk6IGJvb2xlYW4ge1xuXHRcdGNvbnN0IHByb3BlcnRpZXMgPSBtZXRhZGF0YT8uZnJvbnRtYXR0ZXJcblx0XHRpZiAocHJvcGVydGllcyA9PSBudWxsKSByZXR1cm4gZmFsc2U7XG5cdFx0Y29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHByb3BlcnRpZXMpLmZpbHRlcigoa2V5KSA9PlxuXHRcdFx0dGhpcy5wcm9wZXJ0eS5tYXRjaGVzKGtleSksXG5cdFx0KTtcblx0XHRpZiAoa2V5cy5sZW5ndGggPT09IDApIHJldHVybiBmYWxzZTtcblxuXHRcdGlmICh0aGlzLnZhbHVlID09IG51bGwpIHJldHVybiB0cnVlO1xuXG5cdFx0cmV0dXJuIGtleXMuc29tZSgoa2V5KSA9PiB7XG5cdFx0XHRpZiAoIU9iamVjdC5oYXNPd24ocHJvcGVydGllcywga2V5KSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRjb25zdCB2YWx1ZSA9IHByb3BlcnRpZXNba2V5XT8udG9TdHJpbmcoKTtcblxuXHRcdFx0cmV0dXJuIHRoaXMudmFsdWUhLm1hdGNoZXModmFsdWUpO1xuXHRcdH0pO1xuXHR9XG5cbn1cblxuZXhwb3J0IGNsYXNzIEZpbGVQcm9wZXJ0eUZpbHRlciBpbXBsZW1lbnRzIEZpbGVGaWx0ZXIge1xuXG5cdHByaXZhdGUgcmVhZG9ubHkgbWV0YWRhdGFGaWx0ZXI6IE1ldGF0ZGF0YVByb3BlcnR5RmlsdGVyO1xuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgbWV0YWRhdGE6IE1ldGFkYXRhLFxuXG5cdFx0cHJvcGVydHk6IFN0cmluZ0NoZWNrZXIsXG5cdFx0dmFsdWU/OiBTdHJpbmdDaGVja2VyLFxuXHQpIHtcblx0XHR0aGlzLm1ldGFkYXRhRmlsdGVyID0gbmV3IE1ldGF0ZGF0YVByb3BlcnR5RmlsdGVyKHByb3BlcnR5LCB2YWx1ZSlcblx0fVxuXG5cdGFzeW5jIGFwcGxpZXNUbyhmaWxlOiBURmlsZSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IGNhY2hlID0gdGhpcy5tZXRhZGF0YS5nZXRGaWxlQ2FjaGUoZmlsZSlcblx0XHRyZXR1cm4gdGhpcy5tZXRhZGF0YUZpbHRlci5hcHBsaWVzVG8oY2FjaGUpXG5cdH1cblxuXHRhbmQ8UiBleHRlbmRzIFBhcnRpYWw8VEZpbGU+PihmaWx0ZXI6IEZpbGVGaWx0ZXI8Uj4pOiBGaWxlRmlsdGVyPFRGaWxlICYgUj4ge1xuXHRcdHJldHVybiBtYXRjaEFsbCh0aGlzLCBmaWx0ZXIgYXMgRmlsZUZpbHRlcilcblx0fVxuXG5cdG9yPFIgZXh0ZW5kcyBQYXJ0aWFsPFRGaWxlPj4oZmlsdGVyOiBGaWxlRmlsdGVyPFI+KTogRmlsZUZpbHRlcjxURmlsZSAmIFI+IHtcblx0XHRyZXR1cm4gb3IodGhpcywgZmlsdGVyIGFzIEZpbGVGaWx0ZXIpXG5cdH1cbn1cbiIsImltcG9ydCB0eXBlIHsgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEZpbGVGaWx0ZXIgfSBmcm9tIFwiLi9GaWxlRmlsdGVyXCI7XG5pbXBvcnQgeyBtYXRjaEFsbCB9IGZyb20gXCIuL01hdGNoQWxsRmlsdGVyXCI7XG5pbXBvcnQgeyBvciB9IGZyb20gXCIuL09yRmlsdGVyXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBuZWdhdGU8RmlsZVBhcnQgZXh0ZW5kcyBQYXJ0aWFsPFRGaWxlPj4oXG5cdGZpbHRlcjogRmlsZUZpbHRlcjxGaWxlUGFydD4sXG4pOiBGaWxlRmlsdGVyPEZpbGVQYXJ0PjtcbmV4cG9ydCBmdW5jdGlvbiBuZWdhdGU8RmlsZVBhcnQgZXh0ZW5kcyBQYXJ0aWFsPFRGaWxlPj4oXG5cdGZpbHRlcnM6IEZpbGVGaWx0ZXI8RmlsZVBhcnQ+W10sXG4pOiBGaWxlRmlsdGVyPEZpbGVQYXJ0PjtcbmV4cG9ydCBmdW5jdGlvbiBuZWdhdGU8RmlsZVBhcnQgZXh0ZW5kcyBQYXJ0aWFsPFRGaWxlPj4oXG5cdGZpbHRlcnM6IEZpbGVGaWx0ZXI8RmlsZVBhcnQ+IHwgRmlsZUZpbHRlcjxGaWxlUGFydD5bXSxcbik6IEZpbGVGaWx0ZXI8RmlsZVBhcnQ+IHtcblx0aWYgKEFycmF5LmlzQXJyYXkoZmlsdGVycykpIHtcblx0XHRyZXR1cm4gbmVnYXRlU2luZ2xlKG1hdGNoQWxsKGZpbHRlcnMpKTtcblx0fVxuXHRyZXR1cm4gbmVnYXRlU2luZ2xlKGZpbHRlcnMpO1xufVxuXG5mdW5jdGlvbiBuZWdhdGVTaW5nbGU8RmlsZVBhcnQgZXh0ZW5kcyBQYXJ0aWFsPFRGaWxlPj4oZmlsdGVyOiBGaWxlRmlsdGVyPEZpbGVQYXJ0Pik6IEZpbGVGaWx0ZXI8RmlsZVBhcnQ+IHtcblx0aWYgKGZpbHRlciBpbnN0YW5jZW9mIE5lZ2F0aW9uKSByZXR1cm4gZmlsdGVyLm5lZ2F0ZSgpO1xuXHRyZXR1cm4gbmV3IE5lZ2F0aW9uKGZpbHRlcilcbn1cblxuZXhwb3J0IGNsYXNzIE5lZ2F0aW9uPEZpbGVQYXJ0IGV4dGVuZHMgUGFydGlhbDxURmlsZT4gPSBURmlsZT5cblx0aW1wbGVtZW50cyBGaWxlRmlsdGVyPEZpbGVQYXJ0PiB7XG5cdGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgbmVnYXRlZDogRmlsZUZpbHRlcjxGaWxlUGFydD4pIHsgfVxuXG5cdGFzeW5jIGFwcGxpZXNUbyhmaWxlOiBGaWxlUGFydCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdHJldHVybiAhdGhpcy5uZWdhdGVkLmFwcGxpZXNUbyhmaWxlKTtcblx0fVxuXG5cdG5lZ2F0ZSgpOiBGaWxlRmlsdGVyPEZpbGVQYXJ0PiB7IHJldHVybiB0aGlzLm5lZ2F0ZWQgfVxuXG5cdGFuZDxSIGV4dGVuZHMgUGFydGlhbDxURmlsZT4+KGZpbHRlcjogRmlsZUZpbHRlcjxSPik6IEZpbGVGaWx0ZXI8RmlsZVBhcnQgJiBSPiB7XG5cdFx0cmV0dXJuIG1hdGNoQWxsKHRoaXMsIGZpbHRlciBhcyBhbnkpXG5cdH1cblxuXHRvcjxSIGV4dGVuZHMgUGFydGlhbDxURmlsZT4+KGZpbHRlcjogRmlsZUZpbHRlcjxSPik6IEZpbGVGaWx0ZXI8RmlsZVBhcnQgJiBSPiB7XG5cdFx0cmV0dXJuIG9yKHRoaXMsIGZpbHRlciBhcyBhbnkpXG5cdH1cbn1cbiIsImltcG9ydCB7IE1ldGFkYXRhQ2FjaGUsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBTdHJpbmdDaGVja2VyIH0gZnJvbSBcInNyYy9jaGVja2Vycy9TdHJpbmdDaGVja2VyXCI7XG5pbXBvcnQgeyBGaWxlRmlsdGVyLCBpc0ZpbGVGaWx0ZXIsIG1hdGNoQWxsIH0gZnJvbSBcInNyYy9maWx0ZXJzXCI7XG5pbXBvcnQgeyBQYXJzZXIgfSBmcm9tIFwiLi9QYXJzZXJcIjtcbmltcG9ydCB7IERlZmF1bHRQYXJzZXIgfSBmcm9tIFwiLi9EZWZhdWx0UGFyc2VyXCI7XG5pbXBvcnQgeyBFbXRweUZpbHRlciB9IGZyb20gXCJzcmMvbWFpblwiO1xuXG5leHBvcnQgY2xhc3MgRWl0aGVyUGVyc2VyIGltcGxlbWVudHMgUGFyc2VyIHtcblxuICAgIHN0YXRpYyBzdGFydChcbiAgICAgICAgbWV0YWRhdGE6IE1ldGFkYXRhQ2FjaGUsXG4gICAgICAgIGZpbHRlclR5cGU/OiAoY2hlY2tlcjogU3RyaW5nQ2hlY2tlcikgPT4gRmlsZUZpbHRlcixcbiAgICAgICAgbWF0Y2hDYXNlPzogYm9vbGVhblxuICAgICkge1xuICAgICAgICByZXR1cm4gbmV3IEVpdGhlclBlcnNlcihtZXRhZGF0YSwgZmlsdGVyVHlwZSwgbWF0Y2hDYXNlKVxuICAgIH1cblxuICAgIHByaXZhdGUgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgbWV0YWRhdGE6IE1ldGFkYXRhQ2FjaGUsXG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgZmlsdGVyVHlwZT86IChjaGVja2VyOiBTdHJpbmdDaGVja2VyKSA9PiBGaWxlRmlsdGVyLFxuICAgICAgICBwcml2YXRlIHJlYWRvbmx5IG1hdGNoQ2FzZT86IGJvb2xlYW4sXG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgY29sbGVjdGVkQkZpbHRlcnM6IHJlYWRvbmx5IEZpbGVGaWx0ZXJbXSA9IFtdLFxuICAgICAgICBwcml2YXRlIGludGVybmFsUGFyc2VyOiBQYXJzZXIgPSBuZXcgRGVmYXVsdFBhcnNlcihtZXRhZGF0YSwgZmlsdGVyVHlwZSwgbWF0Y2hDYXNlKVxuICAgICkge1xuICAgIH1cblxuICAgIHBhcnNlKGNoYXI6IHN0cmluZyk6IFBhcnNlciB8IG51bGwge1xuICAgICAgICBjb25zdCBuZXh0UGFyc2VyID0gdGhpcy5pbnRlcm5hbFBhcnNlci5wYXJzZShjaGFyKVxuICAgICAgICBpZiAobmV4dFBhcnNlciA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXJPckNoZWNrZXIgPSB0aGlzLmludGVybmFsUGFyc2VyLmVuZChFbXRweUZpbHRlcilcbiAgICAgICAgICAgIGlmIChpc0ZpbGVGaWx0ZXIoZmlsdGVyT3JDaGVja2VyKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRWl0aGVyUGVyc2VyKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbHRlclR5cGUsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWF0Y2hDYXNlLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbGxlY3RlZEJGaWx0ZXJzLmNvbmNhdChbZmlsdGVyT3JDaGVja2VyXSlcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IEVpdGhlclBlcnNlcihcbiAgICAgICAgICAgICAgICB0aGlzLm1ldGFkYXRhLFxuICAgICAgICAgICAgICAgIHRoaXMuZmlsdGVyVHlwZSxcbiAgICAgICAgICAgICAgICB0aGlzLm1hdGNoQ2FzZVxuICAgICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgRWl0aGVyUGVyc2VyKFxuICAgICAgICAgICAgdGhpcy5tZXRhZGF0YSxcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyVHlwZSxcbiAgICAgICAgICAgIHRoaXMubWF0Y2hDYXNlLFxuICAgICAgICAgICAgdGhpcy5jb2xsZWN0ZWRCRmlsdGVycyxcbiAgICAgICAgICAgIG5leHRQYXJzZXIsXG4gICAgICAgIClcbiAgICB9XG5cbiAgICBlbmQoYWN0aXZlRmlsdGVyOiBGaWxlRmlsdGVyKTogRmlsZUZpbHRlcjxURmlsZT4ge1xuICAgICAgICBjb25zdCBmaWx0ZXJPckNoZWNrZXIgPSB0aGlzLmludGVybmFsUGFyc2VyLmVuZChFbXRweUZpbHRlcilcbiAgICAgICAgaWYgKGlzRmlsZUZpbHRlcihmaWx0ZXJPckNoZWNrZXIpKSB7XG4gICAgICAgICAgICByZXR1cm4gYWN0aXZlRmlsdGVyLm9yKG1hdGNoQWxsKHRoaXMuY29sbGVjdGVkQkZpbHRlcnMuY29uY2F0KFtmaWx0ZXJPckNoZWNrZXJdKSkpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjdGl2ZUZpbHRlclxuICAgIH1cblxufSIsImltcG9ydCB7IFN0cmluZ0NoZWNrZXIgfSBmcm9tIFwic3JjL2NoZWNrZXJzL1N0cmluZ0NoZWNrZXJcIjtcbmltcG9ydCB7IE9wZXJhdG9yUGFyc2VyIH0gZnJvbSBcIi4vT3BlcmF0b3JQYXJzZXJcIjtcbmltcG9ydCB7IFBhcnNlciB9IGZyb20gXCIuL1BhcnNlclwiO1xuaW1wb3J0IHsgRmlsZUZpbHRlciB9IGZyb20gXCJzcmMvZmlsdGVycy9GaWxlRmlsdGVyXCI7XG5pbXBvcnQgeyBTdWJRdWVyeVdvcmRQYXJzZXIgfSBmcm9tIFwiLi9zdWJxdWVyeS9TdWJRdWVyeVdvcmRQYXJzZXJcIjtcbmltcG9ydCB7IE1ldGFkYXRhQ2FjaGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IERlZmF1bHRQYXJzZXIgfSBmcm9tIFwiLi9EZWZhdWx0UGFyc2VyXCI7XG5pbXBvcnQgeyBFaXRoZXJQZXJzZXIgfSBmcm9tIFwiLi9FaXRoZXJQYXJzZXJcIjtcbmltcG9ydCB7IG1hdGNoQWxsIH0gZnJvbSBcInNyYy9maWx0ZXJzXCI7XG5cbmV4cG9ydCBjbGFzcyBXb3JkUGFyc2VyIGltcGxlbWVudHMgUGFyc2VyIHtcbiAgICBwdWJsaWMgc3RhdGljIHN0YXJ0KFxuICAgICAgICBidWZmZXI6IHN0cmluZyxcbiAgICAgICAgZmlsdGVyVHlwZTogKGNoZWNrZXI6IFN0cmluZ0NoZWNrZXIpID0+IEZpbGVGaWx0ZXIsXG4gICAgICAgIG1ldGFkYXRhOiBNZXRhZGF0YUNhY2hlLFxuICAgICAgICBtYXRjaENhc2U/OiBib29sZWFuLFxuICAgICk6IFdvcmRQYXJzZXIge1xuICAgICAgICByZXR1cm4gbmV3IFdvcmRQYXJzZXIoXG4gICAgICAgICAgICBuZXcgU3ViUXVlcnlXb3JkUGFyc2VyKGJ1ZmZlciwgbWF0Y2hDYXNlKSxcbiAgICAgICAgICAgIGZpbHRlclR5cGUsXG4gICAgICAgICAgICBtZXRhZGF0YSxcbiAgICAgICAgICAgIG1hdGNoQ2FzZVxuICAgICAgICApXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBzdWJQYXJzZXI6IFN1YlF1ZXJ5V29yZFBhcnNlcixcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBmaWx0ZXJUeXBlOiAoY2hlY2tlcjogU3RyaW5nQ2hlY2tlcikgPT4gRmlsZUZpbHRlcixcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBtZXRhZGF0YTogTWV0YWRhdGFDYWNoZSxcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBtYXRjaENhc2U/OiBib29sZWFuLFxuICAgICkge31cblxuICAgIHByaXZhdGUgZ2V0IGJ1ZmZlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3ViUGFyc2VyLmJ1ZmZlclxuICAgIH1cblxuICAgIHBhcnNlKGNoYXI6IHN0cmluZyk6IFBhcnNlciB8IG51bGwge1xuICAgICAgICBpZiAoY2hhciA9PT0gYDpgKSB7XG4gICAgICAgICAgICBjb25zdCBidWZmZXIgPSB0aGlzLnN1YlBhcnNlci5idWZmZXI7XG4gICAgICAgICAgICBzd2l0Y2ggKGJ1ZmZlcikge1xuICAgICAgICAgICAgICAgIGNhc2UgYGZpbGVgOlxuICAgICAgICAgICAgICAgIGNhc2UgYHBhdGhgOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJjb250ZW50XCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcInRhZ1wiOiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBPcGVyYXRvclBhcnNlci5zdGFydChidWZmZXIsIHRoaXMubWV0YWRhdGEsIHRoaXMubWF0Y2hDYXNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IERlZmF1bHRQYXJzZXIodGhpcy5tZXRhZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmV4dFBhcnNlciA9IHRoaXMuc3ViUGFyc2VyLnBhcnNlKGNoYXIpO1xuICAgICAgICBpZiAobmV4dFBhcnNlciA9PSBudWxsKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHRoaXMuYnVmZmVyLnRvTG9jYWxlTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwib3JcIjoge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gRWl0aGVyUGVyc2VyLnN0YXJ0KHRoaXMubWV0YWRhdGEsIHRoaXMuZmlsdGVyVHlwZSwgdGhpcy5tYXRjaENhc2UpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhc2UgXCJhbmRcIjoge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IERlZmF1bHRQYXJzZXIodGhpcy5tZXRhZGF0YSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFdvcmRQYXJzZXIoXG4gICAgICAgICAgICBuZXh0UGFyc2VyLFxuICAgICAgICAgICAgdGhpcy5maWx0ZXJUeXBlLFxuICAgICAgICAgICAgdGhpcy5tZXRhZGF0YSxcbiAgICAgICAgICAgIHRoaXMubWF0Y2hDYXNlXG4gICAgICAgIClcbiAgICB9XG5cbiAgICBlbmQoYWN0aXZlRmlsdGVyOiBGaWxlRmlsdGVyKTogRmlsZUZpbHRlciB7XG4gICAgICAgIGNvbnN0IGNoZWNrZXIgPSB0aGlzLnN1YlBhcnNlci5lbmQoKTtcbiAgICAgICAgaWYgKGNoZWNrZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGFjdGl2ZUZpbHRlci5hbmQodGhpcy5maWx0ZXJUeXBlKGNoZWNrZXIpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY3RpdmVGaWx0ZXJcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBGaWxlRmlsdGVyLCBpc0ZpbGVGaWx0ZXIgfSBmcm9tIFwic3JjL2ZpbHRlcnMvRmlsZUZpbHRlclwiO1xuaW1wb3J0IHsgRGVmYXVsdFBhcnNlciB9IGZyb20gXCIuL0RlZmF1bHRQYXJzZXJcIjtcbmltcG9ydCB7IFBhcnNlciwgUGFyZW50UGFyc2VyLCBpc1BhcmVudFBhcnNlciB9IGZyb20gXCIuL1BhcnNlclwiO1xuaW1wb3J0IHsgU3RyaW5nQ2hlY2tlciB9IGZyb20gXCJzcmMvY2hlY2tlcnMvU3RyaW5nQ2hlY2tlclwiO1xuaW1wb3J0IHsgTWV0YWRhdGFDYWNoZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgV29yZFBhcnNlciB9IGZyb20gXCIuL1dvcmRQYXJzZXJcIjtcbmltcG9ydCB7IEVtdHB5RmlsdGVyIH0gZnJvbSBcInNyYy9tYWluXCI7XG5cbmxldCBfbm9uR3JvdXBQYXJzZXJzOiBGdW5jdGlvbltdIHwgdW5kZWZpbmVkO1xuZnVuY3Rpb24gTm9uR3JvdXBQYXJzZXJzKCkge1xuICAgIGlmIChfbm9uR3JvdXBQYXJzZXJzID09IG51bGwpIHtcbiAgICAgICAgX25vbkdyb3VwUGFyc2VycyA9IFtEZWZhdWx0UGFyc2VyLCBXb3JkUGFyc2VyXTtcbiAgICB9XG4gICAgcmV0dXJuIF9ub25Hcm91cFBhcnNlcnM7XG59XG5cbmV4cG9ydCBjbGFzcyBHcm91cFBhcnNlciBpbXBsZW1lbnRzIFBhcmVudFBhcnNlciB7XG4gICAgcHVibGljIHN0YXRpYyBzdGFydChcbiAgICAgICAgbWV0YWRhdGE6IE1ldGFkYXRhQ2FjaGUsXG4gICAgICAgIGZpbHRlclR5cGU6IChjaGVja2VyOiBTdHJpbmdDaGVja2VyKSA9PiBGaWxlRmlsdGVyLFxuICAgICAgICBtYXRjaENhc2U/OiBib29sZWFuLFxuICAgICk6IEdyb3VwUGFyc2VyIHtcbiAgICAgICAgcmV0dXJuIG5ldyBHcm91cFBhcnNlcihcbiAgICAgICAgICAgIG1ldGFkYXRhLFxuICAgICAgICAgICAgZmlsdGVyVHlwZSxcbiAgICAgICAgICAgIEVtdHB5RmlsdGVyLFxuICAgICAgICAgICAgbmV3IERlZmF1bHRQYXJzZXIobWV0YWRhdGEsIGZpbHRlclR5cGUsIG1hdGNoQ2FzZSksXG4gICAgICAgICAgICBtYXRjaENhc2UsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBtZXRhZGF0YTogTWV0YWRhdGFDYWNoZSxcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBmaWx0ZXJUeXBlOiAoY2hlY2tlcjogU3RyaW5nQ2hlY2tlcikgPT4gRmlsZUZpbHRlcixcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBpbnRlcm5hbEZpbHRlcjogRmlsZUZpbHRlcixcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBpbnRlcm5hbFBhcnNlcjogUGFyc2VyLFxuICAgICAgICBwcml2YXRlIHJlYWRvbmx5IG1hdGNoQ2FzZT86IGJvb2xlYW4sXG4gICAgKSB7fVxuXG4gICAgcGFyc2UoY2hhcjogc3RyaW5nKTogUGFyc2VyIHwgbnVsbCB7XG4gICAgICAgIGlmIChjaGFyID09PSBgKWAgJiYgIXRoaXMuY29udGFpbnNOZXN0ZWRHcm91cFBhcnNlcigpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5leHRQYXJzZXIgPSB0aGlzLmludGVybmFsUGFyc2VyLnBhcnNlKGNoYXIpO1xuICAgICAgICBpZiAobmV4dFBhcnNlciAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEdyb3VwUGFyc2VyKFxuICAgICAgICAgICAgICAgIHRoaXMubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgdGhpcy5maWx0ZXJUeXBlLFxuICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJuYWxGaWx0ZXIsXG4gICAgICAgICAgICAgICAgbmV4dFBhcnNlcixcbiAgICAgICAgICAgICAgICB0aGlzLm1hdGNoQ2FzZSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSB0aGlzLmVuZEludGVybmFsUGFyc2VyKCk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEdyb3VwUGFyc2VyKFxuICAgICAgICAgICAgICAgIHRoaXMubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgdGhpcy5maWx0ZXJUeXBlLFxuICAgICAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgICAgICBuZXcgRGVmYXVsdFBhcnNlcihcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tZXRhZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maWx0ZXJUeXBlLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1hdGNoQ2FzZSxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIHRoaXMubWF0Y2hDYXNlLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnRhaW5zTmVzdGVkR3JvdXBQYXJzZXIoKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICB0aGlzLmludGVybmFsUGFyc2VyIGluc3RhbmNlb2YgR3JvdXBQYXJzZXIgfHxcbiAgICAgICAgICAgIChpc1BhcmVudFBhcnNlcih0aGlzLmludGVybmFsUGFyc2VyKSAmJlxuICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJuYWxQYXJzZXIuY29udGFpbnNOZXN0ZWRHcm91cFBhcnNlcigpKVxuICAgICAgICApO1xuICAgIH1cblxuICAgIHByaXZhdGUgZW5kSW50ZXJuYWxQYXJzZXIoKTogRmlsZUZpbHRlciB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IHRoaXMuaW50ZXJuYWxQYXJzZXIuZW5kKHRoaXMuaW50ZXJuYWxGaWx0ZXIpO1xuICAgICAgICBpZiAoaXNGaWxlRmlsdGVyKGZpbHRlcikpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5pbnRlcm5hbEZpbHRlcjtcbiAgICB9XG5cbiAgICBlbmQoYWN0aXZlRmlsdGVyOiBGaWxlRmlsdGVyKTogRmlsZUZpbHRlciB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IHRoaXMuZW5kSW50ZXJuYWxQYXJzZXIoKTtcbiAgICAgICAgcmV0dXJuIGFjdGl2ZUZpbHRlci5hbmQoZmlsdGVyKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBTdHJpbmdDaGVja2VyIH0gZnJvbSBcInNyYy9jaGVja2Vycy9TdHJpbmdDaGVja2VyXCI7XG5pbXBvcnQgeyBEZWZhdWx0UGFyc2VyIH0gZnJvbSBcIi4vRGVmYXVsdFBhcnNlclwiO1xuaW1wb3J0IHsgUGFyZW50UGFyc2VyLCBQYXJzZXIsIGlzUGFyZW50UGFyc2VyIH0gZnJvbSBcIi4vUGFyc2VyXCI7XG5pbXBvcnQgeyBGaWxlRmlsdGVyLCBpc0ZpbGVGaWx0ZXIgfSBmcm9tIFwic3JjL2ZpbHRlcnMvRmlsZUZpbHRlclwiO1xuaW1wb3J0IHsgbmVnYXRlIH0gZnJvbSBcInNyYy9maWx0ZXJzL05lZ2F0aW9uXCI7XG5pbXBvcnQgeyBNZXRhZGF0YUNhY2hlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBHcm91cFBhcnNlciB9IGZyb20gXCIuL0dyb3VwUGFyc2VyXCI7XG5pbXBvcnQgeyBFbXRweUZpbHRlciB9IGZyb20gXCJzcmMvbWFpblwiO1xuXG5leHBvcnQgY2xhc3MgTmVnYXRlZFBhcnNlciBpbXBsZW1lbnRzIFBhcmVudFBhcnNlciB7XG4gICAgcHVibGljIHN0YXRpYyBzdGFydChcbiAgICAgICAgbWV0YWRhdGE6IE1ldGFkYXRhQ2FjaGUsXG4gICAgICAgIGZpbHRlclR5cGU6IChjaGVja2VyOiBTdHJpbmdDaGVja2VyKSA9PiBGaWxlRmlsdGVyLFxuICAgICAgICBtYXRjaENhc2U/OiBib29sZWFuLFxuICAgICk6IE5lZ2F0ZWRQYXJzZXIge1xuICAgICAgICByZXR1cm4gbmV3IE5lZ2F0ZWRQYXJzZXIoXG4gICAgICAgICAgICBtZXRhZGF0YSxcbiAgICAgICAgICAgIGZpbHRlclR5cGUsXG4gICAgICAgICAgICBuZXcgRGVmYXVsdFBhcnNlcihtZXRhZGF0YSwgZmlsdGVyVHlwZSwgbWF0Y2hDYXNlKSxcbiAgICAgICAgICAgIG1hdGNoQ2FzZSxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBtZXRhZGF0YTogTWV0YWRhdGFDYWNoZSxcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBmaWx0ZXJUeXBlOiAoY2hlY2tlcjogU3RyaW5nQ2hlY2tlcikgPT4gRmlsZUZpbHRlcixcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBpbnRlcm5hbFBhcnNlcjogUGFyc2VyLFxuICAgICAgICBwcml2YXRlIHJlYWRvbmx5IG1hdGNoQ2FzZT86IGJvb2xlYW4sXG4gICAgKSB7fVxuXG4gICAgcGFyc2UoY2hhcjogc3RyaW5nKTogUGFyc2VyIHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IG5leHRQYXJzZXIgPSB0aGlzLmludGVybmFsUGFyc2VyLnBhcnNlKGNoYXIpO1xuICAgICAgICBpZiAobmV4dFBhcnNlciA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IE5lZ2F0ZWRQYXJzZXIoXG4gICAgICAgICAgICB0aGlzLm1ldGFkYXRhLFxuICAgICAgICAgICAgdGhpcy5maWx0ZXJUeXBlLFxuICAgICAgICAgICAgbmV4dFBhcnNlcixcbiAgICAgICAgICAgIHRoaXMubWF0Y2hDYXNlLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIGNvbnRhaW5zTmVzdGVkR3JvdXBQYXJzZXIoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICB0aGlzLmludGVybmFsUGFyc2VyIGluc3RhbmNlb2YgR3JvdXBQYXJzZXIgfHxcbiAgICAgICAgICAgIChpc1BhcmVudFBhcnNlcih0aGlzLmludGVybmFsUGFyc2VyKSAmJlxuICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJuYWxQYXJzZXIuY29udGFpbnNOZXN0ZWRHcm91cFBhcnNlcigpKVxuICAgICAgICApO1xuICAgIH1cblxuICAgIGVuZChhY3RpdmVGaWx0ZXI6IEZpbGVGaWx0ZXIpOiBGaWxlRmlsdGVyIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5pbnRlcm5hbFBhcnNlci5lbmQoRW10cHlGaWx0ZXIpO1xuICAgICAgICBpZiAoaXNGaWxlRmlsdGVyKHJlc3VsdCkpIHtcbiAgICAgICAgICAgIHJldHVybiBhY3RpdmVGaWx0ZXIuYW5kKG5lZ2F0ZShyZXN1bHQpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWN0aXZlRmlsdGVyXG4gICAgfVxufVxuIiwiaW1wb3J0IHsgRmlsZUZpbHRlciB9IGZyb20gXCJzcmMvZmlsdGVycy9GaWxlRmlsdGVyXCI7XG5pbXBvcnQgeyBQYXJzZXIgfSBmcm9tIFwiLi9QYXJzZXJcIjtcbmltcG9ydCB7IFN0cmluZ0NoZWNrZXIgfSBmcm9tIFwic3JjL2NoZWNrZXJzL1N0cmluZ0NoZWNrZXJcIjtcbmltcG9ydCB7IFN1YlF1ZXJ5UGhyYXNlUGFyc2VyIH0gZnJvbSBcIi4vc3VicXVlcnkvU3ViUXVlcnlQaHJhc2VQYXJzZXJcIjtcbmltcG9ydCB7IFN1YlF1ZXJ5UGFyc2VyIH0gZnJvbSBcIi4vc3VicXVlcnkvU3ViUXVlcnlQYXJzZXJcIjtcblxuZXhwb3J0IGNsYXNzIFBocmFzZVBhcnNlciBpbXBsZW1lbnRzIFBhcnNlciB7XG4gICAgcHJpdmF0ZSBzdWJQYXJzZXI6IFN1YlF1ZXJ5UGFyc2VyO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgZmlsdGVyVHlwZTogKGNoZWNrZXI6IFN0cmluZ0NoZWNrZXIpID0+IEZpbGVGaWx0ZXIsXG4gICAgICAgIG1hdGNoQ2FzZTogYm9vbGVhbiA9IHRydWUsXG4gICAgKSB7XG4gICAgICAgIHRoaXMuc3ViUGFyc2VyID0gbmV3IFN1YlF1ZXJ5UGhyYXNlUGFyc2VyKG1hdGNoQ2FzZSk7XG4gICAgfVxuXG4gICAgcGFyc2UoY2hhcjogc3RyaW5nKTogUGFyc2VyIHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IG5leHRQYXJzZXIgPSB0aGlzLnN1YlBhcnNlci5wYXJzZShjaGFyKTtcbiAgICAgICAgaWYgKG5leHRQYXJzZXIgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdWJQYXJzZXIgPSBuZXh0UGFyc2VyO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBlbmQoYWN0aXZlRmlsdGVyOiBGaWxlRmlsdGVyKTogRmlsZUZpbHRlciB7XG4gICAgICAgIGNvbnN0IGNoZWNrZXIgPSB0aGlzLnN1YlBhcnNlci5lbmQoKTtcbiAgICAgICAgaWYgKGNoZWNrZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGFjdGl2ZUZpbHRlci5hbmQodGhpcy5maWx0ZXJUeXBlKGNoZWNrZXIpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWN0aXZlRmlsdGVyO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IGdyb3VwIH0gZnJvbSBcIi4vR3JvdXBcIjtcbmltcG9ydCB7IE9yIH0gZnJvbSBcIi4vT3JcIjtcbmltcG9ydCB7IFN0cmluZ0NoZWNrZXIgfSBmcm9tIFwiLi9TdHJpbmdDaGVja2VyXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdleChcbiAgICByZWdleDogVGVtcGxhdGVTdHJpbmdzQXJyYXkgfCBzdHJpbmcgfCBSZWdFeHAsXG4gICAgbWF0Y2hDYXNlOiBib29sZWFuID0gZmFsc2Vcbik6IFN0cmluZ0NoZWNrZXIge1xuICAgIGlmICh0eXBlb2YgcmVnZXggPT09IFwic3RyaW5nXCIgfHwgcmVnZXggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWdleChuZXcgUmVnRXhwKHJlZ2V4KSlcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBSZWdleChuZXcgUmVnRXhwKHJlZ2V4LmpvaW4oXCJcIikpKVxufVxuXG5leHBvcnQgY2xhc3MgUmVnZXggaW1wbGVtZW50cyBTdHJpbmdDaGVja2VyIHtcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgcmVnZXg6IFJlZ0V4cDtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICByZWdleDogUmVnRXhwLFxuXG4gICAgICAgIG1hdGNoQ2FzZTogYm9vbGVhbiA9IGZhbHNlXG4gICAgKSB7XG4gICAgICAgIGlmIChtYXRjaENhc2UgJiYgcmVnZXguZmxhZ3MuaW5jbHVkZXMoXCJpXCIpKSB7XG4gICAgICAgICAgICB0aGlzLnJlZ2V4ID0gbmV3IFJlZ0V4cChyZWdleCwgcmVnZXguZmxhZ3Muc3BsaXQoXCJcIikuZmlsdGVyKGl0ID0+IGl0ICE9PSBcImlcIikuam9pbihcIlwiKSlcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghbWF0Y2hDYXNlICYmICFyZWdleC5mbGFncy5pbmNsdWRlcyhcImlcIikpIHtcbiAgICAgICAgICAgIHRoaXMucmVnZXggPSBuZXcgUmVnRXhwKHJlZ2V4LCByZWdleC5mbGFncyArIFwiaVwiKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yZWdleCA9IHJlZ2V4XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBtYXRjaGVzKHRlc3Q6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWdleC50ZXN0KHRlc3QpXG4gICAgfVxuXG4gICAgb3IoY2hlY2tlcjogU3RyaW5nQ2hlY2tlcik6IFN0cmluZ0NoZWNrZXIge1xuICAgICAgICByZXR1cm4gbmV3IE9yKHRoaXMsIGNoZWNrZXIpXG4gICAgfVxuXG4gICAgYW5kKGNoZWNrZXI6IFN0cmluZ0NoZWNrZXIpOiBTdHJpbmdDaGVja2VyIHtcbiAgICAgICAgcmV0dXJuIGdyb3VwKHRoaXMsIGNoZWNrZXIpXG4gICAgfVxuXG59IiwiaW1wb3J0IHsgU3RyaW5nQ2hlY2tlciB9IGZyb20gXCJzcmMvY2hlY2tlcnMvU3RyaW5nQ2hlY2tlclwiO1xuaW1wb3J0IHsgU3ViUXVlcnlQYXJzZXIgfSBmcm9tIFwiLi9TdWJRdWVyeVBhcnNlclwiO1xuaW1wb3J0IHsgcmVnZXggfSBmcm9tIFwic3JjL2NoZWNrZXJzL1JlZ2V4XCI7XG5cbmV4cG9ydCBjbGFzcyBTdWJRdWVyeVJlZ2V4UGFyc2VyIGltcGxlbWVudHMgU3ViUXVlcnlQYXJzZXIge1xuICAgIHByaXZhdGUgZXNjYXBlZDogYm9vbGVhbiA9IGZhbHNlO1xuICAgIHByaXZhdGUgYnVmZmVyOiBzdHJpbmcgPSBcIlwiO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgbWF0Y2hDYXNlOiBib29sZWFuID0gdHJ1ZVxuICAgICkge31cblxuICAgIHBhcnNlKGNoYXI6IHN0cmluZyk6IFN1YlF1ZXJ5UmVnZXhQYXJzZXIgfCBudWxsIHtcbiAgICAgICAgc3dpdGNoIChjaGFyKSB7XG4gICAgICAgICAgICBjYXNlIGBcXFxcYDoge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5lc2NhcGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXNjYXBlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgYC9gOiB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmVzY2FwZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXNjYXBlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmJ1ZmZlciArPSBjaGFyO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBlbmQoKTogU3RyaW5nQ2hlY2tlciB8IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5idWZmZXIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlZ2V4KHRoaXMuYnVmZmVyLCB0aGlzLm1hdGNoQ2FzZSk7XG4gICAgICAgIH1cbiAgICB9XG59IiwiaW1wb3J0IHsgRmlsZUZpbHRlciB9IGZyb20gXCJzcmMvZmlsdGVycy9GaWxlRmlsdGVyXCI7XG5pbXBvcnQgeyBQYXJzZXIgfSBmcm9tIFwiLi9QYXJzZXJcIjtcbmltcG9ydCB7IFN0cmluZ0NoZWNrZXIgfSBmcm9tIFwic3JjL2NoZWNrZXJzL1N0cmluZ0NoZWNrZXJcIjtcbmltcG9ydCB7IFN1YlF1ZXJ5UmVnZXhQYXJzZXIgfSBmcm9tIFwiLi9zdWJxdWVyeS9TdWJRdWVyeVJlZ2V4UGFyc2VyXCI7XG5pbXBvcnQgeyBtYXRjaEFsbCB9IGZyb20gXCJzcmMvZmlsdGVyc1wiO1xuXG5leHBvcnQgY2xhc3MgUmVnZXhQYXJzZXIgaW1wbGVtZW50cyBQYXJzZXIge1xuICAgIHByaXZhdGUgc3ViUGFyc2VyOiBTdWJRdWVyeVJlZ2V4UGFyc2VyO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgZmlsdGVyVHlwZTogKGNoZWNrZXI6IFN0cmluZ0NoZWNrZXIpID0+IEZpbGVGaWx0ZXIsXG4gICAgICAgIG1hdGNoQ2FzZTogYm9vbGVhbiA9IHRydWUsXG4gICAgKSB7XG4gICAgICAgIHRoaXMuc3ViUGFyc2VyID0gbmV3IFN1YlF1ZXJ5UmVnZXhQYXJzZXIobWF0Y2hDYXNlKVxuICAgIH1cblxuICAgIHBhcnNlKGNoYXI6IHN0cmluZyk6IFBhcnNlciB8IG51bGwge1xuICAgICAgICBjb25zdCBuZXh0UGFyc2VyID0gdGhpcy5zdWJQYXJzZXIucGFyc2UoY2hhcilcbiAgICAgICAgaWYgKG5leHRQYXJzZXIgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN1YlBhcnNlciA9IG5leHRQYXJzZXJcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZW5kKGFjdGl2ZUZpbHRlcjogRmlsZUZpbHRlcik6IEZpbGVGaWx0ZXIge1xuICAgICAgICBjb25zdCBjaGVja2VyID0gdGhpcy5zdWJQYXJzZXIuZW5kKCk7XG4gICAgICAgIGlmIChjaGVja2VyICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBhY3RpdmVGaWx0ZXIuYW5kKHRoaXMuZmlsdGVyVHlwZShjaGVja2VyKSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWN0aXZlRmlsdGVyXG4gICAgfVxufSIsImltcG9ydCB7IE1ldGFkYXRhQ2FjaGUsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBncm91cCB9IGZyb20gXCJzcmMvY2hlY2tlcnMvR3JvdXBcIjtcbmltcG9ydCB7IFN0cmluZ0NoZWNrZXIgfSBmcm9tIFwic3JjL2NoZWNrZXJzL1N0cmluZ0NoZWNrZXJcIjtcbmltcG9ydCB7IEZpbGVQcm9wZXJ0eUZpbHRlciB9IGZyb20gXCJzcmMvZmlsdGVyc1wiO1xuaW1wb3J0IHsgRmlsZUZpbHRlciB9IGZyb20gXCJzcmMvZmlsdGVycy9GaWxlRmlsdGVyXCI7XG5pbXBvcnQgeyBQYXJzZXIgfSBmcm9tIFwic3JjL3BhcnNlcnMvUGFyc2VyXCI7XG5pbXBvcnQgeyBEZWZhdWx0U3ViUXVlcnlQYXJzZXIgfSBmcm9tIFwic3JjL3BhcnNlcnMvc3VicXVlcnkvRGVmYXVsdFN1YlF1ZXJ5UGFyc2VyXCI7XG5pbXBvcnQgeyBTdWJRdWVyeVBhcnNlciB9IGZyb20gXCJzcmMvcGFyc2Vycy9zdWJxdWVyeS9TdWJRdWVyeVBhcnNlclwiO1xuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQcm9wZXJ0eShtZXRhZGF0YTogTWV0YWRhdGFDYWNoZSk6IFBhcnNlciB7XG5cdHJldHVybiBuZXcgUHJvcGVydHlOYW1lUGFyc2VyKFtdLCBtZXRhZGF0YSk7XG59XG5cbmNsYXNzIFByb3BlcnR5TmFtZVBhcnNlciBpbXBsZW1lbnRzIFBhcnNlciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY2hlY2tlcnM6IHJlYWRvbmx5IFN0cmluZ0NoZWNrZXJbXSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IG1ldGFkYXRhOiBNZXRhZGF0YUNhY2hlLFxuXHRcdHByaXZhdGUgcGFyc2VyOiBTdWJRdWVyeVBhcnNlciA9IG5ldyBEZWZhdWx0U3ViUXVlcnlQYXJzZXIoKSxcblx0KSB7IH1cblxuXHRwYXJzZShjaGFyOiBzdHJpbmcpOiBQYXJzZXIgfCBudWxsIHtcblx0XHRpZiAoY2hhciA9PT0gYF1gKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdFx0aWYgKGNoYXIgPT09IGA6YCkge1xuXHRcdFx0cmV0dXJuIG5ldyBQcm9wZXJ0eVZhbHVlUGFyc2VyKFxuXHRcdFx0XHRncm91cCh0aGlzLmVuZEludGVybmFsUGFyc2VyKCkpLFxuXHRcdFx0XHR0aGlzLm1ldGFkYXRhLFxuXHRcdFx0KTtcblx0XHR9XG5cdFx0Y29uc3QgbmV4dCA9IHRoaXMucGFyc2VyLnBhcnNlKGNoYXIpO1xuXHRcdGlmIChuZXh0ID09IG51bGwpIHtcblx0XHRcdHJldHVybiBuZXcgUHJvcGVydHlOYW1lUGFyc2VyKFxuXHRcdFx0XHR0aGlzLmVuZEludGVybmFsUGFyc2VyKCksXG5cdFx0XHRcdHRoaXMubWV0YWRhdGEsXG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdHJldHVybiBuZXcgUHJvcGVydHlOYW1lUGFyc2VyKHRoaXMuY2hlY2tlcnMsIHRoaXMubWV0YWRhdGEsIG5leHQpO1xuXHR9XG5cblx0cHJpdmF0ZSBlbmRJbnRlcm5hbFBhcnNlcigpIHtcblx0XHRjb25zdCBjaGVja2VyID0gdGhpcy5wYXJzZXIuZW5kKCk7XG5cdFx0aWYgKGNoZWNrZXIgIT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuY2hlY2tlcnMuY29uY2F0KFtjaGVja2VyXSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLmNoZWNrZXJzO1xuXHR9XG5cblx0ZW5kKGFjdGl2ZUZpbHRlcjogRmlsZUZpbHRlcik6IEZpbGVGaWx0ZXI8VEZpbGU+IHtcblx0XHRyZXR1cm4gYWN0aXZlRmlsdGVyLmFuZChcblx0XHRcdG5ldyBGaWxlUHJvcGVydHlGaWx0ZXIoXG5cdFx0XHRcdHRoaXMubWV0YWRhdGEsXG5cdFx0XHRcdGdyb3VwKHRoaXMuZW5kSW50ZXJuYWxQYXJzZXIoKSksXG5cdFx0XHQpLFxuXHRcdCk7XG5cdH1cbn1cblxuY2xhc3MgUHJvcGVydHlWYWx1ZVBhcnNlciBpbXBsZW1lbnRzIFBhcnNlciB7XG5cdGNvbnN0cnVjdG9yKFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgcHJvcGVydHk6IFN0cmluZ0NoZWNrZXIsXG5cdFx0cHJpdmF0ZSByZWFkb25seSBtZXRhZGF0YTogTWV0YWRhdGFDYWNoZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGNoZWNrZXJzOiByZWFkb25seSBTdHJpbmdDaGVja2VyW10gPSBbXSxcblx0XHRwcml2YXRlIHBhcnNlcjogU3ViUXVlcnlQYXJzZXIgPSBuZXcgRGVmYXVsdFN1YlF1ZXJ5UGFyc2VyKCksXG5cdCkgeyB9XG5cblx0cGFyc2UoY2hhcjogc3RyaW5nKTogUGFyc2VyIHwgbnVsbCB7XG5cdFx0aWYgKGNoYXIgPT09IGBdYCkge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHRcdGNvbnN0IG5leHQgPSB0aGlzLnBhcnNlci5wYXJzZShjaGFyKTtcblx0XHRpZiAobmV4dCA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gbmV3IFByb3BlcnR5VmFsdWVQYXJzZXIoXG5cdFx0XHRcdHRoaXMucHJvcGVydHksXG5cdFx0XHRcdHRoaXMubWV0YWRhdGEsXG5cdFx0XHRcdHRoaXMuZW5kSW50ZXJuYWxQYXJzZXIoKSxcblx0XHRcdFx0bmV3IERlZmF1bHRTdWJRdWVyeVBhcnNlcigpLFxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbmV3IFByb3BlcnR5VmFsdWVQYXJzZXIoXG5cdFx0XHR0aGlzLnByb3BlcnR5LFxuXHRcdFx0dGhpcy5tZXRhZGF0YSxcblx0XHRcdHRoaXMuY2hlY2tlcnMsXG5cdFx0XHRuZXh0LFxuXHRcdCk7XG5cdH1cblxuXHRwcml2YXRlIGVuZEludGVybmFsUGFyc2VyKCkge1xuXHRcdGNvbnN0IGNoZWNrZXIgPSB0aGlzLnBhcnNlci5lbmQoKTtcblx0XHRpZiAoY2hlY2tlciAhPSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5jaGVja2Vycy5jb25jYXQoW2NoZWNrZXJdKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuY2hlY2tlcnM7XG5cdH1cblxuXHRlbmQoYWN0aXZlRmlsdGVyOiBGaWxlRmlsdGVyKTogRmlsZUZpbHRlcjxURmlsZT4ge1xuXHRcdHJldHVybiBhY3RpdmVGaWx0ZXIuYW5kKFxuXHRcdFx0bmV3IEZpbGVQcm9wZXJ0eUZpbHRlcihcblx0XHRcdFx0dGhpcy5tZXRhZGF0YSxcblx0XHRcdFx0dGhpcy5wcm9wZXJ0eSxcblx0XHRcdFx0Z3JvdXAodGhpcy5lbmRJbnRlcm5hbFBhcnNlcigpKSxcblx0XHRcdCksXG5cdFx0KTtcblx0fVxufVxuIiwiaW1wb3J0IHsgRmlsZUZpbHRlciB9IGZyb20gXCJzcmMvZmlsdGVycy9GaWxlRmlsdGVyXCI7XG5pbXBvcnQgeyBQYXJzZXIgfSBmcm9tIFwiLi9QYXJzZXJcIjtcbmltcG9ydCB7IFN0cmluZ0NoZWNrZXIgfSBmcm9tIFwic3JjL2NoZWNrZXJzL1N0cmluZ0NoZWNrZXJcIjtcbmltcG9ydCB7IEZpbGVDb250ZW50RmlsdGVyIH0gZnJvbSBcInNyYy9maWx0ZXJzL0ZpbGVDb250ZW50RmlsdGVyXCI7XG5pbXBvcnQgeyBXb3JkUGFyc2VyIH0gZnJvbSBcIi4vV29yZFBhcnNlclwiO1xuaW1wb3J0IHsgR3JvdXBQYXJzZXIgfSBmcm9tIFwiLi9Hcm91cFBhcnNlclwiO1xuaW1wb3J0IHsgTmVnYXRlZFBhcnNlciB9IGZyb20gXCIuL05lZ2F0ZWRQYXJzZXJcIjtcbmltcG9ydCB7IFBocmFzZVBhcnNlciB9IGZyb20gXCIuL1BocmFzZVBhcnNlclwiO1xuaW1wb3J0IHsgUmVnZXhQYXJzZXIgfSBmcm9tIFwiLi9SZWdleFBhcnNlclwiO1xuaW1wb3J0IHsgTWV0YWRhdGFDYWNoZSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgcGFyc2VQcm9wZXJ0eSB9IGZyb20gXCJzcmMvcGFyc2Vycy9Qcm9wZXJ0eVBhcnNlclwiO1xuXG5leHBvcnQgY2xhc3MgRGVmYXVsdFBhcnNlciBpbXBsZW1lbnRzIFBhcnNlciB7XG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgbWV0YWRhdGE6IE1ldGFkYXRhQ2FjaGUsXG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgZmlsdGVyVHlwZTogKGNoZWNrZXI6IFN0cmluZ0NoZWNrZXIpID0+IEZpbGVGaWx0ZXIgPSAoXG4gICAgICAgICAgICBjaGVja2VyLFxuICAgICAgICApID0+IG5ldyBGaWxlQ29udGVudEZpbHRlcihjaGVja2VyKSxcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBtYXRjaENhc2U/OiBib29sZWFuLFxuICAgICkge31cblxuICAgIHBhcnNlKGNoYXI6IHN0cmluZyk6IFBhcnNlciB8IG51bGwge1xuICAgICAgICBzd2l0Y2ggKGNoYXIpIHtcbiAgICAgICAgICAgIGNhc2UgYC1gOiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE5lZ2F0ZWRQYXJzZXIuc3RhcnQodGhpcy5tZXRhZGF0YSwgdGhpcy5maWx0ZXJUeXBlLCB0aGlzLm1hdGNoQ2FzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIGBcImA6IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFBocmFzZVBhcnNlcih0aGlzLmZpbHRlclR5cGUsIHRoaXMubWF0Y2hDYXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgYC9gOiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdleFBhcnNlcih0aGlzLmZpbHRlclR5cGUsIHRoaXMubWF0Y2hDYXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgYChgOiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEdyb3VwUGFyc2VyLnN0YXJ0KHRoaXMubWV0YWRhdGEsIHRoaXMuZmlsdGVyVHlwZSwgdGhpcy5tYXRjaENhc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBgW2A6IHsgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlUHJvcGVydHkodGhpcy5tZXRhZGF0YSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgYCBgOiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0OiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFdvcmRQYXJzZXIuc3RhcnQoY2hhciwgdGhpcy5maWx0ZXJUeXBlLCB0aGlzLm1ldGFkYXRhLCB0aGlzLm1hdGNoQ2FzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBlbmQoYWN0aXZlRmlsdGVyOiBGaWxlRmlsdGVyKTogRmlsZUZpbHRlciB7XG4gICAgICAgIHJldHVybiBhY3RpdmVGaWx0ZXJcbiAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGUvY2xpZW50XCIgLz5cbmltcG9ydCB7IEFwcCwgTWV0YWRhdGFDYWNoZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEZpbGVGaWx0ZXIsIGlzRmlsZUZpbHRlciB9IGZyb20gXCIuL2ZpbHRlcnMvRmlsZUZpbHRlclwiO1xuaW1wb3J0IHsgUGFyc2VyIH0gZnJvbSBcIi4vcGFyc2Vycy9QYXJzZXJcIjtcbmltcG9ydCB7IERlZmF1bHRQYXJzZXIgfSBmcm9tIFwiLi9wYXJzZXJzL0RlZmF1bHRQYXJzZXJcIjtcbmltcG9ydCB1dGlsIGZyb20gXCJ1dGlsXCI7XG5cbmxldCBkZWJ1ZzogdHlwZW9mIGNvbnNvbGUubG9nID0gKCkgPT4geyB9O1xuZXhwb3J0IGZ1bmN0aW9uIHRyYWNlUGFyc2luZygpIHtcbiAgICBkZWJ1ZyA9IGNvbnNvbGUubG9nO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGhpZGVQYXJzZWluZ1RyYWNlKCkge1xuICAgIGRlYnVnID0gKCkgPT4geyB9O1xufVxuXG4vKipcbiAqIEBzaW5jZSAwLjEuMVxuICogXG4gKiBOZXZlciBtYXRjaGVzIGFnYWluc3QgYSBmaWxlLiAgQWx3YXlzIGRlZmVycyB0byB3aGF0ZXZlciBmaWx0ZXIgaXQncyBjb21iaW5lZCB3aXRoLlxuICovXG5leHBvcnQgY29uc3QgRW10cHlGaWx0ZXI6IEZpbGVGaWx0ZXIgPSB7XG4gICAgYXN5bmMgYXBwbGllc1RvKGZpbGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSxcbiAgICBhbmQoZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJcbiAgICB9LFxuICAgIG9yKGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyXG4gICAgfSxcbn1cblxuLyoqXG4gKiBAc2luY2UgMC4xLjBcbiAqIFxuICogUGFyc2VzIHRoZSBwcm92aWRlZCBxdWVyeSBhbmQgcmV0dXJucyBhIEZpbGVGaWx0ZXIgdGhhdCBjYW4gYmUgdXNlZCB0byBtYXRjaCBmaWxlcyBhZ2FpbnN0LlxuICogXG4gKiBAcGFyYW0gcXVlcnkgVGhlIHF1ZXJ5IHRvIHBhcnNlIGFuZCB0dXJuIGludG8gYSB7QGxpbmsgRmlsZUZpbHRlcn1cbiAqIEBwYXJhbSBtZXRhZGF0YSBNZXRhZGF0YUNhY2hlIHByb3ZpZGVkIGJ5IE9ic2lkaWFuJ3Mge0BsaW5rIEFwcC5tZXRhZGF0YUNhY2hlfSBwcm9wZXJ0eS5cbiAqIEBwYXJhbSBmaWx0ZXIgVGhlIGZpbHRlciB0byBmYWxsYmFjayB0byBmb3IgYW4gZW1wdHkgcXVlcnkuICBEZWZhdWx0IGJlaGF2aW9yIGlzIHRvIHtAbGluayBFbXRweUZpbHRlcn0uXG4gKiBAcmV0dXJucyBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKHF1ZXJ5OiBzdHJpbmcsIG1ldGFkYXRhOiBNZXRhZGF0YUNhY2hlLCBmaWx0ZXI6IEZpbGVGaWx0ZXIgPSBFbXRweUZpbHRlcik6IEZpbGVGaWx0ZXIge1xuICAgIHF1ZXJ5ID0gcXVlcnkudHJpbSgpO1xuXG4gICAgbGV0IHBhcnNlcjogUGFyc2VyID0gbmV3IERlZmF1bHRQYXJzZXIobWV0YWRhdGEpO1xuICAgIGZvciAoY29uc3QgY2hhciBvZiBxdWVyeSkge1xuICAgICAgICBpZiAoaW1wb3J0Lm1ldGEuZW52Lk1PREUgPT09IFwidGVzdFwiKSB7XG4gICAgICAgICAgICBkZWJ1ZyhcIj09PSBQQVJTSU5HIENIQVI6IFwiLCBjaGFyLCBcIiA9PT1cIik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmV4dFBhcnNlciA9IHBhcnNlci5wYXJzZShjaGFyKTtcbiAgICAgICAgaWYgKG5leHRQYXJzZXIgPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc3QgY2hlY2tlciA9IHBhcnNlci5lbmQoZmlsdGVyKTtcbiAgICAgICAgICAgIGlmIChpc0ZpbGVGaWx0ZXIoY2hlY2tlcikpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXIgPSBjaGVja2VyXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXJzZXIgPSBuZXcgRGVmYXVsdFBhcnNlcihtZXRhZGF0YSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXJzZXIgPSBuZXh0UGFyc2VyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbXBvcnQubWV0YS5lbnYuTU9ERSA9PT0gXCJ0ZXN0XCIpIHtcbiAgICAgICAgICAgIGRlYnVnKFwiLS0tIGFmdGVyOiBcIilcbiAgICAgICAgICAgIGRlYnVnKHV0aWwuaW5zcGVjdChwYXJzZXIsIHsgc2hvd0hpZGRlbjogdHJ1ZSwgZGVwdGg6IG51bGwgfSkpO1xuICAgICAgICAgICAgZGVidWcoXCI9PT0gRU5EIENIQVIgUEFSU0lORyA9PT1cIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBjaGVja2VyID0gcGFyc2VyLmVuZChmaWx0ZXIpO1xuICAgIGlmIChpc0ZpbGVGaWx0ZXIoY2hlY2tlcikpIHtcbiAgICAgICAgcmV0dXJuIGNoZWNrZXJcbiAgICB9XG5cbiAgICByZXR1cm4gZmlsdGVyXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiogc2VhcmNoKHF1ZXJ5OiBzdHJpbmcsIGFwcDogUGljazxBcHAsIFwibWV0YWRhdGFDYWNoZVwiIHwgXCJ2YXVsdFwiPik6IEFzeW5jR2VuZXJhdG9yPFRGaWxlPiB7XG4gICAgY29uc3QgYWxsRmlsZXMgPSBhcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xuXG4gICAgY29uc3QgZmlsdGVyID0gcGFyc2UocXVlcnksIGFwcC5tZXRhZGF0YUNhY2hlKTtcbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgYWxsRmlsZXMpIHtcbiAgICAgICAgaWYgKGF3YWl0IGZpbHRlci5hcHBsaWVzVG8oZmlsZSkpIHtcbiAgICAgICAgICAgIHlpZWxkIGZpbGU7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCAqIGZyb20gJ3NyYy9maWx0ZXJzJ1xuIiwiaW1wb3J0IHR5cGUgeyBURmlsZSB9IGZyb20gXCJvYnNpZGlhblwiXG5pbXBvcnQgKiBhcyBjb21tb24gZnJvbSBcIi4vY29tbW9uLm1haW5cIjtcbmltcG9ydCAqIGFzIG9ic2lkaWFuX3NlYXJjaCBmcm9tIFwic3JjL21haW5cIlxuXG5leHBvcnQgZGVmYXVsdCBjb21tb24uUGx1Z2luKHBsdWdpbiA9PiBjb21tb24uT2JzaWRpYW5GaWxlcyhwbHVnaW4sIGFzeW5jIChxdWVyeSkgPT4ge1xuXHRjb25zdCBtYXRjaGVzOiBURmlsZVtdID0gW107XG5cdGZvciBhd2FpdCAoY29uc3QgZmlsZSBvZiBvYnNpZGlhbl9zZWFyY2guc2VhcmNoKHF1ZXJ5LCBwbHVnaW4uYXBwKSkge1xuXHRcdG1hdGNoZXMucHVzaChmaWxlKTtcblx0fVxuXHRyZXR1cm4gbWF0Y2hlcztcbn0pKVxuIl0sIm5hbWVzIjpbInQiLCJfX3ZpdGVfZ2xvYl8wXzAiLCJfX3ZpdGVfZ2xvYl8wXzEiLCJfX3ZpdGVfZ2xvYl8wXzIiLCJfX3ZpdGVfZ2xvYl8wXzMiLCJfX3ZpdGVfZ2xvYl8wXzQiLCJfX3ZpdGVfZ2xvYl8wXzUiLCJ0ZXN0aW5nLlN1aXRlIiwiam9pbiIsIm9ic2lkaWFuIiwiaW5zcGVjdCIsInRlc3RzLnJ1blRlc3RzIiwiY29tYmluZSIsImNvbnRlbnQiLCJmaWxlIiwicGhyYXNlIiwicmVnZXgiLCJjaGVja2VyIiwiY29tbW9uLlBsdWdpbiIsImNvbW1vbi5PYnNpZGlhbkZpbGVzIiwib2JzaWRpYW5fc2VhcmNoLnNlYXJjaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxNQUFNLFdBQUEsQ0FBWTtBQUFBLEVBQ2pCLFlBQ2lCLElBQUEsRUFDZjtBQURlLElBQUEsSUFBQSxDQUFBLElBQUEsR0FBQSxJQUFBO0FBQUEsRUFDYjtBQUNMO0FBRU8sTUFBTSxLQUFBLENBQVk7QUFBQSxFQUN4QixXQUFBLENBQ1EsVUFBQSxFQUtBLFVBQUEsRUFDQSxTQUFBLEVBQ0EsUUFBQSxFQUNOO0FBUk0sSUFBQSxJQUFBLENBQUEsVUFBQSxH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
