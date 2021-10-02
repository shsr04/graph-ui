
import { ChangeEvent, useCallback, useMemo, useState } from 'react'
import { visitDfs } from '../algorithms/Dfs'
import { Graph } from '../algorithms/Graph'
import GraphSimulation, { SimEdge, SimGraph, SimVertex, VisualizerType } from './GraphSimulation'
import './GraphWindow.css'

interface GraphWindowProps {
    graphs: Graph[]
}

const GraphWindow = (props: GraphWindowProps): JSX.Element => {
    const [selectedVisualizers, setSelectedVisualizer] = useState({
        [VisualizerType.tooltip]: true,
        [VisualizerType.spanningTree]: false
    })

    function getSimVertices (graph: Graph): SimVertex[] {
        return graph.vertices().map(id => ({ id, radius: 20 }))
    }

    function getSimEdges (graph: Graph): SimEdge[] {
        return graph.vertices().flatMap(source => graph.neighbours(source).map(target => ({ source, target })))
    }

    function getTooltip (graph: Graph): string {
        const tooltip = [`name = '${graph.name}'`, `connected = ${String(graph.properties.isConnected)}`]
        if (graph.properties.isTree) tooltip.push('tree = true')
        else if (graph.properties.isAcyclic) tooltip.push('acyclic = true')
        else if (graph.properties.isCycle) tooltip.push('cycle = true')
        if (graph.properties.isEulerian) tooltip.push('eulerian = true')
        else if (graph.properties.isCompleteBipartite) tooltip.push('complete bipartite = true')
        else if (graph.properties.isBipartite) tooltip.push('bipartite = true')
        else if (graph.properties.isComplete) tooltip.push('complete = true')
        if (graph.properties.isStar) tooltip.push('star = true')
        if (graph.properties.isWheel) tooltip.push('wheel = true')
        if (graph.properties.isGear) tooltip.push('gear = true')
        return tooltip.join('\n')
    }

    const handleVisualizeSpanningTree = useCallback((graphId: number, rootVertex: string): Array<[string, string]> => {
        const edges: Array<[string, string]> = []
        const g = props.graphs[graphId]
        visitDfs(g, rootVertex, new Map(g.vertices().map(u => ([u, 'white']))), new Map(), {
            preprocess: (u, p) => {
                edges.push([p, u])
            }
        })
        return edges
    }, [props.graphs])

    function handleChangeVisualizer (event: ChangeEvent<HTMLInputElement>): void {
        const visualizer = VisualizerType[event.target.value as keyof typeof VisualizerType]
        setSelectedVisualizer(prev => ({ ...prev, [visualizer]: event.target.checked }))
    }

    const graphs = useMemo(
        () =>
            props.graphs.map<SimGraph>(graph => ({
                id: graph.id,
                name: graph.name,
                edgeType: graph.directed ? 'arrow' : 'line',
                vertices: getSimVertices(graph),
                edges: getSimEdges(graph),
                tooltip: getTooltip(graph)
            })),
        [props.graphs]
    )

    console.log(selectedVisualizers)

    return <>
        <div id="graph-wrapper">
            <GraphSimulation
                graphs={graphs}
                visualizers={Object.entries(selectedVisualizers).filter(x => x[1]).map(x => x[0] as VisualizerType)}
                onVisualizeSpanningTree={handleVisualizeSpanningTree}
            />
            <div id="graph-configs">
                <label>Visualizers
                    <span style={{ margin: '1em' }}>
                        <label>Tooltip <input type="checkbox" key={VisualizerType.tooltip} value={VisualizerType.tooltip} checked={selectedVisualizers.tooltip} onChange={handleChangeVisualizer} /></label>
                        <label>Spanning tree <input type="checkbox" key={VisualizerType.spanningTree} value={VisualizerType.spanningTree} checked={selectedVisualizers.spanningTree} onChange={handleChangeVisualizer} /></label>
                    </span>
                </label>
            </div>
        </div>
    </>
}

export default GraphWindow
