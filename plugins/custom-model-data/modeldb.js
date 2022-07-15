///<reference path="../../rpbt-types.d.ts" />

import { target } from "@rpbt";

const output = {
    version: 1,
    models: {}
};

for (const path of target.getFiles(true)) {
    if (path.startsWith("assets/minecraft/models/item/") && path.endsWith(".json")) {
        // A vanilla item, let's check for custom-model-data
        const file = target.getFile(path);
        const json = await file.readAsJson();
        if (json.overrides) {
            for (const override of json.overrides) {
                if (override.predicate && override.predicate.custom_model_data) {
                    const customModelData = override.predicate.custom_model_data;
                    const model = override.model;
                    let vanillaItem = path.substring("assets/minecraft/models/item/".length);
                    vanillaItem = vanillaItem.substring(0, vanillaItem.length - ".json".length);
                    output.models[model] = {
                        type: "custom_model_data",
                        target: vanillaItem,
                        CustomModelData: customModelData
                    };
                }
            }
        }
    }
}

const textarea = document.createElement("textarea");
textarea.value = JSON.stringify(output);
document.body.appendChild(textarea);