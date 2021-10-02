import { useCallback, useState } from 'react'
import { Graph } from './algorithms/Graph'
import './App.css'
import EditorWindow from './editor/EditorWindow'
import GraphWindow from './graph/GraphWindow'

type GraphDatabase = { editor: Graph[], random: Graph[] }

function App(): JSX.Element {
    const [graphDb, setGraphDb] = useState<GraphDatabase>({ editor: [], random: [] })
    //generateGraph(20, 0.2, 10, i => i.toString())

    const handleEditorInputGraphs = useCallback(input => {
        setGraphDb({...graphDb, ...{ editor: input}})
    }, [])

    console.log(graphDb.random)

    return (
        <div className="App">
            <EditorWindow onInputGraphs={handleEditorInputGraphs} />
            <GraphWindow graphs={Object.values(graphDb).flat()} />
        </div>
    )
}

export default App
