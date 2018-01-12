var express = require('express');

var session = require('cookie-session'); // Charge le middleware de sessions
var bodyParser = require('body-parser'); // Charge le middleware de gestion des paramètres
var urlencodedParser = bodyParser.urlencoded({extended: false});

var app = express();

/*
 * On utilise les sessions et le décodage des body urlEncoded
 */
app
    .use(session({secret: 'todotopsecret'}))
    .use(urlencodedParser);

var todoListe = [];

/*
 * liste des tâches
 */
app.get('/todo', function (req, res) {
    res.render('./todolist.ejs', {todo_liste: todoListe});
});

/*
 * ajouter une tâche
 */
app.post('/todo/ajouter', function(req, res) {
    todoListe.push(req.body.trucAFaire);
    res.render('./todolist.ejs', {todo_liste: todoListe});
});

/*
 * supprimer une tâche
 */
app.get('/todo/supprimer/:id', function(req, res) {

});

app.listen(8080);
