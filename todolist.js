/*
 *  gestion de todo list
 *
 * utilisation d'un id pour les items de la liste
 */

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var bodyParser = require('body-parser'); // Charge le middleware de gestion des paramètres
var path = require('path');
var ent = require('ent');


var todoListe = [];
var todoId = 0;

/*
 * décodage des bodies urlEncoded
 */
app.use(bodyParser.urlencoded({extended: false}));

/*
 * le get (chargement de la page) renvoie la page avec la liste courante
 */
app.get('/todo', function (req, res, next) {
    res.render('./todolist.ejs', {todo_liste: todoListe});
});

/*
 * connexion d'un nouveau client
 */
io.on('connection', function (socket) {
    console.log("connextion d'un utilisateur");

    socket.emit('serveur_demande_pseudo');

    socket.on('client_deconnexion', function () {
        console.log('un utilisateur est déconnecté');
    });

    socket.on('client_renvoie_pseudo', function (msg) {
        console.log("connexion de " + ent.encode(msg));
        socket.emit('serveur_emet_todo_list', todoListe);
    });

    socket.on('client_ajoute_todo', function (msg) {
        console.log('ajout todo ' + msg);
        todoListe.push({ todoId: todoId, pseudo: msg.pseudo, todoItem: ent.encode(msg.message)});
        todoId++;
        socket.broadcast.emit('serveur_emet_todo_list', todoListe);
        socket.emit('serveur_emet_todo_list', todoListe);
    });

    socket.on('client_supprime_todo', function(msg) {

    });
});

/*
 * redirection si url non trouvée
 */
app.use(function (req, res, next) {
    res.redirect('/todo');
});

/*
 * démarrage du serveur
 */
server.listen(8080, function () {
    console.log('listening on *:8080');
});
