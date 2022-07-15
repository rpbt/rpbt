import Pack from "../../pack/Pack";
import Logger from "../logger/Logger";

const logger = new Logger("bbmodel-to-json");

// TODO: Is this a plugin?
export async function convertBbmodelToJson(target: Pack, bbModelJson: any): Promise<any> {
    if (!(bbModelJson.meta && bbModelJson.meta.format_version == "4.0")) {
        throw new Error(
            "Unsupported .bbmodel format. Only version 4.0 is currently supported." +
            "If you have a newer version, try look for a newer version of the bbmodel-to-json plugin."
        );
    }

    target.addLogger(logger);

    const json: any = {
        credit: "Made with Blockbench",
        elements: [],
        textures: {}
    };

    if (bbModelJson.front_gui_light) {
        json.gui_light = "front";
    }

    if (!bbModelJson.ambientocclusion) {
        json.ambientocclusion = false;
    }

    if (bbModelJson.display) {
        json.display = bbModelJson.display;
    }

    if (bbModelJson.parent) {
        json.parent = parent;
    }

    for (let i = 0; i < bbModelJson.textures.length; i++) {
        const bbTexture = bbModelJson.textures[i];

        let textureKey = "";
        if (bbTexture.namespace) {
            textureKey = bbTexture.namespace + ":";
        }
        if (bbTexture.folder) {
            textureKey += bbTexture.folder + "/";
        }
        if (bbTexture.name) {
            textureKey += bbTexture.name;
        }
        if (textureKey.endsWith(".png")) {
            textureKey = textureKey.substring(0, textureKey.length - 4);
        }

        json.textures[bbTexture.id] = textureKey;

        if (bbTexture.particle) {
            json.textures["particle"] = textureKey;
        }

        const path = target.getTexturePath(textureKey);

        if (!path.startsWith("assets/minecraft")) {

            const base64 = bbTexture.source;

            const image = await new Promise<HTMLImageElement>(function (resolve, reject) {
                const image = new Image();
                image.onload = function () {
                    resolve(image);
                }
                image.onerror = reject;
                image.src = base64;
            });

            const canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(image, 0, 0);

            const file = target.getFile(path);
            if (file != null) {
                // There is already a texture here, let's make sure it's the same
                // texture.
                const err = "There is already an existing texture at " + path + " but while trying to extract a texture from a .bbmodel file a different texture exists at the same path.";

                const image2 = await file.readAsImage();
                const canvas2 = document.createElement("canvas");
                canvas2.width = image2.width;
                canvas2.height = image2.height;
                const ctx2 = canvas2.getContext("2d")!;
                ctx2.drawImage(image2, 0, 0);

                if (canvas.width != canvas2.width || canvas.height == canvas2.height) {
                    document.body.appendChild(canvas);
                    document.body.appendChild(canvas2);
                    throw new Error(err + ` (Differing width/height, ${canvas.width}x${canvas.height} vs ${canvas2.width}x${canvas2.height})`);
                }

                for (let x = 0; x < canvas2.width; x++) {
                    for (let y = 0; y < canvas2.width; y++) {
                        const data1 = ctx.getImageData(x, y, 1, 1);
                        const data2 = ctx2.getImageData(x, y, 1, 1);

                        if (data1.data[0] != data2.data[0]
                            || data1.data[1] != data2.data[1]
                            || data1.data[2] != data2.data[2]
                            || data1.data[3] != data2.data[3]) {
                            throw new Error(err + " (Differing pixel at (" + x + ", " + y + ").)");
                        }
                    }
                }
            } else {
                // No existing texture, let's extract it.
                logger.info("Extracting texture " + textureKey);

                const blob = await new Promise<Blob>(function (resolve, reject) {
                    canvas.toBlob(blob => blob != null ? resolve(blob) : reject(new Error("Failed to export image to blob.")), "image/png");
                });

                target.writeFile(path, blob);
            }
        }
    }

    for (const bbElement of bbModelJson.elements) {
        const element: any = {
            from: bbElement.from,
            to: bbElement.to,
            faces: {}
        };

        for (const faceName in bbElement.faces) {
            const bbFace = bbElement.faces[faceName];
            const face: any = {
                uv: bbFace.uv
            };
            const texture = bbModelJson.textures[bbFace.texture];
            face.texture = "#" + (texture == null ? "missing" : texture.id);
            if (bbFace.rotation) {
                face.rotation = bbFace.rotation;
            }
            element.faces[faceName] = face;
        }

        if (bbElement.rotation) {
            for (let i = 0; i < bbElement.rotation.length; i++) {
                const angle = bbElement.rotation[i];
                if (angle != 0) {
                    const axis = ["x", "y", "z"][i];
                    element["rotation"] = {
                        angle,
                        axis,
                        origin: bbElement.origin
                    };
                }
            }
        }

        json.elements.push(element);
    }

    return json;
}