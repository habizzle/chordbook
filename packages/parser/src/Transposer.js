export const transposeLine = (line, oldKey, newKey) => {
    // if unset, use default
    if (!oldKey) {
        oldKey = 'C';
    }

    if (oldKey === newKey) {
        return line;
    }

    const oldKeyIndex = transpositions[0]
        .findIndex(item => item === oldKey);

    let newKeyIndex = transpositions[0]
        .findIndex(item => item === newKey);

    if (oldKeyIndex < 0 || newKeyIndex < 0) {
        throw new Error(`Unsupported transpose from ${oldKey} to ${newKey}`);
    }

    let modifiedLine = intelliLine(line);

    transpositions
        .forEach(item => modifiedLine = modifiedLine.transpose(item[oldKeyIndex], item[newKeyIndex]));

    return modifiedLine.toLine();
}

const transpositions = [
    ["C", "G"],
    ["Cadd9", "Gadd9"],
    ["A", "E"],
    ["Am", "Em"],
    ["F", "C"],
    ["G", "D"],
    ["G7", "D7"],
    ["D", "A"],
    ["Dm", "Am"],
    ["E", "B"],
    ["E7", "B7"],
    ["Em", "Bm"],
    ["Em7", "Bm7"],
]

const intelliLine = (line) => {
    // Finds last chord in line ("${sourceChord}$")
    // and chord which is followed by another chord, separated by whitespace ("${sourceChord} ")
    const transposeRegex = (sourceChord) => new RegExp(`(${sourceChord}$|${sourceChord} )`, "g");

    return {
        transpose: (oldKey, newKey) => {
            const transposedLine = line.replace(transposeRegex(oldKey), `${newKey}$ `);
            return intelliLine(transposedLine);
        },
        toLine: () => line.replace(/\$/g, "")
    }
}

