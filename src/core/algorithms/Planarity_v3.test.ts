import { checkPlanarity } from './Planarity_v3'
import { GraphEditorDotImpl } from '../../adapters/GraphEditorDotImpl'

describe('Planarity v3', () => {
    it('should classify planar graphs', () => {
        const g = new GraphEditorDotImpl().parseInput(`graph test {
            a -- b -- c -- d -- e -- a
            d -- f -- g -- d
        }`)[0]
        const result = checkPlanarity(g)

        expect(result).toBeTrue()
    })
})
