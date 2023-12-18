import { ChangeEvent, useCallback, useMemo, useState } from 'react'
import { visitDfs } from '../core/algorithms/Dfs'
import GraphSimulation, { VisualizerType } from './GraphSimulation'
import './GraphWindow.css'
import { colourVertices } from '../core/algorithms/VertexColouring'
import { findBiconnectedComponents } from '../core/algorithms/BiconnectedComponents'
import { Graph } from '../core/Graph'
import { D3Graph } from '../adapters/D3Graph'

interface GraphWindowProps {
    graphs: Array<Graph<string>>
}

const GraphWindow = (props: GraphWindowProps): JSX.Element => {
    const [selectedVisualizers, setSelectedVisualizer] = useState<Record<VisualizerType, boolean>>({
        [VisualizerType.tooltip]: true,
        [VisualizerType.spanningTree]: false,
        [VisualizerType.vertexColouring]: false,
        [VisualizerType.cutvertices]: false
    })

    const handleVisualizeSpanningTree = useCallback((graphId: number, rootVertex: string): Array<[string, string]> => {
        const edges: Array<[string, string]> = []
        const g = props.graphs.find(x => x.id === graphId)
        if (g === undefined) throw Error(`INTERNAL ERROR: graph ${graphId} not found`)
        visitDfs(g, rootVertex, new Map(g.vertices.map(u => ([u, 'white']))), new Map(), {
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
        () => props.graphs.map(g => new D3Graph(g)),
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
            <div id="graph-configs" className="pa3 font-label">
                <label className="font-label-bold">Visualizers</label>
                <div id="graph-visualizers">
                    {
                        visualizers.map(x => {
                            return <label key={VisualizerType[x.id]}>{x.name} <input type="checkbox" value={VisualizerType[x.id]} checked={selectedVisualizers[x.id]} onChange={handleChangeVisualizer} /></label>
                        })
                    }
                </div>
            </div>
        </div>
    </>
}

export default GraphWindow
