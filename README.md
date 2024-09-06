# Puzz

Peer-To-Peer jigsaw game built using Angular 18 and WebRTC.

ASP.NET Core API available [here](https://github.com/dov-vai/PuzzApi).

# Live demo

Live demo can be accessed here: [puzz.dov.lt](https://puzz.dov.lt)

# Building

Run:
```bash
npm i
```
in the project root directory to install the dependencies.


Install Angular CLI
```bash
npm install -g @angular/cli
```

Then run:
```bash
ng build
```
to build the project. It will then be available in the `dist/` folder in the root directory.


# Configuring

[environments.ts](src/environments/environment.ts) contains the configuration for production.

[environments.development.ts](src/environments/environment.development.ts) contains the configuration for development.

Here should be set both the API and WebSocket URLs.

It is also recommended to set up your own TURN (relay) server for the users
that can't connect directly (P2P) because of network restrictions. Suggested:
[Coturn](https://github.com/coturn/coturn). 

Add the server in [peer-manager-service.ts](src/app/services/peer-manager/peer-manager.service.ts):
```typescript
iceServers: [
    {urls: 'turn:myturnserver.com', username: "user", credential: "pass"}
]
```

Docker configuration soon.

# Contributing
Pull requests are always welcome.

# LICENSE

GNU General Public License 3.0 or later.

See [LICENSE](LICENSE) for the full text.
