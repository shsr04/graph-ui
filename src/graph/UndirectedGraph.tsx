import * as d3 from "d3";
import { useEffect, useState } from "react";

export interface Vertex extends d3.SimulationNodeDatum {
    id: number
    radius: number
}

export interface Edge extends d3.SimulationLinkDatum<Vertex> {

}

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
    const [animatedVertices, setAnimatedVertices] = useState<Vertex[]>([]);
    const [animatedEdges, setAnimatedEdges] = useState<Edge[]>([]);

    useEffect(() => {
        const simulation = d3.forceSimulation<Vertex, Edge>(props.vertices)
            .force("x", props.forceX ?? d3.forceX(400).strength(0.15))
            .force("y", props.forceY ?? d3.forceY(300).strength(0.15))
            .force("charge", d3.forceManyBody().strength(-150))
            .force("collision", d3.forceCollide(node => node.radius * 1.5))


        simulation.on("tick", () => {
            setAnimatedVertices([...simulation.nodes()])
            const links = simulation.force<d3.ForceLink<Vertex,Edge>>("links")?.links()
            setAnimatedEdges(links !== undefined ? [...links] : [])
        })

        simulation.nodes([...props.vertices])
        simulation.force("links", d3.forceLink<Vertex, Edge>(props.edges).id(vertex => vertex.id).links(props.edges))
        simulation.alpha(0.1).restart()

        return () => {
            simulation.stop()
        }
    }, [props])

    const vertexShapes = animatedVertices.map(vertex => (
        <circle cx={vertex.x} cy={vertex.y} r={vertex.radius} key={vertex.id} stroke="black" fill="transparent" />
    ))

    const edgeShapes = animatedEdges.map(edge => (
        <line x1={(edge.source as Vertex).x} y1={(edge.source as Vertex).y} x2={(edge.target as Vertex).x} y2={(edge.target as Vertex).y} stroke="black" strokeWidth={2} key={edge.index} ></line>
    ))

    return (
        <g>
            {vertexShapes}
            {edgeShapes}
        </g>
    );
}

export default UndirectedGraph;