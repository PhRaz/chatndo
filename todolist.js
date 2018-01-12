/*
 *  gestion de todo list
 */
var express = require('express');
var cookieSession = require('cookie-session'); // Charge le middleware de sessions
var bodyParser = require('body-parser'); // Charge le middleware de gestion des paramètres

var app = express();

/*
 * On utilise les cookies sessions et le décodage des body urlEncoded
 */
app.use(cookieSession({
    name: 'session',
    secret: 'todotopsecret',
    maxAge: 24 * 60 * 60 * 1000
}));

app.use(bodyParser.urlencoded({extended: false}));

/*
 * création de la liste dans la session si elle n'existe pas
 */
app.use(function (req, res, next) {
    if (typeof req.session.todoListe === 'undefined') {
        req.session.todoListe = [];
    }
    next();
});

/*
 * lister les tâches
 */
app.get('/todo', function (req, res) {
    res.render('./todolist.ejs', {todo_liste: req.session.todoListe});
});

/*
 * ajouter une tâche
 */
app.post('/todo/ajouter', function (req, res) {
    if (req.body.trucAFaire !== '') {
        req.session.todoListe.push(req.body.trucAFaire);
    }
    res.redirect('/todo');
});

/*
 * supprimer une tâche
 */
app.get('/todo/supprimer/:id', function (req, res) {
    if (req.params.id !== '') {
        req.session.todoListe.splice(req.params.id, 1);
    }
    res.redirect('/todo');
});

app.use(function (req, res) {
    res.redirect('/todo');
});

app.listen(8080);
