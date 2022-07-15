# resource-pack-build-tool (rpbt)
A tool for automating parts of resource pack creation by creating javascipt files that can interact with the pack, and by using pre-existing plugins.

## Usage
`pack.rpbt.mcmeta` (Rename your `pack.mcmeta`)
```json
{
    "pack": {
        "pack_format": 8,
        "description": "My resource pack"
    },
    "resource-pack-build-tool": {
        "id": "foo/bar",
        "version": "1.0",
        "plugins": [
            { "id": "clean", "version": "1.0" },
            { "id": "include", "version": "1.0" },
            { "id": "./script.js" }
        ],
        "dependencies": [
            { "id": "foo/another-pack", "version": "1.1" },
        ]
    }
}
```
`script.js`
```javascript
///<reference path="./rpbt-types.d.ts" />

import { target } from "@rpbt";

// Read files from the target pack (the output, the pack you will download when the build is done)
const file = target.readFile("pack.mcmeta");
// Read files as json. Use top level await!
const json = await file.readAsJson();

json.pack.description += "\nBuilt at: " + new Date().toLocaleString();

// Write files
target.writeFile("pack.mcmeta", JSON.stringify(json));

// ( rpbt will rename the pack.rpbt.mcmeta to pack.mcmeta and remove the resource-pack-build-tool section, that's why we can read the pack.mcmeta file! )
```

### What does it mean?
`"id": "foo/bar"` - The id of the pack. This can either be a simple id, like `example`, or it can be prefixed with a username or group like `MyTeam/project1`.

`"version": "1.0"` - The version of the pack. This is not very strict, you don't need to increment it every time you make a change. But if you are creating a pack that might be used as a dependency, it can be a good idea to version it.

`"plugins": [` - The array of plugins to use. Plugins can have tasks that will run when the pack is being built.

`{ "id": "clean", "version": "1.0" }` - Add a plugin with the id `clean` and the version `1.0`. The clean plugin will remove unwanted files like `.DS_Store` and other files that operating systems create.

`{ "id": "include", "version": "1.0" }` - The include plugin will include all the files of all of the dependencies inside the current pack. This is very useful for merging packs, and including files from other packs that act as libraries.

`"dependencies": [` - The list of dependency packs. This doesn't do anything unless the `include` plugin is used.

`{ "id": "foo/another-pack", "version": "1.1" }` - Add a pack with the specified id and version.