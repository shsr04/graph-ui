import { Colour, dfs } from './Dfs'
import { Graph } from './Graph'

class ComplexMap<T, U> extends Map<T, U> {
    private readonly map = new Map<string, U>()

    set(key: T, value: U): this {
        this.map.set(JSON.stringify(key), value)
        return this
    }

    get(key: T): U | undefined {
        return this.map.get(JSON.stringify(key))
    }

    extract(key: T): U {
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

    const height: ComplexMap<T, number> = new ComplexMap()
    const lowpt: ComplexMap<[T, number], number> = new ComplexMap()
    const lowpt2: ComplexMap<[T, number], number> = new ComplexMap()
    const nestingDepth: ComplexMap<[T, number], number> = new ComplexMap()

    computeNestingDepth(g, height, lowpt, lowpt2, nestingDepth)
    console.log('Phase 1:', lowpt, lowpt2, nestingDepth)

    const conflictStack: Array<ConflictPair<T>> = []
    const stackBottom: Map<[T, number], ConflictPair<T> | null> = new Map()

    checkLRPartition(g, nestingDepth, height, lowpt, conflictStack, stackBottom)

    // TODO test
}

function computeNestingDepth<T>(g: Graph<T>, height: ComplexMap<T, number>, lowpt: ComplexMap<[T, number], number>, lowpt2: ComplexMap<[T, number], number>, nestingDepth: Map<[T, number], number>): void {
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

interface EdgeInterval<T> {
    low?: [T, number]
    high?: [T, number]
}
interface ConflictPair<T> {
    left?: EdgeInterval<T>
    right?: EdgeInterval<T>
}

function getLowestPoint<T>(pair: ConflictPair<T>, lowpt: ComplexMap<[T, number], number>): number {
    const left = pair.left
    const right = pair.right
    if (left === undefined && right !== undefined) {
        if (right.low === undefined) throw Error('INTERNAL ERROR: Right low edge is empty')
        return lowpt.extract(right.low)
    }
    if (right === undefined && left !== undefined) {
        if (left.low === undefined) throw Error('INTERNAL ERROR: Left low edge is empty')
        return lowpt.extract(left.low)
    }
    if (left === undefined || left.low === undefined || right === undefined || right.low === undefined) throw Error('INTERNAL ERROR: Conflict pair or lower edges are empty')
    return Math.min(lowpt.extract(left.low), lowpt.extract(right.low))
}

function isConflicting<T>(interval?: EdgeInterval<T>, edge: [T,number], lowpt: ComplexMap<[T, number], number>): boolean {
    // high must be set? If not, what should be returned?
    if(interval?.high === undefined) return false
    return lowpt.extract(interval.high) > lowpt.extract(edge)
}

function checkLRPartition<T>(g: Graph<T>, nestingDepth: ComplexMap<[T, number], number>, height: ComplexMap<T, number>, lowpt: ComplexMap<[T, number], number>, conflictStack: Array<ConflictPair<T>>, stackBottom: ComplexMap<[T, number], ConflictPair<T> | null>): void {
    const colour: ComplexMap<T, Colour> = new ComplexMap(g.vertices().map(x => [x, 'white']))
    // For each edge e, stores the first return edge f to its lowpoint u with lowpt(e) = height(u)
    const lowptEdge: ComplexMap<[T, number], [T, number]> = new ComplexMap()
    // For each edge e, stores the orientation
    const side: ComplexMap<[T, number], -1 | 1> = new ComplexMap()
    // For each edge e, stores a reference to the highest edge of the next conflict pair
    const ref: ComplexMap<[T, number], [T, number]> = new ComplexMap()

    /**
     * Checks the LR partitioning of the graph.
     * @param u Current vertex
     * @param parent Parent vertex
     * @returns The planarity status of the graph. 
     * If true, the graph is planar. 
     * If false, the graph is not planar. 
     * If null, the algorithm was inconclusive. This should never happen and indicates an implementation error.
     */
    function visit(u: T, parent: T | null): boolean | null {
        colour.set(u, 'grey')
        const sortedEdges = Array.from(Array(g.deg(u)).keys()).sort((x, y) => nestingDepth.extract([u, x]) - nestingDepth.extract([u, y]))
        for (const k of sortedEdges) {
            const e: [T, number] = [u, k]
            stackBottom.set(e, conflictStack[conflictStack.length - 1] ?? null)

            const v = g.adj(u, k)
            // If e is a tree edge, recursively determine constraints
            if (colour.extract(v) === 'white') {
                const result = visit(v, u)
                if (result !== null) return result
            }
            // If e is a back edge, push it onto the conflict stack for later consideration
            else {
                lowptEdge.set(e, e)
                // Partitioning Invariant: The conflict pairs P[...] accumulated between exploring a tree edge u->v and backtracking over it satisfy all the LR constraints associated with u->v.
                conflictStack.push({ right: { low: e, high: e } })
            }

            if (parent === null) throw Error(`INTERNAL ERROR: parent of ${JSON.stringify(u)} is null`)
            const pe: [T, number] = [parent, g.index(parent, u)]
            // If e has a return edge, integrate it into the LR constraints
            if (lowpt.extract(e) < height.extract(u)) {
                const e0: [T, number] = [u, sortedEdges[0]]
                // If we are in the first outgoing edge e0, we leave it on the stack
                if (e[1] === e0[1]) {
                    lowptEdge.set(pe, lowptEdge.extract(e0))
                } else {
                    // For all other outgoing edges e1,...,ek, we merge their constraints into those collected for e
                    const pair: ConflictPair<T> = {}
                    mergeIntoRightInterval(pair, e, pe)
                    mergeIntoLeftInterval(pair, e)
                    if(pair.left !== undefined || pair.right !== undefined) {
                        conflictStack.push(pair)
                    }
                }
            }

            if (parent == null) {
                return null
            }

            // Remove the back edges which end at parent from the stack
            while (conflictStack.length > 0 && getLowestPoint(conflictStack[conflictStack.length - 1], lowpt) === height.extract(parent)) {
                const top = conflictStack.pop()
                if (top?.left?.low !== undefined) {
                    side.set(top.left.low, -1)
                }
            }

            if (conflictStack.length === 0) {
                return null
            }

            const top = conflictStack[conflictStack.length - 1]
            conflictStack.pop()
            // Trim left interval
            if(top.left === undefined) throw Error(`INTERNAL ERROR: left interval of ${JSON.stringify(top)} is empty`)
            while(top.left.high !== undefined && g.adj(...top.left.high) === parent) {
                top.left.high = ref.extract(top.left.high)
            }

            // TODO continue
        }
        colour.set(u, 'black')
        return null
    }

    /**
     * Merges the constraints of return edges above e into the right interval of the given conflict pair.
     */
    function mergeIntoRightInterval(pair: ConflictPair<T>, e: [T,number], pe: [T, number]) {
        while (true) {
            // Ordering Invariant: For any two conflict pairs P,Q where P is above Q in the stack, there exists no edge e in P such that lowpt(e) < lowpt(f) where edge f is in Q.
            const top = conflictStack.pop()
            if (top === undefined) throw Error('INTERNAL ERROR: Conflict stack is empty')
            if (top.left !== undefined) {
                const tmp = top.right
                top.right = top.left
                top.left = tmp
            }
            // If conflict pair has no non-empty intervals, there is a conflict. Therefore, the graph is not planar.
            if (top.left !== undefined) {
                console.log('--- Graph is not planar. ---')
                return false
            }

            // Merge to the right side because of "same" constraints on all return edges
            if (top.right === undefined || top.right.low === undefined || top.right.high === undefined) throw Error(`INTERNAL ERROR: Top conflict pair ${JSON.stringify(top)} is not non-empty`)
            if (lowpt.extract(top.right.low) > lowpt.extract(pe)) {
                if (pair.right === undefined) {
                    pair.right = { high: top.right.high }
                } else {
                    if (pair.right.low === undefined) throw Error(`INTERNAL ERROR: Right low edge of ${JSON.stringify(pair)} is empty`)
                    ref.set(pair.right.low, top.right.high)
                }
                pair.right = { ...pair.right, low: top.right.low }
            } else {
                ref.set(top.right.low, lowptEdge.extract(pe))
            }

            // If we have merged all edges in the stack above e, go to next step
            if (JSON.stringify(conflictStack[conflictStack.length - 1]) === JSON.stringify(stackBottom.extract(e))) {
                break
            }
        }
    }

    function mergeIntoLeftInterval(pair: ConflictPair<T>, e: [T,number]) {
        const top = conflictStack[conflictStack.length - 1]
        while(isConflicting(top.left, e, lowpt) || isConflicting(top.right, e, lowpt)) {
            conflictStack.pop()
            if(isConflicting(top.right, e, lowpt)) {
                const tmp = top.right; top.left = top.right; top.right = tmp
            }
            if(isConflicting(top.right, e, lowpt)) {
                console.log(`Graph is not planar due to conflict: ${JSON.stringify(top)}`)
                return false
            }

            if(pair.right?.low === undefined || top.right?.high === undefined) throw Error(`INTERNAL ERROR: cannot merge empty right intervals of ${JSON.stringify(pair)} and ${JSON.stringify(top)}`)
            ref.set(pair.right?.low, top.right?.high)
            if(top.right.low !== undefined) {
                pair.right.low = top.right.low
            }

            if(top.left?.high === undefined) throw Error(`INTERNAL ERROR: top left interval of ${JSON.stringify(top)} is empty`)
            if(pair.left === undefined) {
                pair.left = { high: top.left.high }
            } else {
                if(pair.left.low === undefined) throw Error(`INTERNAL ERROR: low left interval of ${JSON.stringify(pair)} is empty`)
                ref.set(pair.left.low, top.left.high)
            }
            pair.left.low = top.left.high
        }
    }

    for (const u of g.vertices()) {
        if (height.extract(u) > 0) {
            continue
        }

        visit(u, null)
    }
}
