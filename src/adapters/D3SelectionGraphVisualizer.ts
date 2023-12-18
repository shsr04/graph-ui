import { GraphVisualizer } from '../core/GraphVisualizer'
import { D3Edge, D3Graph, D3Vertex } from './D3Graph'
import * as d3 from 'd3'
import {
    BOLD_LINE_STROKE_WIDTH,
    DEFAULT_CIRCLE_FILL_COLOR,
    DEFAULT_CIRCLE_STROKE_DASHARRAY,
    DEFAULT_CIRCLE_STROKE_WIDTH, DEFAULT_LINE_STROKE_WIDTH,
    FOCUSED_CIRCLE_FILL_COLOR,
    SECONDARY_CIRCLE_FILL_COLOR,
    SECONDARY_CIRCLE_STROKE_DASHARRAY,
    SECONDARY_CIRCLE_STROKE_WIDTH,
    VisualizerType
} from '../graph/GraphSimulation'

export abstract class D3SelectionGraphVisualizer extends GraphVisualizer<D3Vertex, D3Edge> {
    protected constructor (
        public readonly graph: D3Graph,
        protected readonly vertexSelection: d3.Selection<SVGCircleElement, D3Vertex, d3.BaseType, unknown>,
        protected readonly edgeSelection: d3.Selection<SVGCircleElement, D3Edge, d3.BaseType, unknown>
    ) {
        super()
    }
}

export enum D3GraphVisualizerType {
    tooltip = 'tooltip',
    spanningTree = 'spanningTree',
    vertexColouring = 'vertexColouring',
    cutvertices = 'cutvertices',
}

export class D3TooltipVisualizer extends D3SelectionGraphVisualizer {
    constructor (
        graph: D3Graph,
        vertexSelection: d3.Selection<SVGCircleElement, D3Vertex, d3.BaseType, unknown>,
        edgeSelection: d3.Selection<SVGCircleElement, D3Edge, d3.BaseType, unknown>,
        private readonly svg: d3.Selection<SVGSVGElement, unknown, d3.BaseType, unknown>
    ) {
        super(graph, vertexSelection, edgeSelection)
    }

    visualize (): void {
        this.vertexSelection
            .on('mousemove.tooltip', (event) => {
                const lines = this.graph.tooltip.split(/\r?\n/).map(x => x.trim())
                const [x, y] = d3.pointer(event, this)
                const tooltipGroup = this.svg.selectAll('#tooltip').data([null]).join('g').attr('id', 'tooltip')
                tooltipGroup.selectAll('rect').data([null]).join('rect')
                // TODO rect autosize + background
                tooltipGroup.selectAll('text').data([null]).join('text')
                    .style('font-family', 'monospace')
                    .attr('transform', `translate(${x + 30},${y})`)
                    .selectAll('tspan').data(lines).join('tspan')
                    .attr('x', 0).attr('dy', '1.25em')
                    .text(line => line)
            })
            .on('mouseleave.tooltip', () => {
                this.svg.select('#tooltip').remove()
            })
    }
}

export class D3CutvertexVisualizer extends D3SelectionGraphVisualizer {
    constructor (
        graph: D3Graph,
        vertexSelection: d3.Selection<SVGCircleElement, D3Vertex, d3.BaseType, unknown>,
        edgeSelection: d3.Selection<SVGCircleElement, D3Edge, d3.BaseType, unknown>,
        private readonly cutvertexFinder: (graphId: number, root: string) => string[]
    ) {
        super(graph, vertexSelection, edgeSelection)
    }

    visualize (): void {
        this.vertexSelection
            .on('mouseenter.' + VisualizerType.cutvertices, (_, vertex) => {
                const cutvertices = this.cutvertexFinder(this.graph.id, vertex.id.toString())
                this.vertexSelection.attr('fill', function (u) {
                    return cutvertices.includes(u.id.toString()) ? SECONDARY_CIRCLE_FILL_COLOR : this.getAttribute('fill')
                })
                this.vertexSelection.attr('stroke-width', function (u) {
                    return cutvertices.includes(u.id.toString()) ? SECONDARY_CIRCLE_STROKE_WIDTH : this.getAttribute('stroke-width')
                })
                this.vertexSelection.attr('stroke-dasharray', function (u) {
                    return cutvertices.includes(u.id.toString()) ? SECONDARY_CIRCLE_STROKE_DASHARRAY : this.getAttribute('stroke-dasharray')
                })
            })
            .on('mouseleave.' + VisualizerType.cutvertices, () => {
                this.vertexSelection.attr('fill', DEFAULT_CIRCLE_FILL_COLOR)
                this.vertexSelection.attr('stroke-width', DEFAULT_CIRCLE_STROKE_WIDTH)
                this.vertexSelection.attr('stroke-dasharray', DEFAULT_CIRCLE_STROKE_DASHARRAY)
            })
    }
}

export class D3SpanningTreeVisualizer extends D3SelectionGraphVisualizer {
    constructor (
        graph: D3Graph,
        vertexSelection: d3.Selection<SVGCircleElement, D3Vertex, d3.BaseType, unknown>,
        edgeSelection: d3.Selection<SVGCircleElement, D3Edge, d3.BaseType, unknown>,
        private readonly spanningTreeFinder: (graphId: number, root: string) => Array<[string, string]>
    ) {
        super(graph, vertexSelection, edgeSelection)
    }

    visualize (): void {
        this.vertexSelection
            .on('mouseenter.spanningTree', (_, vertex) => {
                this.vertexSelection.attr('fill', function (u) {
                    return u.id === vertex.id ? FOCUSED_CIRCLE_FILL_COLOR : this.getAttribute('fill')
                })
                const edges = this.spanningTreeFinder(this.graph.id, vertex.id.toString())
                this.edgeSelection.attr('stroke-width', function (e) {
                    if (edges.some(([u, v]) => u === (e.source as D3Vertex).id.toString() && v === (e.target as D3Vertex).id.toString())) {
                        return BOLD_LINE_STROKE_WIDTH
                    }
                    return this.getAttribute('stroke-width')
                })
            })
            .on('mouseleave.spanningTree', () => {
                this.vertexSelection.attr('fill', DEFAULT_CIRCLE_FILL_COLOR)
                this.edgeSelection
                    // "edgeSelection.transition is not a function" ???
                    .attr('stroke-width', DEFAULT_LINE_STROKE_WIDTH)
            })
    }
}

export class D3VertexColouringVisualizer extends D3SelectionGraphVisualizer {
    constructor (
        graph: D3Graph,
        vertexSelection: d3.Selection<SVGCircleElement, D3Vertex, d3.BaseType, unknown>,
        edgeSelection: d3.Selection<SVGCircleElement, D3Edge, d3.BaseType, unknown>,
        private readonly vertexColouringFinder: (graphId: number, root: string) => Map<string, number>
    ) {
        super(graph, vertexSelection, edgeSelection)
    }

    visualize (): void {
        this.vertexSelection
            .on('mouseenter.vertexColouring', (_, vertex) => {
                const colouring = this.vertexColouringFinder(this.graph.id, vertex.id.toString())
                const usedColours = new Set(colouring.values())
                const vertexColourScale = d3.scaleOrdinal(usedColours, d3.schemePastel1)
                this.vertexSelection.attr('fill', u => vertexColourScale(colouring.get(u.id.toString()) ?? 1000))
            })
            .on('mouseleave.vertexColouring', () => {
                this.vertexSelection.attr('fill', DEFAULT_CIRCLE_FILL_COLOR)
            })
    }
}
