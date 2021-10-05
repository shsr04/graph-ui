import * as d3 from 'd3'
import { DEFAULT_CIRCLE_FILL_COLOR, DEFAULT_CIRCLE_STROKE_DASHARRAY, DEFAULT_CIRCLE_STROKE_WIDTH, SECONDARY_CIRCLE_FILL_COLOR, SECONDARY_CIRCLE_STROKE_DASHARRAY, SECONDARY_CIRCLE_STROKE_WIDTH, SimGraph, SimVertex, VisualizerType } from '../GraphSimulation'

export function CutvertexVisualizer (
    selection: d3.Selection<SVGCircleElement, SimVertex, d3.BaseType, unknown>,
    graph: SimGraph,
    cutvertexFactory: (graphId: number, root: string) => string[]
): void {
    console.log(selection)
    selection
        .on('mouseenter.' + VisualizerType.cutvertices, (_, vertex) => {
            const cutvertices = cutvertexFactory(graph.id, vertex.id.toString())
            console.log(cutvertices)
            selection.attr('fill', function (u) {
                return cutvertices.includes(u.id.toString()) ? SECONDARY_CIRCLE_FILL_COLOR : this.getAttribute('fill')
            })
            selection.attr('stroke-width', function (u) {
                return cutvertices.includes(u.id.toString()) ? SECONDARY_CIRCLE_STROKE_WIDTH : this.getAttribute('stroke-width')
            })
            selection.attr('stroke-dasharray', function (u) {
                return cutvertices.includes(u.id.toString()) ? SECONDARY_CIRCLE_STROKE_DASHARRAY : this.getAttribute('stroke-dasharray')
            })
        })
        .on('mouseleave.' + VisualizerType.cutvertices, () => {
            selection.attr('fill', DEFAULT_CIRCLE_FILL_COLOR)
            selection.attr('stroke-width', DEFAULT_CIRCLE_STROKE_WIDTH)
            selection.attr('stroke-dasharray', DEFAULT_CIRCLE_STROKE_DASHARRAY)
        })
}
