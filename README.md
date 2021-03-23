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

The browser client consists of a web application with a supporting API component.  It requires a Redis storage back end.

## Installing

The browser client is designed to run in Docker and this repo contains a Helm chart for use with Kubernetes.

## License

[MIT](https://github.com/cequel-space/blob/master/LICENSE.md)