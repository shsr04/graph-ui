
import UndirectedGraph from './UndirectedGraph'
import * as d3 from 'd3'

interface GraphWindowProps { }

const GraphWindow = (props: GraphWindowProps) => {
    const vertices = d3.range(50).map((n) => {
        return { id: n, radius: 10 };
    });

    const edges = [
        { source: 0, target: 1 },
        { source: 10, target: 1 },
        { source: 10, target: 11 },
        { source: 10, target: 12 },
        { source: 11, target: 13 },
    ]

    return <>
        <div style={{
            width: "90%",
            height: "90%",
        }}>
            <UndirectedGraph vertices={vertices} edges={edges} />
        </div>
    </>;
}

export default GraphWindow;