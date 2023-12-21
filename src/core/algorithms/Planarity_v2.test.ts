import { checkPlanarity } from './Planarity_v2'
import { AdjacencyGraph } from '../AdjacencyGraph'

describe(checkPlanarity.name, () => {
    it('should classify planar graphs', () => {
        const adj = new Map([
            ['a', ['b', 'c', 'd', 'e']],
            ['b', ['a', 'c']],
            ['c', ['a', 'b', 'd']],
            ['d', ['a', 'c', 'e']],
            ['e', ['a', 'd']]
        ])
        const g = new AdjacencyGraph(0, 'input', false, adj)

        const result = checkPlanarity(g)

        expect(result).toBeTrue()
    })
})
