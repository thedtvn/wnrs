"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachGameRooms = void 0;
const socket_io_1 = require("socket.io");
const types_1 = require("../src/shared/types");
const index_1 = require("./index");
const helperFn_1 = require("../src/util/helperFn");
const gameEngine_1 = require("./gameEngine");
const DECK_MAP = {
    main: decks_1.main, family: decks_1.family, couples: decks_1.couples, honestDating: decks_1.honestDating, relationship: decks_1.relationship, innerCircle: decks_1.innerCircle, ownIt: decks_1.ownIt,
    breakup: decks_1.breakup, healing: decks_1.healing, forgiveness: decks_1.forgiveness, selfReflection: decks_1.selfReflection, selfLove: decks_1.selfLove,
    exfriend: decks_1.exfriend, sneakyLink: decks_1.sneakyLink, quarantine: decks_1.quarantine, raceAndPrivilege: decks_1.raceAndPrivilege, voting: decks_1.voting,
    bumbleDate: decks_1.bumbleDate, bumbleBFF: decks_1.bumbleBFF, bumbleBizz: decks_1.bumbleBizz, cann: decks_1.cann, valentino: decks_1.valentino, hbomax: decks_1.hbomax,
};
const decks_1 = require("../src/decks");
// ---------------------------------------------------------------------------
// Question provider — wired once at module load
// ---------------------------------------------------------------------------
(0, gameEngine_1.setQuestionProvider)((settings, roundNumber) => {
    const locale = settings.locale === 'vi' ? 'vi' : 'en';
    const allQuestions = [];
    for (const slug of settings.selectedDecks) {
        const deck = DECK_MAP[slug];
        if (!deck)
            continue;
        const q = locale === 'vi' && deck.questions_vi
            ? deck.questions_vi
            : deck.questions;
        for (let lvl = 0; lvl < q.length; lvl++) {
            if (!allQuestions[lvl])
                allQuestions[lvl] = [];
            allQuestions[lvl].push(...q[lvl]);
        }
    }
    const flat = allQuestions.flat();
    if (flat.length === 0)
        return locale === 'vi' ? 'Hết câu hỏi!' : 'No more questions!';
    const shuffled = (0, helperFn_1.shuffle)(flat, `${settings.seed}-r${roundNumber}`);
    return shuffled[(roundNumber - 1) % shuffled.length] ?? shuffled[0];
});
// ---------------------------------------------------------------------------
// Room registry
// ---------------------------------------------------------------------------
const rooms = new Map();
const getRoom = (roomId) => {
    let room = rooms.get(roomId);
    if (!room) {
        room = {
            state: (0, gameEngine_1.createInitialState)(),
            joinOrder: [],
            socketsByUser: new Map(),
            readyUsers: new Set(),
            spectatorUsers: new Set(),
            timer: null,
        };
        rooms.set(roomId, room);
    }
    return room;
};
// ---------------------------------------------------------------------------
// State filtering — redact answers during answering phase
// ---------------------------------------------------------------------------
function filterStateForBroadcast(state, socketUserId) {
    if (state.phase !== 'answering' || !state.round)
        return state;
    const filtered = {};
    for (const [pid, ans] of Object.entries(state.round.answers)) {
        if (pid === socketUserId) {
            filtered[pid] = ans;
        }
        else {
            filtered[pid] = '•••';
        }
    }
    return { ...state, round: { ...state.round, answers: filtered } };
}
// ---------------------------------------------------------------------------
// Broadcast helpers
// ---------------------------------------------------------------------------
function broadcastFiltered(io, roomId, room) {
    const sockets = io.sockets.adapter.rooms.get(roomId);
    if (!sockets)
        return;
    for (const socketId of sockets) {
        const socket = io.sockets.sockets.get(socketId);
        if (!socket)
            continue;
        const userId = socket.data.userId ?? null;
        const filtered = filterStateForBroadcast(room.state, userId);
        socket.emit('state', { type: 'state', state: filtered });
    }
}
function broadcastClock(io, roomId) {
    io.in(roomId).emit('clock', { type: 'clock', now: Date.now() });
}
// ---------------------------------------------------------------------------
// Timer management
// ---------------------------------------------------------------------------
function armTimer(io, roomId, room) {
    clearTimer(room);
    room.timer = setInterval(() => {
        const now = Date.now();
        const result = (0, gameEngine_1.checkTimeouts)(room.state, now);
        if (result.state.version !== room.state.version) {
            const prevPhase = room.state.phase;
            room.state = result.state;
            manageTimerTransition(io, roomId, room, prevPhase);
            broadcastFiltered(io, roomId, room);
        }
    }, 1000);
}
function clearTimer(room) {
    if (room.timer !== null) {
        clearInterval(room.timer);
        room.timer = null;
    }
}
function manageTimerTransition(io, roomId, room, prevPhase) {
    const phase = room.state.phase;
    if (phase === 'answering' || phase === 'rating') {
        if (!room.timer)
            armTimer(io, roomId, room);
    }
    else {
        clearTimer(room);
    }
}
// ---------------------------------------------------------------------------
// Host promotion
// ---------------------------------------------------------------------------
function promoteHostIfNeeded(room) {
    const activePlayers = room.state.players.filter(p => !room.state.disconnectedIds.includes(p.id));
    const hostAlive = activePlayers.some(p => p.id === room.state.hostId);
    if (!hostAlive && activePlayers.length > 0) {
        room.state = { ...room.state, hostId: activePlayers[0].id, version: room.state.version + 1 };
    }
}
// ---------------------------------------------------------------------------
// Known message types for socket.onAny validation
// ---------------------------------------------------------------------------
const KNOWN_TYPES = new Set([
    'join', 'start', 'setSettings', 'ready', 'unready',
    'spectate', 'unspectate', 'transferHost',
    'submitAnswer', 'revealNext', 'rateAnswer',
    'nextQuestion',
]);
const isKnownMessage = (payload) => typeof payload === 'object' &&
    payload !== null &&
    KNOWN_TYPES.has(payload.type ?? '') &&
    (0, types_1.isClientMessage)(payload);
