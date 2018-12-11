FROM node:9 AS build
WORKDIR /opt/app
ADD package.json .
RUN npm install

FROM node:9-slim
WORKDIR /opt/app
COPY --from=build /opt/app .
ADD . .
RUN npm install angular gulp
EXPOSE 4200
CMD [ "npm", "start", "--", "--disable-host-check", "--host",  "0.0.0.0", "--port", "4200" ]
