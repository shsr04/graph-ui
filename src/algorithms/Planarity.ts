import { dfs } from './Dfs'
import { Graph } from './Graph'

class ComplexMap<T, U> {
    private readonly map = new Map<string, U>()

    set (key: T, value: U): this {
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

export function checkPlanarity<T> (g: Graph<T>): void {
    if (g.directed) {
        throw Error('Planarity check is not implemented for directed graphs')
    }

    if (g.order() > 2 && g.size() > 3 * g.order() - 6) {
        console.log('--- The input graph is not planar. ---')
        return
    }

    type EdgeType = 'tree' | 'back'
    interface TreeAdj {
        target: T
        type: EdgeType
    }
    const tree = new Map<T, TreeAdj[]>()

    const d = new ComplexMap<T, number>()
    let di = 0

    const lowpt = new ComplexMap<[T, number], number>()
    const lowpt2 = new ComplexMap<[T, number], number>()
    const nestingDepth = new ComplexMap<[T, number], number>()

    dfs(g, {
        preprocess: u => {
            d.set(u, di++)
        },
        preexplore: (u, k, c, parent) => {
            lowpt.set([u, k], d.extract(u))
            lowpt2.set([u, k], d.extract(u))

            const v = g.adj(u, k)
            if (c === 'white') {
                tree.set(u, [...(tree.get(u) ?? []), { target: v, type: 'tree' }])
                return
            }

            tree.set(u, [...(tree.get(u) ?? []), { target: v, type: 'back' }])
            lowpt.set([u, k], d.extract(v))

            // set nesting depth
            if (lowpt2.extract([u, k]) < d.extract(v)) {
                // back edge (u,v) is chordal, needs to be nested deeper
                nestingDepth.set([u, k], 2 * lowpt.extract([u, k]) + 1)
            } else {
                nestingDepth.set([u, k], 2 * lowpt.extract([u, k]))
            }

            if (parent == null) {
                return
            }

            // find edge index from parent to u
            let parentEdge: number | null = null
            g.neighbours(parent).forEach((w, i) => {
                if (w === u) {
                    parentEdge = i
                }
            })
            if (parentEdge === null) throw Error(`INTERNAL ERROR: parent edge index ${JSON.stringify(parent)} -> ${JSON.stringify(u)} not found`)

            // update lowpt of parent edge
            const p: [T, number] = [parent, parentEdge]
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

    console.log(lowpt, lowpt2, nestingDepth)

    // TODO test
}
