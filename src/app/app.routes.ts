import { Routes } from '@angular/router';
import { Login } from '../Components/Login/login';
import { Register } from '../Components/register/register';
import { Shell } from './layout/shell/shell';
import { Feed } from '../Components/Feed/feed';
import { Journal } from '../Components/Journal/journal';
import { Post } from '../Components/Post/post';
import { Compose } from '../Components/Compose/compose';
import { MyProfile } from '../Components/MyProfile/my-profile';
import { Members } from '../Components/Members/members';
import { Messages } from '../Components/Messages/messages';
import { Insights } from '../Components/Insights/insights';
import { PendingApproval } from '../Components/PendingApproval/pending-approval';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { composeDeactivateGuard } from './guards/compose-deactivate.guard';

export const routes: Routes = [
  { path: 'login', component: Login, title: 'Sign in · Longwave' },
  { path: 'register', component: Register, title: 'Create account · Longwave' },
  {
    // The default/landing page, and every page a reader can browse without
    // an account, live under Shell with no guard — only actions that need
    // to know *who* you are (compose, profile, messages…) are gated below.
    path: '',
    component: Shell,
    children: [
      { path: '', redirectTo: 'feed', pathMatch: 'full' },
      { path: 'feed', component: Feed, title: 'Feed · Longwave' },
      { path: 'journal', component: Journal, title: 'The Journal · Longwave' },
      { path: 'post/:id', component: Post, title: 'Reading · Longwave' },
      {
        path: 'compose',
        component: Compose,
        canActivate: [authGuard],
        canDeactivate: [composeDeactivateGuard],
        title: 'Compose · Longwave',
      },
      { path: 'profile', component: MyProfile, canActivate: [authGuard], title: 'My profile · Longwave' },
      { path: 'members', component: Members, canActivate: [authGuard], title: 'Members · Longwave' },
      { path: 'messages', component: Messages, canActivate: [authGuard], title: 'Messages · Longwave' },
      { path: 'insights', component: Insights, canActivate: [adminGuard], title: 'Insights · Longwave' },
      {
        path: 'pending-approval',
        component: PendingApproval,
        canActivate: [adminGuard],
        title: 'Pending approval · Longwave',
      },
    ],
  },
];
