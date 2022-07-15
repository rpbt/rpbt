import Pack from "../pack/Pack";
import FileExecutor from "./FileExecutor";
import Logger from "./logger/Logger";
import Plugin from "./Plugin";

/**
 * A task that can be ran alone. Is not ran when the pack is built, but rather
 * when the user requests to run it.
 */
 export default class StandaloneTask {
    private readonly name: string;
    private readonly fileExecutor: FileExecutor;
    plugin: Plugin | null = null;

    constructor(name: string, fileExecutor: FileExecutor) {
        this.name = name;
        this.fileExecutor = fileExecutor;
    }

    getLogger(): Logger {
        return this.plugin!.logger;
    }

    /**
     * Get the name of this task.
     */
    getName() {
        return this.name;
    }

    /**
     * Run this task.
     *
     * The task can decide how to provide the output.
     * 
     * Packs should __not__ be modified, only read, even the target pack.
     *
     * @param source The source pack. This pack should __not__ be modified.
     * @param target The target pack. This pack should __not__ be modified.
     */
    async run(source: Pack, target: Pack): Promise<void> {
        const importResolver = this.fileExecutor.importResolver;
        importResolver.sourcePack = source;
        importResolver.targetPack = target;
        importResolver.outputInfo = null;
        importResolver.pluginLogger = this.getLogger();
        importResolver.plugin = this.plugin!;
        await this.fileExecutor.execute();
    }
}