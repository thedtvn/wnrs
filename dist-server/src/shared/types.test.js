"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const types_1 = require("./types");
(0, vitest_1.describe)('isClientMessage', () => {
    (0, vitest_1.it)('validates join', () => {
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'join', user: { id: '1', name: 'A' } })).toBe(true);
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'join', user: { id: '1' } })).toBe(false);
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'join' })).toBe(false);
    });
    (0, vitest_1.it)('validates ready/unready with no payload', () => {
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'ready' })).toBe(true);
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'unready' })).toBe(true);
    });
    (0, vitest_1.it)('validates spectate/unspectate with no payload', () => {
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'spectate' })).toBe(true);
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'unspectate' })).toBe(true);
    });
    (0, vitest_1.it)('validates setSettings', () => {
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'setSettings', settings: { selectedDecks: ['main'], seed: 'x', answerSeconds: 60, ratingSeconds: 30, totalRounds: 10 } })).toBe(true);
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'setSettings', settings: { selectedDecks: ['main'], seed: 'x', answerSeconds: 60, ratingSeconds: 30 } })).toBe(false);
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'setSettings' })).toBe(false);
    });
    (0, vitest_1.it)('validates transferHost', () => {
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'transferHost', targetId: 'p2' })).toBe(true);
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'transferHost' })).toBe(false);
    });
    (0, vitest_1.it)('validates start with no payload', () => {
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'start' })).toBe(true);
    });
    (0, vitest_1.it)('validates submitAnswer', () => {
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'submitAnswer', answer: 'hello' })).toBe(true);
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'submitAnswer', answer: '' })).toBe(true);
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'submitAnswer' })).toBe(false);
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'submitAnswer', answer: 123 })).toBe(false);
    });
    (0, vitest_1.it)('validates revealNext with no payload (host)', () => {
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'revealNext' })).toBe(true);
    });
    (0, vitest_1.it)('validates rateAnswer with rating 1-10', () => {
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'rateAnswer', targetId: 'p2', rating: 1 })).toBe(true);
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'rateAnswer', targetId: 'p2', rating: 10 })).toBe(true);
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'rateAnswer', targetId: 'p2', rating: 0 })).toBe(false);
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'rateAnswer', targetId: 'p2', rating: 11 })).toBe(false);
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'rateAnswer', targetId: 'p2', rating: 5.5 })).toBe(false);
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'rateAnswer', targetId: 'p2' })).toBe(false);
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'rateAnswer', rating: 5 })).toBe(false);
    });
    (0, vitest_1.it)('validates nextQuestion with no payload', () => {
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'nextQuestion' })).toBe(true);
    });
    (0, vitest_1.it)('rejects unknown and malformed', () => {
        (0, vitest_1.expect)((0, types_1.isClientMessage)({ type: 'bogus' })).toBe(false);
        (0, vitest_1.expect)((0, types_1.isClientMessage)(null)).toBe(false);
        (0, vitest_1.expect)((0, types_1.isClientMessage)(undefined)).toBe(false);
        (0, vitest_1.expect)((0, types_1.isClientMessage)('string')).toBe(false);
        (0, vitest_1.expect)((0, types_1.isClientMessage)(42)).toBe(false);
    });
});
(0, vitest_1.describe)('type surface', () => {
    (0, vitest_1.it)('GamePhase covers all phases', () => {
        const phases = ['lobby', 'answering', 'revealing', 'rating', 'scoring', 'finished'];
        (0, vitest_1.expect)(phases).toHaveLength(6);
    });
    (0, vitest_1.it)('GameState has the phase-protocol shape', () => {
        const state = {
            version: 0,
            phase: 'lobby',
            hostId: null,
            players: [],
            readyIds: [],
            spectatorIds: [],
            disconnectedIds: [],
            settings: { selectedDecks: ['main'], seed: 's', answerSeconds: 60, ratingSeconds: 30, totalRounds: 10, locale: 'en' },
            round: null,
            roundHistory: [],
            roundNumber: 0,
        };
        (0, vitest_1.expect)(state.phase).toBe('lobby');
    });
    (0, vitest_1.it)('ServerMessage state carries GameState; clockSync carries now', () => {
        const s = { type: 'state', state: { version: 1 } };
        const c = { type: 'clock', now: Date.now() };
        const e = { type: 'error', message: 'x' };
        (0, vitest_1.expect)(s.type).toBe('state');
        (0, vitest_1.expect)(c.type).toBe('clock');
        (0, vitest_1.expect)(e.type).toBe('error');
    });
});
