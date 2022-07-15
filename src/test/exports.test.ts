import { convertEsModulesExport } from "../plugin/FileExecutor";

function runTests() {
    test("export name;", "module.exports.name = name;");
    test("export function name() {};", "function name() {};\nmodule.exports.name = name;");
    test("export async function name() {};", "async function name() {};\nmodule.exports.name = name;");
    test("export class Name", "class Name\nmodule.exports.Name = Name;");
    test("export const name = 5;", "const name = 5;\nmodule.exports.name = name;");
    test("export let name = 5;", "let name = 5;\nmodule.exports.name = name;");
    test("export var name = false;", "var name = false;\nmodule.exports.name = name;");
    test("export { name1, name2, name3 };", "\nmodule.exports.name1 = name1;\nmodule.exports.name2 = name2;\nmodule.exports.name3 = name3;");
    test("export default name;", "module.exports.default = name;");
    test("export default const name;", "module.exports.default = const name;");
    test("export default async function name;", "module.exports.default = async function name;");
}

function test(str: string, expected: string) {
    try {
        console.log(str);
        const res = convertEsModulesExport(str);
        if (expected == res) {
            console.log("-->");
            console.log(res);
            console.log("%c✅ Passed", "color: lime;");
        } else {
            console.log("%c❌ Failed", "color: red;", { why: {found: res, expected: expected } });
        }
    } catch(e) {
        console.log("%c❌ Error", "color: red;", { error: {error: e } });
    }
    console.log("\n\n\n\n");
}

runTests();