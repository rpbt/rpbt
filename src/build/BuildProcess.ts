import { localCommunication } from "../index";
import Pack from "../pack/Pack";
import BuildTask from "../plugin/BuildTask";
import BuildToolInfoTask from "../plugin/BuildToolInfoTask";
import JSZip from "jszip";
import { download, getShortId } from "../util/utils";
import OutputInfo from "./OutputInfo";
import Logger from "../plugin/logger/Logger";
import StandaloneTask from "../plugin/StandaloneTask";
import DeferredLogContainer from "../plugin/logger/DeferredLogContainer";

/**
 * Created when a pack is being built and holds data needed for the build.
 */
export default class BuildProcess {
    readonly sourcePack: Pack;
    readonly targetPack: Pack;
    readonly tasks: BuildTask[];
    readonly outputInfo: OutputInfo;
    readonly logger: Logger;

    static async create(sourcePack: Pack): Promise<BuildProcess> {
        const logger = new Logger(sourcePack.name);
        sourcePack.addLogger(logger);
        logger.info("Preparing build");
        const targetPack = await sourcePack.createTargetCopy();
        const process = new BuildProcess(logger, sourcePack, targetPack);
        process.resolveTasks();
        process.sortTasks();
        return process;
    }

    private constructor(logger: Logger, sourcePack: Pack, targetPack: Pack) {
        this.logger = logger;
        this.sourcePack = sourcePack;
        this.targetPack = targetPack;
        this.tasks = [
            new BuildToolInfoTask()
        ];
        const id = this.sourcePack.name;
        const version = this.sourcePack.getBuildSystemInfo().version;
        this.outputInfo = {
            fileName: getShortId(id) + "-" + version + ".zip",
            resourceJson: {
                id,
                version,
                type: "dependency"
            }
        };
        this.sourcePack.addLogger(this.logger);
    }

    resolveTasks() {
        for(const plugin of this.sourcePack.getPlugins()) {
            if (plugin.buildTask != null) {
                this.tasks.push(plugin.buildTask);
            }
        }
    }

    sortTasks() {
        this.tasks.sort((a, b) => a.orderValue - b.orderValue);
    }

    getStandaloneTasks(): StandaloneTask[] {
        const array: StandaloneTask[] = [];
        for (const plugin of this.sourcePack.getPlugins()) {
            for (const task of plugin.standaloneTasks) {
                array.push(task);
            }
        }
        return array;
    }

    async run() {
        for (const task of this.tasks) {
            try {
                await task.run(this.sourcePack, this.targetPack, this.outputInfo);
            } catch(e) {
                task.getLogger().error(e);
            }
        }
    }

    private getTargetPackBlob(): Promise<Blob> {
        return this.targetPack.getZip().generateAsync({ type: "blob" });
    }

    async downloadOutputPack() {
        const blob = await this.getTargetPackBlob();
        download(blob, this.outputInfo.fileName);
    }

    async downloadResource() {
        const zip = new JSZip();
        const { id, version } = this.outputInfo.resourceJson;
        const folder = zip.folder(id + "/" + version)!;
        folder.file("resource.json", JSON.stringify(this.outputInfo.resourceJson, null, 4));
        folder.file(getShortId(id) + "-" + version + ".zip", await this.getTargetPackBlob());
        const blob = await zip.generateAsync({ type: "blob" });
        download(blob, id + "-" + version + "-resource.zip");
    }

    async saveToLocalRepo() {
        const { id, version } = this.outputInfo.resourceJson;
        const resourceJson = JSON.stringify(this.outputInfo.resourceJson, null, 4);
        const resourceFile = await this.getTargetPackBlob();

        await localCommunication.saveToLocalRepo(id, version, resourceJson, resourceFile);
    }

    async installPackInGame(installation: string) {
        const file = await this.getTargetPackBlob();

        await localCommunication.installPackInGame(installation, file, this.outputInfo.fileName);
    }
}