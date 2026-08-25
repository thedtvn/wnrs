"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRawQuestion = exports.shuffle = void 0;
const seedrandom_1 = __importDefault(require("seedrandom"));
const shuffle = (array, seed) => {
    if (!Array.isArray(array))
        return [];
    const copy = array.slice();
    const rng = (0, seedrandom_1.default)(seed);
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};
exports.shuffle = shuffle;
const getRawQuestion = (question) => {
    const _question = question.replaceAll('\n', '');
    const _ownItRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const withoutOwnIt = _question.replaceAll(_ownItRegex, (_m, _p1, p2) => p2);
    const _hboRegex = / <(.+)>/g;
    return withoutOwnIt.replaceAll(_hboRegex, '');
};
exports.getRawQuestion = getRawQuestion;
