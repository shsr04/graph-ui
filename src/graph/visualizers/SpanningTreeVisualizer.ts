import * as d3 from 'd3'
import {
    BOLD_LINE_STROKE_WIDTH,
    DEFAULT_CIRCLE_FILL_COLOR,
    DEFAULT_LINE_STROKE_WIDTH,
    FOCUSED_CIRCLE_FILL_COLOR
} from '../GraphSimulation'
import { D3Edge, D3Graph, D3Vertex } from '../../adapters/D3Graph'

export function SpanningTreeVisualizer (
    selection: d3.Selection<SVGCircleElement, D3Vertex, d3.BaseType, unknown>,
    graph: D3Graph,
    edgeSelection: d3.Selection<SVGLineElement, D3Edge, d3.BaseType, unknown>,
    spanningTreeFactory: (graphId: number, root: string) => Array<[string, string]>
): void {
    selection
        .on('mouseenter.spanningTree', (_, vertex) => {
            selection.attr('fill', function (u) {
                return u.id === vertex.id ? FOCUSED_CIRCLE_FILL_COLOR : this.getAttribute('fill')
            })
            const edges = spanningTreeFactory(graph.id, vertex.id.toString())
            edgeSelection.attr('stroke-width', function (e) {
                if (edges.some(([u, v]) => u === (e.source as D3Vertex).id.toString() && v === (e.target as D3Vertex).id.toString())) {
                    return BOLD_LINE_STROKE_WIDTH
                }
                return this.getAttribute('stroke-width')
            })
        })
        .on('mouseleave.spanningTree', () => {
            selection.attr('fill', DEFAULT_CIRCLE_FILL_COLOR)
            edgeSelection
                // "edgeSelection.transition is not a function" ???
                .attr('stroke-width', DEFAULT_LINE_STROKE_WIDTH)
        })
}
