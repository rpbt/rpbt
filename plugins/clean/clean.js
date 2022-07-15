///<reference path="../../rpbt-types.d.ts" />

import { target, logger } from "@rpbt";

let count = 0;
for (const filePath of target.getFiles(true)) {
    if (filePath.endsWith(".DS_Store")
        || filePath.includes("__MACOSX")
        || filePath.endsWith("thumbs.db")
        || filePath.endsWith("desktop.ini")
        || filePath.endsWith("Icon?\r")) {
        // If we're deleting a folder, count how many files were deleted.
        const folder = target.getFolder(filePath);
        if (folder != null) {
            count += folder.getFiles(true).length;
        }
        target.remove(filePath);
        count++;
    }
}
logger.info("Removed " + count + " unwanted " + (count == 1 ? "file/folder" : "files/folders"));