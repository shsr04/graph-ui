import * as d3 from 'd3'
import { EdgeStmt, Graph as DotGraph, NodeId, NodeStmt } from 'dotparser'

export interface Graph<IdType = string> {
    adj: Map<IdType, IdType[]>
    directed: boolean
    name: string
}

export class EdgeWithInvalidVertexError extends Error {
    message = 'Cannot make an edge from/to a vertex with an unknown ID.'

    constructor (
        public id: string
    ) {
        super()
    }
}

export function mapToGraph (g: DotGraph): Graph {
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

    const result: Graph = {
        adj: new Map(),
        directed: g.type === 'digraph',
        name: g.id?.toString() ?? ''
    }

    // add predefined vertices
    for (const vertex of vertices) {
        result.adj.set(vertex, [])
    }

    // add edges between vertices
    for (const edge of edges) {
        // add vertices on the fly for the edge
        if (!result.adj.has(edge[0])) result.adj.set(edge[0], [])
        if (!result.adj.has(edge[1])) result.adj.set(edge[1], [])
        const sourceAdj = result.adj.get(edge[0]) ?? []
        const targetAdj = result.adj.get(edge[1]) ?? []
        // self-edges are only allowed in digraphs
        if (edge[0] !== edge[1] || g.type === 'digraph') { sourceAdj.push(edge[1]) }
        // if G is a graph, add the reverse edge
        if (g.type === 'graph') { targetAdj.push(edge[0]) }
        result.adj.set(edge[0], sourceAdj)
        result.adj.set(edge[1], targetAdj)
    }

    // if G is a graph, discard duplicate edges
    if (g.type === 'graph') {
        result.adj = new Map(d3.map(result.adj.entries(), ([vertex, adjList]) => ([vertex, Array.from(new Set(adjList))])))
    }

    return result
}
