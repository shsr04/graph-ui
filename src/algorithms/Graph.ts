import { getProperties, GraphProperties } from './GraphProperties'

/**
 * A graph is a pair G=(V,E) such that E = {{u,v} : u,v in V; u != v}.
 * A directed graph ("digraph") is a pair G=(V,E) such that E = {(u,v) : u,v in V}.
 * Thus, a digraph is a graph which has directed edges and allows loops and double edges.
 */
export class Graph<IdType = string> {
    public properties: GraphProperties

    constructor (
        /**
         * Index of the graph over all stored graphs.
         */
        public readonly id: number,
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
        private readonly adjMap: Map<IdType, IdType[]>
    ) {
        this.id = id
        this.name = name
        this.directed = directed
        this.adjMap = adjMap
        this.properties = getProperties(this)
    }

    public deg (u: IdType): number {
        const adj = this.adjMap.get(u)
        if (adj === undefined) { throw Error(`Vertex ${JSON.stringify(u)} is not in graph ${this.name}.`) }
        return this.adjMap.get(u)?.length ?? -1
    }

    public adj (u: IdType, k: number): IdType {
        const adj = this.adjMap.get(u)
        if (adj === undefined) { throw Error(`Vertex ${JSON.stringify(u)} is not in graph ${this.name}.`) }
        if (k >= adj.length) { throw Error(`Vertex ${JSON.stringify(u)} has degree ${adj.length}: therefore, cannot access neighbour #${k}.`) }
        return adj[k]
    }

    public index (u: IdType, v: IdType): number {
        let result: number | null = null
        this.neighbours(u).forEach((w, i) => {
            if (w === v) {
                result = i
            }
        })
        if (result === null) throw Error(`Edge from ${JSON.stringify(u)} to ${JSON.stringify(v)} is not in graph ${this.name}.`)
        return result
    }

    public vertices (): IdType[] {
        return Array.from(this.adjMap.keys())
    }

    public order (): number {
        return this.vertices().length
    }

    public neighbours (u: IdType): IdType[] {
        const adj = this.adjMap.get(u)
        if (adj === undefined) { throw Error(`Vertex ${JSON.stringify(u)} is not in graph ${this.name}.`) }
        return adj
    }

    public edges (): Array<[IdType, IdType]> {
        return Array.from(this.adjMap.entries()).flatMap(([u, adjList]) => adjList.map<[IdType, IdType]>(v => ([u, v])))
    }

    public size (): number {
        if (this.directed) {
            return this.edges().length
        } else {
            return this.edges().length / 2
        }
    }

    public serialize (): any {
        return {
            id: this.id,
            name: this.name,
            directed: this.directed,
            adjacencyLists: Array.from(this.adjMap)
        }
    }

    public static fromJSON<T>(data: any): Graph<T> {
        if (!(typeof data === 'object' && typeof data.id === 'number' && typeof data.name === 'string' && typeof data.directed === 'boolean' && typeof data.adjacencyLists === 'object')) {
            throw Error('Invalid JSON graph data: ' + JSON.stringify(data))
        }
        return new Graph<T>(data.id, data.name, data.directed, new Map(data.adjacencyLists))
    }
}
