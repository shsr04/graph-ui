import * as d3 from 'd3'
import { Simulation } from 'd3'
import { useEffect, useRef, useState } from 'react'

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

        const center = {
            x: svgRef.current.getBoundingClientRect().width / 2,
            y: svgRef.current.getBoundingClientRect().height / 2
        }

        const simulations = props.graphs.map((graph, i) => {
            const vertices = graph.vertices
            const edges = graph.edges
            return {
                i,
                graph,
                simulation: d3.forceSimulation<D3Vertex, D3Edge>(vertices)
                    .force('center', d3.forceCenter(center.x, center.y).strength(0.1))
                    .force('charge', d3.forceManyBody().strength(-100))
                    .force('collision', d3.forceCollide(node => node.radius * 1.5))
                    .nodes([...vertices])
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

    function drawSimulatedGraph (id: number, v: D3Vertex[], e: D3Edge[], edgeType: D3Graph['edgeType'], colorCode: string) {
        if ((svgRef.current == null) === null) return

        const svg = d3.select(svgRef.current)

        svg.select('#nodes-' + id).selectAll<SVGCircleElement, D3Vertex>('circle')
            .data(v)
            .join('circle')
            .attr('cx', u => u.x!)
            .attr('cy', u => u.y!)
            .attr('r', u => u.radius)
            .attr('stroke', colorCode)
            .attr('fill', 'white')

        svg.select('#links-' + id).selectAll<SVGLineElement, D3Edge>('line')
            .data(e)
            .join('line')
            .attr('x1', e => (e.source as D3Vertex).x!)
            .attr('y1', e => (e.source as D3Vertex).y!)
            .attr('x2', e => (e.target as D3Vertex).x!)
            .attr('y2', e => (e.target as D3Vertex).y!)
            .attr('stroke', 'black')
            .attr('strokeWidth', 2)
            .attr('marker-end', () => edgeType == 'arrow' ? 'url(#arrow)' : '')
    }

    return (
        <svg width="100%" height="100%" ref={svgRef}>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5"
                markerWidth="6" markerHeight="6"
                orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>

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
