
import GraphSimulation, { D3Edge, D3Graph, D3Vertex } from './GraphSimulation'
import * as d3 from 'd3'
import { Graph } from '../algorithms/Graph'

interface GraphWindowProps {
    graphs: Graph[]
}

const GraphWindow = (props: GraphWindowProps): JSX.Element => {
    function getD3Vertices (graph: Graph): D3Vertex[] {
        return d3.map(graph.internalAdjMap.keys(), id => ({ id, radius: 20 }))
    }

    function getD3Edges (graph: Graph): D3Edge[] {
        return d3
            .map(
                graph.internalAdjMap.entries(),
                ([source, adj]) => adj.map(target => ({ source, target }))
            )
            .flat()
    }

    function getTooltip (graph: Graph): string {
        return `
        name = '${graph.name}'
        connected = ${graph.properties.isConnected}
        `
    }

    const graphs = props.graphs.map<D3Graph>(graph => ({
        index: graph.index,
        name: graph.name,
        edgeType: graph.directed ? 'arrow' : 'line',
        vertices: getD3Vertices(graph),
        edges: getD3Edges(graph),
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
