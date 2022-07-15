import ImportResolver from "./ImportResolver";

const AsyncFunction: Function = Object.getPrototypeOf(async function(){}).constructor;

const REQUIRE_REGEX = /require\(.*\)/g;
const IMPORT_REGEX = /import ((.+) from)? ?(["'`].+["'`])/g;

/**
 * Executes JavaScript files.
 */
export default class FileExecutor {
    private readonly function: Function;
    importResolver: ImportResolver;
    
    constructor(script: string, codeSource: string, importResolver: ImportResolver) {
        this.importResolver = importResolver;

        const processedScript = this.processScript(script);
        this.function = AsyncFunction("require", processedScript);
        Object.defineProperty(this.function, "name", { value: codeSource });
    }

    private processScript(script: string) {
        // Replace ES Modules imports with a call to our require function
        script = script.replace(IMPORT_REGEX, str => convertImportToRequire(str));

        // Ensure all calls to our require function are awaited
        script = script.replace(REQUIRE_REGEX, str => "(await " + str + ")");
        return script;
    }

    async execute() {
        await this.function(async (path: string) => {
            return await this.importResolver.resolve(path);
        });
    }
}

export function convertImportToRequire(str: string) {
    try {
        return new ImportReader(str).run();
    } catch(e) {
        throw new Error("Failed to convert an import from ES modules to the rpbt format. " +
        "This is an rpbt bug, please report it. In the meantime, try rewrite the import to "+
        "a simpler format and it might work. The import: " + str);
    }
}

const WHITESPACE = /\s/;
const IDENTIFIER_END = /[\s,;]/;
const STRING_START = /["'`]/;

class ImportReader {
    private readonly str: string;
    private index: number;
    private destruct: {[key: string]: string};
    private starName?: string;

    constructor(str: string) {
        this.str = str;
        this.index = 0;
        this.destruct = {};
    }

    peek() { return this.str.charAt(this.index); }
    read() { return this.str.charAt(this.index++); }
    skip() { this.index++; }
    canRead() { return this.index + 1 <= this.str.length; }
    peek2() { return this.peek() + this.str.charAt(this.index + 1); }

    skipWhitespace() {
        while (WHITESPACE.test(this.peek())) {
            this.skip();
        }
    }

    readIdentifier() {
        let str = "";
        while (!IDENTIFIER_END.test(this.peek()) && this.canRead()) {
            str += this.read();
        }
        return str;
    }

    readString() {
        const stringChar = this.read();
        let str = stringChar;
        let escaped = false;
        while (this.canRead()) {
            const char = this.read();
            if (escaped) {
                str += char;
                escaped = false;
            } else if (char == '\\') {
                escaped = true;
            } else if (char == stringChar) {
                str += char;
                return str;
            } else {
                str += char;
            }
        }
        return str;
    }

    expect(char: string) {
        const found = this.read();
        if (found != char) {
            throw new Error("Expected character: " + char +", found: " + found);
        }
    }

    expectWord(word: string) {
        if (this.readIdentifier() != word) {
            throw new Error("Expected word: " + word);
        }
    }

    run() {
        this.expectWord("import");
        this.skipWhitespace();
        if (STRING_START.test(this.peek())) {
            // import "module-name"
            const moduleName = this.readString();
            return `require(${moduleName})`;
        }
        this.readPart();
        this.skipWhitespace();
        this.expectWord("from");
        this.skipWhitespace();
        const moduleName = this.readString();

        if (this.starName) {
            return `const ${this.starName} = ${this.createDestruct()} = require(${moduleName})`;
        } else {
            return `const ${this.createDestruct()} = require(${moduleName})`;
        }

    }

    readPart() {
        const c = this.peek();
        if (c == "*") {
            // Star import
            // import * as name from "module-name";
            this.skip();
            this.skipWhitespace();
            this.expectWord("as");
            this.skipWhitespace();
            this.starName = this.readIdentifier();
        } else if (c == "{") {
            // destruct import
            this.skip();
            this.skipWhitespace();
            this.readDestructPart();
            this.skipWhitespace();
            this.expect("}");
        } else {
            // Default export
            // import defaultExport from "module-name";
            const name = this.readIdentifier();
            this.destruct.default = name;
        }
        this.skipWhitespace();
        if (this.peek() == ",") {
            this.skip();
            this.skipWhitespace();
            this.readPart();
        }
    }

    readDestructPart() {
        const char = this.peek();
        let name: string;
        if (STRING_START.test(char)) {
            name = this.readString();
        } else {
            name = this.readIdentifier();
        }
        this.skipWhitespace();
        if (this.peek2() == "as") {
            this.skip();
            this.skip();
            this.skipWhitespace();
            const rename = this.readIdentifier();
            this.destruct[name] = rename;
        } else {
            this.destruct[name] = name;
        }

        this.skipWhitespace();
        if (this.peek() == ",") {
            this.skip();
            this.skipWhitespace();
            this.readDestructPart();
        }
    }

    createDestruct() {
        let str = "{ ";
        for (const key in this.destruct) {
            const value = this.destruct[key];
            if (key == value) {
                str += key;
            } else {
                str += key + ": " + value;
            }
            str += ", ";
        }
        if (str.endsWith(", ")) {
            str = str.substring(0, str.length - 2) + " ";
        }
        str += "}";
        return str;
    }
}

const SIMPLE_NAME_EXPORT = /export ([^\s,;(){}]+)/g;
const EXPRESSION_EXPORT = /export (((async )?function)|var|let|const|class) ([^\s,;(){}]+)/g;

export function convertEsModulesExport(script: string): string {
    const toExport: {[key: string]: string} = {};

    // export <expression, ex. function or variable>
    script = script.replace(EXPRESSION_EXPORT, (str, p1, p2, p3, name) => {
        toExport[name] = name;
        return str.substring("export ".length);
    });

    // export name;
    script = script.replace(SIMPLE_NAME_EXPORT, (str, name) => {
        return `module.exports.${name} = ${name}`;
    });

    for (let name in toExport) {
        const reference = toExport[name];
        script += `\nmodule.exports.${name} = ${reference};`;
    }

    return script;
}