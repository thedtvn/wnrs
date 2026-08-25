"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eligiblePlayers = exports.checkTimeouts = exports.handleClientMessage = exports.createInitialState = exports.setQuestionProvider = void 0;
let questionProvider = (_settings, _round) => 'Placeholder question?';
/** Server wires this to the real deck-backed picker at boot; tests keep the stub. */
const setQuestionProvider = (fn) => {
    questionProvider = fn;
};
exports.setQuestionProvider = setQuestionProvider;
const createInitialState = () => ({
    version: 0,
    hostId: null,
    players: [],
    readyIds: [],
    spectatorIds: [],
    disconnectedIds: [],
    settings: {
        selectedDecks: ['main'],
        seed: Math.random().toString(36).slice(2, 10),
        answerSeconds: 60,
        ratingSeconds: 30,
        totalRounds: 10,
        locale: 'en',
    },
    phase: 'lobby',
    round: null,
    roundHistory: [],
    roundNumber: 0,
});
exports.createInitialState = createInitialState;
/**
 * Pure reducer: apply one client message to the game state.
 * Never mutates the input state.
 */
const handleClientMessage = (state, msg, senderId, now) => {
    switch (msg.type) {
        case 'join':
            return join(state, msg.user.id, msg.user.name, msg.user.avatar);
        case 'ready':
            return simple(state, () => ready(state, senderId));
        case 'unready':
            return simple(state, () => unready(state, senderId));
        case 'spectate':
            return simple(state, () => spectate(state, senderId));
        case 'unspectate':
            return simple(state, () => unspectate(state, senderId));
        case 'setSettings':
            return setSettings(state, senderId, msg.settings);
        case 'transferHost':
            return transferHost(state, senderId, msg.targetId);
        case 'start':
            return startGame(state, senderId, now);
        case 'submitAnswer':
            return submitAnswer(state, senderId, msg.answer);
        case 'revealNext':
            return revealNext(state, senderId, now);
        case 'rateAnswer':
            return rateAnswer(state, senderId, msg.targetId, msg.rating);
        case 'nextQuestion':
            return nextQuestion(state, senderId, now);
        default:
            return { state, error: 'unknown message' };
    }
};
exports.handleClientMessage = handleClientMessage;
/**
 * Advance any expired timers (answering/rating deadlines).
 * Call this periodically (e.g., every second) from the server.
 */
const checkTimeouts = (state, now) => {
    const round = state.round;
    if (!round || round.deadline === null || now < round.deadline) {
        return { state };
    }
    if (state.phase === 'answering') {
        return { state: bumpVersion(closeAnswering(state)) };
    }
    if (state.phase === 'rating') {
        return { state: bumpVersion(finishRatingCurrent(state)) };
    }
    // stale deadline in a phase without timers — clear it
    return { state: bumpVersion({ ...state, round: { ...round, deadline: null } }) };
};
exports.checkTimeouts = checkTimeouts;
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const bumpVersion = (s) => ({ ...s, version: s.version + 1 });
const simple = (state, fn) => {
    const next = fn();
    return next !== null ? { state: bumpVersion(next) } : { state };
};
const isSpectator = (s, id) => s.spectatorIds.includes(id);
const isDisconnected = (s, id) => s.disconnectedIds.includes(id);
/** players minus spectators minus disconnected — the actors who must answer & rate */
const eligiblePlayers = (s) => s.players
    .map(p => p.id)
    .filter(id => !isSpectator(s, id) && !isDisconnected(s, id));
