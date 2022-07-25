import OutputInfo from "../build/OutputInfo";
import Pack from "../pack/Pack";
import BuildTask from "./BuildTask";
import Logger from "./logger/Logger";

/**
 * An internal build task that does not belong to a plugin and that is executed directly.
 */
export default abstract class InternalBuildTask extends BuildTask {
    private readonly logger: Logger;

    constructor(name: string, orderValue?: number) {
        super(null, orderValue);
        this.logger = new Logger(name);
    }

    getLogger(): Logger {
        return this.logger;
    }

    abstract run(source: Pack, target: Pack, outputInfo: OutputInfo): Promise<void>;
}