///<reference path="../../rpbt-types.d.ts" />

import { source, target, logger, outputInfo } from "@rpbt";
import Pack from "@rpbt/pack/Pack";
import PackFile from "@rpbt/pack/PackFile";

const includedDependencies = [];

for (const dependency of source.getDependencies()) {
    logger.info("Including " + dependency.id + ":" + dependency.version);
    await include(target, dependency.pack);
    includedDependencies.push({
        id: dependency.id,
        version: dependency.version
    });
    outputInfo.resourceJson.included_dependencies = includedDependencies;
}

/**
 * Include the other pack into the pack.
 * 
 * @param {Pack} pack The pack to include into.
 * @param {Pack} other The pack to include.
 */
async function include(pack, other) {
    // Loop trough all files deeply.
    for (const path of other.getFiles(true)) {
        const file = other.getFile(path);
        if (file != null) {
            // Check if the file already exists in the pack
            const existingFile = pack.getFile(path);
            if (existingFile == null) {
                // Copy the file
                const blob = await file.readAsBlob();
                pack.writeFile(path, blob);
            } else {
                // Collision
                await handleCollision(pack, other, existingFile, file, path);
            }
        }
    }
}

/**
 * Handle a collision where a file exists in two packs.
 * 
 * @param {Pack} packA The pack A.
 * @param {Pack} packB The pack B.
 * @param {PackFile} fileA The file in pack A.
 * @param {PackFile} fileB The file in pack B.
 * @param {string} path The path of the files.
 */
async function handleCollision(packA, packB, fileA, fileB, path) {
    if (path == "pack.mcmeta" || path == "pack.rpbt.mcmeta") {
        // Do nothing (don't copy the file)
        return;
    }

    if (path.startsWith("assets/minecraft/models/item/") && path.endsWith(".json")) {
        // A vanilla item, let's check if the model is the same, in that case we can
        // merge overrides.
        const jsonA = await fileA.readAsJson();
        const jsonB = await fileB.readAsJson();
        // Compare the json, except the overrides, to see if they are equal.
        for (const key in jsonA) {
            if (key == "overrides") continue;

            if (JSON.stringify(jsonA[key]) != JSON.stringify(jsonB[key])) {
                this.getLogger().warn("Collision! The item model \""+ path +"\" is not equal in packs \""+ packA.name +"\" and \""+ packB.name +"\"");
                return;
            }
        }
        // If we are here the loop above has not returned, so the model is equal.
        if (jsonB.overrides) {
            if (jsonA.overrides) {
                // We have existing overrides, copy the overrides from B
                for (const override of jsonB.overrides) {
                    jsonA.overrides.push(override);
                }
            } else {
                // No existing overrides, copy the B overrides over
                jsonA.overrides = jsonB.overrides;
            }
        }

        packA.writeFile(path, JSON.stringify(jsonA, null, 4));
        return;
    }

    logger.warn("Collision! The file " + path + " from pack \""+ packB.name +"\" already exists in pack \"" + packA.name + "\".");
}