/*
 * gestion de todo list multi utilisateur
 */

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var ent = require('ent');
var bodyParser = require('body-parser');
var sharedsession = require("express-socket.io-session");
var ec2 = require("ec2-publicip");
var CognitoExpress = require("cognito-express");
var cookieParser = require('cookie-parser');
var util = require('util');

/*
 * initialize public IP address for AWS EC2 instance
 */
var address = '';
/*
ec2.getPublicIP(function (error, ip) {
    if (error) {
        console.log(error);
    }
    console.log("Instance Public IP: ", ip);
    address = ip;
});
*/
//var address = require("ip").address();
var address = 'localhost';

/*
 * initialize port number
 */
var port = 80;
var port = 8080;

var serverUrl = "http://" + address + ":" + port;
var loginUrl = serverUrl + "/login";

/*
 * cognito configuration
 */
var cognitoDomain = "listnchat";
var cognitoRegion = "eu-west-2";
var cognitoClientId = "dhshvf124nk15u9v7ge0vg29f";
var cognitoUserPoolUrl = "https://" + cognitoDomain + ".auth." + cognitoRegion + ".amazoncognito.com";
var cognitoLoginUrl = cognitoUserPoolUrl + "/login?response_type=token&client_id=" + cognitoClientId + "&redirect_uri=" + loginUrl;
var cognitoLogoutUrl = cognitoUserPoolUrl + "/logout?response_type=token&client_id=" + cognitoClientId + "&logout_uri=" + cognitoLoginUrl;

/*
 * Gestion de la liste dans une variable globale du serveur.
 * Chaque item de liste est associé à un identifiant.
 */
var todoListe = [];
var todoId = 0;
var conversation = [];

/*
 * configuration
 */
var session = require('express-session')({
    secret: 'top secret',
    resave: true,
    saveUninitialized: true
});

app.use(session);

/*
 * Initializing CognitoExpress constructor
 */
var cognitoExpress = new CognitoExpress({
    region: "eu-west-2",
    cognitoUserPoolId: "eu-west-2_Fldcl9hUr",
    tokenUse: "id", //Possible Values: access | id
    tokenExpiration: 3600000 //Up to default expiration of 1 hour (3600000 ms)
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

io.use(sharedsession(session, {
    autoSave: true
}));

/*
 * debug
 */

// Debugging express
app.use("*", function (req, res, next) {
    console.log("Express `req.session` data is %j.", req.session);
    console.log('Cookies: ', req.cookies);
    next();
});

// Debugging io
io.use(function (socket, next) {
    console.log("socket.handshake session data is %j.", socket.handshake.session);
    next();
});

function checkCognitoToken(req, res, next)
{
    console.log("checkCognitoToken");

    id_token = req.cookies.id_token;
    if (!id_token) {
        res.render("./login.ejs");
    }

    cognitoExpress.tokenUse = "id";
    cognitoExpress.validate(id_token, function (err, response) {
        if (err) {
            /*
             * remove cognito cookies
             */
            res.cookie("id_token", "", {expires: new Date(0), path: '/'});
            res.cookie("access_token", "", {expires: new Date(0), path: '/'});
            res.redirect(cognitoLoginUrl);
        }
        console.log("response id token : " + util.inspect(response));
        console.log("username : " + response['cognito:username']);
        req.session.pseudo = response['cognito:username'];
        res.redirect("/todo");
    });
}

/*
 * login page
 *
 * return a page to read the token in url hash and set them as cookie
 * then reload the login page
 * if tokens are checked as valid then continue to next page
 * else return to signin/signup page
 */
app.get('/login', function(req, res, next) {
    console.log("/login");
    checkCognitoToken(req, res, next);
});

/*
 * logout request
 */
app.get('/logout', function (req, res, next) {
    console.log("/logout");
    /*
     * remove cognito cookies
     */
    res.cookie("id_token", "", {expires: new Date(0), path: '/'});
    res.cookie("access_token", "", {expires: new Date(0), path: '/'});
    /*
     * and session
     */
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect(cognitoLogoutUrl);
        }
    });
});

/*
 * renvoie la page de l'application
 */
app.get('/todo', function (req, res, next) {
    console.log("/todo");
    res.render('./todolist.ejs', {
        pseudo: req.session.pseudo,
        address: address,
        port: port,
        logout_url: "/logout"
    });
});

/*
 * redirection si url non trouvée
 */
app.use(function (req, res, next) {
    console.log("default");
    checkCognitoToken(req, res, next);
});

/*
 * connexion d'un nouveau client
 */
io.on('connection', function (socket) {

    console.log("connection socket.io");

    socket.on('hello', function (userdate) {

        console.log('hello');
        pseudo = socket.handshake.session.pseudo;

        socket.emit('serveur_emet_conversation', conversation);
        socket.broadcast.emit('serveur_emet_conversation', conversation);
        socket.emit('serveur_emet_todo_list', todoListe);
    });

    socket.on('disconnect', function () {
        console.log('déconnexion de ' + socket.handshake.session.pseudo);
    });

    socket.on('message', function (msg) {

        pseudo = socket.handshake.session.pseudo;
        /*
         * encodage des entitées HTML pour ne pas injecter de HTML dans la page
         */
        message = '<span class="pseudo">' + ent.encode(pseudo) + '</span> ' + ent.encode(msg.message);
        console.log(pseudo + " : " + message);
        socket.broadcast.emit('message', message);
        socket.emit('message', message);
        conversation.push(message);
    });

    socket.on('client_ajoute_todo', function (msg) {
        if (typeof msg !== "string") {
            console.log('typeof msg : ' + typeof(msg));
        }
        console.log('ajout todo ' + todoId + ' : ' + msg);
        todoListe.push({todoId: todoId, todoState: 'todo', todoItem: ent.encode(msg)});
        todoId++;
        socket.broadcast.emit('serveur_emet_todo_list', todoListe);
        socket.emit('serveur_emet_todo_list', todoListe);
    });

    socket.on('client_supprime_todo', function (msg) {
        todoListe.forEach(function (e) {
            if (e.todoId === parseInt(msg)) {
                if (e.todoState === 'todo') {
                    e.todoState = 'done';
                } else {
                    e.todoState = 'todo';
                }
            }
        });
        socket.broadcast.emit('serveur_emet_todo_list', todoListe);
        socket.emit('serveur_emet_todo_list', todoListe);
        console.log("suppression todo " + msg);
    });
});

/*
 * démarrage du serveur
 */
server.listen(port, address, function () {
    console.log('le serveur écoute sur ' + address + ':' + port);
});
