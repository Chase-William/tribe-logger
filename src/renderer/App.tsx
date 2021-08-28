import React from 'react';
import { Switch, Route, HashRouter, Link } from 'react-router-dom';
// import icon from '../../assets/icon.svg';
import './App.global.css';
import Settings from './Settings';
import Home from './Home';

export default function App() {
  return (
    <HashRouter>
      <Link to="/">
        <h2>Home</h2>
      </Link>
      <Link to="/settings">
        <h2>Settings</h2>
      </Link>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/settings" component={Settings} />
      </Switch>
    </HashRouter>
  );
}
