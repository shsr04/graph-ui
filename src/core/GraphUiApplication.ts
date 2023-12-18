import { GraphEditor } from './GraphEditor'
import { RandomGraphGenerator } from './RandomGraphGenerator'

export class GraphUiApplication {
    constructor (
        public readonly editor: GraphEditor,
        public readonly generator: RandomGraphGenerator
    ) {
        this.editor = editor
        this.generator = generator
    }
}
