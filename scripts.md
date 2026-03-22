test:unit - run unit tests.  These are found next to production code and test the api of the module (file)
test:contract - run obsidian search contract tests.  These are black box tests that run within obsidian to verify that obsidian's built-in search plugin behaves the way we expect
test:conform - run functionality tests within obsidian to verify that the code behaves identically to obsidian's built-in search plugin.

test - run all tests above

build - build the library for production.  Runs all tests, including integration and func tests, prior to fully building.  Pass --force to build regardless of tests passing


