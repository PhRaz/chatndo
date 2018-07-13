# Chat and TODO List


Single page application, Application simple de gestion de TODO list.

Cette application utilise NodeJS.

## Installation

Installation du serveur sur une instance EC2 AWS :
<pre>
#!/bin/bash
yum update -y
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 8.9.4
yum install git -y
git clone https://github.com/PhRaz/chatndo.git
cd chatndo
npm install
DEBUG=express:* nohup node app.js &
</pre>

## Utilisation de cognito

### Adresse page de login

<pre>
https://listnchat.auth.eu-west-2.amazoncognito.com/login?response_type=token&client_id=dhshvf124nk15u9v7ge0vg29f&redirect_uri=http://localhost:8080/login
</pre>

### Adresse de logout

<pre>
https://listnchat.auth.eu-west-2.amazoncognito.com/logout?response_type=token&client_id=dhshvf124nk15u9v7ge0vg29f&logout_uri=https://listnchat.auth.eu-west-2.amazoncognito.com/login?response_type=token&client_id=dhshvf124nk15u9v7ge0vg29f&redirect_uri=http://localhost:8080/login
</pre>
