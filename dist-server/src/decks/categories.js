"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Crossover = exports.Online = exports.Self = exports.Expansions = exports.Main = void 0;
const index_1 = require("./index");
const pick = (...slugs) => {
    const all = {
        main: index_1.main, family: index_1.family, couples: index_1.couples, honestDating: index_1.honestDating, relationship: index_1.relationship, innerCircle: index_1.innerCircle, ownIt: index_1.ownIt,
        breakup: index_1.breakup, healing: index_1.healing, forgiveness: index_1.forgiveness, selfReflection: index_1.selfReflection, selfLove: index_1.selfLove,
        exfriend: index_1.exfriend, sneakyLink: index_1.sneakyLink, quarantine: index_1.quarantine, raceAndPrivilege: index_1.raceAndPrivilege, voting: index_1.voting,
        bumbleDate: index_1.bumbleDate, bumbleBFF: index_1.bumbleBFF, bumbleBizz: index_1.bumbleBizz, cann: index_1.cann, valentino: index_1.valentino, hbomax: index_1.hbomax,
    };
    return Object.fromEntries(slugs.filter(s => s in all).map(s => [s, all[s]]));
};
exports.Main = {
    displayName: 'Main Deck',
    decks: pick('main'),
};
exports.Expansions = {
    displayName: 'Expansion',
    decks: pick('family', 'couples', 'honestDating', 'relationship', 'innerCircle', 'ownIt'),
};
exports.Self = {
    displayName: 'One Player +',
    decks: pick('breakup', 'healing', 'forgiveness', 'selfReflection', 'selfLove'),
};
exports.Online = {
    displayName: 'Online Released',
    decks: pick('exfriend', 'sneakyLink', 'quarantine', 'raceAndPrivilege', 'voting'),
};
exports.Crossover = {
    displayName: 'Crossover',
    decks: pick('bumbleDate', 'bumbleBFF', 'bumbleBizz', 'cann', 'valentino', 'hbomax'),
};
