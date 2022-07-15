import Folder from "./Folder";
import PackFile from "./PackFile";

/**
 * A {@link Pack} or {@link Folder}.
 * 
 * Something that is a folder that can read, write, delete, etc files and folders. This
 * interface is used to share JSDoc between the implementations and ensure both the Pack
 * (root) and `Folder`s have the same methods for managing files and folders.
 */
export default interface FolderOrRoot {
    /**
     * Get a file inside the pack at the specified path.
     * 
     * @param path The path of the file to get relative to this folder.
     */
    getFile(path: string): PackFile | null;

    /**
     * Write a file. The contents can be almost anything, it must be a type that JSZip
     * accepts. See {@link https://stuk.github.io/jszip/documentation/api_jszip/file_data.html JSZip#file}.
     * 
     * Example usages:
     * 
     * `pack.writeFile("pack.mcmeta", '{"pack":{"description":"Hello, World!", "pack_format": 6}}');`
     * 
     * `pack.writeFile("pack.mcmeta", (await pack.getFile("pack.mcmeta").readAsText()).replace("{DATE}", new Date().toLocaleString()))`
     * 
     * @param path The path to write to
     * @param content The content to write, can for example be a string or a blob.
     */
    writeFile(path: string, content: any): void;

    /**
     * Remove a file or folder at the specified path.
     * 
     * @param path The path to remove at
     */
    remove(path: string): void;

    // Aliases
    /**
     * Alias of {@link FolderOrRoot#remove()}
     * @see FolderOrRoot#remove()
     */
    delete(path: string): void;
    /**
     * Alias of {@link FolderOrRoot#remove()}
     * @see FolderOrRoot#remove()
     */
    deleteFile(path: string): void;
    /**
     * Alias of {@link FolderOrRoot#remove()}
     * @see FolderOrRoot#remove()
     */
    removeFile(path: string): void;

    /**
     * Get all files and folders in this folder. If the deep option is set to true all
     * files and folders in subdirectories will also be returned with the path being
     * relative to this folder. If deep is set to false (which is the default), only the
     * files and folders in this folder will be returned.
     * 
     * @param deep Whether to get files and folders recursively.
     * @returns A list of paths to the files and folders matched relative to this folder.
     */
    getFiles(deep: boolean): string[];

    /**
     * Get a subfolder inside this folder.
     * 
     * @param path The path of the folder to get.
     */
    getFolder(path: string): Folder | null;
}