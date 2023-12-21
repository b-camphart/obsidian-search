# obsidian-search

The (unofficial) API for Obsidian.md searching functionality.

Obsidian does not provide an API for using it's search functionality, forcing developers to either build their own - with limited features, depend on something like dataview, or perform a gross hack in which we query the DOM of the search plugin.  _NO MORE_

This library provides a `parse` function to convert a query string into a FileFilter, a `search` function to directly query the app from a given query, and direct access to the corresponding FileFilters.

## How to use
This library is still in *ALPHA* due to limited test coverage.  Use at your own risk!

### Install
```bash
# Using npm
npm install obsidian-search

# Using yarn
yarn add obsidian-search
```


### Search
```javascript
import { search } from 'obsidian-search'

const asyncResults = search(`file:filename OR path:sub/folder OR [has property:with value]`, app) // the App made available to your plugin
for await (const file of asyncResults) {
    // do something with the file
}
```
Of course, the query provided could be a `string` that your users passed into an input somewhere.

### Parse
If you need more direct access to the file filters for finer control over when and how you filter for files, you may also use the `parse` function:

```javascript
import { parse } from 'obsidian-search'

const filter = parse(`file:filename OR path:sub/folder OR [has property:with value]`, app.metadataCache) // the App made available to your plugin

const files = app.value.getMarkdownFiles();

for (const file of files) {
    if (await filter.appliesTo(file)) {
        // do something with the file
    }
}
```

## Contributing

Thank you for considering contributing to the `obsidian-search` library! Contributions are welcome and encouraged.

### Bug Reports and Feature Requests

If you find a bug or have a feature request, please open an issue on the [issue tracker](https://github.com/b-camphart/obsidian-search/issues). When creating an issue, provide as much detail as possible, including steps to reproduce for bugs.

### Pull Requests

If you would like to contribute directly to the codebase, you can follow these steps to submit a pull request:

1. Fork the repository.

2. Create a new branch for your feature or bug fix:

   ```bash
   git checkout -b feature-name
   ```
3. Write new tests for your changes if applicable.
4. Run the tests to ensure nothing broke (and your changes work):
   ```bash
   npm run test:unit
   ```
5. Commit your changes:
    ```bash
    git commit -m "Add your commit message here"
    ```
6. Push your branch to your fork:
    ```bash
    git push origin feature-name
    ```
7. Open a new [Pull Request](https://github.com/b-camphart/obsidian-search/compare) from the feature branch in your fork