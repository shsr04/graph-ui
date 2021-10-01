import * as d3 from 'd3'
import { EdgeStmt, Graph as DotGraph, NodeId, NodeStmt } from 'dotparser'
import { Graph } from '../algorithms/Graph'

export class EdgeWithInvalidVertexError extends Error {
    message = 'Cannot make an edge from/to a vertex with an unknown ID.'

    constructor (
        public id: string
    ) {
        super()
    }
}

export function mapToGraph (g: DotGraph, i: number): Graph {
    const vertices = g.children
        .filter(child => child.type === 'node_stmt')
        .map(u => (u as NodeStmt).node_id.id.toString())
    const edges = g.children
        .filter(child => child.type === 'edge_stmt')
        .map(e => (e as EdgeStmt)
            // edge_list is an array of targets
            .edge_list
            // keep only NodeIds
            .filter(target => target.type === 'node_id')
            // map NodeIds to their string representations
            .map(u => (u as NodeId).id.toString())
        )
        // map edge lists to pairs
        .flatMap(e => d3.pairs(e))

    let adj = new Map()

    // add predefined vertices
    for (const vertex of vertices) {
        adj.set(vertex, [])
    }

    // add edges between vertices
    for (const edge of edges) {
        // if vertex is not yet defined, add it on the fly
        const sourceAdj = adj.get(edge[0]) ?? []
        const targetAdj = adj.get(edge[1]) ?? []

        // loops (self-edges) are only allowed in digraphs
        if (edge[0] !== edge[1] || g.type === 'digraph') { sourceAdj.push(edge[1]) }
        // if G is a graph, add the reverse edge
        if (g.type === 'graph') { targetAdj.push(edge[0]) }

        adj.set(edge[0], sourceAdj)
        adj.set(edge[1], targetAdj)
    }

    // if G is a graph, discard duplicate edges
    if (g.type === 'graph') {
        adj = new Map(d3.map(adj.entries(), ([vertex, adjList]) => ([vertex, Array.from(new Set(adjList))])))
    }

    return new Graph(i, g.id?.toString() ?? '', g.type === 'digraph', adj)
}
