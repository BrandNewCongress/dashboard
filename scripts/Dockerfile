# quay.io/brandnewcongress/dashboard:transport_v0.0.1

FROM node:7.7

RUN mkdir -p /app

ADD . /app

RUN cd /app \
  && yarn install

CMD ["node", "script.js"]
