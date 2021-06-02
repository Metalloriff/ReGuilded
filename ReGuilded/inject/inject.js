const { writeFileSync, existsSync, mkdirSync, rmSync } = require("fs");
const { join, sep } = require("path");

exports.inject = async(appDir) => {
    if (!existsSync(appDir)) {
        try {
            mkdirSync(appDir);
            // Creates a path for patcher for require statement
            const patcherPath = join(__dirname.replace(RegExp(sep.repeat(2), 'g'), '/'), '../src/reguildedPatcher.js')
            // Creates require statement in `index.js`
            writeFileSync(join(appDir, "index.js"), `require("${patcherPath}");`);
            writeFileSync(join(appDir, "package.json"), JSON.stringify({ name: "guilded", main: "index.js", version: "0.0.0" }));
        } catch (err) {
            throw new Error(err);
        }
    } else {
        throw new Error("There is already an injection.");
    }

}

exports.uninject = async(appDir) => {
    if (existsSync(appDir)) {
        try {
            rmSync(appDir, { recursive: true, force: true});
        } catch (err) {
            throw new Error(err);
        }
        
    } else {
        throw new Error("There is no injection.");
    }
}