import {Routes} from '@angular/router';
import {GameComponent} from "./components/game/game.component";
import {HomeComponent} from "./pages/home/home.component";
import {PageNotFoundComponent} from "./pages/page-not-found/page-not-found.component";
import {PublicGamesComponent} from "./components/public-games/public-games.component";
import {HostGameComponent} from "./components/host-game/host-game.component";

export const routes: Routes = [
  {
    path: "",
    title: "Home",
    component: HomeComponent,
    children: [
      {
        path: "",
        title: "Host Game",
        component: HostGameComponent
      },
      {
        path: "public",
        title: "Public Rooms",
        component: PublicGamesComponent
      }
    ]
  },
  {
    path: "play",
    title: "Game",
    component: GameComponent
  },
  {
    path: "**",
    title: "Not Found",
    component: PageNotFoundComponent
  }
];
