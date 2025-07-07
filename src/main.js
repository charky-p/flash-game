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
        const newUser = { name: name, password: password, group: null, xp: 0 };
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
    if (group && db.users.find(user => user.name === userName)) {
        group.users.push(userName);
        return true;
    } else {
        console.log(`group is ${group} and user is ${db.users.find(user => user === userName)}`);
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
    const groupName = db.groups.find(group => group.groupName === user.group);
    return groupName;
}

function getXp(userName) {
    const user = db.users.find(user => user.name === userName);
    return user.xp;
}

function getLeaderboard(groupName) {
    const group = db.groups.find(group => group.groupName === groupName);
    if (group) {
        const leaderboard = group.users.map((username) => ({
            xp: getXp(username),
            name: username
        }));
        leaderboard.sort((a, b) => b.xp - a.xp);
        return leaderboard;
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
    getLeaderboard
}