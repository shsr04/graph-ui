import * as d3 from 'd3'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SpanningTreeVisualizer } from './visualizers/SpanningTreeVisualizer'
import { TooltipVisualizer } from './visualizers/TooltipVisualizer'
import { VertexColouringVisualizer } from './visualizers/VertexColouringVisualizer'
import { CutvertexVisualizer } from './visualizers/CutvertexVisualizer'

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
    vertexColouring = 'vertexColouring',
    cutvertices = 'cutvertices',
}

export const DEFAULT_CIRCLE_FILL_COLOR = 'white'
export const DEFAULT_CIRCLE_STROKE_WIDTH = 1
export const DEFAULT_CIRCLE_STROKE_DASHARRAY = null
export const FOCUSED_CIRCLE_FILL_COLOR = 'orangered'
export const SECONDARY_CIRCLE_FILL_COLOR = 'lightcyan'
export const SECONDARY_CIRCLE_STROKE_DASHARRAY = '2'
export const SECONDARY_CIRCLE_STROKE_WIDTH = 4
export const DEFAULT_LINE_STROKE_WIDTH = 1
export const BOLD_LINE_STROKE_WIDTH = 5

/**
 * The simulation starts from the base value and converges to the target value.
 * If the simulation goes lower than the min value, the simulation is stopped immediately.
 * (Theoretically, the simulation can be restarted, but this is pretty broken right now.)
 */
const SIMULATION_ALPHA_SETTINGS = {
    base: 0.5,
    target: 1e-10,
    min: 0
}

interface GraphSimulationProps {
    graphs: SimGraph[]
    visualizers: VisualizerType[]
    onVisualizeSpanningTree: (graphId: number, rootVertex: string) => Array<[string, string]>
    onVisualizeVertexColouring: (graphId: number, rootVertex: string) => Map<string, number>
    onVisualizeCutvertices: (graphId: number, rootVertex: string) => string[]
}

/**
 * Simulated force-graph renderer.
 *
 * Adapted from https://reactfordataviz.com/articles/force-directed-graphs-with-react-and-d3v7/
 */
const GraphSimulation = ({ onVisualizeSpanningTree, onVisualizeVertexColouring, onVisualizeCutvertices, ...props }: GraphSimulationProps): JSX.Element => {
    const svgRef = useRef<SVGSVGElement>(null)
    const [simulation, setSimulation] = useState<d3.Simulation<SimVertex, SimEdge>>(d3.forceSimulation())

    useEffect(() => {
        if (svgRef.current === null) return

        const vertices = props.graphs.flatMap(g => g.vertices)
        const edges = props.graphs.flatMap(g => g.edges)

        const simulation = d3.forceSimulation<SimVertex, SimEdge>()
            .nodes(vertices)
            .force('center', d3.forceCenter(0, 0).strength(0.1))
            .force('charge', d3.forceManyBody().strength(-100))
            .force('collision', d3.forceCollide(node => node.radius * 1.5))
            .force('links', d3.forceLink<SimVertex, SimEdge>().id(vertex => vertex.id).links(edges))
            // hack: Somehow d3 completely kills the simulation when alpha < alphaMin, so we need to keep it running continuously...
            .alpha(SIMULATION_ALPHA_SETTINGS.base)
            .alphaTarget(SIMULATION_ALPHA_SETTINGS.target)
            .alphaMin(SIMULATION_ALPHA_SETTINGS.min)

        setSimulation(simulation)

        return () => {
            simulation.stop()
        }
    }, [props.graphs])

    // keeps stable reference to the drawSimulatedGraph function
    const handleDraw = useCallback(drawSimulatedGraph, [props.visualizers, onVisualizeSpanningTree, onVisualizeVertexColouring, onVisualizeCutvertices])

    useEffect(() => {
        // Clean up the SVG elements of old graphs
        const graphIds = props.graphs.map(graph => graph.id)
        d3.selectAll<SVGGElement, unknown>('g').nodes()
            // Look for <g> elements like `nodes-N` or `links-N`
            .filter(elem => {
                try {
                    const num = Number(elem.id.split('-')[1])
                    if (!graphIds.includes(num)) {
                        return true
                    }
                } catch (e: any) {}
                return false
            })
            .forEach(elem => {
                elem.remove()
            })

        const colorScale = d3.scaleOrdinal(props.graphs.map(g => g.id), d3.schemeCategory10)
        simulation.on('tick', () => {
            for (const graph of props.graphs) {
                handleDraw(graph, simulation, colorScale(graph.id))
            }
        })
    }, [simulation, props.graphs, handleDraw])

    function drawSimulatedGraph (graph: SimGraph, simulation: d3.Simulation<SimVertex, SimEdge>, colorCode: string): void {
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
            .attr('stroke', colorCode)
            .attr('fill', function () {
                return this.getAttribute('fill') ?? DEFAULT_CIRCLE_FILL_COLOR
            })
            .call(handleDrag(simulation))
            .call((sel) => {
                // unregister event handlers
                const handlers = Object.keys(VisualizerType).map(x => '.' + x).join(' ')
                sel.on(handlers, null)
            })

        // apply visualizers (from background to foreground)
        if (props.visualizers.includes(VisualizerType.vertexColouring)) {
            vertices.call(VertexColouringVisualizer, graph, onVisualizeVertexColouring)
        }
        if (props.visualizers.includes(VisualizerType.spanningTree)) {
            vertices.call(SpanningTreeVisualizer, graph, edges, onVisualizeSpanningTree)
        }
        if (props.visualizers.includes(VisualizerType.cutvertices)) {
            vertices.call(CutvertexVisualizer, graph, onVisualizeCutvertices)
        }
        if (props.visualizers.includes(VisualizerType.tooltip)) {
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
    }

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

    function handleDrag (simulation: d3.Simulation<SimVertex, SimEdge>): d3.DragBehavior<SVGCircleElement, SimVertex, SimVertex | d3.SubjectPosition> {
        return d3.drag<SVGCircleElement, SimVertex>()
            .on('start', (event) => {
                if (event.active > 0) return
                // Set up some dynamic behaviour
                simulation.alpha(0.21).alphaTarget(0.2).restart()
            })
            .on('drag', (event, vertex) => {
                vertex.fx = event.x
                vertex.fy = event.y
            })
            .on('end', (event, vertex) => {
                if (event.active > 0) return
                simulation
                    // Reset to default alpha target
                    .alphaTarget(SIMULATION_ALPHA_SETTINGS.target)
                vertex.fx = null
                vertex.fy = null
            })
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
