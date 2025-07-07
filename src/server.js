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
    res.render('login', {error: false});
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (main.loginUser(username, password) != null ) {
        req.session.user = username;
        res.redirect('/group/dashboard');
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
        res.render('dashboard',
		{
			username: req.session.user,
			leaderboard: main.getLeaderboard(groupName)
		});
    }
});

app.get('/group/join', (req, res) => {
    res.render('nogroup');
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





