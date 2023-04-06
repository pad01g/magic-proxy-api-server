# what is this

poc server implementation for magic-proxy api server

# requirements

 - docker
 - yarn
 - nodejs (>=v16)

# install

```
yarn install
```

# run

```
# run mysql
docker compose --env-file .env up -d mysql
# run app
yarn start:dev
```

# login to db

```
docker exec -it mysql mysql -h 127.0.0.1 -P 3306 -u root -pproxymagic -D magicproxy
```

# api documentation

see http://127.0.0.1:3000/documentation/#/

# note

This software uses
 - NestJS framework
 - https://github.com/NarHakobyan/awesome-nest-boilerplate

