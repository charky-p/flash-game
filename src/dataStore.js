const data = {
    users: [],
    groups: [],
    flashcardAmt: 0
}

// User
// name: String
// password: String
// groupId: String / null
// points: int
// flashcardAttempts: [{flashcardId, time}]

// Group
// name: String
// owner: String
// users: [String]
// flashcards: [Flashcard]

// Flashcard
// flashcardId: String
// question: String
// answers: [String][4]
// correctAnswer: String
// TODO: attempted date

function getData() {
    return data;
}

module.exports = { getData };