import OutputInfo from "../build/OutputInfo";
import Pack from "../pack/Pack";
import JSZip from "jszip";
import Logger from "./logger/Logger";
import Plugin from "./Plugin";

export default class ImportResolver {
    /**
     * The zip containing files that can be imported relatively.
     */
    readonly zip: JSZip;
    /**
     * The path within the zip of the current file.
     */
    readonly path: string;
    sourcePack: Pack | null;
    targetPack: Pack | null;
    outputInfo: OutputInfo | null;
    pluginLogger: Logger | null;
    plugin: Plugin | null;

    constructor(zip: JSZip, path: string, sourcePack?: Pack, targetPack?: Pack, outputInfo?: OutputInfo, pluginLogger?: Logger, plugin?: Plugin) {
        this.zip = zip;
        this.path = path;
        this.sourcePack = sourcePack || null;
        this.targetPack = targetPack || null;
        this.outputInfo = outputInfo || null;
        this.pluginLogger = pluginLogger || null;
        this.plugin = plugin || null;
    }

    async resolve(path: string): Promise<any> {
        if (path == "@rpbt") {
            return {
                source: this.sourcePack,
                target: this.targetPack,
                outputInfo: this.outputInfo,
                logger: this.pluginLogger,
                plugin: this.plugin
            };
        }

        switch (path) {
            case "@rpbt/pack/Pack": return Pack;
        }
        
        if (path.startsWith("@rpbt/")) {
            // TODO This will not work for production builds
            const jsFile = "/src/" + path.substring("@rpbt/".length) + ".ts";
            const res = await import(/* @vite-ignore */ jsFile).catch(_ignored => { });
            if (res != null) {
                return res;
            }
        }

        switch (path) {
            case "fs":
            case "http":
            case "https":
            case "child_process":
            case "crypto":
            case "os":
            case "path":
                throw new Error('Import "' + path + '" not found. ' +
                    'Imports in rpbt are not like npm. You may only import the rpbt plugin ' +
                    'variables from "@rpbt", from other plugins "@plugin/plugin-id", or rpbt ' +
                    'internals "@rpbt/path/to/file".');

            default:
                throw new Error('Import "' + path + '" not found.');
        }
    }
}