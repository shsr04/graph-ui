import * as d3 from 'd3'
import parseDot, { Graph as DotGraph } from 'dotparser'
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Graph } from '../algorithms/Graph'
import './EditorWindow.css'
import { mapToGraph } from './GraphMapper'

interface DotParserSyntaxError extends Error {
    message: string
    expected: Array<{ type: 'literal', text: 'string' }> | null
    location: { start: { line: number, column: number } }
}

export interface EditorWindowProps {
    onInputGraphs: (graphs: Graph[]) => void
}

const EditorWindow = ({ onInputGraphs, ...props }: EditorWindowProps): JSX.Element => {
    // TODO textLines: {content: string, indentation: number, selected: bool}
    const [text, setText] = useState(localStorage.getItem('graphui.editor.codeInput') ?? '')
    const [parseResult, setParseResult] = useState<DotGraph[]>()
    const [parseError, setParseError] = useState<DotParserSyntaxError>()
    const textAreaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        try {
            setParseResult(parseDot(text))
            setParseError(undefined)
        } catch (e) {
            setParseError(e as DotParserSyntaxError)
            setParseResult(undefined)
        }
    }, [text])

    useEffect(() => {
        if (parseResult === undefined) return
        onInputGraphs(parseResult.map(mapToGraph))
    }, [parseResult, onInputGraphs])

    const lineNumbers = d3.range(1, 100).map(n => <span key={n}>{n}<br /></span>)

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
                <label className="full-width">
                    Enter graph specification here. Supports a subset of <a href="https://www.graphviz.org/doc/info/lang.html">DOT syntax</a>. (Subgraphs, attributes and ports are not supported.)
                </label>
                <div id="line-numbers">{lineNumbers}</div>
                <textarea placeholder="Enter graph specification..."
                    cols={80} rows={48} autoComplete="off" tabIndex={-1}
                    ref={textAreaRef}
                    value={text}
                    onChange={handleChangeText}
                    onKeyDown={handleKeyDown}
                    style={{
                        border: (parseError != null) ? '2px dashed red' : '2px solid black'
                    }}
                ></textarea>

                {parseError !== undefined && <div className="full-width">
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{parseError.message}</pre>
                </div>}
            </div>
        </>
    )
}

export default EditorWindow
