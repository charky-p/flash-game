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
        const newUser = { name: name, password: password, group: null };
        data.users.push(newUser);
        return newUser;
    } else if (password === user.password) {
        return user;
    }

    // Invalid login details (Either name is not unique, or wrong password)
    return null;
}

function createGroup(groupName, userName) {
    const db = getData();
    if (db.groups.find(group => group.groupName === groupName)) {
        return null;
    } else if (db.users.find(user => user.name === userName)) {
        const group = { name: groupName, owner: userName, users: [userName], flashcards: []};
        db.groups.push(group);
        return group;
    }
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
    if (group && group.users.find(user => user === userName)) {
        group.users.push(userName);
        return true;
    } else {
        return false;
    }
}

/**
 * Function for fetching group name player belongs to
 */
function getPlayerGroupName(userName) {
    const db = getData();
    const user = db.users.find(user => user === userName);
    if (!user) {
        return null;
    }
    const group = db.groups.find(group => group.groupName === user.group);
    return group;
}
/**
 *
 */
module.exports = {
    loginUser,
    createGroup,
    joinGroup,
    getPlayerGroupName
}