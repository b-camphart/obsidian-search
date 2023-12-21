import { exec } from "child_process"
import { mkdirSync, existsSync, writeFileSync, rmSync, readFileSync } from "fs"
import { join, resolve } from "path"

/** @param {string} vaultPath */
export function createTestVault(vaultPath) {
    if (existsSync(vaultPath)) {
        rmSync(vaultPath, { recursive: true })
    }
    mkdirSync(vaultPath)

    const initialSettings = {
        "community-plugins.json": [
            "obsidian-search-e2e-tests"
        ]
    }

    const obsidianDir = join(vaultPath, '.obsidian')
    mkdirSync(obsidianDir)

    for (const fileName of Object.keys(initialSettings)) {
        const fileContent = initialSettings[fileName];
        writeFileSync(`${obsidianDir}/${fileName}`, JSON.stringify(fileContent, null, '\t'));
    }
    
}

function loadLocalConfig() {
    const configPath = join(process.cwd(), "e2e", "config.local.json")
    if (! existsSync(configPath)) {
        console.error("config.local.json file not found.  Creating one.  Please fill out the properties");
        writeFileSync(configPath, `{
            "$schema": "./config.local.schema.json",
            "obsidian": {
                "install": "path/to/obsidian/installation",
                "support": "path/to/obsidian/support/folder"
            }
        }`);
        return;
    }
    const configData = readFileSync(configPath, { encoding: "utf-8" });
    let config;
    try {
        config = JSON.parse(configData)
    } catch(e) {
        console.error(e)
        return;
    }

    if (typeof config !== "object") {
        console.error("Invalid local config file.  Expected object.")
        return;
    }

    // validated properties

    return config

}

/** @param {string} vaultPath */
export function launchObsidian(vaultPath) {
    const config = loadLocalConfig()
    if (config == null) return;

    const supportDir = config.obsidian.support
    const obsidianCachePath = join(supportDir, "obsidian.json")

    const obsidianCache = JSON.parse(readFileSync(obsidianCachePath, { encoding: "utf-8" }));
    const vaults = obsidianCache.vaults
    for (const vaultId of Object.keys(vaults)) {
        const vault = vaults[vaultId]
        if ('open' in vault && vault.open) {
            delete vault.open
        }
    }

    const newVault = { open: true, ts: Date.now(), path: vaultPath }
    const id = "test-vault-path"
    vaults[id] = newVault

    writeFileSync(obsidianCachePath, JSON.stringify(obsidianCache))

    const child = exec(config.obsidian.install)
    
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)

    process.on("SIGINT", (signal) => {
        console.log(signal)
        child.kill();
    })
    process.on("SIGTERM", (signal) => {
        console.log(signal)
        child.kill();
    })
    process.on("SIGKILL", (signal) => {
        console.log(signal)
        child.kill();
    })

}

/** 
 * @param {string} vaultPath 
 * @param {string} pluginName
 */
export function generateManifest(pluginPath, pluginName) {
    const manifest = {
        id: pluginName,
        name: "Obsidian Search e2e Tests",
        version: "1.0.0",
        minAppVersion: "1.4.14",
        description: "None",
        author: "this",
        authorUrl: "this",
        isDesktopOnly: false
    }
    writeFileSync(join(pluginPath, 'manifest.json'), JSON.stringify(manifest))
}