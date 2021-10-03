import * as d3 from 'd3'
import { useEffect, useRef } from 'react'
import { SpanningTreeVisualizer } from './visualizers/SpanningTreeVisualizer'
import { TooltipVisualizer } from './visualizers/TooltipVisualizer'
import { VertexColouringVisualizer } from './visualizers/VertexColouringVisualizer'

export interface SimGraph {
    id: number
    name: string
    vertices: SimVertex[]
    edges: SimEdge[]
    edgeType: 'line' | 'arrow'
    tooltip: string
}

export interface SimVertex extends d3.SimulationNodeDatum {
    id: number | string
    graphId: number
    radius: number
}

export interface SimEdge extends d3.SimulationLinkDatum<SimVertex> { }

export enum VisualizerType {
    tooltip = 'tooltip',
    spanningTree = 'spanningTree',
    vertexColouring = 'vertexColouring'
}

export const DEFAULT_CIRCLE_FILL_COLOR = 'white'
export const FOCUSED_CIRCLE_FILL_COLOR = 'orangered'
export const DEFAULT_LINE_STROKE_WIDTH = 1
export const BOLD_LINE_STROKE_WIDTH = 5

interface GraphSimulationProps {
    graphs: SimGraph[]
    visualizers: VisualizerType[]
    onVisualizeSpanningTree: (graphId: number, rootVertex: string) => Array<[string, string]>
    onVisualizeVertexColouring: (graphId: number, rootVertex: string) => Map<string, number>
}

/**
 * Simulated force-graph renderer.
 *
 * Adapted from https://reactfordataviz.com/articles/force-directed-graphs-with-react-and-d3v7/
 */
