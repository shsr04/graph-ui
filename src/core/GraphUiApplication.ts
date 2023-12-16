import { GraphEditor } from './GraphEditor'
import { RandomGraphGenerator } from './RandomGraphGenerator'

export class GraphUiApplication {
    public readonly editor: GraphEditor
    public readonly generator: RandomGraphGenerator

    public constructor (editor: GraphEditor, generator: RandomGraphGenerator) {
        this.editor = editor
        this.generator = generator
    }
}
