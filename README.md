# Chat and TODO List


Single page application, Application simple de gestion de TODO list.

Cette application utilise NodeJS.

Installation du serveur sur une instance EC2 AWS :
<pre>
yum update -y
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 8.9.4
yum install git -y
git clone https://github.com/PhRaz/chatndo.git
cd chatndo
npm install
nohup node app.js
</pre>
