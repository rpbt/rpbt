const { exec } = require("child_process");
const fs = require("fs").promises;

const RPBT_VERSION = "0.2";

console.log("Creating types...");

exec("tsc --noEmit false --emitDeclarationOnly --declaration --module none --outFile rpbt-types.d.ts", async function (_error, stdout, stderr) {
    console.log();
    console.log();
    console.log(stdout, stderr);
    console.log();
    console.log("Processing types...");

    let contents = await fs.readFile("rpbt-types.d.ts", "utf-8");
    contents = contents.replace(/declare module "/g, str => str + "@rpbt/");
    contents = contents.replace(/import .+ from "/g, str => str + "@rpbt/");
    contents = contents.replace(/@rpbt\/jszip/g, "jszip");

    contents = `
// rpbt v${RPBT_VERSION}
// Types generated at ${new Date().toUTCString()}

declare module "@rpbt" {
    import Pack from "@rpbt/pack/Pack";
    import OutputInfo from "@rpbt/build/OutputInfo";
    import Logger from "@rpbt/plugin/logger/Logger";
    import Plugin from "@rpbt/plugin/Plugin";
    export const source: Pack;
    export const target: Pack;
    export const outputInfo: OutputInfo;
    export const logger: Logger;
    export const plugin: Plugin;
}
        `.trim() + '\n' + contents;

    await fs.writeFile("rpbt-types.d.ts", contents);
    console.log("Created rpbt-types.d.ts");
});