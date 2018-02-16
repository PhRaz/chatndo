/*
 * gestion de todo list multi utilisateur
 */

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var session = require('express-session');
var ent = require('ent');
var bodyParser = require('body-parser');

/*
 * Gestion de la liste dans une variable globale du serveur.
 * Chaque item de liste est associé à un identifiant.
 */
var todoListe = [];
var todoId = 0;

/*
 * configuration
 */
app.use(session({
    secret: 'top secret',
    resave: false,
    saveUninitialized: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(function (req, res, next) {
    if (!req.session.pseudo) {
        req.session.pseudo = '';
    }
    next();
});

/*
 * login page request
 */
app.get('/login', function (req, res, next) {
    console.log("login");
    if (req.session.pseudo !== '') {
        /*
         * already logged in
         */
        res.redirect('/todo');
    } else {
        res.render('./login.ejs');
    }
});

/*
 * login page form submit
 */
app.post('/login', function(req, res, next) {
    if (req.body) {
        if (req.body.pseudo) {
            /*
             * submit login
             */
            req.session.pseudo = req.body.pseudo;
            res.redirect('/todo');
        }
    }
    res.render('./login.ejs');
});

/*
 * logout request
 */
app.get('/logout', function (req, res, next) {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/todo');
        }
    });
});

/*
 * redirection si url non trouvée
 */
app.use(function (req, res, next) {
    res.redirect('/todo');
});

/*
 * renvoie la page de l'application
 */
app.get('/todo', function (req, res, next) {
    if (req.session.pseudo !== '') {
        res.render('./todolist.ejs', {pseudo: req.session.pseudo});
    } else {
        res.redirect('/login');
    }
});

/*
 * connexion d'un nouveau client
 */
io.on('connection', function (socket) {

    /*
    message = pseudo + ' a rejoint la conversation';
    console.log(message);

    socket.broadcast.emit('message', message);
    socket.emit('message', message);

    socket.on('disconnect', function () {
        console.log('[recharge la page ?] déconnexion');
    });
    */

    socket.emit('serveur_emet_todo_list', todoListe);

    socket.on('message', function (msg) {
        /*
         * encodage des entitées HTML pour ne pas injecter de HTML dans la page
         */
        message = '<span class="pseudo">' + ent.encode(msg.pseudo) + '</span> ' + ent.encode(msg.message);
        console.log(message + " " + socket.request.pseudo);
        socket.broadcast.emit('message', message);
        socket.emit('message', message);
    });

    socket.on('client_ajoute_todo', function (msg) {
        console.log('ajout todo ' + todoId + ' : ' + msg);
        todoListe.push({todoId: todoId, todoItem: ent.encode(msg)});
        todoId++;
        socket.broadcast.emit('serveur_emet_todo_list', todoListe);
        socket.emit('serveur_emet_todo_list', todoListe);
    });

    socket.on('client_supprime_todo', function (msg) {
        todoListe = todoListe.filter(function (e) {
            return (e.todoId !== parseInt(msg));
        });
        socket.broadcast.emit('serveur_emet_todo_list', todoListe);
        socket.emit('serveur_emet_todo_list', todoListe);
        console.log("suppression todo " + msg);
    });
});

/*
 * démarrage du serveur
 */
server.listen(8080, function () {
    console.log('le serveur écoute sur *:8080');
});
