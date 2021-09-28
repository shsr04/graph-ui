import { useState } from 'react'
import './App.css'
import EditorWindow from './editor/EditorWindow'
import { GraphProps } from './editor/GraphMapper'
import GraphWindow from './graph/GraphWindow'

function App (): JSX.Element {
    const [graphs, setGraphs] = useState<GraphProps[]>([])

    return (
        <div className="App">
            <EditorWindow onInputGraphs={setGraphs} />
            <GraphWindow graphs={graphs} />
        </div>
    )
}

export default App
