import { PluginInfo } from "../pack/BuildSystemInfo";
import { PluginResourceJson } from "../repository/resource";
import BuildTask from "./BuildTask";
import StandaloneTask from "./StandaloneTask";
import JSZip from "jszip";
import FileExecutor from "./FileExecutor";
import ImportResolver from "./ImportResolver";
import Logger from "./logger/Logger";

export default class Plugin {
    readonly id: string;
    readonly version?: string;
    buildTask?: BuildTask;
    readonly standaloneTasks: StandaloneTask[];
    logger: Logger;
    config: PluginInfo | null = null;

    constructor(id: string, version?: string, buildTask?: BuildTask, ...standaloneTasks: StandaloneTask[]) {
        this.id = id;
        this.version = version;
        this.buildTask = buildTask;
        this.standaloneTasks = standaloneTasks || [];
        this.logger = new Logger(this.id);
        if (buildTask != null) {
            buildTask.plugin = this;
        }
    }


    static async loadZipFile(resource: PluginResourceJson, zipFile: Blob): Promise<Plugin> {
        const zip = await JSZip.loadAsync(zipFile);
        return Plugin.loadJSZip(resource, zip);
    }

    static async loadJSZip(resource: PluginResourceJson, zip: JSZip): Promise<Plugin> {
        const plugin = new Plugin(resource.id, resource.version);
        if (resource.build) {
            const fileExecutor = await getFileExecutor(resource.build.main, resource, zip);
            const buildTask = new BuildTask(fileExecutor, resource.build.order_value);
            buildTask.plugin = plugin;
            plugin.buildTask = buildTask;
        }
        if (resource.standalone_tasks) {
            for (const task of resource.standalone_tasks) {
                const fileExecutor = await getFileExecutor(task.main, resource, zip);
                const standaloneTask = new StandaloneTask(task.name, fileExecutor);
                standaloneTask.plugin = plugin;
                plugin.standaloneTasks.push(standaloneTask);
            }
        }
        return plugin;
    }
}

async function getFileExecutor(main: string, resource: PluginResourceJson, zip: JSZip) {
    const file = zip.file(main);
    if (file == null) {
        throw new Error(`Unable to find main script file ${main}`);
    }
    const script = await file.async("string");
    const importResolver = new ImportResolver(zip, main);
    return new FileExecutor(script, resource.id + ":" + resource.version + "//" + main, importResolver);
}