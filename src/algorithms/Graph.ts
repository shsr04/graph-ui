import { getProperties, GraphProperties } from './GraphProperties'
import * as d3 from 'd3'

/**
 * A graph is a pair (V,E) such that E = {(u,v) : u,v in V}.
 * This graph representation uses an adjacency map to store the vertices and edges.
 * The graph is either directed or undirected.
 */
export class Graph<IdType = string> {
    public properties: GraphProperties

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
        this.properties = getProperties(this)
    }

    public deg (u: IdType): number {
        const adj = this.internalAdjMap.get(u)
        if (adj === undefined) { throw Error(`Vertex ${u} is not in graph ${this.name}.`) }
        return this.internalAdjMap.get(u)?.length ?? -1
    }

    public adj (u: IdType, k: number): IdType {
        const adj = this.internalAdjMap.get(u)
        if (adj === undefined) { throw Error(`Vertex ${u} is not in graph ${this.name}.`) }
        if (k >= adj.length) { throw Error(`Vertex ${u} has degree ${adj.length}: therefore, cannot access neighbour #${k}.`) }
        return adj[k]
    }

    public vertices (): IdType[] {
        return d3.map(this.internalAdjMap.keys(), x => x)
    }

    public neighbours (u: IdType): IdType[] {
        const adj = this.internalAdjMap.get(u)
        if (adj === undefined) { throw Error(`Vertex ${u} is not in graph ${this.name}.`) }
        return adj
    }
}
