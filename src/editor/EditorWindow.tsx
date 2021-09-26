import * as d3 from "d3";
import parseDot, * as dotparser from "dotparser";
import { ChangeEvent, KeyboardEvent, useRef, useState } from "react";

interface DotParserSyntaxError extends Error {
    message: string
    expected: { type: "literal", text: "string" }[] | null
    location: { start: { line: number, column: number } }
}

export interface EditorWindowProps {
    onInputGraphs?: (graphs: dotparser.Graph[])=> void
}

const EditorWindow = (props: EditorWindowProps) => {
    // TODO textLines: {content: string, indentation: number, selected: bool}
    const [text, setText] = useState(localStorage.getItem("graphui.editor.codeInput") ?? "");
    const [indentation, setIndentation] = useState(0);
    const [selectedLine, setSelectedLine] = useState(1);
    const [indentSize, setIndentSize] = useState(4);
    let parseResult: dotparser.Graph[] | null = null
    let parseError: DotParserSyntaxError | null = null
    const textAreaRef = useRef<HTMLTextAreaElement>(null)

    try {
        parseResult = parseDot(text)
    } catch (e) {
        parseError = e as DotParserSyntaxError
    }

    const lineNumbers = d3.range(1, 100).map(n => <span key={n}>{n}<br /></span>)

    function errorText() {
        if (parseError === null) return ""
        return `
            ${parseError.message}
            At line ${parseError.location.start.line}, column ${parseError.location.start.column}
        `
    }

    function handleChangeText(event: ChangeEvent<HTMLTextAreaElement>) {
        setText(event.target.value)
        localStorage.setItem("graphui.editor.codeInput", event.target.value)
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        switch (event.key) {
            case "Tab":
                event.preventDefault()
                break
        }
    }

    function handleSelectLine() {
        setSelectedLine(text.substr(0, textAreaRef.current?.selectionStart).split(/\r?\n/).length)
    }

    return (
        <>
            <div style={{
                background: "white",
                // border: "2px solid darkgray",
                width: "90%",
                height: "90%",
                display: "grid",
                gridTemplateColumns: "5% auto",
                gridTemplateRows: "600px auto",
            }}>
                <div
                    style={{
                        overflow: "hidden",
                        fontFamily: "monospace",
                        marginTop: "0.35em"
                    }}
                >{lineNumbers}</div>
                <textarea placeholder="Enter graph specification..." cols={80} rows={48} autoComplete="off" tabIndex={-1}
                    ref={textAreaRef}
                    value={text}
                    onChange={handleChangeText}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleSelectLine}
                    onMouseUp={handleSelectLine}
                    style={{
                        resize: "none",
                        border: parseError ? "2px dashed red" : "2px solid black"
                    }}
                ></textarea>
                <div style={{
                    gridColumn: "1 / span 2"
                }}><pre style={{
                    whiteSpace: "pre-wrap"
                }}>{parseResult !== null ? JSON.stringify(parseResult) : ""}{errorText()}</pre></div>
            </div>
        </>
    );
}

export default EditorWindow;