import { convertImportToRequire } from "../plugin/FileExecutor";

function runTest() {
    testw(`import * as name from "module-name";`);
    testw(`import defaultExport from "module-name";`);
    testw(`import { export1 } from "module-name";`);
    testw(`import { export1 as alias1 } from "module-name";`);
    testw(`import { default as alias } from "module-name";`);
    testw(`import { export1 , export2 } from "module-name";`);
    testw(`import { export1 , export2 as alias2 , export3 } from "module-name";`);
    testw(`import { "string name" as alias } from "module-name";`);
    testw(`import defaultExport, { export1 } from "module-name";`);
    testw(`import defaultExport, { export1, export2 } from "module-name";`);
    testw(`import defaultExport, * as name from "module-name";`);
    testw(`import "module-name";`);
    testw(`import { source, logger } from "@rpbt";`);
    testw(`import Pack from "@rpbt/pack/Pack";`);
    testw(`import Test from 'jszip'`);
    testw(`import def, * as module, { export1, export2 as exp2, export3, 'str name' as strn } from '@rpbt/examle'`);
}

function testw(str: string) {
    try {
        test(str);
        console.log("%c✅ Passed", "color: lime;");
    } catch(e) {
        console.log("%c❌ Failed", "color: red;", { error: {error: e } });
    }
    console.log("\n\n\n\n");
}

function test(str: string) {
    console.log(str);
    console.log("-->");
    console.log(convertImportToRequire(str));
}

runTest();