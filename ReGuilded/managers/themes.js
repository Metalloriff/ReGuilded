const { existsSync, readFileSync, stat } = require("fs");
const ExtensionManager = require("./extension.js");
const { FileWatcher } = require("../utils");
const path = require("path");

/**
 * Manager that manages ReGuilded's themes
 */
module.exports = class ThemesManager extends ExtensionManager {
    /**
     * Manager that manages ReGuilded's themes
     * @param {String} themesDir The directory of the ReGuilded themes
     */
    constructor(themesDir) {
        super(themesDir);
        this.on("fullLoad", e => console.log("Full load"));
    }

    /**
     * Initiates themes and theme manager
     * @param {String[]} enabled An array of enabled themes
     */
    init(enabled = []) {
        // Gets a list of theme directories
        const themes = super.getDirs(enabled);

        // Gets every theme directory
        for (let i in themes) {
            const theme = themes[i]
            // Creates path to the Theme Directory
            const themePath = super.getPath(theme.name);
            // Gets path of the JSON
            const jsonPath = path.join(themePath, "theme.json");

            // If json doesn't exist, ignore this directory
            stat(jsonPath, (e, _) => {
                checkTheme: {
                    if (e) {
                        // If it doesn't exist ignore it
                        if (e.code === 'ENOENT') break checkTheme;
                        // If there is other kind of an error, throw it
                        else throw e;
                    }
                    // Get that json
                    const json = require(jsonPath);
                    // Sets directory's name
                    json.dirname = themePath;

                    // TODO: Use JSON schema

                    // Gets ID property
                    const propId = json.id;
                    // Checks if ID is correct
                    if (!ExtensionManager.checkId(propId)) throw new Error(`Incorrect syntax of the property 'id'.`);

                    // Gets CSS path
                    const propCss = json.css;
                    // Checks if it's a string
                    ExtensionManager.checkProperty("css", propCss, "string", jsonPath);
                    // Gets full CSS path
                    const cssPath = path.isAbsolute(propCss) ? propCss : path.join(themePath, propCss);
                    // Checks if CSS file exists
                    if (!existsSync(cssPath)) throw new Error(`Could not find CSS file in path ${cssPath}`);
                    // Adds it to themes array instead
                    this.all.push(json);
                    // Loads it
                    if(this.enabled.includes(propId)) {
                        this.load(json);
                        this.emit("load", json);
                    }
                }
                // Checks if it's the last item
                this.checkLoaded(i, themes.length);
            })
        }
    }

    /**
     * Loads a ReGuilded theme
     * @param {{id: String, name: String, dirname: String, css: String}} theme ReGuilded theme to load
     */
    load(theme) {
        console.log(`Loading theme by ID '${theme.id}'`);
        // Creates path to the Theme Directory
        const themeCss = path.join(theme.dirname, theme.css);
        theme.watcher = new FileWatcher(themeCss, this.reload.bind(this), theme.id);

        // Creates a new style element for that theme
        const style = document.createElement("style");
        style.id = `reGl-theme-${theme.id}`;
        style.classList.add("ReGuilded-Theme");

        // Sets the innerText of the style element to the themeCss file.
        style.innerHTML = readFileSync(themeCss).toString();

        // Adds style element at the start of the body
        document.body.appendChild(style);
    }

    /**
     * Unloads a ReGuilded theme.
     * @param {String} theme ID of the theme to unload from Guilded.
     */
    unload(theme) {
        console.log(`Unloading theme by ID '${theme}'`);
        // Selects the theme's link element by name that is in body element
        const linkRef = document.querySelector(`body style#reGl-theme-${theme}`);
        // Removes it
        linkRef.remove();
    }

    /**
     * Reloads a ReGuilded theme.
     * @param {String} id The identifier of the theme
     */
    reload(id) {
        console.log(`Reloading theme by ID '${id}`);

        // Gets the Theme, Theme Path, and Theme Css.
        const theme = this.all.find((object) => object.id === id);
        const themeCss = path.join(theme.dirname, theme.css);

        // Gets the Style within Guilded.
        const style = document.getElementById(`reGl-theme-${theme.id}`);

        // Sets the innerText of the style element to the themeCss file.
        style.innerHTML = readFileSync(themeCss).toString();
    }

    /**
     * Checks if given theme based on ID is loaded.
     * @param {String} id The identifier of the theme
     * @returns Theme is loaded
     */
    isLoaded(id) {
        return this.enabled.includes(id);
    }
};
/**
 * A Regex pattern for determining whether given theme's ID is correct.
 */
module.exports.idRegex = /^[A-Za-z0-9]+$/g;
