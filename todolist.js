var express = require('express');

var cookieSession = require('cookie-session'); // Charge le middleware de sessions
var bodyParser = require('body-parser'); // Charge le middleware de gestion des paramètres
var urlencodedParser = bodyParser.urlencoded({extended: false});

var app = express();

/*
 * On utilise les cookies sessions et le décodage des body urlEncoded
 */
app
    .use(cookieSession({
        name: 'session',
        secret: 'todotopsecret',
        maxAge: 24 * 60 * 60 * 1000
    }))
    .use(urlencodedParser);

/*
 * liste des tâches
 */
app.get('/todo', function (req, res) {
    if (typeof req.session.todoListe !== 'undefined') {
        req.session.todoListe = [];
    }
    res.render('./todolist.ejs', {todo_liste: req.session.todoListe});
});

/*
 * ajouter une tâche
 */
app.post('/todo/ajouter', function (req, res) {
    req.session.todoListe.push(req.body.trucAFaire);
    res.render('./todolist.ejs', {todo_liste: req.session.todoListe});
});

/*
 * supprimer une tâche
 */
app.get('/todo/supprimer/:id', function (req, res) {
    req.session.todoListe = req.session.todoListe.filter(function (value, index) {
        return index !== parseInt(this[0]);
    }, req.params.id);
    res.render('./todolist.ejs', {todo_liste: req.session.todoListe});
});

app.listen(8080);
