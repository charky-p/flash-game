const { json } = require('express');
const { getData } = require('./dataStore');

const DEFAULT_XP = 10;
const ONE_DAY = 24 * 60 * 60 * 1000; // milliseconds in a day

function getUser(userName) {
    const db = getData();
    return db.users.find(user => user.name === userName);
}

/**
 * Login/register user
 * @returns null if invalid login, otherwise the user
 */
function loginUser(name, password) {
    const data = getData();
    const user = data.users.find(user => user.name === name);
    if (!user) {
        const newUser = { name: name, password: password, group: null, xp: 0, streak: 0, flashcardAttempts: [], 
            flashcardsCreated: 0, badges: [] };
        data.users.push(newUser);
        return newUser;
    } else if (password === user.password) {
        return user;
    }
    return null;
}

function createGroup(groupName, userName) {
    console.log(`Creating group ${groupName}`);
    const db = getData();
    if (db.groups.find(group => group.groupName === groupName)) {
        console.log(`Creating group ${groupName} and group found`);
        return null;
    }
    const user = getUser(userName);
    if (user) {
        const group = { groupName: groupName, owner: userName, users: [userName], flashcards: [] };
        db.groups.push(group);
        user.group = groupName;
        return group;
    }
    console.log(`Creating group ${groupName} and user not found`);
    return null;
}

function joinGroup(groupName, userName) {
    const db = getData();
    const group = db.groups.find(group => group.groupName === groupName);
    const user = getUser(userName);
    if (group && user && !group.users.includes(userName)) {
        group.users.push(userName);
        user.group = groupName;
        return true;
    } else {
        console.log(`group is ${group} and user is ${user}`);
        return false;
    }
}

function getPlayerGroupName(userName) {
    const db = getData();
    const user = getUser(userName);
    if (!user) return null;
    const group = db.groups.find(group => group.groupName === user.group);
    if (!group) return null;
    return group.groupName;
}

function getXp(userName) {
    const user = getUser(userName);
    return user?.xp ?? 0;
}

function getLeaderboard(groupName) {
    const db = getData();
    const group = db.groups.find(group => group.groupName === groupName);
    console.log(`group is ${JSON.stringify(group)}`);

    if (group) {
        const leaderboard = group.users.map((username) => ({
            xp: getXp(username),
            name: username
        }));
        leaderboard.sort((a, b) => b.xp - a.xp);
        console.log(`leaderboard is ${JSON.stringify(leaderboard)}`);
        return leaderboard;
    }
    return null;
}

function createFlashcard(question, answers, correctAnswer, userName) {
    const db = getData();
    const group = db.groups.find(group => group.users.includes(userName));

    if (group) {
        if (group.flashcards.find(f => f.question === question)) {
            return false;
        }
        const flashcard = {
            flashcardId: db.flashcardAmt,
            question: question,
            answers: answers,
            correctAnswer: correctAnswer
        };
        db.flashcardAmt++;
        group.flashcards.push(flashcard);
        addHelpingHandBadge(userName);
        return flashcard;
    }
    return null;
}

function addHelpingHandBadge(userName) {
    const user = getUser(userName);
    user.flashcardsCreated++;
    if (user.flashcardsCreated >= 3) {
        if (!user.badges.includes("helping hand")) {
            user.badges.push("helping hand");
        }
    }
}

function reviewFlashcard(userName) {
    const db = getData();
    const group = db.groups.find(group => group.users.includes(userName));
    console.log('group ', JSON.stringify(group));
    if (group) {
        const user = getUser(userName);
        console.log('user ', JSON.stringify(user));
        if (user) {
            const now = Date.now();

            user.flashcardAttempts = user.flashcardAttempts.filter(attempt => {
                const attemptTime = new Date(attempt.time).getTime();
                return now - attemptTime <= ONE_DAY;
            });

            if (user.flashcardAttempts.length == 0) {
                user.streak = 0;
            }

            const attemptsPerFlashCard = {};
            user.flashcardAttempts.forEach(f => {
                const id = f.flashcardId;
                attemptsPerFlashCard[id] = (attemptsPerFlashCard[id] || 0) + 1;
            });

            const flashcardIds = group.flashcards.map(f => f.flashcardId);
            const disallowedIds = user.flashcardAttempts.filter(
                f => f.correct || attemptsPerFlashCard[f.flashcardId] >= 3
            ).map(f => f.flashcardId);
            const allowed_ids = flashcardIds.filter(f => !disallowedIds.includes(f));
            return allowed_ids;
        }
    }
    return null;
}

function answerFlashcard(answer, flashcardId, userName) {
    const db = getData();
    const group = db.groups.find(group => group.users.includes(userName));

    if (group) {
        const flashcard = getFlashcard(flashcardId, userName);
        const user = getUser(userName);
        if (flashcard) {
            let xpGained = 0;
            if (flashcard.correctAnswer === answer) {
                user.streak++;
                addHotShotBadge(user);
                let attempts = user.flashcardAttempts.filter(f => f.flashcardId == flashcardId && !f.correct);
                xpGained = (DEFAULT_XP / Math.pow(2, attempts.length)) * (1 + 0.25 * (user.streak >= 3));
                user.xp += xpGained;
            } else {
                user.streak = 0;
            }
            user.flashcardAttempts.push({
                flashcardId: flashcardId,
                time: Date.now(),
                correct: flashcard.correctAnswer == answer
            });
            return xpGained;
        }
    }
    return null;
}

function addHotShotBadge(user) {
    if (user.streak > 4 && !user.badges.includes("hot shot")) {
        if (!user.flashcardAttempts.find(f => f.correct === false)) {
            user.badges.push("hot shot");
        }
    }
}

function getFlashcard(flashcardId, userName) {
    console.log('flashcardId is', flashcardId, 'type:', typeof flashcardId);
    const db = getData();
    const group = db.groups.find(group => group.users.includes(userName));
    console.log(`group is ${JSON.stringify(group)}`);
    const val = group.flashcards.find(f => f.flashcardId === flashcardId);
    console.log(`val is ${JSON.stringify(val)}`);
    return val;
}

function getAnswer(flashcardId, userName) {
    return getFlashcard(flashcardId, userName).correctAnswer;
}

function resetStreak(userName) {
    const user = getUser(userName);
    user.streak = 0;
}

function getStreak(userName) {
    const user = getUser(userName);
    return user.streak;
}

function getBadges(userName) {
    const user = getUser(userName);
    return user.badges;
}

function addSkillDiffBadge(leaderboard, userName) {
    if (leaderboard[0].name === userName && leaderboard.length > 1) {
        if (!getBadges(userName).includes("skill diff") && leaderboard[0].xp - leaderboard[1].xp >= 50) {
            const user = getUser(userName);
            user.badges.push("skill diff");
        }
    }
}

function flashcardAllowed(flashcardId, userName) {
    const user = getUser(userName);
    const attempts = user.flashcardAttempts.filter(f => f.flashcardId === flashcardId);
    return (attempts.length < 3 && !attempts.find(f => f.correct));
}

module.exports = {
    loginUser,
    createGroup,
    joinGroup,
    getPlayerGroupName,
    getLeaderboard,
    reviewFlashcard,
    answerFlashcard,
    createFlashcard,
    getFlashcard,
    getAnswer,
    resetStreak,
    getStreak,
    getBadges,
    addSkillDiffBadge,
    flashcardAllowed
};
