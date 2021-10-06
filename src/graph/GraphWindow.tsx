
import { ChangeEvent, useCallback, useMemo, useState } from 'react'
import { visitDfs } from '../algorithms/Dfs'
import { Graph } from '../algorithms/Graph'
import GraphSimulation, { SimEdge, SimGraph, SimVertex, VisualizerType } from './GraphSimulation'
import './GraphWindow.css'
import { colourVertices } from '../algorithms/VertexColouring'
import { findBiconnectedComponents } from '../algorithms/BiconnectedComponents'

interface GraphWindowProps {
    graphs: Graph[]
}

const GraphWindow = (props: GraphWindowProps): JSX.Element => {
    const [selectedVisualizers, setSelectedVisualizer] = useState<Record<VisualizerType, boolean>>({
        [VisualizerType.tooltip]: true,
        [VisualizerType.spanningTree]: false,
        [VisualizerType.vertexColouring]: false,
        [VisualizerType.cutvertices]: false
    })

    function getSimVertices (graph: Graph): SimVertex[] {
        return graph.vertices().map(id => ({ id, graphId: graph.id, radius: 20 }))
    }

    function getSimEdges (graph: Graph, vertices: SimVertex[]): SimEdge[] {
        function getVertex (vertices: SimVertex[], id: string): SimVertex {
            const result = vertices.find(x => x.id === id)
            if (result === undefined) {
                throw Error(`INTERNAL ERROR: Vertex ${id} not found`)
            }
            return result
        }
        return graph.vertices().flatMap(u => graph.neighbours(u).map(v => ({ source: getVertex(vertices, u), target: getVertex(vertices, v) })))
    }

    function getTooltip (graph: Graph): string {
        const tooltip = []
        if (graph.properties.isBiconnected) tooltip.push('biconnected')
        else if (graph.properties.isConnected) tooltip.push('connected')
        else tooltip.push('disconnected')
        if (graph.properties.chromaticity !== null) tooltip.push(`${graph.properties.chromaticity}-chromatic`)
        else tooltip.push(`${graph.properties.colourability}-colourable`)
        if (graph.properties.isTree) tooltip.push('tree')
        else if (graph.properties.isAcyclic) tooltip.push('acyclic')
        if (graph.properties.isCycle) tooltip.push('cycle')
        else if (graph.properties.isEulerian) tooltip.push('eulerian')
        if (graph.properties.isCompleteBipartite) tooltip.push('complete bipartite')
        else if (graph.properties.isBipartite) tooltip.push('bipartite')
        else if (graph.properties.isComplete) tooltip.push('complete')
        if (graph.properties.isStar) tooltip.push('star')
        if (graph.properties.isWheel) tooltip.push('wheel')
        if (graph.properties.isGear) tooltip.push('gear')
        const header = `${graph.directed ? 'digraph' : 'graph'} ${graph.name.toUpperCase()} (n=${graph.order()}, m=${graph.size()})\n`
        return header + tooltip.map(x => '- ' + x).join('\n')
    }

    const handleVisualizeSpanningTree = useCallback((graphId: number, rootVertex: string): Array<[string, string]> => {
        const edges: Array<[string, string]> = []
        const g = props.graphs.find(x => x.id === graphId)
        if (g === undefined) throw Error(`INTERNAL ERROR: graph ${graphId} not found`)
        visitDfs(g, rootVertex, new Map(g.vertices().map(u => ([u, 'white']))), new Map(), {
            preprocess: (u, p) => {
                edges.push([p, u])
            }
        })
        return edges
    }, [props.graphs])

    const handleVisualizeVertexColouring = useCallback((graphId: number, rootVertex: string): Map<string, number> => {
        const g = props.graphs.find(x => x.id === graphId)
        if (g === undefined) throw Error(`INTERNAL ERROR: graph ${graphId} not found`)
        return colourVertices(g, rootVertex)
    }, [props.graphs])

    const handleVisualizeCutvertices = useCallback((graphId: number, rootVertex: string): string[] => {
        const g = props.graphs.find(x => x.id === graphId)
        if (g === undefined) throw Error(`INTERNAL ERROR: graph ${graphId} not found`)
        return Array.from(findBiconnectedComponents(g, rootVertex)[0])
    }, [props.graphs])

    function handleChangeVisualizer (event: ChangeEvent<HTMLInputElement>): void {
        const visualizer = VisualizerType[event.target.value as keyof typeof VisualizerType]
        setSelectedVisualizer(prev => ({ ...prev, [visualizer]: event.target.checked }))
    }

    const graphs = useMemo(
        () => props.graphs.map<SimGraph>(graph => {
            const vertices = getSimVertices(graph)
            const edges = getSimEdges(graph, vertices)
            return {
                id: graph.id,
                name: graph.name,
                edgeType: graph.directed ? 'arrow' : 'line',
                vertices,
                edges,
                tooltip: getTooltip(graph)
            }
        }),
        [props.graphs]
    )

    const visualizers = [
        { name: 'Tooltip', id: VisualizerType.tooltip },
        { name: 'Spanning tree', id: VisualizerType.spanningTree },
        { name: 'Vertex colouring', id: VisualizerType.vertexColouring },
        { name: 'Cutvertices', id: VisualizerType.cutvertices }
    ]

    return <>
        <div id="graph-wrapper">
            <GraphSimulation
                graphs={graphs}
                visualizers={Object.entries(selectedVisualizers).filter(x => x[1]).map(x => x[0] as VisualizerType)}
                onVisualizeSpanningTree={handleVisualizeSpanningTree}
                onVisualizeVertexColouring={handleVisualizeVertexColouring}
                onVisualizeCutvertices={handleVisualizeCutvertices}
            />
            <div id="graph-configs">
                <label>Visualizers
                    <span style={{ margin: '1em' }}>
                        {
                            visualizers.map(x => {
                                return <label key={VisualizerType[x.id]}>{x.name} <input type="checkbox" value={VisualizerType[x.id]} checked={selectedVisualizers[x.id]} onChange={handleChangeVisualizer} /></label>
                            })
                        }
                    </span>
                </label>
            </div>
        </div>
    </>
}

export default GraphWindow
