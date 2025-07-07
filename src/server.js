const { getData } = require('./dataStore.js');
const express = require('express');
const main = require('./main.js');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
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
    const leaderboard = ['Charky', 'Sam'];

    if (main.loginUser(username, password) != null ) {
        res.render('home', { username: username, leaderboard: leaderboard });
    } else {
        res.render('login', {error: true});
    }
});