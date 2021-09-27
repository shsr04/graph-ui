import * as d3 from 'd3'
import { useEffect, useRef } from 'react'

export interface D3Graph {
    name: string
    vertices: D3Vertex[]
    edges: D3Edge[]
    edgeType: 'line' | 'arrow'
}

export interface D3Vertex extends d3.SimulationNodeDatum {
    id: number | string
    radius: number
}

export interface D3Edge extends d3.SimulationLinkDatum<D3Vertex> { }

interface GraphSimulationProps {
    graphs: D3Graph[]
}

/**
 * Simulated force-graph renderer.
 *
 * Adapted from https://reactfordataviz.com/articles/force-directed-graphs-with-react-and-d3v7/
 */
const GraphSimulation = (props: GraphSimulationProps) => {
    const svgRef = useRef<SVGSVGElement>(null)

    useEffect(() => {
        if (svgRef.current === null || props.graphs.length === 0) return

        const simulations = props.graphs.map((graph, i) => {
            const vertices = [...graph.vertices]
            const edges = [...graph.edges]
            return {
                i,
                graph,
                simulation: d3.forceSimulation<D3Vertex, D3Edge>(vertices)
                    .force('center', d3.forceCenter(0, 0).strength(0.1))
                    .force('charge', d3.forceManyBody().strength(-500))
                    .force('collision', d3.forceCollide(node => node.radius * 1.5))
                    .nodes(vertices)
                    .force('links', d3.forceLink<D3Vertex, D3Edge>(edges).id(vertex => vertex.id).links(edges))
            }
        })

        const colorScale = d3.scaleOrdinal(simulations.map(({ i }) => i), d3.schemeCategory10)

        for (const { i, graph, simulation } of simulations) {
            simulation.alpha(0.1).restart()

            simulation.on('tick', () => {
                const nodes = simulation.nodes()
                const links = simulation.force<d3.ForceLink<D3Vertex, D3Edge>>('links')?.links()
                drawSimulatedGraph(i, [...nodes], links === undefined ? [] : [...links], graph.edgeType, colorScale(i))
            })
        }

        return () => {
            for (const { simulation } of simulations) {
                simulation.stop()
            }
        }
    }, [props.graphs])

    const arrowTipSize = 6

    function drawSimulatedGraph(id: number, v: D3Vertex[], e: D3Edge[], edgeType: D3Graph['edgeType'], colorCode: string) {
        if ((svgRef.current == null) === null) return

        const svg = d3.select(svgRef.current)

        svg.select(`#nodes-${id}`).selectAll<SVGCircleElement, D3Vertex>('circle')
            .data(v)
            .join('circle')
            .attr('cx', u => u.x!)
            .attr('cy', u => u.y!)
            .attr('r', u => u.radius)
            .attr('stroke', colorCode)
            .attr('fill', 'white')

        svg.select(`#nodes-${id}`).selectAll<SVGTextElement, D3Vertex>('text')
            .data(v)
            .join('text')
            .text(u => u.id)
            // hack: center text inside circle
            .attr('x', u => u.x! - u.radius / 2)
            .attr('y', u => u.y! + u.radius / 2)
            .attr('font-size', 'small')
            .attr('fill', 'black')

        /**
         * @param source Source vertex
         * @param target Target vertex
         * @returns The coordinate where a line drawn from the source vertex intersects with the border of the target vertex.
         */
        function intersectionWithCircle(source: D3Vertex, target: D3Vertex): { x: number, y: number } {
            if (source.x === undefined || source.y === undefined || target.x === undefined || target.y === undefined) return { x: -99, y: -99 }
            const distanceCenter = Math.sqrt(Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2))
            const distanceBorder = distanceCenter - target.radius - arrowTipSize / 2
            const ratio = distanceBorder / distanceCenter
            const deltaX = (target.x - source.x) * ratio
            const deltaY = (target.y - source.y) * ratio
            return { x: source.x + deltaX, y: source.y + deltaY }
        }

        svg.select('#links-' + id).selectAll<SVGLineElement, D3Edge>('line')
            .data(e)
            .join('line')
            .attr('x1', e => (e.source as D3Vertex).x!)
            .attr('y1', e => (e.source as D3Vertex).y!)
            .attr('x2', e => intersectionWithCircle(e.source as D3Vertex, e.target as D3Vertex).x)
            .attr('y2', e => intersectionWithCircle(e.source as D3Vertex, e.target as D3Vertex).y)
            .attr('stroke', 'black')
            .attr('strokeWidth', 2)
            .attr('marker-end', () => edgeType === 'arrow' ? 'url(#arrowTip)' : '')
    }

    const svgBoundingRect = svgRef.current !== null ? {
        w: svgRef.current.getBoundingClientRect().width / 2,
        h: svgRef.current.getBoundingClientRect().height / 2
    } : { w: 0, h: 0 }

    return (
        <svg width="100%" height="100%" ref={svgRef} viewBox={`-${svgBoundingRect.w} -${svgBoundingRect.h} ${svgBoundingRect.w * 2} ${svgBoundingRect.h * 2}`}>
            <defs>
                <marker id="arrowTip" viewBox="0 0 10 10" refX="5" refY="5"
                    markerWidth={arrowTipSize} markerHeight={arrowTipSize}
                    orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" />
                </marker>
            </defs>

            {
                props.graphs.map((_, i) => (
                    <>
                        <g id={`links-${i}`}></g>
                        <g id={`nodes-${i}`}></g>
                    </>
                ))
            }

        </svg>
    )
}

export default GraphSimulation
