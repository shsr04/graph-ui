import React from 'react';
import logo from './logo.svg';
import './App.css';
import GraphWindow from './graph/GraphWindow'
import EditorWindow from './editor/EditorWindow'

function App() {
  return (
    <div className="App">
      <EditorWindow />
      <GraphWindow />
    </div> 
  );
}

export default App;
