
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
        const treeString = graph.properties.isTree ? `tree = ${graph.properties.isTree}` : `connected = ${graph.properties.isConnected}\nacyclic = ${graph.properties.isAcyclic}`
        return `name = '${graph.name}'\n${treeString}`
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
