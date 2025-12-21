#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const yargs = __importStar(require("yargs"));
const gift_1 = require("./gift");
main();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yargs.demandOption(['i', 'r']);
        yargs.option('input', {
            alias: 'i',
            description: 'The input files(that contains `declare module "..." { }`).',
            array: true,
        });
        yargs.option('root-dir', {
            type: 'string',
            description: 'The root dir.'
        });
        yargs.alias('r', 'root').describe('r', 'The root module name.');
        yargs.alias('n', 'name').describe('n', 'The generated module name.');
        yargs.alias('o', 'output').describe('o', 'The output file.');
        yargs.alias('u', 'shelter-name').describe('u', 'Name of the unexported symbols\' namespace.(defaulted to "__internal")');
        yargs.alias('p', 'export-privates').describe('p', 'Indicates whether export private members of class.');
        yargs.option('verbose', { type: 'boolean', default: false });
        yargs.option('config', {
            type: 'string',
        });
        yargs.help();
        const argv = yargs.parse(process.argv);
        const { i, n, o, r, u, p, verbose, config: configFile, rootDir } = argv;
        let entries;
        if (configFile) {
            let config;
            try {
                config = fs.readJsonSync(configFile);
            }
            catch (err) {
                console.error(`Failed to read config file ${configFile}\n`, err);
            }
            entries = config.entries;
        }
        let name;
        if (typeof n === 'string') {
            name = n;
        }
        else if (typeof o === 'string') {
            name = path.basename(o, path.extname(o));
        }
        else {
            console.error(`You must specify a name for the result module.`);
            return -1;
        }
        let output;
        if (typeof o !== 'string') {
            output = path.join('.', 'gitf-out', `${name}.d.ts`);
        }
        else {
            if (fs.existsSync(o) && fs.statSync(o).isDirectory() ||
                !o.toLocaleLowerCase().endsWith('.d.ts')) {
                output = path.join(o, `${name}.d.ts`);
            }
            else {
                output = o;
            }
        }
        const options = {
            input: i,
            rootDir: rootDir,
            name,
            output,
            rootModule: r,
            shelterName: u,
            exportPrivates: p,
            verbose: verbose,
            entries,
        };
        try {
            const bundleResult = (0, gift_1.bundle)(options);
            yield Promise.all(bundleResult.groups.map((group) => __awaiter(this, void 0, void 0, function* () {
                yield fs.outputFile(group.path, group.code, { encoding: 'utf8' });
            })));
        }
        catch (err) {
            console.error(err);
            return -1;
        }
        return 0;
    });
}
//# sourceMappingURL=gift-cli.js.map