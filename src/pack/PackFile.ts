import { JSZipObject } from "jszip";
import Pack from "./Pack";

/**
 * A file inside a Pack. Only represents a path of the file, sort of like java's
 * java.io.File meaning PackFile instances can exist despite there actually being
 * no file at the path.
 * 
 * The path is relative to the pack meaning "pack.png" refers to the pack.png
 * file in the root of the pack.
 */
export default class PackFile {
    readonly pack: Pack;
    readonly path: string;

    /**
     * Create a new pack file instance.
     * 
     * Do not use this constructor to create files.
     * 
     * @param pack The pack this file belongs to
     * @param path The path of the file relative to the pack
     */
    constructor(pack: Pack, path: string) {
        this.pack = pack;
        this.path = path;
    }

    /**
     * Get the name of this file. Will returns the last part of it's path.
     */
    getName(): string {
        let path = this.path;
        if (path.endsWith("/")) path = path.substring(0, path.length - 1);
        const parts = path.split("/");
        return parts[parts.length - 1];
    }

    /**
     * Get this file as a JSZip ZipObject.
     */
    getZipObject(): JSZipObject | null {
        return this.pack.getZip().file(this.path);
    }

    /**
     * Check whether the file exists and is a file.
     * Will return false even if there exists something
     * at the path but it is not a file (for example a folder).
     */
    exists(): boolean {
        return this.getZipObject() != null;
    }

    // Reading

    /**
     * Read the file as text.
     * This method is async and needs to be awaited.
     * Throws an error if this file does not exist or if the reading
     * failed for some reason.
     * @async
     */
    async readAsText(): Promise<string> {
        const blob = await this.readAsBlob();
        return new Promise<string>(function(resolve, reject) {
            const reader = new FileReader();
            reader.onload = function() {
                resolve(reader.result as string);
            };
            reader.onerror = reject;
            reader.readAsText(blob);
        });
    }

    /**
     * Read the file as json.
     * This method is async and needs to be awaited.
     * Throws an error if this file does not exist or if the reading
     * failed for some reason, or if the read text is not json.
     * @async
     */
    async readAsJson(): Promise<any> {
        const text = await this.readAsText();
        try {
            return JSON.parse(text);
        } catch(e) {
            throw new Error("Invalid JSON when reading file. " + this.path + " " + e);
        }
    }

    /**
     * Read the file as a data url. Can be used when for example displaying images.
     * This method is async and needs to be awaited.
     * Throws an error if this file does not exist or if the reading
     * failed for some reason.
     * @async
     */
    async readAsDataURL(): Promise<string> {
        const blob = await this.readAsBlob();
        return new Promise<string>(function(resolve, reject) {
            const reader = new FileReader();
            reader.onload = function() {
                resolve(reader.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Read the file as an Image. Can for example be used when rendering
     * images on a canvas.
     * This method is async and needs to be awaited.
     * Throws an error if this file does not exist or if the reading
     * failed for some reason.
     * @async
     */
    async readAsImage(): Promise<HTMLImageElement> {
        const dataURL = await this.readAsDataURL();
        return new Promise<HTMLImageElement>(function(resolve, reject) {
            const image = new Image();
            image.onload = function() {
                resolve(image);
            }
            image.onerror = reject;
            image.src = dataURL;
        });
    }

    private getExistingZipObject(): JSZipObject {
        const zipObject = this.getZipObject();
        if (zipObject == null) throw new Error("File does not exist. Has it been deleted? path: "+ this.path);
        return zipObject;
    }

    /**
     * Read the file as a blob.
     * Throws an error if this file does not exist or if the reading
     * failed for some reason.
     * @async
     */
    async readAsBlob(): Promise<Blob> {
        const zipObject = this.getExistingZipObject();
        return await zipObject.async("blob");
    }

    async readAsArrayBuffer(): Promise<ArrayBuffer> {
        const zipObject = this.getExistingZipObject();
        return await zipObject.async("arraybuffer");
    }

    async readAsUint8Array(): Promise<Uint8Array> {
        const zipObject = this.getExistingZipObject();
        return await zipObject.async("uint8array");
    }
}