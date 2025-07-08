const { getData } = require('./dataStore.js');
const express = require('express');
const main = require('./main.js');
const path = require('path');

const app = express();
const session = require('express-session');

app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
	secret: 'hardcoded-bad-secret-for-game-jam-demo',
  	resave: false,
	saveUninitialized: false,
	cookie: { secure: false }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "../views"));

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// TO BE REMOVED
app.get('/viewdata', (req, res) => {
    res.send(getData());
})
app.get('/', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (main.loginUser(username, password) != null ) {
        req.session.user = username;
        res.json({success: true});
    } else {
		res.json({success: false});
	}
});

app.use('/group', (req, res, next) => {
    if (req.session && req.session.user) {
		next();
    } else {
        res.redirect('/');
    }
});

app.get('/group/dashboard', (req, res) => {
    const groupName = main.getPlayerGroupName(req.session.user);
    if (!groupName) {
        res.redirect('/group/join');
    } else {
		console.log(`groupName is ${groupName}`);
        main.resetStreak(req.session.user);
        res.render('dashboard',
		{
			username: req.session.user,
			leaderboard: main.getLeaderboard(groupName)
		});
    }
});

app.get('/group/join', (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (main.getPlayerGroupName(req.session.user)) {
        res.redirect('/group/dashboard');
    } else {
        res.render('nogroup');
    }
});

app.post('/group/join', (req, res) => {
    if (main.joinGroup(req.body.groupCode, req.session.user)) {
		console.log('Joining group ' + JSON.stringify(req.body.groupCode));
        res.json({ redirectUrl: '/group/dashboard' });
    } else {
		console.log(`Joining group failed`);

        res.json({ redirectUrl : null });
    }
});

app.post('/group/create', (req, res) => {
    const { groupName } = req.body;
	if (main.createGroup(groupName, req.session.user)) {

		res.json({ redirectUrl: '/group/dashboard'});
	} else {
		console.log(`Creating group failed`);
		res.json({ redirectUrl : null });

	}
});

app.get('/group/create-flashcard', (req, res) => {
    res.render('post');
});

app.post('/group/create-flashcard', (req, res) => {
    const { question, answers, correctAnswer } = req.body;
    const flashcard = main.createFlashcard(question, answers, correctAnswer, req.session.user);
    if (flashcard) {
        res.json({ msg: 'Success' });
    } else {
        res.status(400).json({msg: 'Bad request'});
    }
});

app.get('/group/review-flashcards', (req, res) => {
    const flashcards = main.reviewFlashcard(req.session.user);
    console.log(`flashcards are ${JSON.stringify(flashcards)}`);
    if (flashcards && flashcards.length > 0) {
        const randomIndex = Math.floor(Math.random() * flashcards.length);
        res.redirect(`/group/review/${flashcards[randomIndex]}`);
    } else {
        res.redirect('/group/review-flashcards/done');
    }
});

app.get('/group/review-flashcards/done', (req, res) => {
    res.render('done');
});

app.get('/group/review/:id', (req, res) => {
    const flashcardId = parseInt(req.params.id);
    const flashcard = main.getFlashcard(flashcardId, req.session.user);
    const streak = main.getStreak(req.session.user);
    if (flashcard) {
        res.render('review', { question: flashcard.question, answers: flashcard.answers, streak: streak});
    } else {
        res.redirect('/group/dashboard');
    }
});

app.post('/group/review/:id/answer', (req, res) => {
    const flashcardId = parseInt(req.params.id);
    const username = req.session.user;
    const { answer } = req.body;
    const correctAnswer = main.getAnswer(flashcardId, username);

    const streak = main.answerFlashcard(answer, flashcardId, username);
    res.json({ correctAnswerIndex: correctAnswer, streak: streak  });
});
