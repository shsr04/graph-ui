import * as d3 from 'd3'
import { DEFAULT_CIRCLE_FILL_COLOR, SimGraph, SimVertex } from '../GraphSimulation'

export function VertexColouringVisualizer (
    selection: d3.Selection<SVGCircleElement, SimVertex, d3.BaseType, unknown>,
    graph: SimGraph,
    vertexColouringFactory: (graphId: number, root: string) => Map<string, number>
): void {
    selection
        .on('mouseenter.vertexColouring', (_, vertex) => {
            const colouring = vertexColouringFactory(graph.id, vertex.id.toString())
            const usedColours = new Set(colouring.values())
            const vertexColourScale = d3.scaleOrdinal(usedColours, d3.schemePastel1)
            selection.attr('fill', u => vertexColourScale(colouring.get(u.id.toString()) ?? 1000))
        })
        .on('mouseleave.vertexColouring', () => {
            selection.attr('fill', DEFAULT_CIRCLE_FILL_COLOR)
        })
}
