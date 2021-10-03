import { useCallback, useState } from 'react'
import { Graph } from './algorithms/Graph'
import './App.css'
import EditorWindow from './editor/EditorWindow'
import GraphGenerator from './editor/GraphGenerator'
import GraphWindow from './graph/GraphWindow'

interface GraphDatabase { editor: Graph[], random: Graph[] }

function App (): JSX.Element {
    const [graphDb, setGraphDb] = useState<GraphDatabase>({ editor: [], random: [] })
    // generateGraph(20, 0.2, 10, i => i.toString())

    const handleEditorInputGraphs = useCallback(input => {
        setGraphDb(prev => ({ ...prev, ...{ editor: input } }))
    }, [])

    const handleRandomInputGraphs = useCallback(input => {
        setGraphDb(prev => ({ ...prev, ...{ random: input } }))
    }, [])

    console.log(Object.values(graphDb))

    return (
        <div className="App">
            <div id="left-side">
                <EditorWindow onInputGraphs={handleEditorInputGraphs} />
                <GraphGenerator onGenerateGraph={handleRandomInputGraphs} />
            </div>
            <div id="right-side">
                <GraphWindow graphs={Object.values(graphDb).flat()} />
            </div>
        </div>
    )
}

export default App
