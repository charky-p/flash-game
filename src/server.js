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
        req.session.user =  { username };
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
    const playerGroup = main.getGroup(req.session.user);
    if (!playerGroup) {
        res.redirect('/group/join');
    } else {
        res.render('');
    }
});

app.get('/group/join', (req, res) => {
    res.render('nogroup', {status: 0 });
});

app.post('/group/join', (req, res) => {
    if (main.joinGroup()) {
        res.redirect('/group/dashboard');
    } else {
        res.render('nogroup', { status: 1 });
    }
});

app.post('/group/create', (req, res) => {
    const { groupName } = req.body;
	if (main.createGroup(groupName, req.session.user)) {
		res.redirect('/group/dashboard');
	} else {
		res.render('nogroup', { status: 2 });
	}
});





