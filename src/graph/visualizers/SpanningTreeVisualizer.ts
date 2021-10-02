import { SimEdge, SimVertex, SimGraph } from '../GraphSimulation'
import * as d3 from 'd3'

export function SpanningTreeVisualizer (
    selection: d3.Selection<SVGCircleElement, SimVertex, d3.BaseType, unknown>,
    graph: SimGraph,
    edgeSelection: d3.Selection<SVGLineElement, SimEdge, d3.BaseType, unknown>,
    spanningTreeFactory: (graphId: number, root: string) => Array<[string, string]>
): void {
    selection
        .on('mouseover', (_, vertex) => {
            const edges = spanningTreeFactory(graph.index, vertex.id.toString()).map(x => new Set(x))
            edgeSelection.attr('stroke-width', e => {
                if (edges.some(edgeSet => edgeSet.has((e.source as SimVertex).id.toString()) && edgeSet.has((e.target as SimVertex).id.toString()))) {
                    return 10
                }
                return edgeSelection.attr('stroke-width')
            })
        })
        // TODO not firing???
        .on('mouseout', (event) => {
            console.log(event)
            edgeSelection.attr('stroke-width', 1)
        })
}
