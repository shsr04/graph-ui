import { includes, range, some } from "lodash";
import { dfs } from "./Dfs";
import { Graph } from "./Graph";

export function decomposeBipartite<T>(g: Graph<T>): (T[][] | null) {
    // A graph is bipartite if and only if it contains no odd cycle.
    let hasOddCycle = false
    const partitions: T[][] = range(0, 2).map((_) => ([]))
    const branch: T[] = []
    dfs(g, {
        preprocess: (u) => {
            branch.push(u)
        },
        preexplore: (_u, _k, c) => {
            if (c !== 'white') {
                // If G is undirected, we need to exclude the edge to the parent
                if (!g.directed && g.adj(_u, _k) === branch[branch.length - 2]) {
                    return
                }
                const cycle = branch.slice(branch.indexOf(g.adj(_u, _k)))
                // A cycle cannot have less than 3 edges
                if (cycle.length < 3) {
                    return
                }
                const segments = [cycle.filter((_, i) => i % 2 === 0), cycle.filter((_, i) => i % 2 === 1)]
                // seed partitions
                // TODO ???? !!!
                partitions[0]=segments[0]
                partitions[1]=segments[1]
                // insert into partitions
                for (let i = 0; i < partitions.length; i++) {
                    const partition = partitions[i];
                    for (const segment of segments) {
                        if (some(segment, u => includes(partition, u))) {
                            partitions[i] = Array.from(new Set([...partition, ...segment]))
                        }
                    }
                }
                if (cycle.length % 2 === 1) {
                    hasOddCycle = true
                }
            }
        },
        postprocess: () => {
            branch.pop()
        }
    })


    if (hasOddCycle) return null
    return partitions
}