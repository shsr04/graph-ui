
import GraphSimulation, { D3Edge, D3Graph, D3Vertex } from './GraphSimulation'
import * as d3 from 'd3'
import { GraphProps } from '../editor/GraphMapper'

interface GraphWindowProps {
    graphs: GraphProps[]
}

const GraphWindow = (props: GraphWindowProps): JSX.Element => {
    function getD3Vertices (graph: GraphProps): D3Vertex[] {
        return d3.map(graph.adj.keys(), id => ({ id, radius: 20 }))
    }

    function getD3Edges (graph: GraphProps): D3Edge[] {
        return d3
            .map(
                graph.adj.entries(),
                ([source, adj]) => adj.map(target => ({ source, target }))
            )
            .flat()
    }

    const graphs = props.graphs.map<D3Graph>(graph => ({
        index: graph.index,
        name: graph.name,
        edgeType: graph.directed ? 'arrow' : 'line',
        vertices: getD3Vertices(graph),
        edges: getD3Edges(graph)
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
