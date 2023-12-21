import { checkPlanarity } from './Planarity'
import { AdjacencyGraph } from '../AdjacencyGraph'

xdescribe(checkPlanarity.name, () => {
    it('should classify planar graphs', () => {
        const adj = new Map([
            [0, [1]],
            [1, [2]],
            [2, [3]],
            [3, [0, 1]]
        ])
        const g = new AdjacencyGraph(0, 'input', false, adj)

        const result = checkPlanarity(g)

        expect(result).toBeTrue()
    })
})
