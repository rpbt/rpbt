import OutputInfo from "../build/OutputInfo";
import Pack from "../pack/Pack";
import FileExecutor from "./FileExecutor";
import Logger from "./logger/Logger";
import Plugin from "./Plugin";

/**
 * A task ran when building a pack.
 */
export default class BuildTask {
    private readonly fileExecutor: FileExecutor;
    orderValue: number;
    plugin: Plugin | null = null;

    /**
     * Create a build task.
     * 
     * The order value of the task decides when the task should run. Tasks with lower
     * values run first, packs with higher values run later.
     * 
     * @param fileExecutor The file executor that runs this build task.
     * @param orderValue The order value.
     */
    constructor(fileExecutor: FileExecutor, orderValue = 15) {
        this.fileExecutor = fileExecutor;
        this.orderValue = orderValue;
    }

    getLogger(): Logger {
        return this.plugin!.logger;
    }

    /**
     * Run this build task and do the modifications to the pack.
     * 
     * @param source The original source pack. This pack should __not__ be modified.
     * @param target The target pack that will become the final product. This pack may be modified.
     * @param outputInfo Information about the produced output.
     */
    async run(source: Pack, target: Pack, outputInfo: OutputInfo): Promise<void> {
        const importResolver = this.fileExecutor.importResolver;
        importResolver.sourcePack = source;
        importResolver.targetPack = target;
        importResolver.outputInfo = outputInfo;
        importResolver.pluginLogger = this.getLogger();
        importResolver.plugin = this.plugin!;
        await this.fileExecutor.execute();
    }
}