// ---------------------------------------------------------------------------
// Clock sync interval per room
// ---------------------------------------------------------------------------
const clockIntervals = new Map();
function ensureClockSync(io, roomId) {
    if (clockIntervals.has(roomId))
        return;
    const interval = setInterval(() => {
        const sockets = io.sockets.adapter.rooms.get(roomId);
        if (!sockets || sockets.size === 0) {
            clearInterval(interval);
            clockIntervals.delete(roomId);
            return;
        }
        broadcastClock(io, roomId);
    }, 30_000);
    clockIntervals.set(roomId, interval);
}
function cleanupClockSync(roomId) {
    const interval = clockIntervals.get(roomId);
    if (interval) {
        clearInterval(interval);
        clockIntervals.delete(roomId);
    }
}
// ---------------------------------------------------------------------------
// Room cleanup when empty
// ---------------------------------------------------------------------------
function cleanupIfEmpty(io, roomId, room) {
    const sockets = io.sockets.adapter.rooms.get(roomId);
    if (!sockets || sockets.size === 0) {
        clearTimer(room);
        cleanupClockSync(roomId);
        rooms.delete(roomId);
    }
}
const attachGameRooms = (httpServer, options = {}) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: { origin: true },
    });
    io.on('connection', socket => {
        const roomId = typeof socket.handshake.auth?.room === 'string'
            ? socket.handshake.auth.room
            : null;
        if (!roomId) {
            console.error('[GameRoom] connection without room ID');
            socket.disconnect(true);
            return;
        }
        const admit = async () => {
            if (!options.verifyJoin)
                return true;
            try {
                return await options.verifyJoin(roomId);
            }
            catch (err) {
                console.error('[GameRoom] verifyJoin failed:', err);
                return false;
            }
        };
        void admit().then(async (allowed) => {
            if (!allowed) {
                console.error('[GameRoom] admission rejected for room:', roomId);
                socket.disconnect(true);
                return;
            }
            const rawJwt = typeof socket.handshake.auth?.jwt === 'string' ? socket.handshake.auth.jwt : null;
            if (roomId.startsWith('discord:') && !rawJwt) {
                console.error('[GameRoom] discord room missing JWT:', roomId);
                socket.disconnect(true);
                return;
            }
            let jwtPayload = null;
            if (rawJwt) {
                try {
                    jwtPayload = await (0, index_1.verifyJwt)(rawJwt);
                }
                catch (err) {
                    console.error('[GameRoom] JWT verification failed:', err);
                    socket.disconnect(true);
                    return;
                }
            }
            ;
            socket.data.room = roomId;
            socket.data.userId = null;
            socket.data.jwtPayload = jwtPayload;
            socket.join(roomId);
            socket.emit('clock', { type: 'clock', now: Date.now() });
            ensureClockSync(io, roomId);
            const room = getRoom(roomId);
            const userId = socket.data.userId;
            broadcastFilteredToSocket(socket, room, userId);
            socket.onAny((_event, payload) => {
                if (!isKnownMessage(payload))
                    return;
                processMessage(io, socket, roomId, payload);
            });
            socket.on('disconnect', () => {
                handleDisconnect(io, socket, roomId);
            });
        })
            .catch((err) => {
            console.error('[GameRoom] connection handler error:', err);
            socket.disconnect(true);
        });
    });
    return io;
};
exports.attachGameRooms = attachGameRooms;
// ---------------------------------------------------------------------------
// Send current state to a single socket
// ---------------------------------------------------------------------------
function broadcastFilteredToSocket(socket, room, userId) {
    const filtered = filterStateForBroadcast(room.state, userId);
    socket.emit('state', { type: 'state', state: filtered });
}
// ---------------------------------------------------------------------------
// Process a client message through the engine
// ---------------------------------------------------------------------------
function processMessage(io, socket, roomId, msg) {
    const room = getRoom(roomId);
    const data = socket.data;
    if (msg.type === 'join') {
        data.userId = msg.user.id;
        room.socketsByUser.set(msg.user.id, msg.user);
        if (!room.joinOrder.includes(msg.user.id)) {
            room.joinOrder.push(msg.user.id);
        }
    }
    const senderId = data.userId;
    if (!senderId) {
        socket.emit('error', { type: 'error', message: 'must join first' });
        return;
    }
    const prevPhase = room.state.phase;
    const now = Date.now();
    const result = (0, gameEngine_1.handleClientMessage)(room.state, msg, senderId, now);
    if (result.error) {
        socket.emit('error', { type: 'error', message: result.error });
    }
    if (result.state !== room.state) {
        room.state = result.state;
        manageTimerTransition(io, roomId, room, prevPhase);
        broadcastFiltered(io, roomId, room);
    }
}
// ---------------------------------------------------------------------------
// Disconnect handling with grace
// ---------------------------------------------------------------------------
function handleDisconnect(io, socket, roomId) {
    const room = rooms.get(roomId);
    if (!room)
        return;
    const data = socket.data;
    const userId = data.userId;
    if (!userId) {
        cleanupIfEmpty(io, roomId, room);
        return;
    }
    const hasOtherSocket = hasAnotherSocketForUser(io, roomId, socket.id, userId);
    if (hasOtherSocket) {
        cleanupIfEmpty(io, roomId, room);
        return;
    }
    const inGame = room.state.phase !== 'lobby';
    if (inGame) {
        if (!room.state.disconnectedIds.includes(userId)) {
            room.state = {
                ...room.state,
                disconnectedIds: [...room.state.disconnectedIds, userId],
                version: room.state.version + 1,
            };
        }
        promoteHostIfNeeded(room);
        broadcastFiltered(io, roomId, room);
    }
    else {
        room.socketsByUser.delete(userId);
        room.joinOrder = room.joinOrder.filter(id => id !== userId);
        room.state = {
            ...room.state,
            players: room.state.players.filter(p => p.id !== userId),
            readyIds: room.state.readyIds.filter(id => id !== userId),
            spectatorIds: room.state.spectatorIds.filter(id => id !== userId),
            version: room.state.version + 1,
        };
        promoteHostIfNeeded(room);
        broadcastFiltered(io, roomId, room);
    }
    cleanupIfEmpty(io, roomId, room);
}
function hasAnotherSocketForUser(io, roomId, excludeSocketId, userId) {
    const sockets = io.sockets.adapter.rooms.get(roomId);
    if (!sockets)
        return false;
    for (const socketId of sockets) {
        if (socketId === excludeSocketId)
            continue;
        const s = io.sockets.sockets.get(socketId);
        if (s && s.data.userId === userId)
            return true;
    }
    return false;
}
