
import { Graph } from '../algorithms/Graph'
import GraphSimulation, { SimEdge, SimGraph, SimVertex } from './GraphSimulation'

interface GraphWindowProps {
    graphs: Graph[]
}

const GraphWindow = (props: GraphWindowProps): JSX.Element => {
    function getSimVertices (graph: Graph): SimVertex[] {
        return graph.vertices().map(id => ({ id, radius: 20 }))
    }

    function getSimEdges (graph: Graph): SimEdge[] {
        return graph.vertices().flatMap(source => graph.neighbours(source).map(target => ({ source, target })))
    }

    function getTooltip (graph: Graph): string {
        const tooltip = [`name = '${graph.name}'`, `connected = ${graph.properties.isConnected}`]
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

    const graphs = props.graphs.map<SimGraph>(graph => ({
        index: graph.index,
        name: graph.name,
        edgeType: graph.directed ? 'arrow' : 'line',
        vertices: getSimVertices(graph),
        edges: getSimEdges(graph),
        tooltip: getTooltip(graph)
    }))

    return <>
        <div style={{
            width: '90%',
            height: '90%'
        }}>
            <GraphSimulation graphs={graphs} />
        </div>
    </>
}

export default GraphWindow
