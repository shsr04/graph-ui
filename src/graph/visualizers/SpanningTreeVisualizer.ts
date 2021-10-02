import { SimEdge, SimVertex, SimGraph, BOLD_LINE_STROKE_WIDTH, DEFAULT_LINE_STROKE_WIDTH, FOCUSED_CIRCLE_FILL_COLOR, DEFAULT_CIRCLE_FILL_COLOR } from '../GraphSimulation'
import * as d3 from 'd3'

export function SpanningTreeVisualizer (
    selection: d3.Selection<SVGCircleElement, SimVertex, d3.BaseType, unknown>,
    graph: SimGraph,
    edgeSelection: d3.Selection<SVGLineElement, SimEdge, d3.BaseType, unknown>,
    spanningTreeFactory: (graphId: number, root: string) => Array<[string, string]>
): void {
    selection
        .on('mouseenter.spanningTree', (_, vertex) => {
            selection.attr('fill', u => u.id === vertex.id ? FOCUSED_CIRCLE_FILL_COLOR : DEFAULT_CIRCLE_FILL_COLOR)
            const edges = spanningTreeFactory(graph.id, vertex.id.toString())
            edgeSelection.attr('stroke-width', e => {
                if (edges.some(([u, v]) => u === (e.source as SimVertex).id.toString() && v === (e.target as SimVertex).id.toString())) {
                    return BOLD_LINE_STROKE_WIDTH
                }
                return DEFAULT_LINE_STROKE_WIDTH
            })
        })
        .on('mouseleave.spanningTree', () => {
            selection.attr('fill', DEFAULT_CIRCLE_FILL_COLOR)
            edgeSelection
                // "edgeSelection.transition is not a function" ???
                .attr('stroke-width', DEFAULT_LINE_STROKE_WIDTH)
        })
}
