const { getData } = require('./dataStore');

/**
 * Login/register user
 * @returns null if invalid login, otherwise the user
 */
function loginUser(name, password) {
    const data = getData();

    // Check if user has not been registered
    const user = data.users.find(user => user.name === name);
    if (!user) {
        const newUser = { name: name, password: password, group: null, points: 0, flashcardAttempts: [] };
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
    if (group && user) {
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
        return leaderboard;
    }
    return null;
}

function createFlashcard(question, answers, correctAnswer, userName) {
    const db = getData();
    const group = db.groups.find(group => group.users.includes(userName));

    if (group) {
        const flashcard = { 
            flashcardId: db.flashcardAmt,
            question: question,
            answers: answers,
            correctAnswer: correctAnswer
        };
        db.flashcardAmt++;
        group.flashcards.push(flashcard);
        return flashcard;
    }
    return null;
}

function reviewFlashcard(userName, groupId) {
    const db = getData();
    const group = db.groups.find(group => group.users.includes(userName));
    
    if (group) {
        // Go through attempted flashcards, filter them out
        const user = group.users.find(user => user.userName === userName);
        if (user) {
            const ONE_DAY = 24 * 60 * 60 * 1000; // milliseconds in a day
            const now = Date.now();

            user.flashcardAttempts = user.flashcardAttempts.filter(attempt => {
                const attemptTime = new Date(attempt.time).getTime();
                return now - attemptTime <= ONE_DAY;
            });

            const flashcardIds = user.flashcardAttempts(fc => fc.flashcardId);
            return group.flashcards.filter(flashcard => !flashcardIds.includes(flashcard.flashcardId));
        }
    }

    return null;

}

function answerFlashcard(answer, flashcardId, userName) {
    const db = getData();
    const group = db.groups.find(group => group.users.includes(userName));

    if (group) {
        const flashcard = group.flashcards.find(fc => fc.flaschardId === flashcardId);
        const user = group.users.find(user => user.userName === userName);
        if (flashcard) {
            if (flashcard.correctAnswer == answer) {
                user.push({
                    flashcardId: flashcardId,
                    time: Date.now()
                });
                return true;
            }
            return false;
        }
    }

    return null;
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
    answerFlashcard
}