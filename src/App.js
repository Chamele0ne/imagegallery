import React from 'react';
import { Gallery } from './gallery.js'
import { CreateCol } from './createCol.js'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import {Collection} from './collection.js'
import {DeleteCol} from './deleteCol'

function App() {
  return (

    <BrowserRouter>
      <Switch>
        <Route path="/" exact component={Gallery}></Route>
        <Route path="/createCol" exact component={CreateCol}></Route>
        <Route path="/deleteCol" exact component={DeleteCol}></Route>
        <Route path="/:title" exact component={Collection}></Route>

      </Switch>
    </BrowserRouter>
  );
}

export default App;
