import * as d3 from 'd3'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface Vertex extends d3.SimulationNodeDatum {
    id: number | string
    radius: number
}

export interface Edge extends d3.SimulationLinkDatum<Vertex> {}

interface UndirectedGraphProps {
    vertices: Vertex[]
    edges: Edge[]
    forceX?: d3.ForceX<Vertex>
    forceY?: d3.ForceY<Vertex>
}

/**
 * Undirected graph.
 *
 * Taken from https://reactfordataviz.com/articles/force-directed-graphs-with-react-and-d3v7/
 */
const UndirectedGraph = (props: UndirectedGraphProps) => {
    const [animatedVertices, setAnimatedVertices] = useState<Vertex[]>([])
    const [animatedEdges, setAnimatedEdges] = useState<Edge[]>([])

    const svgRef = useRef<SVGSVGElement>(null)

    useEffect(() => {
        const simulation = d3.forceSimulation<Vertex, Edge>(props.vertices)
            .force('center', d3.forceCenter(400, 300).strength(0.1))
            .force('charge', d3.forceManyBody().strength(-100))
            .force('collision', d3.forceCollide(node => node.radius * 1.5))
            .nodes([...props.vertices])
            .force('links', d3.forceLink<Vertex, Edge>(props.edges).id(vertex => vertex.id).links(props.edges))

        simulation.alpha(0.1).restart()

        simulation.on('tick', () => {
            setAnimatedVertices([...simulation.nodes()])
            const links = simulation.force<d3.ForceLink<Vertex, Edge>>('links')?.links()
            setAnimatedEdges(links !== undefined && links.length > 0 ? [...links] : [])
        })

        return () => {
            simulation.stop()
        }
    }, [props])

    const colorScale = d3.scaleOrdinal(props.vertices.map(u => u.id), d3.schemeCategory10)

    useEffect(() => {
        if (svgRef.current === null) return
        const svg = d3.select(svgRef.current)
        svg.selectAll<SVGCircleElement, Vertex>('circle')
            .data(animatedVertices)
            .join('circle')
            .attr('cx', u => u.x!)
            .attr('cy', u => u.y!)
            .attr('r', u => u.radius)
            .attr('stroke', u => colorScale(u.id))
            .attr('fill', 'transparent')
        svg.selectAll<SVGLineElement, Edge>('line')
            .data(animatedEdges)
            .join('line')
            .attr('x1', e => (e.source as Vertex).x!)
            .attr('y1', e => (e.source as Vertex).y!)
            .attr('x2', e => (e.target as Vertex).x!)
            .attr('y2', e => (e.target as Vertex).y!)
            .attr('stroke', 'black')
            .attr('strokeWidth', 2)
    }, [animatedVertices, animatedEdges, colorScale])

    const vertexShapes = animatedVertices.map(vertex => (
        <circle cx={vertex.x} cy={vertex.y} r={vertex.radius} key={vertex.id} stroke={colorScale(vertex.id)} fill="transparent" />
    ))

    const edgeShapes = animatedEdges.map(edge => (
        <line x1={(edge.source as Vertex).x} y1={(edge.source as Vertex).y} x2={(edge.target as Vertex).x} y2={(edge.target as Vertex).y} stroke="black" strokeWidth={2} key={edge.index} ></line>
    ))

    return (
        <svg width="100%" height="100%" ref={svgRef}></svg>
    )
}

export default UndirectedGraph
