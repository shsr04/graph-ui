import { Graph } from './Graph'

export class RandomGraphGenerator {
    /**
     * Generates a random graph.
     * @param n Order of the graph
     * @param p Probability that two vertices (u,v) are connected by an edge.
     * @param graphId Unique ID for the graph
     * @param vertexIdGenerator Function which generates a unique vertex ID from the given integer
     */
    public generateGraph<T>(n: number, p: number, graphId: number, vertexIdGenerator: (i: number) => T): Graph<T> {
        const directed = false

        let adjMap = new Map<T, T[]>(Array.from(Array(n).keys()).map(i => [vertexIdGenerator(i), []]))

        for (const u of Array.from(adjMap.keys())) {
            for (const v of Array.from(adjMap.keys())) {
                if (Math.random() > 1 - p) {
                    const sourceAdj = adjMap.get(u) ?? []
                    const targetAdj = adjMap.get(v) ?? []
                    adjMap.set(u, [...sourceAdj, v])
                    adjMap.set(v, [...targetAdj, u])
                }
            }
        }

        // if G is a graph, discard duplicate edges
        if (!directed) {
            adjMap = new Map(
                Array.from(adjMap.entries())
                    .map(([u, adjList]) => ([
                        u,
                        Array.from(new Set(adjList.filter(v => u !== v)))
                    ]))
            )
        }

        return new Graph(graphId, 'random', directed, adjMap)
    }
}
