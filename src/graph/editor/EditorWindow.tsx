import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { AdjacencyGraph } from '../../core/AdjacencyGraph'
import './EditorWindow.css'
import { GraphEditor } from '../../core/GraphEditor'

interface DotParserSyntaxError extends Error {
    message: string
    expected: Array<{ type: 'literal', text: 'string' }> | null
    location: { start: { line: number, column: number } }
}

export interface EditorWindowProps {
    editor: GraphEditor
    onInputGraphs: (graphs: AdjacencyGraph[]) => void
}

const EditorWindow = ({ editor, onInputGraphs, ...props }: EditorWindowProps): JSX.Element => {
    // TODO textLines: {content: string, indentation: number, selected: bool}
    const [text, setText] = useState(localStorage.getItem('graphui.editor.codeInput') ?? '')
    const [parseError, setParseError] = useState<DotParserSyntaxError>()
    const textAreaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (text.trim().length === 0) {
            onInputGraphs([])
            setParseError(undefined)
            return
        }

        try {
            onInputGraphs(editor.parseInput(text))
            setParseError(undefined)
        } catch (e) {
            setParseError(e as DotParserSyntaxError)
        }
    }, [editor, text, onInputGraphs])

    function handleChangeText (event: ChangeEvent<HTMLTextAreaElement>): void {
        setText(event.target.value)
        localStorage.setItem('graphui.editor.codeInput', event.target.value)
    }

    function handleKeyDown (event: KeyboardEvent<HTMLTextAreaElement>): void {
        switch (event.key) {
            case 'Tab':
                event.preventDefault()
                break
        }
    }

    return (
        <>
            <div id="editor-wrapper">
                <textarea className={`lh-copy ba bw1 ${(parseError != null) ? 'b--dashed b--red' : 'b--black'}`}
                    placeholder="Enter graph specification..."
                    cols={80} rows={48} autoComplete="off" tabIndex={-1}
                    ref={textAreaRef}
                    value={text}
                    onChange={handleChangeText}
                    onKeyDown={handleKeyDown}
                ></textarea>

                <div>
                    {parseError !== undefined &&
                        <pre style={{ whiteSpace: 'pre-wrap' }}>{parseError.message}</pre>}
                </div>
            </div>
        </>
    )
}

export default EditorWindow
