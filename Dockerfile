FROM node:carbon

ENV http_proxy "http://172.17.0.1:3128"
ENV https_proxy "http://172.17.0.1:3128"
ENV no_proxy "172.17.0.1"
RUN echo "proxy_url: http://172.17.0.1:3128"

WORKDIR /usr/src/app

COPY package.json .
COPY package-lock.json .

RUN npm i npm@latest -g
RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
