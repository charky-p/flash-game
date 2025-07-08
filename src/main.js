const { json } = require('express');
const { getData } = require('./dataStore');

const DEFAULT_XP = 10;
const ONE_DAY = 24 * 60 * 60 * 1000; // milliseconds in a day

    /**
     * Login/register user
     * @returns null if invalid login, otherwise the user
     */
    function loginUser(name, password) {
        const data = getData();

        // Check if user has not been registered
        const user = data.users.find(user => user.name === name);
        if (!user) {
            const newUser = { name: name, password: password, group: null, xp: 0, streak: 0, flashcardAttempts: [], 
                flashcardsCreated: 0, badges: [] };
            data.users.push(newUser);
            return newUser;
        } else if (password === user.password) {
            return user;
        }

        // Invalid login details (Either name is not unique, or wrong password)
        return null;
    }

    function createGroup(groupName, userName) {
        console.log(`Creating group ${groupName}`);
        const db = getData();
        if (db.groups.find(group => group.groupName === groupName)) {
            console.log(`Creating group ${groupName} and group found`);
            return null;
        };
        const user = db.users.find(user => user.name === userName);
        if (user) {
            const group = { groupName: groupName, owner: userName, users: [userName], flashcards: []};
            db.groups.push(group);
            user.group = groupName;
            return group;
        }
        console.log(`Creating group ${groupName} and user not found`);

        return null;
    }

    /**
     * Boolean for if user can or did join the group
     * @param {*} groupName
     * @param {*} userName
     * @returns
     */
    function joinGroup(groupName, userName) {
        const db = getData();
        const group = db.groups.find(group => group.groupName === groupName);
        const user = db.users.find(user => user.name === userName);
        if (group && user && !group.users.includes(userName)) {
            group.users.push(userName);
            user.group = groupName;
            return true;
        } else {
            console.log(`group is ${group} and user is ${user}`);
            return false;
        }
    }

    /**
     * Function for fetching group name player belongs to
     */
    function getPlayerGroupName(userName) {
        const db = getData();
        const user = db.users.find(user => user.name === userName);
        if (!user) {
            return null;
        }
        const group = db.groups.find(group => group.groupName === user.group);
        if (!group) {
            return null;
        }
        return group.groupName;
    }

    function getXp(userName) {
        const db = getData();
        const user = db.users.find(user => user.name === userName);
        return user.xp;
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
            return leaderboard.slice(0, 10);
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
        const db = getData();
        const user = db.users.find(user => user.name === userName);
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
            // Go through attempted flashcards, filter them out
            const user = db.users.find(user => user.name === userName);
            console.log('user ', JSON.stringify(user));
            if (user) {
                const now = Date.now()

                // Remove day old attempts
                user.flashcardAttempts = user.flashcardAttempts.filter(attempt => {
                    const attemptTime = new Date(attempt.time).getTime();
                    return now - attemptTime <= ONE_DAY;
                });

                // Reset streak if no attempts in last day
                if (user.flashcardAttempts.length == 0) {
                    user.streak = 0;
                }

                attemptsPerFlashCard = {}
                // Count
                user.flashcardAttempts.forEach(f => {
                    const id = f.flashcardId;
                    if (!attemptsPerFlashCard[id]) {
                        attemptsPerFlashCard[id] = 1;
                    } else {
                        attemptsPerFlashCard[id]++;
                    }
                });

                let flashcardIds = group.flashcards.map(f => f.flashcardId);
                // Find flashcards that have been attempted 3 or more times or correctly answered
                let disallowedIds = user.flashcardAttempts.filter(
                    f => f.correct || (attemptsPerFlashCard[f.flashcardId] >= 3
                    )).map(f => f.flashcardId);
                console.log(`disallowed ids `, JSON.stringify(disallowedIds));
                let allowed_ids = flashcardIds.filter(f => !disallowedIds.includes(f));
                console.log(`allowed ids `, JSON.stringify(allowed_ids));
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
            const user = db.users.find(user => user.name === userName);
            if (flashcard) {
                if (flashcard.correctAnswer == answer) {
                    user.streak++;
                    addHotShotBadge(user);
                    let attempts = user.flashcardAttempts.filter(f => f.flashcardId == flashcardId && !f.correct);
                    user.xp += (DEFAULT_XP / Math.pow(2, attempts.length)) * (1 + 0.25 * (user.streak >= 3));
                } else {
                    user.streak = 0;
                }
                user.flashcardAttempts.push({
                    flashcardId: flashcardId,
                    time: Date.now(),
                    correct: flashcard.correctAnswer == answer
                });
                return user.streak;
            }
        }

        return null;
    }

    function addHotShotBadge(user) {
        if (user.streak > 3 && !user.badges.includes("hot shot")) {
            if (!user.flashcardAttempts.find(f => f.correct === false)) {
                user.badges.push("hot shot");
            }
        }
        return;
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
        const db = getData();
        const user = db.users.find(user => user.name === userName);
        user.streak = 0;
    }

    function getStreak(userName) {
        const db = getData();
        const user = db.users.find(user => user.name === userName);
        return user.streak;
    }

    function getBadges(userName) {
        const db = getData();
        const user = db.users.find(user => user.name === userName);
        return user.badges;
    }

    function addSkillDiffBadge(leaderboard, userName) {
        if (leaderboard[0].name === userName && leaderboard.length > 1) {
            console.log('yes')
            if (!getBadges(userName).includes("skill diff") &&
            ((parseInt(leaderboard[0].xp) - parseInt(leaderboard[1].xp)) >= 50)) {
                const db = getData();
                const user = db.users.find(user => user.name === userName);
                user.badges.push("skill diff");
            }
        }
    }
    /**
     *
     */
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
        addSkillDiffBadge
    }