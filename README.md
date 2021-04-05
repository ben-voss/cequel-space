# Cequel Space

A SQL code editor that runs as a desktop application or in a web browser.  Built using [Vue.js](https://vuejs.org/) and the [Ace Editor](https://ace.c9.io/).

## Desktop Client

Built using [Electron](https://github.com/electron/electron), the destop application is designed to run macOS, Windows and Linux operating systems.

## Installing

Download the latest [Release](https://github.com/cequel-space/releases/latest).

### Building

### Prerequisites
- [Node.js](https://nodejs.org)  v14.15.0 LTS

Ensure that NPM is up to date:

```console
npm install npm@latest -g
```

Clone this repo and run the following commands:

```console
npm install
npm run build
```

## Browser Client

The browser client consists of a web application with a supporting API component.  It uses a Redis storage back end and uses Nginx as a reverse proxy gateway.  The browser client requires integration with an external OAuth provider and has been tested with [auth0](https://auth0.com/) and [IdentityServer](https://github.com/IdentityServer).

## Installing

The browser client is designed to run in Docker containers and this repo contains configuration for use with Docker Compose and a Helm chart for use with Kubernetes.

### Docker Compose

Edit the deployment/docker/.env file and provide values for your OAuth provider.

Start the containers with this command:

```
docker-compose up
```

This will start the API, App and Nginx gateway containers and expose an endpoint on localhost:8080

### Kubernetes

To deploy via Helm, edit the values.yaml file at deployment/kubernetes/cequel.space to set OAuth configuration, redis and load balalancer configuration.

```
helm install --values=values.yaml --namespace cequel-space --create-namespace cequel.space ./cequel.space

```

## License

[MIT](https://github.com/cequel-space/blob/master/LICENSE.md)