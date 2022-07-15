import OutputInfo from "../build/OutputInfo";
import Pack from "../pack/Pack";
import BuildTask from "./BuildTask";

/**
 * A task ran early in the building process that removes the resource-pack-build-tool
 * information from the pack meta and renames it back to pack.mcmeta in case it was
 * named differently.
 */
export default class BuildToolInfoTask extends BuildTask {
    constructor() {
        // @ts-ignore // todo
        super(null, 5);
    }

    async run(source: Pack, target: Pack, outputInfo: OutputInfo): Promise<void> {
        // Note that this task does not belong to a plugin so it has no logger.
        // The logger may therefore not be used by this task.

        let file = target.getFile("pack.mcmeta");
        if (file == null) {
            file = target.getFile("pack.rpbt.mcmeta");
        }
        if (file == null) {
            console.warn("No pack.mcmeta or pack.rpbt.mcmeta found in the pack.");
            // todo logger
            return;
        }
        const json = await file.readAsJson();
        delete json["resource-pack-build-tool"];
        target.writeFile("pack.mcmeta", JSON.stringify(json));
        target.removeFile("pack.rpbt.mcmeta");
    }
}