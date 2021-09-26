
import UndirectedGraph, { Edge, Vertex } from './UndirectedGraph'
import * as d3 from 'd3'
import { Graph } from '../editor/GraphMapper'

interface GraphWindowProps {
    graphs: Graph[]
}

const GraphWindow = (props: GraphWindowProps) => {
    function vertices (): Vertex[] {
        if (props.graphs.length === 0) return []
        return d3.map(props.graphs[0].adj.keys(), (id) => {
            return { id, radius: 10 }
        })
    }

    function edges (): Edge[] {
        if (props.graphs.length === 0) return []
        return d3.map(props.graphs[0].adj.entries(),
            ([source, adj]) =>
                adj.map(target => ({ source, target })))
            .flat()
    }

    return <>
        <div style={{
            width: '90%',
            height: '90%'
        }}>
            <UndirectedGraph vertices={vertices()} edges={edges()} />
        </div>
    </>
}

export default GraphWindow
