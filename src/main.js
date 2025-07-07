import { getData } from './dataStore';

/**
 * Login/register user 
 * @returns null if invalid login, otherwise the user
 */
export function loginUser(name, password) {
    const data = getData();

    // Check if user has not been registered
    const user = data.users.find(user => user.name === name);
    if (!user) {
        const newUser = { name: name, password: password };
        data.users.push(newUser);
        return newUser;
    } else if (password === user.password) {
        return user;
    }

    // Invalid login details (Either name is not unique, or wrong password)
    return null;
}

export function createGroup(req, res) {
    const db = getData();
    const { groupName, userName } = req.body;

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
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
export function joinGroup(req, res) {
    const db = getData();
    const { groupName, userName } = req.body;

    const group = db.groups.find(group => group.groupName === groupName);
    if (group && group.users.find(user => user === userName)) {
        group.users.push(userName);
        return true;
    } else {
        return false;
    }
}
