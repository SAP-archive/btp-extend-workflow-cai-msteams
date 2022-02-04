/**
 * App.js defines the router for the available app routes. 
 * 
 * In this simple scenario only routes for authentication and one route for loading the
 * required task module to approve or reject a leave request is available. Additional routes
 * can be created and e.g. provide content for an additional tab extension. 
 * 
 */

import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Route} from "react-router-dom";
import { Provider, themeNames } from "@fluentui/react-teams";

import AuthStart from './modules/auth-start';
import AuthEnd from './modules/auth-end';
import TaskModule from './components/TaskModule';

function App() {
  const [theme] = useState(themeNames.Default)

  return (
    <Provider themeName={theme} lang="en-US">
      <Suspense fallback="loading">
        <Router>
          <Route exact path="/task-module" component={TaskModule} />
          <Route exact path="/auth-start" component={AuthStart} />
          <Route exact path="/auth-end" component={AuthEnd} />
        </Router>
      </Suspense>
    </Provider>
  );
}

export default App;
