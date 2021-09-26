import React, { useState } from 'react'
import logo from './logo.svg'
import './App.css'
import GraphWindow from './graph/GraphWindow'
import EditorWindow from './editor/EditorWindow'
import { Graph } from './editor/GraphMapper'

function App () {
    const [graphs, setGraphs] = useState<Graph[]>([])

    return (
        <div className="App">
            <EditorWindow onInputGraphs={setGraphs} />
            <GraphWindow graphs={graphs} />
        </div>
    )
}

export default App
