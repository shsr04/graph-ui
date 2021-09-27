import { Graph as DotGraph, EdgeStmt, NodeId, NodeStmt } from 'dotparser'
import * as d3 from 'd3'

export interface Graph<IdType = string> {
    adj: Map<IdType, IdType[]>
    directed: boolean
    name: string
}

function * subsets<T> (array: T[], length: number, start = 0): Generator<Set<T>> {
    if (start >= array.length || length < 1) {
        yield new Set()
    } else {
        while (start <= array.length - length) {
            const first = array[start]
            const gen = subsets(array, length - 1, start + 1)
            while (true) {
                const subset = gen.next()
                subset.value.add(first)
                yield subset.value
                if (subset.done === true) break
            }
            start++
        }
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
        // self-edges are only allowed in digraphs
        if (edge[0] !== edge[1] || g.type === 'digraph') { result.adj.get(edge[0])!.push(edge[1]) }
        // if G is a graph, add the reverse edge
        if (g.type === 'graph') { result.adj.get(edge[1])!.push(edge[0]) }
    }

    // if G is a graph, discard duplicate edges
    if (g.type === 'graph') {
        result.adj = new Map(d3.map(result.adj.entries(), ([vertex, adjList]) => ([vertex, Array.from(new Set(adjList))])))
    }

    return result
}
