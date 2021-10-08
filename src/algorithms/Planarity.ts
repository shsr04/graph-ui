import { dfs } from './Dfs'
import { Graph } from './Graph'

class ComplexMap<T, U> extends Map<T, U> {
    private readonly map = new Map<string, U>()

    set(key: T, value: U): this {
        this.map.set(JSON.stringify(key), value)
        return this
    }

    get (key: T): U | undefined {
        return this.map.get(JSON.stringify(key))
    }

    extract (key: T): U {
        const result = this.get(key)
        if (result === undefined) {
            throw Error(`Extraction error: no value for key ${JSON.stringify(key)}`)
        }
        return result
    }
}

export function checkPlanarity<T>(g: Graph<T>): void {
    if (g.directed) {
        throw Error('Planarity check is not implemented for directed graphs')
    }

    if (g.order() > 2 && g.size() > 3 * g.order() - 6) {
        console.log('--- The input graph is not planar. ---')
        return
    }

    

    const height = new ComplexMap<T, number>()
    const lowpt = new ComplexMap<[T, number], number>()
    const lowpt2 = new ComplexMap<[T, number], number>()
    const nestingDepth = new ComplexMap<[T, number], number>()

    computeNestingDepth(g, height, lowpt, lowpt2, nestingDepth)

    console.log("Phase 1:", lowpt, lowpt2, nestingDepth)



    // TODO test
}

function computeNestingDepth<T>(g: Graph<T>, height: ComplexMap<T,number>, lowpt: ComplexMap<[T, number], number>, lowpt2: ComplexMap<[T, number], number>, nestingDepth: Map<[T, number], number>): void {
    type EdgeType = 'tree' | 'back'
    interface TreeAdj {
        target: T
        type: EdgeType
    }
    const tree = new Map<T, TreeAdj[]>()

    dfs(g, {
        preprocess: (u, parent) => {
            height.set(u, parent === null ? 0 : height.extract(parent) + 1)
        },
        preexplore: (u, k, c, parent) => {
            lowpt.set([u, k], height.extract(u))
            lowpt2.set([u, k], height.extract(u))

            const v = g.adj(u, k)
            if (c === 'white') {
                tree.set(u, [...(tree.get(u) ?? []), { target: v, type: 'tree' }])
                return
            }

            tree.set(u, [...(tree.get(u) ?? []), { target: v, type: 'back' }])
            lowpt.set([u, k], height.extract(v))

            // set nesting depth
            if (lowpt2.extract([u, k]) < height.extract(v)) {
                // back edge (u,v) is chordal, needs to be nested deeper
                nestingDepth.set([u, k], 2 * lowpt.extract([u, k]) + 1)
            } else {
                nestingDepth.set([u, k], 2 * lowpt.extract([u, k]))
            }

            if (parent == null) {
                return
            }

            // update lowpt of parent edge
            const p: [T, number] = [parent, g.index(parent, u)]
            if (lowpt.extract([u, k]) < lowpt.extract(p)) {
                lowpt2.set(p, Math.min(lowpt.extract(p), lowpt2.extract([u, k])))
                lowpt.set(p, lowpt.extract([u, k]))
            } else if (lowpt.extract([u, k]) > lowpt.extract(p)) {
                lowpt2.set(p, Math.min(lowpt2.extract(p), lowpt.extract([u, k])))
            } else {
                lowpt2.set(p, Math.min(lowpt2.extract(p), lowpt2.extract([u, k])))
            }
        }
    })
}

function checkLRPartition<T>(g: Graph<T>, u: T, nestingDepth: ComplexMap<[T,number], number>): void {
    type ConflictItem = [T,number]
    interface ConflictPair {
        left: ConflictItem
        right: ConflictItem
    }
    const conflictStack: ConflictItem[] = []
    const stackMarkers = new Map<[T, number], ConflictItem>()
    const sortedEdges = Array.from(Array(g.deg(u)).keys()).sort((x, y) => nestingDepth.extract([u,x]) - nestingDepth.extract([u,y]))
    for(const k of sortedEdges) {
        // TODO continue
    }
}