const GraphSimulation = ({ onVisualizeSpanningTree, onVisualizeVertexColouring, ...props }: GraphSimulationProps): JSX.Element => {
    const svgRef = useRef<SVGSVGElement>(null)

    useEffect(() => {
        if (svgRef.current === null || props.graphs.length === 0) return

        const vertices = props.graphs.flatMap(g => g.vertices)
        const edges = props.graphs.flatMap(g => g.edges)
        console.log(vertices, edges)

        const simulation = d3.forceSimulation<SimVertex, SimEdge>()
            .nodes(vertices)
            .force('center', d3.forceCenter(0, 0).strength(0.1))
            .force('charge', d3.forceManyBody().strength(-100))
            .force('collision', d3.forceCollide(node => node.radius * 1.5))
            .force('links', d3.forceLink<SimVertex, SimEdge>().id(vertex => vertex.id).links(edges))
            .alpha(0.1)
            .restart()

        const colorScale = d3.scaleOrdinal(props.graphs.map(g => g.id), d3.schemeCategory10)
        // TODO extract drawSimulatedGraph to useCallback (deps on visualizers etc.), then remove all deps here except props.graphs
        simulation.on('tick', () => {
            for (const graph of props.graphs) {
                drawSimulatedGraph(graph, {
                    colorCode: colorScale(graph.id),
                    dragHandler: handleDrag(simulation),
                    visualizers: props.visualizers,
                    onVisualizeSpanningTree,
                    onVisualizeVertexColouring
                })
            }
        })

        function handleDrag (simulation: d3.Simulation<SimVertex, SimEdge>): d3.DragBehavior<SVGCircleElement, SimVertex, SimVertex | d3.SubjectPosition> {
            return d3.drag<SVGCircleElement, SimVertex>()
                .on('start', (event) => {
                    if (event.active > 0) return
                    simulation.alphaTarget(0.2).restart()
                })
                .on('drag', (event, vertex) => {
                    vertex.fx = event.x
                    vertex.fy = event.y
                })
                .on('end', (event, vertex) => {
                    if (event.active > 0) return
                    simulation.alphaTarget(0)
                    vertex.fx = null
                    vertex.fy = null
                })
        }

        return () => {
            simulation.stop()
        }
    }, [props.graphs, props.visualizers, onVisualizeSpanningTree])

    function drawSimulatedGraph (graph: SimGraph, options?: {
        colorCode?: string
        dragHandler?: d3.DragBehavior<SVGCircleElement, SimVertex, SimVertex | d3.SubjectPosition>
        visualizers: VisualizerType[]
        onVisualizeSpanningTree: (graphId: number, rootVertex: string) => Array<[string, string]>,
        onVisualizeVertexColouring: (graphId: number, rootVertex: string) => Map<string, number>,
    }): void {
        if (svgRef.current === null) return

        const svg = d3.select(svgRef.current)
        const id = graph.id
        const v = graph.vertices
        const e = graph.edges

        // Undocumented (fun) fact: we must use selectAll for data-joined elements, otherwise d3 throws null pointer errors
        // Note: The link group comes before the node group so that the links are drawn in the background
        const linkGroup = svg.selectAll(`#links-${id}`).data([null]).join('g').attr('id', `links-${id}`)
        const nodeGroup = svg.selectAll(`#nodes-${id}`).data([null]).join('g').attr('id', `nodes-${id}`)

        const edges = linkGroup.selectAll<SVGLineElement, SimEdge>('line')
            .data(e)
            .join('line')
            .attr('x1', e => (e.source as SimVertex).x ?? null)
            .attr('y1', e => (e.source as SimVertex).y ?? null)
            .attr('x2', e => intersectionWithCircle(e.source as SimVertex, e.target as SimVertex, graph.edgeType === 'arrow').x)
            .attr('y2', e => intersectionWithCircle(e.source as SimVertex, e.target as SimVertex, graph.edgeType === 'arrow').y)
            .attr('stroke', 'black')
            .attr('stroke-width', function () {
                return this.getAttribute('stroke-width') ?? DEFAULT_LINE_STROKE_WIDTH
            })
            .attr('marker-end', () => graph.edgeType === 'arrow' ? 'url(#arrowTip)' : '')

        const vertices = nodeGroup.selectAll<SVGCircleElement, SimVertex>('circle.vertex')
            .data(v)
            .join('circle')
            .attr('class', 'vertex')
            .attr('cx', u => u.x ?? null)
            .attr('cy', u => u.y ?? null)
            .attr('r', u => u.radius)
            .attr('stroke', options?.colorCode ?? 'black')
            .attr('fill', function () {
                return this.getAttribute('fill') ?? DEFAULT_CIRCLE_FILL_COLOR
            })
            .call(options?.dragHandler ?? (() => { }))
            .call((sel) => {
                // unregister event handlers
                const handlers = Object.keys(VisualizerType).map(x => '.' + x).join(' ')
                sel.on(handlers, null)
            })

        // apply visualizers (from background to foreground)
        if (options?.visualizers.includes(VisualizerType.vertexColouring) === true) {
            vertices.call(VertexColouringVisualizer, graph, options.onVisualizeVertexColouring)
        }
        if (options?.visualizers.includes(VisualizerType.spanningTree) === true) {
            vertices.call(SpanningTreeVisualizer, graph, edges, options.onVisualizeSpanningTree)
        }
        if (options?.visualizers.includes(VisualizerType.tooltip) === true) {
            vertices.call(TooltipVisualizer, svg, graph)
        }

        nodeGroup.selectAll<SVGTextElement, SimVertex>('text.label')
            .data(v)
            .join('text')
            .attr('class', 'label')
            .text(u => u.id)
            // hack: center text inside circle
            .attr('x', u => (u.x ?? 0) - u.radius / 2)
            .attr('y', u => (u.y ?? 0) + u.radius / 2)
            .attr('font-size', u => u.radius)
            .attr('fill', 'black')
            .style('pointer-events', 'none')

        /**
         * @param source Source vertex
         * @param target Target vertex
         * @param respectArrow True if the distance should consider additional space for an arrow tip (used in digraphs)
         * @returns The coordinate where a line drawn from the source vertex intersects with the border of the target vertex.
         */
        function intersectionWithCircle (source: SimVertex, target: SimVertex, respectArrow: boolean = false): { x: number, y: number } {
            if (source.x === undefined || source.y === undefined || target.x === undefined || target.y === undefined) throw Error('INTERNAL ERROR: source/target is undefined')
            if (source === target) return { x: source.x, y: source.y }
            const distanceCenter = Math.sqrt(Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2))
            let distanceBorder = distanceCenter - target.radius
            if (respectArrow) distanceBorder -= arrowTipSize / 2
            const ratio = distanceBorder / distanceCenter
            const deltaX = (target.x - source.x) * ratio
            const deltaY = (target.y - source.y) * ratio
            if (Number.isNaN(source.x)) console.log(source, target)
            if (Number.isNaN(deltaX)) console.log(source, target)
            if (Number.isNaN(source.y)) console.log(source, target)
            if (Number.isNaN(deltaY)) console.log(source, target)
            return { x: source.x + deltaX, y: source.y + deltaY }
        }
    }

    const svgBoundingRect = svgRef.current !== null
        ? {
            w: svgRef.current.getBoundingClientRect().width,
            h: svgRef.current.getBoundingClientRect().height
        }
        : { w: 0, h: 0 }

    const arrowTipSize = 6

    return (
        <>
            <svg width="100%" height="100%" ref={svgRef} viewBox={`-${svgBoundingRect.w / 2} -${svgBoundingRect.h / 2} ${svgBoundingRect.w} ${svgBoundingRect.h}`}>
                <defs>
                    <marker id="arrowTip" viewBox="0 0 10 10" refX="5" refY="5"
                        markerWidth={arrowTipSize} markerHeight={arrowTipSize}
                        markerUnits="userSpaceOnUse"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" />
                    </marker>
                </defs>
            </svg>
        </>
    )
}

export default GraphSimulation
