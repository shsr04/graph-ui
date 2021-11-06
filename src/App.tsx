import { useCallback, useState } from 'react'
import { Graph } from './algorithms/Graph'
import './App.css'
import EditorWindow from './editor/EditorWindow'
import GraphGenerator from './graph/generator/GraphGenerator'
import GraphWindow from './graph/GraphWindow'

interface GraphDatabase { editor: Graph[], random: Graph[] }

function getGraphsFromStorage (key: string): GraphDatabase | null {
    const storedDb = localStorage.getItem(key)
    if (storedDb === null) { return null }
    try {
        const data = JSON.parse(storedDb)
        const result: any = {}
        for (const key of ['editor', 'random']) {
            result[key] = data[key].map((x: any) => Graph.fromJSON(x))
        }
        return result as GraphDatabase
    } catch (e: any) {
        console.warn('Error when reading graph from localStorage:\n', e, '\nThe application storage will be cleared.')
        return null
    }
}

function saveGraphsToStorage (key: string, graphDb: GraphDatabase): void {
    const data: any = {}
    for (const key of ['editor', 'random']) {
        data[key] = graphDb[key as keyof GraphDatabase].map(g => g.serialize())
    }
    localStorage.setItem(key, JSON.stringify(data))
}

function App (): JSX.Element {
    const [graphDb, setGraphDb] = useState<GraphDatabase>(getGraphsFromStorage('graphui.graphs.db') ?? { editor: [], random: [] })
    saveGraphsToStorage('graphui.graphs.db', graphDb)

    const handleEditorInputGraphs = useCallback(input => {
        setGraphDb(prev => ({ ...prev, ...{ editor: input } }))
    }, [])

    const handleRandomInputGraphs = useCallback(input => {
        setGraphDb(prev => ({ ...prev, ...{ random: input } }))
    }, [])

    return (
        <div className="App">
            <div className="heading">
                <h1>Graph UI</h1>
            </div>
            <div className="constrained">
                <div id="left-side">
                    <EditorWindow onInputGraphs={handleEditorInputGraphs} />
                    <label>
                    Enter graph specification here. Supports a subset of <a href="https://www.graphviz.org/doc/info/lang.html">DOT syntax</a>. (Subgraphs, attributes and ports are not supported.)
                    </label>
                </div>
            </div>
            <div className="constrained">
                <div id="right-side">
                    <GraphWindow graphs={Object.values(graphDb).flat()} />
                    <GraphGenerator onGenerateGraphs={handleRandomInputGraphs} />
                </div>
            </div>
        </div>
    )
}

export default App
