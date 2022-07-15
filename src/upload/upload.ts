/*
 * Handles uploads in different ways (drag and drop, input, folder uploading,
 * zip uploading).
 */

import Pack from "../pack/Pack";
import PackType from "../pack/PackType";
import JSZip from "jszip";
import getApp from "../ui/index";

async function handle(zip: JSZip, name: string) {
    const pack = await Pack.loadJSZip(name, zip, PackType.SOURCE);
    // @ts-ignore
    window["pack"] = pack;

    const app = getApp();
    const packs = app.state.packs;
    packs.push(pack);
    app.setState({
        ...app.state,
        packs
    });
}

// ============================== //
// Drag and drop                  //
// ============================== //

/**
 * Handle a drop event where the user potentially dropped files to upload and
 * upload them.
 *
 * @param event The drag and drop event.
 */
 export async function handleOnDrop(event: DragEvent) {
    event.preventDefault();
    
    // We have to get the uploads sync, otherwise they disappear.
    const uploads = await getDropEventFiles(event);

    // Check if the user uploaded a zip file
    const directories = uploads.filter((path, file) => file.dir);
    const files = uploads.filter((path, file) => !file.dir);

    if (directories.length == 0 && files.length == 1 && files[0].name.endsWith(".zip")) {
        // The user has uploaded a zip file
        const file = files[0];
        const blob = await file.async("blob");
        const zip = await JSZip.loadAsync(blob);
        await handle(zip, file.name);
        return;
    } else {
        // Uploaded a folder (probably)
    }

    await handle(uploads, "");
}

/**
 * Get the files from a drop event.
 * 
 * @param event The drop event.
 * @returns The files.
 */
 async function getDropEventFiles(event: React.DragEvent | DragEvent): Promise<JSZip> {
    const root = new JSZip();
    const promises: Promise<void>[] = [];
    // Uploads from the drag and drop event have to be used exactly when the event
    // is called, synchronously, otherwise they disappear. Even if the
    // DataTransferItemList is saved, or induvidual DataTransferItems are stored,
    // they will all clear. Even if an await keyword is used they will be gone.
    //
    // Therefore, this method iterates sync and uses the item and stores all promises.
    // These promises can then all be awaited using Promise.all

    for (const item of event.dataTransfer!.items) {
        const entry = item.webkitGetAsEntry();
        const promise = handleItem(entry!, root);
        promises.push(promise);
    }
    await Promise.all(promises);
    return root;
}

/**
 * Handle an uploaded FileSystemEntry and extract the files to the directory
 * represented as a JSZip instance. Will also handle subdirectories and add them
 * to the directory and handle their files and folders recursively.
 * 
 * @param item The item to handle.
 * @param directory The directory to extract the upload to.
 */
 async function handleItem(item: FileSystemEntry, directory: JSZip) {
    if (item.isFile) {
        const file = await (new Promise<File>(function(resolve, reject) {
            (item as FileSystemFileEntry).file(resolve);
        }));
        directory.file(file.name, file);
    } else if (item.isDirectory) {
        const reader = (item as FileSystemDirectoryEntry).createReader();
        const entries: FileSystemEntry[] = [];
        while (true) {
            const readEntries = await (new Promise<FileSystemEntry[]>(function(resolve, reject) {
                reader.readEntries(resolve, reject);
            }));
            if (readEntries.length > 0) {
                entries.push(...readEntries);
            } else {
                break;
            }
        }
        const subdir = directory.folder(item.name)!;
        for (const entry of entries) {
            await handleItem(entry, subdir);
        }
    }
}

export function setup() {

    function handleDrag(event: DragEvent) {
        event.dataTransfer!.dropEffect = "copy";
        event.preventDefault();
    }
    document.body.addEventListener("dragover",  handleDrag);
    document.body.addEventListener("dragenter", handleDrag);
    document.body.addEventListener("dragstart", handleDrag);
    
    document.body.addEventListener("drop", handleOnDrop);
}


// ============================== //
// Input                          //
// ============================== //