exports.eligiblePlayers = eligiblePlayers;
// ---------------------------------------------------------------------------
// Lobby
// ---------------------------------------------------------------------------
function join(state, userId, name, avatar) {
    const existing = state.players.find(p => p.id === userId);
    let next;
    if (existing) {
        next = {
            ...state,
            players: state.players.map(p => p.id === userId ? { ...p, name, avatar } : p),
            disconnectedIds: state.disconnectedIds.filter(id => id !== userId),
        };
    }
    else {
        next = {
            ...state,
            players: [...state.players, { id: userId, name, avatar }],
            hostId: state.hostId ?? userId,
            spectatorIds: state.phase !== 'lobby'
                ? [...state.spectatorIds, userId]
                : state.spectatorIds,
        };
    }
    return { state: bumpVersion(next) };
}
function ready(state, senderId) {
    if (state.phase !== 'lobby')
        return null;
    if (isSpectator(state, senderId))
        return null;
    if (senderId === state.hostId)
        return null; // host implicitly ready
    if (state.readyIds.includes(senderId))
        return state;
    return { ...state, readyIds: [...state.readyIds, senderId] };
}
function unready(state, senderId) {
    if (state.phase !== 'lobby')
        return null;
    if (!state.readyIds.includes(senderId))
        return state;
    return { ...state, readyIds: state.readyIds.filter(id => id !== senderId) };
}
function spectate(state, senderId) {
    if (state.phase !== 'lobby')
        return null; // no mid-game toggling
    if (isSpectator(state, senderId))
        return state;
    return {
        ...state,
        players: state.players.filter(p => p.id !== senderId),
        spectatorIds: [...state.spectatorIds, senderId],
        readyIds: state.readyIds.filter(id => id !== senderId),
    };
}
function unspectate(state, senderId) {
    if (state.phase !== 'lobby' && state.phase !== 'scoring')
        return null;
    if (!isSpectator(state, senderId))
        return state;
    const info = state.players.find(p => p.id === senderId)
        ?? state.spectatorIds.includes(senderId)
        ? { id: senderId, name: senderId } // shouldn't happen, but safe fallback
        : null;
    if (!info)
        return state;
    return {
        ...state,
        players: [...state.players, info],
        spectatorIds: state.spectatorIds.filter(id => id !== senderId),
    };
}
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
function sanitizeSettings(s) {
    const validDecks = Array.isArray(s.selectedDecks)
        ? s.selectedDecks.filter(d => typeof d === 'string' && d.length > 0)
        : ['main'];
    return {
        selectedDecks: validDecks.length > 0 ? validDecks : ['main'],
        seed: typeof s.seed === 'string' && s.seed.length > 0 ? s.seed.slice(0, 64) : 'seed',
        answerSeconds: clamp(Math.round(s.answerSeconds), 10, 300),
        ratingSeconds: clamp(Math.round(s.ratingSeconds), 5, 120),
        totalRounds: clamp(Math.round(s.totalRounds), 0, 50),
        locale: s.locale === 'vi' ? 'vi' : 'en',
    };
}
function setSettings(state, senderId, settings) {
    if (state.phase !== 'lobby' && state.phase !== 'finished') {
        return { state, error: 'settings locked during game' };
    }
    if (senderId !== state.hostId)
        return { state, error: 'not host' };
    return { state: bumpVersion({ ...state, settings: sanitizeSettings(settings) }) };
}
function transferHost(state, senderId, targetId) {
    if (senderId !== state.hostId)
        return { state, error: 'not host' };
    if (!state.players.some(p => p.id === targetId)) {
        return { state, error: 'target not in room' };
    }
    return { state: bumpVersion({ ...state, hostId: targetId }) };
}
// ---------------------------------------------------------------------------
// Starting / answering
// ---------------------------------------------------------------------------
function startGame(state, senderId, now) {
    if (state.phase !== 'lobby')
        return { state, error: 'already started' };
    if (senderId !== state.hostId)
        return { state, error: 'not host' };
    const required = (0, exports.eligiblePlayers)(state).filter(id => id !== state.hostId);
    const allReady = required.every(id => state.readyIds.includes(id));
    if (!allReady)
        return { state, error: 'not all players ready' };
    if ((0, exports.eligiblePlayers)(state).length < 1) {
        return { state, error: 'need at least one player' };
    }
    const roundNumber = 1;
    return {
        state: bumpVersion({
            ...state,
            phase: 'answering',
            roundNumber,
            readyIds: [],
            round: newRound(state, roundNumber, now),
        }),
    };
}
function newRound(state, roundNumber, now) {
    return {
        question: questionProvider(state.settings, roundNumber),
        deadline: now + state.settings.answerSeconds * 1000,
        answers: {},
        ratings: {},
        revealedAnswerIds: [],
        currentRevealId: null,
    };
}
function submitAnswer(state, senderId, answer) {
    if (state.phase !== 'answering')
        return { state, error: 'not accepting answers' };
    if (isSpectator(state, senderId))
        return { state, error: 'spectators cannot answer' };
    if (isDisconnected(state, senderId))
        return { state, error: 'disconnected' };
    const round = state.round;
    if (Object.prototype.hasOwnProperty.call(round.answers, senderId)) {
        return { state }; // duplicate submit ignored (first answer sticks)
    }
    const trimmed = typeof answer === 'string' ? answer.slice(0, 500) : '';
    const nextRound = { ...round, answers: { ...round.answers, [senderId]: trimmed } };
    const nextState = { ...state, round: nextRound };
    if (hasEveryoneAnswered(nextState)) {
        return { state: bumpVersion(closeAnswering(nextState)) };
    }
    return { state: bumpVersion(nextState) };
}
const hasEveryoneAnswered = (s) => {
    const eligible = (0, exports.eligiblePlayers)(s);
    if (eligible.length === 0)
        return true;
    return eligible.every(id => Object.hasOwn(s.round.answers, id));
};
/** answering -> revealing (or straight to scoring if nobody answered) */
function closeAnswering(state) {
    const round = state.round;
    const answerCount = Object.keys(round.answers).length;
    if (answerCount === 0) {
        return {
            ...state,
            phase: 'scoring',
            round: { ...round, deadline: null },
        };
    }
    return {
        ...state,
        phase: 'revealing',
        round: { ...round, deadline: null },
    };
}
// ---------------------------------------------------------------------------
// Revealing / rating
// ---------------------------------------------------------------------------
/** ordered owners who still have an unrevealed answer */
const pendingRevealIds = (s) => Object.keys(s.round.answers).filter(id => !s.round.revealedAnswerIds.includes(id));
function revealNext(state, senderId, now) {
    if (senderId !== state.hostId)
        return { state, error: 'not host' };
    if (state.phase === 'answering') {
        return { state: bumpVersion(closeAnswering(state)) };
    }
    if (state.phase === 'rating') {
        return { state: bumpVersion(finishRatingCurrent(state)) };
    }
    if (state.phase !== 'revealing')
        return { state, error: 'not revealing' };
    const pending = pendingRevealIds(state);
    if (pending.length === 0) {
        return { state: bumpVersion(toScoring(state)) };
    }
    const revealId = pending[0];
    const round = state.round;
    const nextState = {
        ...state,
        phase: 'rating',
        round: {
            ...round,
            currentRevealId: revealId,
            revealedAnswerIds: [...round.revealedAnswerIds, revealId],
            deadline: now + state.settings.ratingSeconds * 1000,
        },
    };
    // Always show rating phase — even solo / no eligible raters see the answer
    return { state: bumpVersion(nextState) };
}
/** raters allowed on the currently revealed answer: eligible minus the author */
const eligibleRaters = (s, ownerId) => (0, exports.eligiblePlayers)(s).filter(id => id !== ownerId);
function rateAnswer(state, senderId, targetId, rating) {
    if (state.phase !== 'rating')
        return { state, error: 'not rating' };
    const round = state.round;
    if (targetId !== round.currentRevealId)
        return { state, error: 'stale target' };
    if (targetId === senderId)
        return { state, error: 'cannot rate own answer' };
    if (isSpectator(state, senderId))
        return { state, error: 'spectators cannot rate' };
    if (isDisconnected(state, senderId))
        return { state, error: 'disconnected' };
    if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
        return { state, error: 'invalid rating' };
    }
    if (round.ratings[targetId]?.[senderId] !== undefined) {
        return { state }; // double-rate ignored
    }
    const nextRatings = {
        ...round.ratings,
        [targetId]: { ...(round.ratings[targetId] ?? {}), [senderId]: rating },
    };
    const nextState = { ...state, round: { ...round, ratings: nextRatings } };
    const expected = eligibleRaters(nextState, targetId);
    const got = Object.keys(nextRatings[targetId]).filter(id => expected.includes(id));
    if (got.length >= expected.length) {
        return { state: bumpVersion(finishRatingCurrent(nextState)) };
    }
    return { state: bumpVersion(nextState) };
}
/** rating done for the current answer -> next reveal, or scoring when exhausted */
function finishRatingCurrent(state) {
    const remaining = pendingRevealIds(state);
    if (remaining.length > 0) {
        return {
            ...state,
            phase: 'revealing',
            round: { ...state.round, currentRevealId: null, deadline: null },
        };
    }
    return toScoring(state);
}
function toScoring(state) {
    const round = state.round;
    return {
        ...state,
        phase: 'scoring',
        roundHistory: [...state.roundHistory, { ...round, currentRevealId: null, deadline: null }],
        round: { ...round, currentRevealId: null, deadline: null },
    };
}
// ---------------------------------------------------------------------------
// Round progression / restart
// ---------------------------------------------------------------------------
function nextQuestion(state, senderId, now) {
    if (state.phase !== 'scoring')
        return { state, error: 'not in scoring' };
    if (senderId !== state.hostId)
        return { state, error: 'not host' };
    const next = state.roundNumber + 1;
    if (state.settings.totalRounds > 0 && next > state.settings.totalRounds) {
        return { state: bumpVersion({ ...state, phase: 'finished' }) };
    }
    return {
        state: bumpVersion({
            ...state,
            phase: 'answering',
            roundNumber: next,
            round: newRound(state, next, now),
        }),
    };
}
