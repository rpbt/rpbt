///<reference path="../../rpbt-types.d.ts" />

import { target, logger, plugin } from "@rpbt";

const config = plugin.config;

let count = 0;
for (const vanillaModel in config.config) {
    for (const model of config.config[vanillaModel]) {
        await target.addCustomModelData(vanillaModel, model);
        count++;
    }
}

logger.info("Added " + count + " custom model data overrides.");