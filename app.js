/*
 * gestion de todo list multi utilisateur
 */

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var ent = require('ent');

/*
 * Gestion de la liste dans une variable globale du serveur.
 * Chaque item de liste est associé à un identifiant.
 */
var todoListe = [];
var todoId = 0;

/*
 * le get renvoie la page de l'application
 */
app.get('/todo', function (req, res, next) {
    res.render('./todolist.ejs');
});

/*
 * connexion d'un nouveau client
 */
io.on('connection', function (socket) {
    console.log("connexion d'un utilisateur");

    socket.emit('demande_pseudo');

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });

    socket.on('pseudo', function (msg) {
        message = ent.encode(msg)  + ' a rejoint la conversation';
        console.log(message);
        socket.broadcast.emit('message', message);
        socket.emit('message', message);

        socket.emit('serveur_emet_todo_list', todoListe);
    });

    socket.on('message', function (msg) {
        /*
         * encodage des entitées HTML pour ne pas injecter de HTML dans la page
         */
        message = '<span class="pseudo">' + ent.encode(msg.pseudo) + '</span> ' + ent.encode(msg.message);
        console.log(message);
        socket.broadcast.emit('message', message);
        socket.emit('message', message);
    });

    socket.on('client_ajoute_todo', function (msg) {
        console.log('ajout todo ' + todoId + ' : ' + msg);
        todoListe.push({ todoId: todoId, todoItem: ent.encode(msg)});
        todoId++;
        socket.broadcast.emit('serveur_emet_todo_list', todoListe);
        socket.emit('serveur_emet_todo_list', todoListe);
    });

    socket.on('client_supprime_todo', function(msg) {
        todoListe = todoListe.filter(function(e) {
            return (e.todoId !== parseInt(msg));
        });
        socket.broadcast.emit('serveur_emet_todo_list', todoListe);
        socket.emit('serveur_emet_todo_list', todoListe);
        console.log("suppression todo " + msg);
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
    console.log('le serveur écoute sur *:8080');
});
