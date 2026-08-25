"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
// Inside Docker, env comes from the container environment (IS_DOCKER=1).
// Otherwise (bare npm start / tsx dev), hydrate from the project .env file.
// Must be imported before any module reads process.env.
if (!process.env.IS_DOCKER) {
    (0, dotenv_1.config)({ quiet: true });
}
