"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultUserDataPath = exports.serveOrcaApp = exports.RuntimeRpcFailureError = exports.RuntimeClientError = exports.RuntimeClient = void 0;
// Why: the runtime client used to live here as a single file. It was split
// into ./runtime/{types,metadata,transport,status,launch,client}.ts so each
// concern can be tested in isolation. This barrel preserves the original
// import surface so call sites (src/cli/index.ts, tests) remain unchanged.
var index_1 = require("./runtime/index");
Object.defineProperty(exports, "RuntimeClient", { enumerable: true, get: function () { return index_1.RuntimeClient; } });
Object.defineProperty(exports, "RuntimeClientError", { enumerable: true, get: function () { return index_1.RuntimeClientError; } });
Object.defineProperty(exports, "RuntimeRpcFailureError", { enumerable: true, get: function () { return index_1.RuntimeRpcFailureError; } });
Object.defineProperty(exports, "serveOrcaApp", { enumerable: true, get: function () { return index_1.serveOrcaApp; } });
Object.defineProperty(exports, "getDefaultUserDataPath", { enumerable: true, get: function () { return index_1.getDefaultUserDataPath; } });
