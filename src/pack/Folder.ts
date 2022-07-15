import FolderOrRoot from "./FolderOrRoot";
import Pack from "./Pack";
import PackFile from "./PackFile";

/**
 * A folder inside a Pack. Only represents a path of the folder meaning Folder instances
 * can exist despite there actually being no folder at the path.
 * 
 * The path is relative to the pack meaning "assets" refers to the assets folder
 * in the root of the pack.
 */
export default class Folder implements FolderOrRoot {
    readonly pack: Pack;
    readonly path: string;

    /**
     * Create a new folder instance.
     * 
     * Do not use this constructor to create folers, instead use
     * `pack.createFolder(path)` or create files inside the folder
     * and it will be created automatically.
     * 
     * @param pack The pack this file belongs to
     * @param path The path of the file relative to the pack
     */
    constructor(pack: Pack, path: string) {
        this.pack = pack;
        this.path = path;
    }

    /**
     * @override
     * @inheritdoc
     */
    getFiles(deep = false): string[] {
        const files: string[] = [];
        for (const absolutePath of this.pack.getFiles(true)) {
            if (absolutePath == this.path) continue;

            if (absolutePath.startsWith(this.path)) {
                const path = absolutePath.substr(this.path.length);
                if (deep || !path.slice(0, -1).includes("/")) {
                    files.push(path);
                }
            }
        }
        return files;
    }

    /**
     * Get the absolute path of this folder relative to the pack.
     * 
     * @returns The absolute path of this folder.
     */
    getAbsolutePath(): string;
    /**
     * Get the absolute path relative to the pack of the specified `path`.
     * 
     * For example, in the folder "assets", if this method is called with
     * "example/" as a parameter "assets/example/" will be returned.
     * 
     * @param path The path relative to this folder to get as an absolute path.
     * @returns The abolute path of the specified `path` parameter.
     */
    getAbsolutePath(path: string): string;
    getAbsolutePath(path = ""): string {
        if (path.startsWith("/")) path = path.substr(1);

        return this.path + path;
    }

    // Implement FolderOrRoot by forwarding the absolute path to the pack.

    /**
     * Get a file inside this folder at the specified path.
     * 
     * @param path The path of the file to get relative to this folder.
     */
    getFile(path: string): PackFile | null {
        return this.pack.getFile(this.getAbsolutePath(path));
    }

    /**
     * @override
     * @inheritdoc
     */
    writeFile(path: string, content: any) {
        this.pack.writeFile(this.getAbsolutePath(path), content);
    }
    /**
     * @override
     * @inheritdoc
     */
    remove(path: string) {
        this.pack.remove(this.getAbsolutePath(path));
    }
    /**
     * @override
     * @inheritdoc
     */
    delete(path: string) {
        this.pack.delete(this.getAbsolutePath(path));
    }
    /**
     * @override
     * @inheritdoc
     */
    deleteFile(path: string) {
        this.pack.deleteFile(this.getAbsolutePath(path));
    }
    /**
     * @override
     * @inheritdoc
     */
    removeFile(path: string) {
        this.pack.removeFile(this.getAbsolutePath(path));
    }
    /**
     * @override
     * @inheritdoc
     */
    getFolder(path: string) {
        return this.pack.getFolder(this.getAbsolutePath(path));
    }
}