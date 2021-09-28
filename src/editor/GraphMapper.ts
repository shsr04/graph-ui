import * as d3 from 'd3'
import { EdgeStmt, Graph as DotGraph, NodeId, NodeStmt } from 'dotparser'

/**
 * A graph is a pair (V,E) such that E = {(u,v) : u,v in V}.
 * This graph representation uses an adjacency map to store the vertices and edges.
 * The graph is either directed or undirected.
 */
export class Graph<IdType = string> {
    constructor (
        /**
     * Index of the graph over all stored graphs.
     */
        public readonly index: number,
        /**
         * Display name.
         */
        public readonly name: string,
        /**
         * True if the graph is directed (= digraph), false if the graph is undirected.
         */
        public readonly directed: boolean,
        /**
         * Adjacency map.
         * For each vertex in the graph, stores the list of adjacent vertices.
         */
        public readonly internalAdjMap: Map<IdType, IdType[]>
    ) {
        this.index = index
        this.name = name
        this.directed = directed
        this.internalAdjMap = internalAdjMap
    }

    public deg (u: IdType): number {
        const adj = this.internalAdjMap.get(u)
        if (adj === undefined) throw Error(`Vertex ${u} is not in graph ${this.name}.`)
        return this.internalAdjMap.get(u)?.length ?? -1
    }

    public adj (u: IdType, k: number): IdType {
        const adj = this.internalAdjMap.get(u)
        if (adj === undefined) throw Error(`Vertex ${u} is not in graph ${this.name}.`)
        if (k >= adj.length) throw Error(`Vertex ${u} has degree ${adj.length}: therefore, cannot access neighbour #${k}.`)
        return adj[k]
    }
}

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

        // self-edges are only allowed in digraphs
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
