import { dfs } from "./Dfs";
import { Graph } from "./Graph"

export function checkPlanarity<T>(g: Graph<T>): void {
    if (g.directed) {
        throw Error("Planarity check is not implemented for directed graphs")
    }

    const d = new Map<T, number>();
    let di = 0

    type EdgeType = "tree" | "back"
    interface TreeAdj { 
        target: T
        type: EdgeType
    }
    const tree = new Map<T, TreeAdj[]>();

    dfs(g, {
        preprocess: u => {
            d.set(u, di++)
        },
        preexplore: (u, k, c) => {
            const v = g.adj(u, k)
            if (c === "white") {
                tree.set(u, [...(tree.get(u) ??[]), { target: v, type: "tree" }])
            } else {
                tree.set(u, [...(tree.get(u) ??[]), { target: v, type: "back" }])
            }
        }
    })

    // TODO LR partitioning
}