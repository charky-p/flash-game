const data = {
    users: [],
    groups: [],
}

// User
// name: String
// password: String
// groupId: String / null
// points: int

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

function getData() {
    return data;
}

export { getData };